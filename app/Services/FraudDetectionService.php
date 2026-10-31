<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\FraudFlag;
use App\Models\Reservation;

class FraudDetectionService
{
    /**
     * Trigger 1: IP Account Farming
     * Checks if >= 3 user registrations have occurred from the same IP within 1 hour.
     */
    public static function checkIpRegistrationVelocity(string $ipAddress, ?int $userId = null): ?FraudFlag
    {
        $oneHourAgo = now()->subHour();

        $recentRegistrations = AuditLog::where('action', 'user_registered')
            ->where('ip_address', $ipAddress)
            ->where('created_at', '>=', $oneHourAgo)
            ->count();

        if ($recentRegistrations >= 3) {
            return FraudFlag::create([
                'user_id' => $userId,
                'ip_address' => $ipAddress,
                'activity_description' => "Rapid registration velocity detected: {$recentRegistrations} registrations from IP {$ipAddress} within 1 hour.",
                'risk_level' => 'high',
                'review_status' => 'pending',
                'created_at' => now(),
            ]);
        }

        return null;
    }

    /**
     * Trigger 2: Unpaid Booking Spam
     * Checks if user creates >= 3 reservations with payment_status = 'unpaid' within 24 hours.
     */
    public static function checkUnpaidBookingSpam(int $userId, string $ipAddress): ?FraudFlag
    {
        $twentyFourHoursAgo = now()->subHours(24);

        $unpaidCount = Reservation::where('user_id', $userId)
            ->where('payment_status', 'unpaid')
            ->where('created_at', '>=', $twentyFourHoursAgo)
            ->count();

        if ($unpaidCount >= 3) {
            return FraudFlag::create([
                'user_id' => $userId,
                'ip_address' => $ipAddress,
                'activity_description' => "Unpaid booking spam detected: User {$userId} created {$unpaidCount} unpaid reservations within 24 hours.",
                'risk_level' => 'medium',
                'review_status' => 'pending',
                'created_at' => now(),
            ]);
        }

        return null;
    }

    /**
     * Trigger 3: Rapid Overlapping Attempts
     * Logs failed overlap attempts and flags if >= 3 attempts occur within 15 minutes.
     */
    public static function recordOverlappingAttempt(int $userId, string $ipAddress, int $roomId): ?FraudFlag
    {
        AuditLoggerService::log('overlapping_booking_attempt', 'rooms', $roomId, $userId);

        $fifteenMinutesAgo = now()->subMinutes(15);

        $overlapAttempts = AuditLog::where('user_id', $userId)
            ->where('action', 'overlapping_booking_attempt')
            ->where('created_at', '>=', $fifteenMinutesAgo)
            ->count();

        if ($overlapAttempts >= 3) {
            return FraudFlag::create([
                'user_id' => $userId,
                'ip_address' => $ipAddress,
                'activity_description' => "Rapid overlapping booking attempts: User {$userId} submitted {$overlapAttempts} overlapping reservation attempts within 15 minutes.",
                'risk_level' => 'low',
                'review_status' => 'pending',
                'created_at' => now(),
            ]);
        }

        return null;
    }
}
