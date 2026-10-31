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

class HousekeepingController extends Controller
{
    use ApiResponse;

    /**
     * List housekeeping tasks with filters and summary KPIs.
     */
    public function index(Request $request): JsonResponse
    {
        $hotelId = $request->input('hotel_id');
        $status = $request->input('task_status');
        $assignedTo = $request->input('assigned_to');
        $roomId = $request->input('room_id');
        $search = $request->input('search');

        $query = HousekeepingTask::with([
            'room.hotel',
            'room.roomType',
            'assignee',
        ]);

        if (! empty($hotelId) && $hotelId !== 'all') {
            $query->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }

        if (! empty($status) && $status !== 'all') {
            $query->where('task_status', $status);
        }

        if (! empty($assignedTo) && $assignedTo !== 'all') {
            if ($assignedTo === 'me') {
                $query->where('assigned_to', $request->user()->user_id);
            } else {
                $query->where('assigned_to', $assignedTo);
            }
        }

        if (! empty($roomId)) {
            $query->where('room_id', $roomId);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('task_description', 'like', "%{$search}%")
                    ->orWhereHas('room', function ($rq) use ($search) {
                        $rq->where('room_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('assignee', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Calculate KPI summary for current scope (filtered by hotel if provided)
        $kpiQuery = HousekeepingTask::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $kpiQuery->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }
        if ($request->user()->role === 'housekeeping' && $assignedTo === 'me') {
            $kpiQuery->where('assigned_to', $request->user()->user_id);
        }

        $dirtyCount = (clone $kpiQuery)->where('task_status', 'dirty')->count();
        $cleaningCount = (clone $kpiQuery)->where('task_status', 'cleaning')->count();
        $cleanCount = (clone $kpiQuery)->where('task_status', 'clean')->count();
        $totalCount = (clone $kpiQuery)->count();

        // Average cleaning time in minutes for completed tasks
        $completedTasks = (clone $kpiQuery)
            ->whereNotNull('completed_at')
            ->whereNotNull('assigned_at')
            ->get(['assigned_at', 'completed_at']);

        $avgCleaningTime = 0.0;
        if ($completedTasks->isNotEmpty()) {
            $avgCleaningTime = round($completedTasks->avg(function ($item) {
                return $item->completed_at->diffInMinutes($item->assigned_at);
            }), 1);
        }

        $tasks = $query->orderByRaw("CASE 
            WHEN task_status = 'dirty' THEN 1 
            WHEN task_status = 'cleaning' THEN 2 
            ELSE 3 END")
            ->orderBy('assigned_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $meta = [
            'kpis' => [
                'total_tasks' => $totalCount,
                'dirty_count' => $dirtyCount,
                'cleaning_count' => $cleaningCount,
                'clean_count' => $cleanCount,
                'avg_cleaning_time_minutes' => $avgCleaningTime,
            ],
        ];

        return $this->paginatedResponse($tasks, 'Housekeeping tasks retrieved successfully.', $meta);
    }

    /**
     * Get active housekeeping staff for assignment dropdown.
     */
    public function getStaff(Request $request): JsonResponse
    {
        $staff = User::whereIn('role', ['housekeeping', 'admin'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['user_id', 'name', 'email', 'role', 'phone']);

        return $this->successResponse($staff, 'Housekeeping staff retrieved successfully.');
    }

    /**
     * Create / assign a new housekeeping task.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,room_id',
            'assigned_to' => 'required|exists:users,user_id',
            'task_description' => 'required|string|max:1000',
            'task_status' => 'nullable|in:dirty,cleaning,clean',
        ]);

        $room = Room::findOrFail($validated['room_id']);
        $assignee = User::findOrFail($validated['assigned_to']);
        $status = $validated['task_status'] ?? 'dirty';

        $task = HousekeepingTask::create([
            'room_id' => $room->room_id,
            'assigned_to' => $assignee->user_id,
            'task_description' => $validated['task_description'],
            'task_status' => $status,
            'assigned_at' => now(),
            'completed_at' => $status === 'clean' ? now() : null,
        ]);

        // Room status adjustment
        if ($status === 'clean') {
            $hasActiveMaintenance = MaintenanceLog::where('room_id', $room->room_id)
                ->whereIn('maintenance_status', ['pending', 'in_progress'])
                ->exists();

            if ($hasActiveMaintenance) {
                $room->update(['status' => 'under_maintenance']);
            } elseif ($room->status !== 'occupied') {
                $room->update(['status' => 'available']);
            }
        } elseif (! in_array($room->status, ['under_maintenance', 'occupied'])) {
            $room->update(['status' => 'dirty']);
        }

        // Notify assigned staff
        Notification::create([
            'user_id' => $assignee->user_id,
            'title' => "Housekeeping Task Assigned: Room {$room->room_number}",
            'message' => "You have been assigned: {$task->task_description}",
            'notification_type' => 'housekeeping',
            'is_read' => false,
            'created_at' => now(),
        ]);

        AuditLoggerService::log('create', 'housekeeping_tasks', $task->task_id, $request->user()->user_id);

        return $this->successResponse(
            $task->load(['room.hotel', 'room.roomType', 'assignee']),
            'Housekeeping task assigned successfully.',
            201
        );
    }

    /**
     * Show task details.
     */
    public function show(HousekeepingTask $task): JsonResponse
    {
        return $this->successResponse(
            $task->load(['room.hotel', 'room.roomType', 'assignee']),
            'Task details retrieved successfully.'
        );
    }

    /**
     * Update task status (quick 1-click transition: dirty -> cleaning -> clean).
     */
    public function updateStatus(Request $request, HousekeepingTask $task): JsonResponse
    {
        $validated = $request->validate([
            'task_status' => 'required|in:dirty,cleaning,clean',
        ]);

        $newStatus = $validated['task_status'];
        $room = $task->room;

        if ($newStatus === 'clean') {
            $task->update([
                'task_status' => 'clean',
                'completed_at' => now(),
            ]);

            // Check if room has unresolved maintenance
            $hasActiveMaintenance = MaintenanceLog::where('room_id', $room->room_id)
                ->whereIn('maintenance_status', ['pending', 'in_progress'])
                ->exists();

            if ($hasActiveMaintenance) {
                $room->update(['status' => 'under_maintenance']);
            } elseif ($room->status !== 'occupied') {
                $room->update(['status' => 'available']);
            }
        } elseif ($newStatus === 'cleaning') {
            $task->update([
                'task_status' => 'cleaning',
                'completed_at' => null,
            ]);

            if (! in_array($room->status, ['under_maintenance', 'occupied'])) {
                $room->update(['status' => 'dirty']);
            }
        } else {
            // 'dirty'
            $task->update([
                'task_status' => 'dirty',
                'completed_at' => null,
            ]);

            if (! in_array($room->status, ['under_maintenance', 'occupied'])) {
                $room->update(['status' => 'dirty']);
            }
        }

        AuditLoggerService::log('update_status', 'housekeeping_tasks', $task->task_id, $request->user()->user_id);

        return $this->successResponse(
            $task->fresh(['room.hotel', 'room.roomType', 'assignee']),
            "Task status updated to '{$newStatus}' successfully."
        );
    }

    /**
     * Update task details or reassign.
     */
    public function update(Request $request, HousekeepingTask $task): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'sometimes|exists:users,user_id',
            'task_description' => 'sometimes|string|max:1000',
            'task_status' => 'sometimes|in:dirty,cleaning,clean',
        ]);

        if (isset($validated['task_status'])) {
            return $this->updateStatus($request, $task);
        }

        $task->update($validated);

        AuditLoggerService::log('update', 'housekeeping_tasks', $task->task_id, $request->user()->user_id);

        return $this->successResponse(
            $task->fresh(['room.hotel', 'room.roomType', 'assignee']),
            'Housekeeping task updated successfully.'
        );
    }

    /**
     * Delete a housekeeping task.
     */
    public function destroy(Request $request, HousekeepingTask $task): JsonResponse
    {
        $taskId = $task->task_id;
        $task->delete();

        AuditLoggerService::log('delete', 'housekeeping_tasks', $taskId, $request->user()->user_id);

        return $this->successResponse(null, 'Housekeeping task deleted successfully.');
    }
}
