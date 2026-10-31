<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of services with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('hotel');

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', $request->input('hotel_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('service_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);

            return $this->paginatedResponse($query->paginate($perPage), 'Services retrieved successfully.');
        }

        return $this->successResponse($query->get(), 'Services retrieved successfully.');
    }

    /**
     * Display the specified service.
     */
    public function show(int $id): JsonResponse
    {
        $service = Service::with('hotel')->find($id);

        if (! $service) {
            return $this->errorResponse('Service not found.', 404);
        }

        return $this->successResponse($service, 'Service retrieved successfully.');
    }

    /**
     * Store a newly created service.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hotel_id' => 'required|exists:hotels,hotel_id',
            'service_name' => 'required|string|max:120',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $service = Service::create([
            'hotel_id' => $validated['hotel_id'],
            'service_name' => $validated['service_name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'status' => $validated['status'] ?? 'active',
        ]);

        AuditLoggerService::log('create', 'services', $service->service_id);

        return $this->successResponse(
            $service->load('hotel'),
            'Service created successfully.',
            201
        );
    }

    /**
     * Update the specified service.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::find($id);

        if (! $service) {
            return $this->errorResponse('Service not found.', 404);
        }

        $validated = $request->validate([
            'hotel_id' => 'sometimes|required|exists:hotels,hotel_id',
            'service_name' => 'sometimes|required|string|max:120',
            'description' => 'sometimes|required|string',
            'price' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $service->update($validated);

        AuditLoggerService::log('update', 'services', $service->service_id);

        return $this->successResponse(
            $service->load('hotel'),
            'Service updated successfully.'
        );
    }

    /**
     * Remove the specified service from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $service = Service::find($id);

        if (! $service) {
            return $this->errorResponse('Service not found.', 404);
        }

        if ($service->guestServiceOrders()->exists()) {
            return $this->errorResponse('Cannot delete service with existing guest orders. Consider deactivating it.', 409);
        }

        $service->delete();

        AuditLoggerService::log('delete', 'services', $id);

        return $this->successResponse(null, 'Service deleted successfully.');
    }
}
