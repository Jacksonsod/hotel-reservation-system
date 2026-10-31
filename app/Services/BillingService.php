<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Room;
use Carbon\Carbon;

class BillingService
{
    /**
     * Calculate reservation totals according to exact system billing formulas.
     *
     * @return array{
     *     nights: int,
     *     price_per_night: float,
     *     room_charges: float,
     *     additional_charges: float,
     *     subtotal: float,
     *     redeemed_points: int,
     *     discount: float,
     *     tax: float,
     *     total_amount: float
     * }
     */
    public function calculateReservationTotals(
        Room $room,
        string $checkIn,
        string $checkOut,
        int $redeemedPoints = 0,
        float $additionalCharges = 0
    ): array {
        $nights = max(1, Carbon::parse($checkIn)->diffInDays(Carbon::parse($checkOut)));
        $roomCharges = round($nights * (float) $room->price_per_night, 2);
        $subtotal = round($roomCharges + $additionalCharges, 2);
        $discount = min($subtotal, round($redeemedPoints * 50, 2)); // 1 point = 50 RWF
        $taxableAmount = max(0, $subtotal - $discount);
        $tax = round($taxableAmount * 0.18, 2); // 18% VAT
        $totalAmount = round($taxableAmount + $tax, 2);

        return [
            'nights' => (int) $nights,
            'price_per_night' => (float) $room->price_per_night,
            'room_charges' => $roomCharges,
            'additional_charges' => $additionalCharges,
            'subtotal' => $subtotal,
            'redeemed_points' => $redeemedPoints,
            'discount' => $discount,
            'tax' => $tax,
            'total_amount' => $totalAmount,
        ];
    }

    /**
     * Synchronize or generate an itemized invoice for the given reservation.
     */
    public function syncOrGenerateInvoice(Reservation $reservation): Invoice
    {
        $room = $reservation->room;
        if (! $room && $reservation->room_id) {
            $room = Room::find($reservation->room_id);
        }

        // Additional charges from guest service orders
        $additionalCharges = (float) $reservation->serviceOrders()->sum('total_price');

        // Check redeemed points if any
        $redeemedPoints = abs((int) $reservation->loyaltyTransactions()
            ->where('transaction_type', 'redeemed')
            ->sum('points'));

        if ($room) {
            $totals = $this->calculateReservationTotals(
                $room,
                $reservation->check_in->toDateString(),
                $reservation->check_out->toDateString(),
                $redeemedPoints,
                $additionalCharges
            );
            $subtotal = $totals['subtotal'];
            $discount = $totals['discount'];
            $tax = $totals['tax'];
            $totalAmount = $totals['total_amount'];
        } else {
            $subtotal = (float) $reservation->total_amount;
            $discount = 0.0;
            $tax = round($subtotal * 0.18, 2);
            $totalAmount = (float) $reservation->total_amount;
        }

        $invoiceNumber = 'INV-'.date('Ymd').'-'.str_pad($reservation->reservation_id, 5, '0', STR_PAD_LEFT);

        return Invoice::updateOrCreate(
            ['reservation_id' => $reservation->reservation_id],
            [
                'invoice_number' => $invoiceNumber,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total_amount' => $totalAmount,
                'issued_at' => now(),
            ]
        );
    }
}
