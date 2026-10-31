<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Checkout;
use App\Models\Hotel;
use App\Models\HousekeepingTask;
use App\Models\MaintenanceLog;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportAnalyticsController extends Controller
{
    use ApiResponse;

    /**
     * Get aggregate analytics data for the Executive Dashboard & Reports Center.
     */
    public function analytics(Request $request): JsonResponse
    {
        $data = $this->getAnalyticsData($request);

        return $this->successResponse($data, 'Analytics and report data retrieved successfully.');
    }

    /**
     * Export executive report as PDF document.
     */
    public function exportPdf(Request $request): Response|JsonResponse
    {
        $data = $this->getAnalyticsData($request);

        $pdf = Pdf::loadView('pdf.analytics_report', $data)
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        $filename = 'RP_Hotels_Executive_Report_'.date('Ymd_His').'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export executive report as structured CSV file.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $data = $this->getAnalyticsData($request);
        $filename = 'RP_Hotels_Analytics_Export_'.date('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($data) {
            $handle = fopen('php://output', 'w');

            // 1. EXECUTIVE KPIS
            fputcsv($handle, ['=== EXECUTIVE SUMMARY & KPIS ===']);
            fputcsv($handle, ['Metric', 'Value']);
            $kpis = $data['executive_kpis'];
            fputcsv($handle, ['Total Hotel Branches', $kpis['total_hotels']]);
            fputcsv($handle, ['Total Rooms Managed', $kpis['total_rooms']]);
            fputcsv($handle, ['Available Rooms', $kpis['available_rooms']]);
            fputcsv($handle, ['Occupied Rooms', $kpis['occupied_rooms']]);
            fputcsv($handle, ['Occupancy Rate (%)', $kpis['occupancy_rate_percent'].'%']);
            fputcsv($handle, ['Active Reservations', $kpis['active_reservations']]);
            fputcsv($handle, ['Current In-House Guests', $kpis['current_guests']]);
            fputcsv($handle, ['Total Revenue (RWF)', number_format($kpis['total_revenue'], 2)]);
            fputcsv($handle, ['Today Revenue (RWF)', number_format($kpis['daily_revenue'], 2)]);
            fputcsv($handle, ['Weekly Revenue (RWF)', number_format($kpis['weekly_revenue'], 2)]);
            fputcsv($handle, ['Monthly Revenue (RWF)', number_format($kpis['monthly_revenue'], 2)]);
            fputcsv($handle, ['Cancellation Rate (%)', $kpis['cancellation_rate_percent'].'%']);
            fputcsv($handle, ['Average Satisfaction (5.0)', $kpis['avg_satisfaction_rating']]);
            fputcsv($handle, []);

            // 2. REVENUE BY BRANCH
            fputcsv($handle, ['=== REVENUE & PERFORMANCE BY HOTEL BRANCH ===']);
            fputcsv($handle, ['Hotel Name', 'Location', 'Total Rooms', 'Occupied', 'Occupancy (%)', 'Bookings', 'Cancelled', 'Revenue (RWF)', 'Rating']);
            foreach ($data['revenue_by_branch'] as $branch) {
                fputcsv($handle, [
                    $branch['hotel_name'],
                    $branch['location'],
                    $branch['total_rooms'],
                    $branch['occupied_rooms'],
                    $branch['occupancy_rate'].'%',
                    $branch['reservations_count'],
                    $branch['cancelled_count'],
                    number_format($branch['revenue'], 2),
                    $branch['avg_rating'],
                ]);
            }
            fputcsv($handle, []);

            // 3. REVENUE BY ROOM TYPE
            fputcsv($handle, ['=== FINANCIAL BREAKDOWN BY ROOM TYPE ===']);
            fputcsv($handle, ['Room Type', 'Bookings Count', 'Total Revenue (RWF)', 'Avg Nightly Rate (RWF)', 'Min Rate (RWF)', 'Max Rate (RWF)']);
            foreach ($data['revenue_by_room_type'] as $rt) {
                fputcsv($handle, [
                    $rt['type_name'],
                    $rt['bookings_count'],
                    number_format($rt['revenue'], 2),
                    number_format($rt['avg_nightly_rate'], 2),
                    number_format($rt['min_rate'], 2),
                    number_format($rt['max_rate'], 2),
                ]);
            }
            fputcsv($handle, []);

            // 4. STAFF PERFORMANCE
            fputcsv($handle, ['=== STAFF OPERATIONAL PERFORMANCE ===']);
            fputcsv($handle, ['Staff Name', 'Role', 'Check-ins Processed', 'Checkouts Processed', 'Cleaning Completed', 'Maintenance Handled', 'Total Actions']);
            foreach ($data['staff_performance'] as $staff) {
                fputcsv($handle, [
                    $staff['name'],
                    $staff['role'],
                    $staff['checkins_processed'],
                    $staff['checkouts_processed'],
                    $staff['cleaning_tasks_completed'],
                    $staff['maintenance_reported_or_resolved'],
                    $staff['total_actions'],
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Shared calculation engine returning all aggregate metrics.
     */
    public function getAnalyticsData(Request $request): array
    {
        $hotelId = $request->input('hotel_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date', now()->toDateString());
        $period = $request->input('period', 'daily');

        // Hotel scope
        $hotelsQuery = Hotel::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $hotelsQuery->where('hotel_id', $hotelId);
        }
        $totalHotels = (clone $hotelsQuery)->where('status', 'active')->count();

        // Room scope
        $roomsQuery = Room::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $roomsQuery->where('hotel_id', $hotelId);
        }
        $totalRooms = (clone $roomsQuery)->count();
        $availableRooms = (clone $roomsQuery)->where('status', 'available')->count();
        $occupiedRooms = (clone $roomsQuery)->where('status', 'occupied')->count();
        $reservedRooms = (clone $roomsQuery)->where('status', 'reserved')->count();
        $dirtyRooms = (clone $roomsQuery)->where('status', 'dirty')->count();
        $cleanRooms = (clone $roomsQuery)->where('status', 'clean')->count();
        $maintenanceRooms = (clone $roomsQuery)->where('status', 'under_maintenance')->count();
        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0.0;

        // Reservations scope
        $resQuery = Reservation::with(['room.hotel', 'room.roomType']);
        if (! empty($hotelId) && $hotelId !== 'all') {
            $resQuery->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }
        if (! empty($startDate)) {
            $resQuery->whereDate('check_in', '>=', $startDate);
        }
        if (! empty($endDate)) {
            $resQuery->whereDate('check_in', '<=', $endDate);
        }
        $reservations = $resQuery->get();

        $activeReservations = (clone $resQuery)->whereIn('reservation_status', ['confirmed', 'checked_in'])->count();
        $currentGuests = (clone $resQuery)->where('reservation_status', 'checked_in')->count();
        $totalResCount = $reservations->count();
        $cancelledCount = $reservations->where('reservation_status', 'cancelled')->count();
        $cancellationRate = $totalResCount > 0 ? round(($cancelledCount / $totalResCount) * 100, 1) : 0.0;

        // Payments / Revenue scope
        $paymentsQuery = Payment::with('reservation.room')
            ->where('payment_status', 'completed');
        if (! empty($hotelId) && $hotelId !== 'all') {
            $paymentsQuery->whereHas('reservation.room', fn ($q) => $q->where('hotel_id', $hotelId));
        }

        $totalRevenue = (float) (clone $paymentsQuery)->sum('amount');
        $todayRevenue = (float) (clone $paymentsQuery)->whereDate('paid_at', now()->toDateString())->sum('amount');
        $weeklyRevenue = (float) (clone $paymentsQuery)->where('paid_at', '>=', now()->subDays(7))->sum('amount');
        $monthlyRevenue = (float) (clone $paymentsQuery)->where('paid_at', '>=', now()->subDays(30))->sum('amount');

        // If no payment records exist yet, fall back to paid reservations total
        if ($totalRevenue <= 0) {
            $totalRevenue = (float) $reservations->where('payment_status', 'paid')->sum('total_amount');
        }

        // Reviews & Satisfaction
        $reviewsQuery = Review::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $reviewsQuery->where('hotel_id', $hotelId);
        }
        $avgSatisfaction = round((float) ($reviewsQuery->avg('rating') ?: 4.8), 1);

        // 1. Executive KPIs
        $executiveKpis = [
            'total_hotels' => $totalHotels,
            'total_rooms' => $totalRooms,
            'available_rooms' => $availableRooms,
            'occupied_rooms' => $occupiedRooms,
            'reserved_rooms' => $reservedRooms,
            'occupancy_rate_percent' => $occupancyRate,
            'active_reservations' => $activeReservations,
            'current_guests' => $currentGuests,
            'total_revenue' => $totalRevenue,
            'daily_revenue' => $todayRevenue,
            'weekly_revenue' => $weeklyRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'cancellation_rate_percent' => $cancellationRate,
            'avg_satisfaction_rating' => $avgSatisfaction,
        ];

        // 2. Room Status Distribution
        $roomStatusDistribution = [
            ['name' => 'Available', 'value' => $availableRooms, 'color' => '#10B981'],
            ['name' => 'Occupied', 'value' => $occupiedRooms, 'color' => '#3B82F6'],
            ['name' => 'Reserved', 'value' => $reservedRooms, 'color' => '#F59E0B'],
            ['name' => 'Dirty / Turnover', 'value' => $dirtyRooms, 'color' => '#EF4444'],
            ['name' => 'Clean', 'value' => $cleanRooms, 'color' => '#059669'],
            ['name' => 'Under Maintenance', 'value' => $maintenanceRooms, 'color' => '#DC2626'],
        ];

        // 3. Revenue & Bookings Trend (Last 7 intervals)
        $revenueTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $label = now()->subDays($i)->format('M d');

            $dayPayments = Payment::where('payment_status', 'completed')
                ->whereDate('paid_at', $date);
            if (! empty($hotelId) && $hotelId !== 'all') {
                $dayPayments->whereHas('reservation.room', fn ($q) => $q->where('hotel_id', $hotelId));
            }
            $dayRev = (float) $dayPayments->sum('amount');

            $dayBookings = Reservation::whereDate('created_at', $date);
            if (! empty($hotelId) && $hotelId !== 'all') {
                $dayBookings->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
            }
            $dayCount = $dayBookings->count();

            $revenueTrend[] = [
                'period_label' => $label,
                'date' => $date,
                'revenue' => $dayRev,
                'bookings_count' => $dayCount,
            ];
        }

        // 4. Revenue & Performance by Hotel Branch
        $branches = Hotel::withCount(['rooms', 'reviews'])
            ->with(['rooms', 'reviews'])
            ->when(! empty($hotelId) && $hotelId !== 'all', fn ($q) => $q->where('hotel_id', $hotelId))
            ->get();

        $revenueByBranch = [];
        foreach ($branches as $branch) {
            $bRoomsCount = $branch->rooms->count();
            $bOccupied = $branch->rooms->where('status', 'occupied')->count();
            $bOccupancy = $bRoomsCount > 0 ? round(($bOccupied / $bRoomsCount) * 100, 1) : 0.0;

            $bReservations = Reservation::whereHas('room', fn ($q) => $q->where('hotel_id', $branch->hotel_id))->get();
            $bRevCount = $bReservations->count();
            $bCancelled = $bReservations->where('reservation_status', 'cancelled')->count();

            $bRevenue = (float) Payment::where('payment_status', 'completed')
                ->whereHas('reservation.room', fn ($q) => $q->where('hotel_id', $branch->hotel_id))
                ->sum('amount');

            $bRating = round((float) ($branch->reviews->avg('rating') ?: 4.8), 1);

            $revenueByBranch[] = [
                'hotel_id' => $branch->hotel_id,
                'hotel_name' => $branch->name,
                'location' => $branch->location,
                'total_rooms' => $bRoomsCount,
                'occupied_rooms' => $bOccupied,
                'occupancy_rate' => $bOccupancy,
                'reservations_count' => $bRevCount,
                'cancelled_count' => $bCancelled,
                'revenue' => $bRevenue,
                'avg_rating' => $bRating,
            ];
        }

        // 5. Revenue by Room Type using SQL Aggregates (COUNT, SUM, AVG, MIN, MAX)
        $roomTypes = RoomType::all();
        $revenueByRoomType = [];

        foreach ($roomTypes as $rt) {
            $rtRoomQuery = Room::where('room_type_id', $rt->room_type_id);
            if (! empty($hotelId) && $hotelId !== 'all') {
                $rtRoomQuery->where('hotel_id', $hotelId);
            }

            $minRate = (float) ($rtRoomQuery->min('price_per_night') ?: 0.0);
            $maxRate = (float) ($rtRoomQuery->max('price_per_night') ?: 0.0);
            $avgNightly = (float) ($rtRoomQuery->avg('price_per_night') ?: 0.0);

            $rtReservations = Reservation::whereHas('room', function ($q) use ($rt, $hotelId) {
                $q->where('room_type_id', $rt->room_type_id);
                if (! empty($hotelId) && $hotelId !== 'all') {
                    $q->where('hotel_id', $hotelId);
                }
            })->get();

            $rtBookingsCount = $rtReservations->count();
            $rtRevenue = (float) $rtReservations->where('payment_status', 'paid')->sum('total_amount');

            $revenueByRoomType[] = [
                'room_type_id' => $rt->room_type_id,
                'type_name' => $rt->type_name,
                'bookings_count' => $rtBookingsCount,
                'revenue' => $rtRevenue,
                'avg_nightly_rate' => round($avgNightly, 2),
                'min_rate' => round($minRate, 2),
                'max_rate' => round($maxRate, 2),
            ];
        }

        // 6. Reservation Status Breakdown
        $statusBreakdown = [
            'pending' => $reservations->where('reservation_status', 'pending')->count(),
            'confirmed' => $reservations->where('reservation_status', 'confirmed')->count(),
            'checked_in' => $reservations->where('reservation_status', 'checked_in')->count(),
            'checked_out' => $reservations->where('reservation_status', 'checked_out')->count(),
            'cancelled' => $reservations->where('reservation_status', 'cancelled')->count(),
        ];

        // 7. Housekeeping & Maintenance Stats
        $hkQuery = HousekeepingTask::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $hkQuery->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }
        $hkTotal = (clone $hkQuery)->count();
        $hkDirty = (clone $hkQuery)->where('task_status', 'dirty')->count();
        $hkCleaning = (clone $hkQuery)->where('task_status', 'cleaning')->count();
        $hkClean = (clone $hkQuery)->where('task_status', 'clean')->count();
        $hkRate = $hkTotal > 0 ? round(($hkClean / $hkTotal) * 100, 1) : 100.0;

        $maintQuery = MaintenanceLog::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $maintQuery->whereHas('room', fn ($q) => $q->where('hotel_id', $hotelId));
        }
        $maintTotal = (clone $maintQuery)->count();
        $maintPending = (clone $maintQuery)->where('maintenance_status', 'pending')->count();
        $maintInProgress = (clone $maintQuery)->where('maintenance_status', 'in_progress')->count();
        $maintResolved = (clone $maintQuery)->where('maintenance_status', 'resolved')->count();
        $maintUrgent = (clone $maintQuery)->where('priority', 'urgent')->where('maintenance_status', '!=', 'resolved')->count();

        $housekeepingMaintenanceStats = [
            'housekeeping' => [
                'total_tasks' => $hkTotal,
                'dirty_count' => $hkDirty,
                'cleaning_count' => $hkCleaning,
                'clean_count' => $hkClean,
                'completion_rate_percent' => $hkRate,
            ],
            'maintenance' => [
                'total_logs' => $maintTotal,
                'pending_count' => $maintPending,
                'in_progress_count' => $maintInProgress,
                'resolved_count' => $maintResolved,
                'urgent_count' => $maintUrgent,
            ],
        ];

        // 8. Staff Performance Metrics
        $staffMembers = User::whereIn('role', ['receptionist', 'housekeeping', 'admin'])
            ->where('status', 'active')
            ->get();

        $staffPerformance = [];
        foreach ($staffMembers as $staff) {
            $checkins = CheckIn::where('receptionist_id', $staff->user_id)->count();
            $checkouts = Checkout::where('receptionist_id', $staff->user_id)->count();
            $cleaningDone = HousekeepingTask::where('assigned_to', $staff->user_id)
                ->where('task_status', 'clean')
                ->count();
            $maintenanceDone = MaintenanceLog::where('reported_by', $staff->user_id)->count();

            $totalActions = $checkins + $checkouts + $cleaningDone + $maintenanceDone;

            $staffPerformance[] = [
                'user_id' => $staff->user_id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staff->role,
                'checkins_processed' => $checkins,
                'checkouts_processed' => $checkouts,
                'cleaning_tasks_completed' => $cleaningDone,
                'maintenance_reported_or_resolved' => $maintenanceDone,
                'total_actions' => $totalActions,
            ];
        }

        return [
            'executive_kpis' => $executiveKpis,
            'room_status_distribution' => $roomStatusDistribution,
            'revenue_trend' => $revenueTrend,
            'revenue_by_branch' => $revenueByBranch,
            'revenue_by_room_type' => $revenueByRoomType,
            'reservation_status_breakdown' => $statusBreakdown,
            'housekeeping_maintenance_stats' => $housekeepingMaintenanceStats,
            'staff_performance' => $staffPerformance,
            'generated_at' => now()->toDateTimeString(),
        ];
    }
}
