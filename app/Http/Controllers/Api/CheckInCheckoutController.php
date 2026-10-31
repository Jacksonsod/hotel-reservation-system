<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Checkout;
use App\Models\GuestServiceOrder;
use App\Models\HousekeepingTask;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\ReservationGuest;
use App\Models\Room;
use App\Models\Service;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Services\AvailabilityService;
use App\Services\BillingService;
use App\Services\LoyaltyService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckInCheckoutController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AvailabilityService $availabilityService,
        protected BillingService $billingService,
        protected LoyaltyService $loyaltyService
    ) {}

    /**
     * Operational front-desk dashboard summary.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $hotelId = $request->input('hotel_id');

        // Base query for hotel filtering
        $applyHotel = function ($q) use ($hotelId) {
            if (! empty($hotelId) && $hotelId !== 'all') {
                $q->whereHas('room', fn ($rq) => $rq->where('hotel_id', $hotelId));
            }
        };

        // 1. Expected Arrivals: confirmed bookings where check_in <= today
        $arrivalsQuery = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'payments',
            'guests',
        ])
            ->where('reservation_status', 'confirmed')
            ->where('check_in', '<=', $today);
        $applyHotel($arrivalsQuery);
        $expectedArrivals = $arrivalsQuery->get();

        // 2. Current In-House Guests: checked_in reservations
        $currentGuestsQuery = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'checkIn',
            'payments',
            'serviceOrders.service',
        ])->where('reservation_status', 'checked_in');
        $applyHotel($currentGuestsQuery);
        $currentGuests = $currentGuestsQuery->get();

        // 3. Scheduled Departures: checked_in reservations where check_out <= today
        $departuresQuery = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'checkIn',
            'payments',
        ])
            ->where('reservation_status', 'checked_in')
            ->where('check_out', '<=', $today);
        $applyHotel($departuresQuery);
        $scheduledDepartures = $departuresQuery->get();

        // 4. Room Status Summary
        $roomQuery = Room::query();
        if (! empty($hotelId) && $hotelId !== 'all') {
            $roomQuery->where('hotel_id', $hotelId);
        }

        $roomSummary = [
            'total' => (clone $roomQuery)->count(),
            'available' => (clone $roomQuery)->where('status', 'available')->count(),
            'reserved' => (clone $roomQuery)->where('status', 'reserved')->count(),
            'occupied' => (clone $roomQuery)->where('status', 'occupied')->count(),
            'dirty' => (clone $roomQuery)->where('status', 'dirty')->count(),
            'clean' => (clone $roomQuery)->where('status', 'clean')->count(),
            'under_maintenance' => (clone $roomQuery)->where('status', 'under_maintenance')->count(),
        ];

        return $this->successResponse([
            'expected_arrivals' => $expectedArrivals,
            'current_guests' => $currentGuests,
            'scheduled_departures' => $scheduledDepartures,
            'room_status_summary' => $roomSummary,
            'stats' => [
                'expected_arrivals_count' => $expectedArrivals->count(),
                'in_house_count' => $currentGuests->count(),
                'scheduled_departures_count' => $scheduledDepartures->count(),
                'available_rooms_count' => $roomSummary['available'],
            ],
        ], 'Front desk operations data retrieved successfully.');
    }

    /**
     * Fast confirmation code lookup with available alternative rooms in branch.
     */
    public function lookup(string $confirmationCode): JsonResponse
    {
        $reservation = Reservation::with([
            'user',
            'guests',
            'room.hotel',
            'room.roomType',
            'serviceOrders.service',
            'payments',
            'invoice',
            'checkIn.receptionist',
            'checkout.receptionist',
        ])->where('confirmation_code', strtoupper(trim($confirmationCode)))->first();

        if (! $reservation) {
            return $this->errorResponse("Reservation with confirmation code '{$confirmationCode}' was not found.", 404);
        }

        // Find alternative rooms in the same hotel branch if room reassignment is needed
        $alternativeRooms = [];
        if ($reservation->reservation_status === 'confirmed' && $reservation->room) {
            $alternativeRooms = $this->availabilityService->searchAvailableRooms([
                'hotel_id' => $reservation->room->hotel_id,
                'check_in' => $reservation->check_in->toDateString(),
                'check_out' => $reservation->check_out->toDateString(),
                'number_of_guests' => $reservation->number_of_guests,
            ])->filter(fn ($r) => $r->room_id !== $reservation->room_id)->values();
        }

        return $this->successResponse([
            'reservation' => $reservation,
            'alternative_rooms' => $alternativeRooms,
        ], 'Reservation lookup completed.');
    }

    /**
     * Process Guest Check-In.
     */
    public function checkIn(Request $request, int $reservationId): JsonResponse
    {
        $reservation = Reservation::with(['room.hotel', 'payments'])->find($reservationId);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        if ($reservation->reservation_status !== 'confirmed') {
            return $this->errorResponse(
                "Only confirmed reservations can be checked in. Current status: '{$reservation->reservation_status}'.",
                422
            );
        }

        $validated = $request->validate([
            'room_id' => 'sometimes|nullable|exists:rooms,room_id',
            'special_requests' => 'nullable|string|max:1000',
            'companion_guests' => 'nullable|array',
            'companion_guests.*.full_name' => 'required|string|max:120',
            'companion_guests.*.identification_number' => 'nullable|string|max:50',
            'companion_guests.*.contact_phone' => 'nullable|string|max:20',
            'allow_unpaid' => 'sometimes|boolean',
        ]);

        $targetRoomId = $validated['room_id'] ?? $reservation->room_id;
        $targetRoom = Room::findOrFail($targetRoomId);

        // If assigning a different room, verify it belongs to the same hotel and has sufficient capacity
        if ($targetRoomId !== $reservation->room_id) {
            if ($targetRoom->hotel_id !== $reservation->room->hotel_id) {
                return $this->errorResponse('Reassigned room must belong to the same hotel branch.', 422);
            }
            if ($targetRoom->capacity < $reservation->number_of_guests) {
                return $this->errorResponse("Selected room capacity ({$targetRoom->capacity}) is less than guest count ({$reservation->number_of_guests}).", 422);
            }
            if (! in_array($targetRoom->status, ['available', 'clean'])) {
                return $this->errorResponse("Selected room is not ready for occupancy (Current status: '{$targetRoom->status}').", 422);
            }
        }

        return DB::transaction(function () use ($reservation, $targetRoom, $validated, $request) {
            $user = $request->user();

            // 1. Create CheckIn record
            $checkIn = CheckIn::create([
                'reservation_id' => $reservation->reservation_id,
                'room_id' => $targetRoom->room_id,
                'receptionist_id' => $user->user_id,
                'checkin_time' => now(),
                'special_requests' => $validated['special_requests'] ?? null,
                'status' => 'checked_in',
            ]);

            // 2. Update reservation
            $reservation->update([
                'room_id' => $targetRoom->room_id,
                'reservation_status' => 'checked_in',
            ]);

            // 3. Mark room occupied
            $targetRoom->update(['status' => 'occupied']);

            // 4. Companion guests if provided
            if (! empty($validated['companion_guests'])) {
                foreach ($validated['companion_guests'] as $cg) {
                    ReservationGuest::create([
                        'reservation_id' => $reservation->reservation_id,
                        'full_name' => $cg['full_name'],
                        'identification_number' => $cg['identification_number'] ?? null,
                        'contact_phone' => $cg['contact_phone'] ?? null,
                    ]);
                }
            }

            // 5. Send guest notification
            Notification::create([
                'user_id' => $reservation->user_id,
                'title' => 'Checked In Successfully',
                'message' => "Welcome to {$targetRoom->hotel->name}! You have been checked into Room {$targetRoom->room_number}.",
                'notification_type' => 'checkin',
                'is_read' => false,
                'created_at' => now(),
            ]);

            AuditLoggerService::log('guest_checked_in', 'reservations', $reservation->reservation_id, $user->user_id);

            return $this->successResponse(
                $reservation->load(['room.hotel', 'checkIn', 'guests']),
                "Guest checked in successfully into Room {$targetRoom->room_number}."
            );
        });
    }

    /**
     * List guest service orders.
     */
    public function getServiceOrders(Request $request): JsonResponse
    {
        $query = GuestServiceOrder::with([
            'service.hotel',
            'reservation.user',
            'reservation.room',
        ])->latest('order_id');

        if ($request->filled('hotel_id') && $request->hotel_id !== 'all') {
            $query->whereHas('service', fn ($sq) => $sq->where('hotel_id', $request->hotel_id));
        }

        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('service', fn ($sq) => $sq->where('service_name', 'like', "%{$search}%"))
                    ->orWhereHas('reservation', fn ($rq) => $rq->where('confirmation_code', 'like', "%{$search}%"))
                    ->orWhereHas('reservation.user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }

        return $this->successResponse($query->get(), 'Guest service orders retrieved successfully.');
    }

    /**
     * Post a new guest service order to an active reservation and recalculate folio.
     */
    public function storeServiceOrder(Request $request, int $reservationId): JsonResponse
    {
        $reservation = Reservation::with(['room', 'serviceOrders'])->find($reservationId);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        if (! in_array($reservation->reservation_status, ['confirmed', 'checked_in'])) {
            return $this->errorResponse('Services can only be added to confirmed or in-house (checked-in) reservations.', 422);
        }

        $validated = $request->validate([
            'service_id' => 'required|exists:services,service_id',
            'quantity' => 'required|integer|min:1',
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $unitPrice = (float) $service->price;
        $totalPrice = round($unitPrice * $validated['quantity'], 2);

        return DB::transaction(function () use ($reservation, $service, $validated, $unitPrice, $totalPrice, $request) {
            $order = GuestServiceOrder::create([
                'reservation_id' => $reservation->reservation_id,
                'service_id' => $service->service_id,
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'ordered_at' => now(),
            ]);

            // Recalculate reservation billing totals
            $additionalCharges = (float) $reservation->serviceOrders()->sum('total_price') + $totalPrice;
            $redeemedPoints = abs((int) $reservation->loyaltyTransactions()->where('transaction_type', 'redeemed')->sum('points'));

            $totals = $this->billingService->calculateReservationTotals(
                $reservation->room,
                $reservation->check_in->toDateString(),
                $reservation->check_out->toDateString(),
                $redeemedPoints,
                $additionalCharges
            );

            // Update reservation total
            $reservation->update(['total_amount' => $totals['total_amount']]);

            // Update payment status if outstanding balance exists
            $paidSoFar = (float) $reservation->payments()->where('payment_status', 'completed')->sum('amount');
            if ($paidSoFar >= $totals['total_amount']) {
                $reservation->update(['payment_status' => 'paid']);
            } elseif ($paidSoFar > 0) {
                $reservation->update(['payment_status' => 'partially_paid']);
            } else {
                $reservation->update(['payment_status' => 'unpaid']);
            }

            // Sync invoice
            $this->billingService->syncOrGenerateInvoice($reservation);

            AuditLoggerService::log('create', 'guest_service_orders', $order->order_id, $request->user()->user_id);

            return $this->successResponse(
                $order->load('service'),
                "Service '{$service->service_name}' added to reservation folio successfully.",
                201
            );
        });
    }

    /**
     * Delete an unbilled service order.
     */
    public function deleteServiceOrder(Request $request, int $orderId): JsonResponse
    {
        $order = GuestServiceOrder::with('reservation.room')->find($orderId);

        if (! $order) {
            return $this->errorResponse('Service order not found.', 404);
        }

        $reservation = $order->reservation;
        if (! in_array($reservation->reservation_status, ['confirmed', 'checked_in'])) {
            return $this->errorResponse('Cannot remove service orders from completed or cancelled reservations.', 422);
        }

        return DB::transaction(function () use ($order, $reservation, $request) {
            $order->delete();

            // Recalculate totals
            $additionalCharges = (float) $reservation->serviceOrders()->sum('total_price');
            $redeemedPoints = abs((int) $reservation->loyaltyTransactions()->where('transaction_type', 'redeemed')->sum('points'));

            $totals = $this->billingService->calculateReservationTotals(
                $reservation->room,
                $reservation->check_in->toDateString(),
                $reservation->check_out->toDateString(),
                $redeemedPoints,
                $additionalCharges
            );

            $reservation->update(['total_amount' => $totals['total_amount']]);

            $paidSoFar = (float) $reservation->payments()->where('payment_status', 'completed')->sum('amount');
            if ($paidSoFar >= $totals['total_amount']) {
                $reservation->update(['payment_status' => 'paid']);
            } elseif ($paidSoFar > 0) {
                $reservation->update(['payment_status' => 'partially_paid']);
            } else {
                $reservation->update(['payment_status' => 'unpaid']);
            }

            $this->billingService->syncOrGenerateInvoice($reservation);

            AuditLoggerService::log('delete', 'guest_service_orders', $order->order_id, $request->user()->user_id);

            return $this->successResponse(null, 'Service order removed and folio recalculated successfully.');
        });
    }

    /**
     * Process Guest Checkout and Room Turnover.
     */
    public function checkout(Request $request, int $reservationId): JsonResponse
    {
        $reservation = Reservation::with([
            'room.hotel',
            'user',
            'serviceOrders',
            'payments',
            'checkIn',
        ])->find($reservationId);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        if ($reservation->reservation_status !== 'checked_in') {
            return $this->errorResponse(
                "Only in-house (checked-in) reservations can be checked out. Current status: '{$reservation->reservation_status}'.",
                422
            );
        }

        $user = $request->user();

        // 1. Recalculate final billing totals
        $additionalCharges = (float) $reservation->serviceOrders()->sum('total_price');
        $redeemedPoints = abs((int) $reservation->loyaltyTransactions()->where('transaction_type', 'redeemed')->sum('points'));

        $totals = $this->billingService->calculateReservationTotals(
            $reservation->room,
            $reservation->check_in->toDateString(),
            $reservation->check_out->toDateString(),
            $redeemedPoints,
            $additionalCharges
        );

        $reservation->update(['total_amount' => $totals['total_amount']]);

        // 2. Process final payment if provided in request to settle balance
        $paidSoFar = (float) $reservation->payments()->where('payment_status', 'completed')->sum('amount');
        $outstanding = max(0, round($totals['total_amount'] - $paidSoFar, 2));

        if ($request->filled('payment_method') || ($request->filled('final_payment_amount') && (float) $request->final_payment_amount > 0)) {
            $paymentAmount = $request->filled('final_payment_amount') && (float) $request->final_payment_amount > 0
                ? min($outstanding, (float) $request->final_payment_amount)
                : $outstanding;
            $paymentMethod = $request->input('payment_method', 'cash');

            if ($paymentAmount > 0) {
                Payment::create([
                    'reservation_id' => $reservation->reservation_id,
                    'amount' => $paymentAmount,
                    'payment_method' => $paymentMethod,
                    'transaction_reference' => 'PAY-'.date('Ymd').'-'.strtoupper(Str::random(6)),
                    'payment_status' => 'completed',
                    'paid_at' => now(),
                ]);

                $paidSoFar += $paymentAmount;
                $outstanding = max(0, round($totals['total_amount'] - $paidSoFar, 2));
            }
        }

        // 3. Enforce full payment condition
        if ($outstanding > 0) {
            return $this->errorResponse(
                'Cannot check out guest with outstanding balance of RWF '.number_format($outstanding, 0).'. Please settle the remaining balance first.',
                422,
                ['outstanding_balance' => $outstanding]
            );
        }

        return DB::transaction(function () use ($reservation, $totals, $user) {
            $room = $reservation->room;

            // 1. Create Checkout record
            $checkout = Checkout::create([
                'reservation_id' => $reservation->reservation_id,
                'receptionist_id' => $user->user_id,
                'checkout_time' => now(),
                'room_charges' => $totals['room_charges'],
                'additional_charges' => $totals['additional_charges'],
                'discounts' => $totals['discount'],
                'total_amount' => $totals['total_amount'],
            ]);

            // 2. Update reservation status
            $reservation->update([
                'reservation_status' => 'checked_out',
                'payment_status' => 'paid',
            ]);

            // 3. Mark checkIn as completed
            if ($reservation->checkIn) {
                $reservation->checkIn->update(['status' => 'completed']);
            }

            // 4. Transition room status to 'dirty'
            $room->update(['status' => 'dirty']);

            // 5. Automatically create HousekeepingTask for room turnover
            $housekeeper = User::where('role', 'housekeeping')->where('status', 'active')->first();
            $assignedTo = $housekeeper ? $housekeeper->user_id : $user->user_id;

            HousekeepingTask::create([
                'room_id' => $room->room_id,
                'assigned_to' => $assignedTo,
                'task_description' => "Post-checkout deep cleaning and linen change for Room {$room->room_number}",
                'task_status' => 'dirty',
                'assigned_at' => now(),
            ]);

            // 6. Final invoice sync
            $this->billingService->syncOrGenerateInvoice($reservation);

            // 7. Award loyalty points for completed stay (1 pt / 1,000 RWF)
            $this->loyaltyService->awardPointsForCompletedStay($reservation);

            // 8. Notifications
            Notification::create([
                'user_id' => $reservation->user_id,
                'title' => 'Checkout Completed',
                'message' => "Thank you for staying at {$room->hotel->name}! Your checkout is complete. We hope to welcome you again soon.",
                'notification_type' => 'checkout',
                'is_read' => false,
                'created_at' => now(),
            ]);

            Notification::create([
                'user_id' => $assignedTo,
                'title' => "Room {$room->room_number} Ready for Turnover",
                'message' => "Guest checked out of Room {$room->room_number}. Cleaning task has been created.",
                'notification_type' => 'housekeeping',
                'is_read' => false,
                'created_at' => now(),
            ]);

            AuditLoggerService::log('guest_checked_out', 'reservations', $reservation->reservation_id, $user->user_id);

            return $this->successResponse(
                $checkout->load('reservation.invoice'),
                "Guest checked out successfully from Room {$room->room_number}. Room marked as dirty for housekeeping turnover."
            );
        });
    }
}
