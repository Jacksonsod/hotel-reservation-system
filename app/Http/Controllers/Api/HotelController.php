<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\Reservation;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HotelController extends Controller
{
    use ApiResponse;

    /**
     * List hotels with search and status filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Hotel::with(['images'])
            ->withCount('rooms')
            ->addSelect([
                'active_reservations_count' => Reservation::selectRaw('count(*)')
                    ->join('rooms', 'rooms.room_id', '=', 'reservations.room_id')
                    ->whereColumn('rooms.hotel_id', 'hotels.hotel_id')
                    ->whereIn('reservations.reservation_status', ['pending', 'confirmed', 'checked_in']),
            ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);

            return $this->paginatedResponse($query->paginate($perPage), 'Hotels retrieved successfully.');
        }

        return $this->successResponse($query->get(), 'Hotels retrieved successfully.');
    }

    /**
     * Retrieve single hotel details with relations and reviews average.
     */
    public function show(int $id): JsonResponse
    {
        $hotel = Hotel::with([
            'images',
            'rooms.roomType',
            'rooms.amenities',
            'services',
            'reviews.user',
        ])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->withCount('rooms')
            ->find($id);

        if (! $hotel) {
            return $this->errorResponse('Hotel not found.', 404);
        }

        return $this->successResponse($hotel, 'Hotel retrieved successfully.');
    }

    /**
     * Store a newly created hotel.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'required|string',
            'location' => 'required|string|max:100',
            'address' => 'required|string|max:255',
            'contact_phone' => ['required', 'regex:/^\+?[0-9]{10,15}$/'],
            'contact_email' => 'required|email|max:150',
            'status' => 'sometimes|in:active,inactive',
            'images.*' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $hotel = Hotel::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'location' => $validated['location'],
            'address' => $validated['address'],
            'contact_phone' => $validated['contact_phone'],
            'contact_email' => $validated['contact_email'],
            'status' => $validated['status'] ?? 'active',
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('hotels', $filename, 'public');
                HotelImage::create([
                    'hotel_id' => $hotel->hotel_id,
                    'image_path' => $path,
                    'uploaded_at' => now(),
                ]);
            }
        }

        AuditLoggerService::log('create', 'hotels', $hotel->hotel_id);

        return $this->successResponse(
            $hotel->load('images'),
            'Hotel created successfully.',
            201
        );
    }

    /**
     * Update an existing hotel.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $hotel = Hotel::find($id);

        if (! $hotel) {
            return $this->errorResponse('Hotel not found.', 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'sometimes|required|string',
            'location' => 'sometimes|required|string|max:100',
            'address' => 'sometimes|required|string|max:255',
            'contact_phone' => ['sometimes', 'required', 'regex:/^\+?[0-9]{10,15}$/'],
            'contact_email' => 'sometimes|required|email|max:150',
            'status' => 'sometimes|in:active,inactive',
            'images.*' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        // Guard: Prevent deactivation if active reservations exist
        if (isset($validated['status']) && $validated['status'] === 'inactive' && $hotel->status !== 'inactive') {
            $hasActiveReservations = Reservation::whereIn('room_id', $hotel->rooms()->pluck('room_id'))
                ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
                ->exists();

            if ($hasActiveReservations) {
                return $this->errorResponse('Cannot deactivate hotel with active reservations.', 409);
            }
        }

        $hotel->update($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('hotels', $filename, 'public');
                HotelImage::create([
                    'hotel_id' => $hotel->hotel_id,
                    'image_path' => $path,
                    'uploaded_at' => now(),
                ]);
            }
        }

        AuditLoggerService::log('update', 'hotels', $hotel->hotel_id);

        return $this->successResponse(
            $hotel->load('images'),
            'Hotel updated successfully.'
        );
    }

    /**
     * Delete an individual hotel image.
     */
    public function destroyImage(int $hotelId, int $imageId): JsonResponse
    {
        $image = HotelImage::where('hotel_id', $hotelId)->where('image_id', $imageId)->first();

        if (! $image) {
            return $this->errorResponse('Hotel image not found.', 404);
        }

        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        AuditLoggerService::log('delete_image', 'hotel_images', $imageId);

        return $this->successResponse(null, 'Hotel image deleted successfully.');
    }

    /**
     * Delete a hotel and its associated images.
     */
    public function destroy(int $id): JsonResponse
    {
        $hotel = Hotel::with('images')->find($id);

        if (! $hotel) {
            return $this->errorResponse('Hotel not found.', 404);
        }

        // Guard: Prevent deleting hotel with active reservations
        $hasActiveReservations = Reservation::whereIn('room_id', $hotel->rooms()->pluck('room_id'))
            ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
            ->exists();

        if ($hasActiveReservations) {
            return $this->errorResponse('Cannot delete hotel with active reservations.', 409);
        }

        foreach ($hotel->images as $image) {
            if (Storage::disk('public')->exists($image->image_path)) {
                Storage::disk('public')->delete($image->image_path);
            }
            $image->delete();
        }

        $hotel->delete();

        AuditLoggerService::log('delete', 'hotels', $id);

        return $this->successResponse(null, 'Hotel deleted successfully.');
    }
}
