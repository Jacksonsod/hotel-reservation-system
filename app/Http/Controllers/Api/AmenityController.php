<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AmenityController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of amenities.
     */
    public function index(): JsonResponse
    {
        $amenities = Amenity::withCount('rooms')->get();

        return $this->successResponse($amenities, 'Amenities retrieved successfully.');
    }

    /**
     * Display the specified amenity.
     */
    public function show(int $id): JsonResponse
    {
        $amenity = Amenity::withCount('rooms')->find($id);

        if (! $amenity) {
            return $this->errorResponse('Amenity not found.', 404);
        }

        return $this->successResponse($amenity, 'Amenity retrieved successfully.');
    }

    /**
     * Store a newly created amenity.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amenity_name' => 'required|string|max:100|unique:amenities,amenity_name',
            'description' => 'required|string|max:255',
        ]);

        $amenity = Amenity::create($validated);

        AuditLoggerService::log('create', 'amenities', $amenity->amenity_id);

        return $this->successResponse(
            $amenity->loadCount('rooms'),
            'Amenity created successfully.',
            201
        );
    }

    /**
     * Update the specified amenity.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $amenity = Amenity::find($id);

        if (! $amenity) {
            return $this->errorResponse('Amenity not found.', 404);
        }

        $validated = $request->validate([
            'amenity_name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('amenities', 'amenity_name')->ignore($id, 'amenity_id'),
            ],
            'description' => 'sometimes|required|string|max:255',
        ]);

        $amenity->update($validated);

        AuditLoggerService::log('update', 'amenities', $amenity->amenity_id);

        return $this->successResponse(
            $amenity->loadCount('rooms'),
            'Amenity updated successfully.'
        );
    }

    /**
     * Remove the specified amenity from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $amenity = Amenity::find($id);

        if (! $amenity) {
            return $this->errorResponse('Amenity not found.', 404);
        }

        $amenity->rooms()->detach();
        $amenity->delete();

        AuditLoggerService::log('delete', 'amenities', $id);

        return $this->successResponse(null, 'Amenity deleted successfully.');
    }
}
