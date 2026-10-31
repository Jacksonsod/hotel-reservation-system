<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HousekeepingTask;
use App\Models\MaintenanceLog;
use App\Models\Notification;
use App\Models\Room;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MaintenanceController extends Controller
{
    use ApiResponse;

    /**
     * List maintenance logs with filters and summary KPIs.
     */
    public function index(Request $request): JsonResponse
    {
        $hotelId = $request->input('hotel_id');
        $priority = $request->input('priority');
        $status = $request->input('maintenance_status');
        $roomId = $request->input('room_id');
        $search = $request->input('search');

        $query = MaintenanceLog::with([
            'room.hotel',
            'room.roomType',
            'reporter',
        ]);

        if (! empty($hotelId) && $hotelId !== 'all') {
            $query->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }

        if (! empty($priority) && $priority !== 'all') {
            $query->where('priority', $priority);
        }

        if (! empty($status) && $status !== 'all') {
            $query->where('maintenance_status', $status);
        }

        if (! empty($roomId)) {
            $query->where('room_id', $roomId);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('issue_description', 'like', "%{$search}%")
                    ->orWhereHas('room', function ($rq) use ($search) {
                        $rq->where('room_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('reporter', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Calculate KPI summary for current scope
        $kpiQuery = MaintenanceLog::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $kpiQuery->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }

        $pendingCount = (clone $kpiQuery)->where('maintenance_status', 'pending')->count();
        $inProgressCount = (clone $kpiQuery)->where('maintenance_status', 'in_progress')->count();
        $resolvedCount = (clone $kpiQuery)->where('maintenance_status', 'resolved')->count();
        $urgentCount = (clone $kpiQuery)->where('priority', 'urgent')->where('maintenance_status', '!=', 'resolved')->count();
        $totalLogs = (clone $kpiQuery)->count();

        $logs = $query->orderByRaw("CASE 
            WHEN maintenance_status = 'pending' THEN 1 
            WHEN maintenance_status = 'in_progress' THEN 2 
            ELSE 3 END")
            ->orderByRaw("CASE 
            WHEN priority = 'urgent' THEN 1 
            WHEN priority = 'high' THEN 2 
            WHEN priority = 'medium' THEN 3 
            ELSE 4 END")
            ->orderBy('reported_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $meta = [
            'kpis' => [
                'total_logs' => $totalLogs,
                'pending_count' => $pendingCount,
                'in_progress_count' => $inProgressCount,
                'resolved_count' => $resolvedCount,
                'urgent_count' => $urgentCount,
            ],
        ];

        return $this->paginatedResponse($logs, 'Maintenance logs retrieved successfully.', $meta);
    }

    /**
     * Report a maintenance issue.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,room_id',
            'issue_description' => 'required|string|max:2000',
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $room = Room::with('hotel')->findOrFail($validated['room_id']);

        $log = MaintenanceLog::create([
            'room_id' => $room->room_id,
            'reported_by' => $request->user()->user_id,
            'issue_description' => $validated['issue_description'],
            'priority' => $validated['priority'],
            'maintenance_status' => 'pending',
            'reported_at' => now(),
            'resolved_at' => null,
        ]);

        // Unless room is currently occupied by checked-in guest, mark under maintenance
        if ($room->status !== 'occupied') {
            $room->update(['status' => 'under_maintenance']);
        }

        // Notify admins and maintenance/housekeeping staff
        $staffToNotify = User::whereIn('role', ['admin', 'housekeeping', 'receptionist'])
            ->where('status', 'active')
            ->get();

        foreach ($staffToNotify as $staff) {
            Notification::create([
                'user_id' => $staff->user_id,
                'title' => "Maintenance Alert: Room {$room->room_number}",
                'message' => "[{$validated['priority']}] {$validated['issue_description']}",
                'notification_type' => 'maintenance',
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        AuditLoggerService::log('create', 'maintenance_logs', $log->maintenance_id, $request->user()->user_id);

        return $this->successResponse(
            $log->load(['room.hotel', 'room.roomType', 'reporter']),
            'Maintenance issue reported successfully.',
            201
        );
    }

    /**
     * Show maintenance log details.
     */
    public function show(MaintenanceLog $maintenance): JsonResponse
    {
        return $this->successResponse(
            $maintenance->load(['room.hotel', 'room.roomType', 'reporter']),
            'Maintenance log details retrieved successfully.'
        );
    }

    /**
     * Update maintenance log status, priority, or description.
     */
    public function update(Request $request, MaintenanceLog $maintenance): JsonResponse
    {
        $validated = $request->validate([
            'maintenance_status' => 'sometimes|in:pending,in_progress,resolved',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'issue_description' => 'sometimes|string|max:2000',
        ]);

        $room = $maintenance->room;
        $oldStatus = $maintenance->maintenance_status;
        $newStatus = $validated['maintenance_status'] ?? $oldStatus;

        if ($newStatus === 'resolved' && $oldStatus !== 'resolved') {
            $maintenance->resolved_at = now();
            $maintenance->maintenance_status = 'resolved';

            // Check if other active maintenance issues remain on this room
            $otherActive = MaintenanceLog::where('room_id', $room->room_id)
                ->where('maintenance_id', '!=', $maintenance->maintenance_id)
                ->whereIn('maintenance_status', ['pending', 'in_progress'])
                ->exists();

            if (! $otherActive && $room->status !== 'occupied') {
                // Room transitions to 'dirty' and a turnover task is created
                $room->update(['status' => 'dirty']);

                $housekeeper = User::where('role', 'housekeeping')->where('status', 'active')->first();
                $assignedTo = $housekeeper ? $housekeeper->user_id : $request->user()->user_id;

                HousekeepingTask::create([
                    'room_id' => $room->room_id,
                    'assigned_to' => $assignedTo,
                    'task_description' => 'Turnover and post-maintenance inspection following resolved issue: '.Str::limit($maintenance->issue_description, 100),
                    'task_status' => 'dirty',
                    'assigned_at' => now(),
                ]);

                Notification::create([
                    'user_id' => $assignedTo,
                    'title' => "Room {$room->room_number} Ready for Post-Maintenance Cleaning",
                    'message' => "Maintenance issue resolved for Room {$room->room_number}. Please perform turnover cleaning and inspection.",
                    'notification_type' => 'housekeeping',
                    'is_read' => false,
                    'created_at' => now(),
                ]);
            }
        } elseif ($newStatus !== 'resolved' && $oldStatus === 'resolved') {
            $maintenance->resolved_at = null;
            $maintenance->maintenance_status = $newStatus;

            if ($room->status !== 'occupied') {
                $room->update(['status' => 'under_maintenance']);
            }
        } else {
            $maintenance->maintenance_status = $newStatus;
        }

        if (isset($validated['priority'])) {
            $maintenance->priority = $validated['priority'];
        }

        if (isset($validated['issue_description'])) {
            $maintenance->issue_description = $validated['issue_description'];
        }

        $maintenance->save();

        AuditLoggerService::log('update', 'maintenance_logs', $maintenance->maintenance_id, $request->user()->user_id);

        return $this->successResponse(
            $maintenance->fresh(['room.hotel', 'room.roomType', 'reporter']),
            'Maintenance log updated successfully.'
        );
    }

    /**
     * Delete a maintenance log.
     */
    public function destroy(Request $request, MaintenanceLog $maintenance): JsonResponse
    {
        $logId = $maintenance->maintenance_id;
        $maintenance->delete();

        AuditLoggerService::log('delete', 'maintenance_logs', $logId, $request->user()->user_id);

        return $this->successResponse(null, 'Maintenance log deleted successfully.');
    }
}
