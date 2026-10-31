<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Reservation;
use Illuminate\Console\Command;

class SendStayRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hotel:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send automatic check-in and checkout reminder notifications to guests for upcoming stays';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();
        $today = now()->toDateString();

        $this->info("Scanning reservations for stay date: {$tomorrow}...");

        // 1. Check-in reminders: confirmed bookings arriving tomorrow
        $arrivalReservations = Reservation::with(['user', 'room.hotel'])
            ->where('reservation_status', 'confirmed')
            ->whereDate('check_in', $tomorrow)
            ->get();

        $checkinsSent = 0;
        foreach ($arrivalReservations as $reservation) {
            $alreadySent = Notification::where('user_id', $reservation->user_id)
                ->where('notification_type', 'checkin')
                ->whereDate('created_at', $today)
                ->where('title', 'like', "%{$reservation->room->room_number}%")
                ->exists();

            if (! $alreadySent) {
                Notification::create([
                    'user_id' => $reservation->user_id,
                    'title' => "Upcoming Stay Reminder: Room {$reservation->room->room_number}",
                    'message' => "Your stay at {$reservation->room->hotel->name} begins tomorrow ({$reservation->check_in}). We look forward to welcoming you! Confirmation code: {$reservation->confirmation_code}.",
                    'notification_type' => 'checkin',
                    'is_read' => false,
                    'created_at' => now(),
                ]);
                $checkinsSent++;
            }
        }

        // 2. Checkout reminders: checked-in bookings departing tomorrow
        $departureReservations = Reservation::with(['user', 'room.hotel'])
            ->where('reservation_status', 'checked_in')
            ->whereDate('check_out', $tomorrow)
            ->get();

        $checkoutsSent = 0;
        foreach ($departureReservations as $reservation) {
            $alreadySent = Notification::where('user_id', $reservation->user_id)
                ->where('notification_type', 'checkout')
                ->whereDate('created_at', $today)
                ->where('title', 'like', "%{$reservation->room->room_number}%")
                ->exists();

            if (! $alreadySent) {
                Notification::create([
                    'user_id' => $reservation->user_id,
                    'title' => "Upcoming Checkout Reminder: Room {$reservation->room->room_number}",
                    'message' => "Your checkout from {$reservation->room->hotel->name} is scheduled for tomorrow ({$reservation->check_out}). Please visit the front desk to settle your folio.",
                    'notification_type' => 'checkout',
                    'is_read' => false,
                    'created_at' => now(),
                ]);
                $checkoutsSent++;
            }
        }

        $this->info("Reminders dispatched: {$checkinsSent} check-in reminders and {$checkoutsSent} check-out reminders.");

        return Command::SUCCESS;
    }
}
