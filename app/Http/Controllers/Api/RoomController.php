<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomImage;
use App\Models\RoomType;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of rooms with filters and KPI metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Room::with(['hotel', 'roomType', 'amenities', 'images']);

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', $request->input('hotel_id'));
        }

        if ($request->filled('room_type_id')) {
            $query->where('room_type_id', $request->input('room_type_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('min_price')) {
            $query->where('price_per_night', '>=', $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price_per_night', '<=', $request->input('max_price'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('room_number', 'like', "%{$search}%")
                    ->orWhereHas('hotel', function ($hq) use ($search) {
                        $hq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Summary KPI counts scoped to current branch if hotel_id passed, else all
        $kpiBase = Room::query();
        if ($request->filled('hotel_id')) {
            $kpiBase->where('hotel_id', $request->input('hotel_id'));
        }

        $kpis = [
            'total' => (clone $kpiBase)->count(),
            'available' => (clone $kpiBase)->where('status', 'available')->count(),
            'occupied' => (clone $kpiBase)->where('status', 'occupied')->count(),
            'dirty_or_cleaning' => (clone $kpiBase)->whereIn('status', ['dirty', 'clean'])->count(),
            'under_maintenance' => (clone $kpiBase)->where('status', 'under_maintenance')->count(),
        ];

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Rooms retrieved successfully.',
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
            'Rooms retrieved successfully.',
            200,
            ['kpis' => $kpis]
        );
    }

    /**
     * Display the specified room.
     */
    public function show(int $id): JsonResponse
    {
        $room = Room::with([
            'hotel',
            'roomType',
            'amenities',
            'images',
            'reservations' => fn ($q) => $q->latest()->limit(5),
        ])->find($id);

        if (! $room) {
            return $this->errorResponse('Room not found.', 404);
        }

        return $this->successResponse($room, 'Room retrieved successfully.');
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id' => 'required|exists:hotels,hotel_id',
            'room_number' => [
                'required',
                'string',
                'max:30',
                Rule::unique('rooms')->where(fn ($q) => $q->where('hotel_id', $request->input('hotel_id'))),
            ],
            'room_type_id' => 'required|exists:room_types,room_type_id',
            'price_per_night' => 'required|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:available,reserved,occupied,dirty,clean,under_maintenance,inactive',
            'amenity_ids' => 'nullable|array',
            'amenity_ids.*' => 'exists:amenities,amenity_id',
            'images.*' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        // Capacity constraint validation
        $roomType = RoomType::findOrFail($validated['room_type_id']);
        if ((int) $validated['capacity'] > (int) $roomType->maximum_capacity) {
            return $this->errorResponse(
                "Capacity ({$validated['capacity']}) exceeds the room type maximum capacity of {$roomType->maximum_capacity}.",
                422,
                ['capacity' => ["Capacity cannot exceed {$roomType->maximum_capacity} for room type '{$roomType->type_name}'."]]
            );
        }

        $room = Room::create([
            'hotel_id' => $validated['hotel_id'],
            'room_number' => $validated['room_number'],
            'room_type_id' => $validated['room_type_id'],
            'price_per_night' => $validated['price_per_night'],
            'capacity' => $validated['capacity'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'available',
        ]);

        if (! empty($validated['amenity_ids'])) {
            $room->amenities()->sync($validated['amenity_ids']);
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('rooms', $filename, 'public');
                RoomImage::create([
                    'room_id' => $room->room_id,
                    'image_path' => $path,
                    'uploaded_at' => now(),
                ]);
            }
        }

        AuditLoggerService::log('create', 'rooms', $room->room_id);

        return $this->successResponse(
            $room->load(['hotel', 'roomType', 'amenities', 'images']),
            'Room created successfully.',
            201
        );
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $room = Room::find($id);

        if (! $room) {
            return $this->errorResponse('Room not found.', 404);
        }

        $validated = $request->validate([
            'hotel_id' => 'sometimes|required|exists:hotels,hotel_id',
            'room_number' => [
                'sometimes',
                'required',
                'string',
                'max:30',
                Rule::unique('rooms')
                    ->where(fn ($q) => $q->where('hotel_id', $request->input('hotel_id', $room->hotel_id)))
                    ->ignore($id, 'room_id'),
            ],
            'room_type_id' => 'sometimes|required|exists:room_types,room_type_id',
            'price_per_night' => 'sometimes|required|numeric|min:0',
            'capacity' => 'sometimes|required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:available,reserved,occupied,dirty,clean,under_maintenance,inactive',
            'amenity_ids' => 'nullable|array',
            'amenity_ids.*' => 'exists:amenities,amenity_id',
            'images.*' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        // Capacity check
        $targetRoomTypeId = $validated['room_type_id'] ?? $room->room_type_id;
        $targetCapacity = (int) ($validated['capacity'] ?? $room->capacity);
        $roomType = RoomType::findOrFail($targetRoomTypeId);

        if ($targetCapacity > (int) $roomType->maximum_capacity) {
            return $this->errorResponse(
                "Capacity ({$targetCapacity}) exceeds the room type maximum capacity of {$roomType->maximum_capacity}.",
                422,
                ['capacity' => ["Capacity cannot exceed {$roomType->maximum_capacity} for room type '{$roomType->type_name}'."]]
            );
        }

        // Active reservation guard on deactivation or maintenance
        if (isset($validated['status']) && in_array($validated['status'], ['inactive', 'under_maintenance']) && $validated['status'] !== $room->status) {
            $hasActiveReservations = Reservation::where('room_id', $room->room_id)
                ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
                ->exists();

            if ($hasActiveReservations) {
                return $this->errorResponse('Cannot set room to inactive or under maintenance while it has active reservations.', 409);
            }
        }

        $room->update($validated);

        if ($request->has('amenity_ids')) {
            $room->amenities()->sync($validated['amenity_ids'] ?? []);
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('rooms', $filename, 'public');
                RoomImage::create([
                    'room_id' => $room->room_id,
                    'image_path' => $path,
                    'uploaded_at' => now(),
                ]);
            }
        }

        AuditLoggerService::log('update', 'rooms', $room->room_id);

        return $this->successResponse(
            $room->load(['hotel', 'roomType', 'amenities', 'images']),
            'Room updated successfully.'
        );
    }

    /**
     * Delete an individual room image.
     */
    public function destroyImage(int $roomId, int $imageId): JsonResponse
    {
        $image = RoomImage::where('room_id', $roomId)->where('image_id', $imageId)->first();

        if (! $image) {
            return $this->errorResponse('Room image not found.', 404);
        }

        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        AuditLoggerService::log('delete_image', 'room_images', $imageId);

        return $this->successResponse(null, 'Room image deleted successfully.');
    }

    /**
     * Remove the specified room from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $room = Room::with('images')->find($id);

        if (! $room) {
            return $this->errorResponse('Room not found.', 404);
        }

        // Guard: Prevent deleting room with active reservations
        $hasActiveReservations = Reservation::where('room_id', $room->room_id)
            ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
            ->exists();

        if ($hasActiveReservations) {
            return $this->errorResponse('Cannot delete room with active reservations.', 409);
        }

        foreach ($room->images as $image) {
            if (Storage::disk('public')->exists($image->image_path)) {
                Storage::disk('public')->delete($image->image_path);
            }
            $image->delete();
        }

        $room->amenities()->detach();
        $room->delete();

        AuditLoggerService::log('delete', 'rooms', $id);

        return $this->successResponse(null, 'Room deleted successfully.');
    }
}
