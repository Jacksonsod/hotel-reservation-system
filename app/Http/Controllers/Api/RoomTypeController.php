<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomType;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of room types.
     */
    public function index(): JsonResponse
    {
        $roomTypes = RoomType::withCount('rooms')->get();

        return $this->successResponse($roomTypes, 'Room types retrieved successfully.');
    }

    /**
     * Display the specified room type.
     */
    public function show(int $id): JsonResponse
    {
        $roomType = RoomType::withCount('rooms')->find($id);

        if (! $roomType) {
            return $this->errorResponse('Room type not found.', 404);
        }

        return $this->successResponse($roomType, 'Room type retrieved successfully.');
    }

    /**
     * Store a newly created room type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type_name' => 'required|string|max:100',
            'description' => 'required|string',
            'maximum_capacity' => 'required|integer|min:1|max:20',
        ]);

        $roomType = RoomType::create($validated);

        AuditLoggerService::log('create', 'room_types', $roomType->room_type_id);

        return $this->successResponse(
            $roomType->loadCount('rooms'),
            'Room type created successfully.',
            201
        );
    }

    /**
     * Update the specified room type.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $roomType = RoomType::find($id);

        if (! $roomType) {
            return $this->errorResponse('Room type not found.', 404);
        }

        $validated = $request->validate([
            'type_name' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|required|string',
            'maximum_capacity' => 'sometimes|required|integer|min:1|max:20',
        ]);

        $roomType->update($validated);

        AuditLoggerService::log('update', 'room_types', $roomType->room_type_id);

        return $this->successResponse(
            $roomType->loadCount('rooms'),
            'Room type updated successfully.'
        );
    }

    /**
     * Remove the specified room type from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $roomType = RoomType::withCount('rooms')->find($id);

        if (! $roomType) {
            return $this->errorResponse('Room type not found.', 404);
        }

        if ($roomType->rooms_count > 0) {
            return $this->errorResponse('Cannot delete room type with assigned rooms.', 409);
        }

        $roomType->delete();

        AuditLoggerService::log('delete', 'room_types', $id);

        return $this->successResponse(null, 'Room type deleted successfully.');
    }
}
