<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Database\Eloquent\Collection;

class AvailabilityService
{
    /**
     * Check if a specific room is available for the given date range.
     */
    public function isRoomAvailable(int $roomId, string $checkIn, string $checkOut, ?int $ignoreReservationId = null): bool
    {
        $room = Room::with('hotel')->find($roomId);

        if (! $room) {
            return false;
        }

        // Room and hotel operational availability checks
        if (in_array($room->status, ['under_maintenance', 'inactive'], true) || $room->hotel?->status !== 'active') {
            return false;
        }

        // Check for overlapping active reservations: check_in < requested_check_out AND check_out > requested_check_in
        $overlapQuery = Reservation::where('room_id', $roomId)
            ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn);

        if ($ignoreReservationId !== null) {
            $overlapQuery->where('reservation_id', '!=', $ignoreReservationId);
        }

        return ! $overlapQuery->exists();
    }

    /**
     * Search and retrieve available rooms matching the given search criteria.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Room>
     */
    public function searchAvailableRooms(array $filters): Collection
    {
        $query = Room::with(['hotel', 'roomType', 'amenities', 'images'])
            ->whereHas('hotel', function ($hq) {
                $hq->where('status', 'active');
            })
            ->whereNotIn('status', ['under_maintenance', 'inactive']);

        if (! empty($filters['hotel_id'])) {
            $query->where('hotel_id', $filters['hotel_id']);
        }

        if (! empty($filters['location'])) {
            $location = $filters['location'];
            $query->whereHas('hotel', function ($hq) use ($location) {
                $hq->where('location', 'like', "%{$location}%")
                    ->orWhere('address', 'like', "%{$location}%")
                    ->orWhere('name', 'like', "%{$location}%");
            });
        }

        if (! empty($filters['room_type_id'])) {
            $query->where('room_type_id', $filters['room_type_id']);
        }

        if (! empty($filters['number_of_guests'])) {
            $query->where('capacity', '>=', (int) $filters['number_of_guests']);
        }

        if (! empty($filters['min_price'])) {
            $query->where('price_per_night', '>=', (float) $filters['min_price']);
        }

        if (! empty($filters['max_price'])) {
            $query->where('price_per_night', '<=', (float) $filters['max_price']);
        }

        if (! empty($filters['amenity_ids']) && is_array($filters['amenity_ids'])) {
            foreach ($filters['amenity_ids'] as $amenityId) {
                $query->whereHas('amenities', function ($aq) use ($amenityId) {
                    $aq->where('amenities.amenity_id', $amenityId);
                });
            }
        }

        if (! empty($filters['check_in']) && ! empty($filters['check_out'])) {
            $checkIn = $filters['check_in'];
            $checkOut = $filters['check_out'];

            $query->whereDoesntHave('reservations', function ($rq) use ($checkIn, $checkOut) {
                $rq->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
                    ->where('check_in', '<', $checkOut)
                    ->where('check_out', '>', $checkIn);
            });
        }

        return $query->get();
    }
}
