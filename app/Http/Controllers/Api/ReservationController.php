<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\ReservationGuest;
use App\Models\Room;
use App\Services\AuditLoggerService;
use App\Services\AvailabilityService;
use App\Services\BillingService;
use App\Services\FraudDetectionService;
use App\Services\LoyaltyService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AvailabilityService $availabilityService,
        protected BillingService $billingService,
        protected LoyaltyService $loyaltyService
    ) {}

    /**
     * Public and guest search endpoint for real-time room availability.
     */
    public function publicAvailability(Request $request): JsonResponse
    {
        $filters = $request->only([
            'hotel_id',
            'location',
            'room_type_id',
            'number_of_guests',
            'min_price',
            'max_price',
            'amenity_ids',
            'check_in',
            'check_out',
        ]);

        $availableRooms = $this->availabilityService->searchAvailableRooms($filters);

        return $this->successResponse(
            $availableRooms,
            'Available rooms retrieved successfully.'
        );
    }

    /**
     * List reservations (scoped by user role).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'guest') {
            $query = Reservation::with([
                'room.hotel',
                'room.roomType',
                'room.images',
                'guests',
                'payments',
                'invoice',
                'review',
            ])
                ->where('user_id', $user->user_id)
                ->latest('reservation_id');

            return $this->successResponse($query->get(), 'Your reservations retrieved successfully.');
        }

        // Staff and Admin Query
        $query = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'guests',
            'payments',
            'invoice',
            'review',
        ])->latest('reservation_id');

        if ($request->filled('hotel_id')) {
            $query->whereHas('room', function ($rq) use ($request) {
                $rq->where('hotel_id', $request->input('hotel_id'));
            });
        }

        if ($request->filled('confirmation_code')) {
            $query->where('confirmation_code', 'like', "%{$request->input('confirmation_code')}%");
        }

        if ($request->filled('reservation_status')) {
            $query->where('reservation_status', $request->input('reservation_status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('confirmation_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('room', function ($rq) use ($search) {
                        $rq->where('room_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->where('check_in', '>=', $request->input('start_date'))
                ->where('check_out', '<=', $request->input('end_date'));
        }

        $kpis = [
            'total' => (clone $query)->count(),
            'upcoming' => (clone $query)->whereIn('reservation_status', ['pending', 'confirmed'])->where('check_in', '>=', now()->toDateString())->count(),
            'checked_in' => (clone $query)->where('reservation_status', 'checked_in')->count(),
            'cancelled' => (clone $query)->where('reservation_status', 'cancelled')->count(),
        ];

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Reservations retrieved successfully.',
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'kpis' => $kpis,
                ],
            ]);
        }

        return $this->successResponse(
            $query->get(),
            'Reservations retrieved successfully.',
            200,
            ['kpis' => $kpis]
        );
    }

    /**
     * Retrieve single reservation details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'room.images',
            'guests',
            'payments',
            'invoice',
            'review',
            'serviceOrders.service',
        ])->find($id);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        $user = $request->user();
        if ($user->role === 'guest' && (int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized access to this reservation.', 403);
        }

        return $this->successResponse($reservation, 'Reservation retrieved successfully.');
    }

    /**
     * Store a new reservation (concurrency safe with pessimistic locking).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,room_id',
            'user_id' => 'sometimes|nullable|exists:users,user_id',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'number_of_guests' => 'required|integer|min:1',
            'redeem_points' => 'sometimes|nullable|integer|min:0',
            'companion_guests' => 'sometimes|nullable|array',
            'companion_guests.*.full_name' => 'required|string|max:120',
            'companion_guests.*.identification_number' => 'nullable|string|max:50',
            'companion_guests.*.contact_phone' => 'nullable|string|max:20',
        ]);

        $targetUserId = ($user->role === 'guest')
            ? $user->user_id
            : ($validated['user_id'] ?? $user->user_id);

        $ipAddress = $request->ip() ?? '127.0.0.1';

        return DB::transaction(function () use ($validated, $targetUserId, $ipAddress) {
            // 1. Pessimistic Lock on target room row
            $room = Room::with('hotel')->where('room_id', $validated['room_id'])->lockForUpdate()->firstOrFail();

            // 2. Guest capacity check
            if ($validated['number_of_guests'] > $room->capacity) {
                return $this->errorResponse(
                    "Number of guests ({$validated['number_of_guests']}) exceeds room capacity of {$room->capacity}.",
                    422
                );
            }

            // 3. Concurrency-safe availability re-check
            $isAvailable = $this->availabilityService->isRoomAvailable(
                $room->room_id,
                $validated['check_in'],
                $validated['check_out']
            );

            if (! $isAvailable) {
                FraudDetectionService::recordOverlappingAttempt($targetUserId, $ipAddress, $room->room_id);

                return $this->errorResponse(
                    'The selected room is unavailable for the chosen dates.',
                    409,
                    ['check_in' => ["Room {$room->room_number} is already reserved for the chosen dates."]]
                );
            }

            // 4. Generate unique confirmation code: RES-YYYYMMDD-XXXXX
            $confirmationCode = 'RES-'.date('Ymd').'-'.strtoupper(Str::random(5));

            // 5. Calculate billing totals & apply point redemptions
            $redeemedPoints = (int) ($validated['redeem_points'] ?? 0);
            $totals = $this->billingService->calculateReservationTotals(
                $room,
                $validated['check_in'],
                $validated['check_out'],
                $redeemedPoints
            );

            // 6. Create Reservation
            $reservation = Reservation::create([
                'confirmation_code' => $confirmationCode,
                'user_id' => $targetUserId,
                'room_id' => $room->room_id,
                'check_in' => $validated['check_in'],
                'check_out' => $validated['check_out'],
                'number_of_guests' => $validated['number_of_guests'],
                'total_amount' => $totals['total_amount'],
                'payment_status' => 'unpaid',
                'reservation_status' => 'confirmed',
            ]);

            // Deduct redeemed points
            if ($redeemedPoints > 0) {
                try {
                    $this->loyaltyService->redeemPoints($targetUserId, $redeemedPoints, $reservation->reservation_id);
                } catch (\Exception $e) {
                    return $this->errorResponse($e->getMessage(), 422);
                }
            }

            // 7. Save companion guests
            if (! empty($validated['companion_guests'])) {
                foreach ($validated['companion_guests'] as $guestData) {
                    ReservationGuest::create([
                        'reservation_id' => $reservation->reservation_id,
                        'full_name' => $guestData['full_name'],
                        'identification_number' => $guestData['identification_number'] ?? null,
                        'contact_phone' => $guestData['contact_phone'] ?? null,
                    ]);
                }
            }

            // 8. Generate itemized tax invoice
            $this->billingService->syncOrGenerateInvoice($reservation);

            // 9. Send booking notification
            Notification::create([
                'user_id' => $targetUserId,
                'title' => 'Reservation Confirmed',
                'message' => "Your reservation #{$confirmationCode} for Room {$room->room_number} at {$room->hotel->name} has been confirmed.",
                'notification_type' => 'booking',
                'is_read' => false,
                'created_at' => now(),
            ]);

            // 10. Fraud detection check: unpaid booking spam
            FraudDetectionService::checkUnpaidBookingSpam($targetUserId, $ipAddress);

            // 11. Audit log
            AuditLoggerService::log('create', 'reservations', $reservation->reservation_id, $targetUserId);

            return $this->successResponse(
                $reservation->load(['room.hotel', 'room.roomType', 'guests', 'invoice']),
                'Reservation created successfully.',
                201
            );
        });
    }

    /**
     * Update reservation dates or guest count.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        $user = $request->user();
        if ($user->role === 'guest' && (int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized to update this reservation.', 403);
        }

        if (! in_array($reservation->reservation_status, ['pending', 'confirmed'])) {
            return $this->errorResponse('Cannot modify a reservation that is checked in, completed, or cancelled.', 422);
        }

        $validated = $request->validate([
            'check_in' => 'sometimes|required|date',
            'check_out' => 'sometimes|required|date|after:check_in',
            'number_of_guests' => 'sometimes|required|integer|min:1',
        ]);

        return DB::transaction(function () use ($reservation, $validated, $user) {
            $room = Room::where('room_id', $reservation->room_id)->lockForUpdate()->firstOrFail();

            $newCheckIn = $validated['check_in'] ?? $reservation->check_in->toDateString();
            $newCheckOut = $validated['check_out'] ?? $reservation->check_out->toDateString();
            $newGuests = $validated['number_of_guests'] ?? $reservation->number_of_guests;

            if ($newGuests > $room->capacity) {
                return $this->errorResponse("Number of guests ({$newGuests}) exceeds room capacity ({$room->capacity}).", 422);
            }

            // Check availability ignoring current reservation
            $isAvailable = $this->availabilityService->isRoomAvailable(
                $room->room_id,
                $newCheckIn,
                $newCheckOut,
                $reservation->reservation_id
            );

            if (! $isAvailable) {
                return $this->errorResponse('The room is unavailable for the newly selected dates.', 409);
            }

            // Recalculate totals
            $totals = $this->billingService->calculateReservationTotals($room, $newCheckIn, $newCheckOut);

            $reservation->update([
                'check_in' => $newCheckIn,
                'check_out' => $newCheckOut,
                'number_of_guests' => $newGuests,
                'total_amount' => $totals['total_amount'],
            ]);

            $this->billingService->syncOrGenerateInvoice($reservation);

            AuditLoggerService::log('update', 'reservations', $reservation->reservation_id, $user->user_id);

            return $this->successResponse($reservation->load(['room.hotel', 'invoice']), 'Reservation updated successfully.');
        });
    }

    /**
     * Cancel an existing reservation and restore redeemed points.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::find($id);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        $user = $request->user();
        if ($user->role === 'guest' && (int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized to cancel this reservation.', 403);
        }

        if (! in_array($reservation->reservation_status, ['pending', 'confirmed'])) {
            return $this->errorResponse('Only pending or confirmed reservations can be cancelled.', 422);
        }

        return DB::transaction(function () use ($reservation, $user) {
            $reservation->update(['reservation_status' => 'cancelled']);

            // Refund any redeemed points
            $this->loyaltyService->refundRedeemedPoints($reservation->reservation_id);

            // Send notification
            Notification::create([
                'user_id' => $reservation->user_id,
                'title' => 'Reservation Cancelled',
                'message' => "Your reservation #{$reservation->confirmation_code} has been cancelled.",
                'notification_type' => 'booking',
                'is_read' => false,
                'created_at' => now(),
            ]);

            AuditLoggerService::log('cancel', 'reservations', $reservation->reservation_id, $user->user_id);

            return $this->successResponse(null, 'Reservation cancelled successfully.');
        });
    }
}
