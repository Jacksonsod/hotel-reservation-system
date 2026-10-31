<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Reservation;
use App\Models\Review;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewLoyaltyController extends Controller
{
    use ApiResponse;

    /**
     * Get loyalty account and transaction history.
     */
    public function getLoyalty(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'guest') {
            $loyaltyAccount = LoyaltyAccount::firstOrCreate(
                ['user_id' => $user->user_id],
                ['total_points' => 0, 'available_points' => 0]
            );

            $transactions = LoyaltyTransaction::with(['reservation'])
                ->where('loyalty_id', $loyaltyAccount->loyalty_id)
                ->latest('transaction_id')
                ->get();

            return $this->successResponse([
                'account' => $loyaltyAccount,
                'transactions' => $transactions,
                'rwf_value_equivalent' => $loyaltyAccount->available_points * 50,
            ], 'Loyalty program data retrieved successfully.');
        }

        // Admin: View all accounts and recent transactions
        $accounts = LoyaltyAccount::with(['user'])->latest('loyalty_id')->get();
        $transactions = LoyaltyTransaction::with(['loyaltyAccount.user', 'reservation'])
            ->latest('transaction_id')
            ->limit(100)
            ->get();

        return $this->successResponse([
            'accounts' => $accounts,
            'recent_transactions' => $transactions,
        ], 'All loyalty accounts retrieved successfully.');
    }

    /**
     * Get reviews and eligible unreviewed stays for guests.
     */
    public function getReviews(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Review::with(['user', 'hotel', 'reservation'])->latest('review_id');

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', $request->input('hotel_id'));
        }

        if ($request->filled('rating')) {
            $query->where('rating', $request->input('rating'));
        }

        if ($request->boolean('my_reviews') || $user->role === 'guest') {
            $query->where('user_id', $user->user_id);
        }

        $reviews = $query->get();

        // If guest, also return completed stays eligible for review
        $eligibleStays = [];
        if ($user->role === 'guest') {
            $eligibleStays = Reservation::with(['room.hotel', 'room.roomType'])
                ->where('user_id', $user->user_id)
                ->where('reservation_status', 'checked_out')
                ->doesntHave('review')
                ->latest('reservation_id')
                ->get();
        }

        return $this->successResponse([
            'reviews' => $reviews,
            'eligible_stays' => $eligibleStays,
        ], 'Reviews retrieved successfully.');
    }

    /**
     * Store a guest review for a completed stay.
     */
    public function storeReview(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'reservation_id' => 'required|exists:reservations,reservation_id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $reservation = Reservation::with('room.hotel')->find($validated['reservation_id']);

        // Strict validation: ownership
        if ((int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('You can only review your own reservations.', 403);
        }

        // Strict validation: reservation must be completed/checked_out
        if ($reservation->reservation_status !== 'checked_out') {
            return $this->errorResponse('You can only submit reviews for stays that have already checked out.', 422);
        }

        // Strict validation: cannot review twice
        if (Review::where('reservation_id', $reservation->reservation_id)->exists()) {
            return $this->errorResponse('You have already submitted a review for this reservation.', 422);
        }

        $review = Review::create([
            'user_id' => $user->user_id,
            'hotel_id' => $reservation->room->hotel_id,
            'reservation_id' => $reservation->reservation_id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'created_at' => now(),
        ]);

        AuditLoggerService::log('create', 'reviews', $review->review_id, $user->user_id);

        return $this->successResponse(
            $review->load(['hotel', 'reservation']),
            'Thank you! Your review has been submitted successfully.',
            201
        );
    }
}
