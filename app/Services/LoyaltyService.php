<?php

namespace App\Services;

use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Reservation;
use InvalidArgumentException;

class LoyaltyService
{
    /**
     * Redeem loyalty points for a discount on a reservation.
     *
     * @throws InvalidArgumentException
     */
    public function redeemPoints(int $userId, int $pointsToRedeem, int $reservationId): float
    {
        if ($pointsToRedeem <= 0) {
            return 0.0;
        }

        $loyaltyAccount = LoyaltyAccount::firstOrCreate(
            ['user_id' => $userId],
            ['total_points' => 0, 'available_points' => 0]
        );

        if ($pointsToRedeem > $loyaltyAccount->available_points) {
            throw new InvalidArgumentException(
                "Cannot redeem {$pointsToRedeem} points. Available balance is {$loyaltyAccount->available_points} points."
            );
        }

        $loyaltyAccount->decrement('available_points', $pointsToRedeem);

        LoyaltyTransaction::create([
            'loyalty_id' => $loyaltyAccount->loyalty_id,
            'reservation_id' => $reservationId,
            'transaction_type' => 'redeemed',
            'points' => -$pointsToRedeem,
            'description' => "Redeemed {$pointsToRedeem} points for reservation discount",
            'created_at' => now(),
        ]);

        // 1 point = 50 RWF
        return (float) ($pointsToRedeem * 50);
    }

    /**
     * Restore redeemed loyalty points when an uncompleted reservation is cancelled.
     */
    public function refundRedeemedPoints(int $reservationId): void
    {
        $transactions = LoyaltyTransaction::where('reservation_id', $reservationId)
            ->where('transaction_type', 'redeemed')
            ->get();

        if ($transactions->isEmpty()) {
            return;
        }

        // Points are stored as negative numbers for 'redeemed'
        $totalRedeemed = abs($transactions->sum('points'));

        if ($totalRedeemed <= 0) {
            return;
        }

        $firstTx = $transactions->first();
        $loyaltyAccount = LoyaltyAccount::find($firstTx->loyalty_id);

        if ($loyaltyAccount) {
            $loyaltyAccount->increment('available_points', $totalRedeemed);

            LoyaltyTransaction::create([
                'loyalty_id' => $loyaltyAccount->loyalty_id,
                'reservation_id' => $reservationId,
                'transaction_type' => 'adjusted',
                'points' => $totalRedeemed,
                'description' => "Refund of {$totalRedeemed} redeemed points due to cancellation of reservation #{$reservationId}",
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Award loyalty points upon completed stay and full payment.
     * Rule: 1 point per 1,000 RWF spent.
     */
    public function awardPointsForCompletedStay(Reservation $reservation): ?LoyaltyTransaction
    {
        if ($reservation->reservation_status !== 'checked_out' || $reservation->payment_status !== 'paid') {
            return null;
        }

        // Prevent duplicate awards
        $alreadyEarned = LoyaltyTransaction::where('reservation_id', $reservation->reservation_id)
            ->where('transaction_type', 'earned')
            ->exists();

        if ($alreadyEarned) {
            return null;
        }

        $points = (int) floor($reservation->total_amount / 1000);

        if ($points <= 0) {
            return null;
        }

        $loyaltyAccount = LoyaltyAccount::firstOrCreate(
            ['user_id' => $reservation->user_id],
            ['total_points' => 0, 'available_points' => 0]
        );

        $loyaltyAccount->increment('total_points', $points);
        $loyaltyAccount->increment('available_points', $points);

        return LoyaltyTransaction::create([
            'loyalty_id' => $loyaltyAccount->loyalty_id,
            'reservation_id' => $reservation->reservation_id,
            'transaction_type' => 'earned',
            'points' => $points,
            'description' => "Earned {$points} points from completed stay for reservation #{$reservation->confirmation_code}",
            'created_at' => now(),
        ]);
    }
}
