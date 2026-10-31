<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    /**
     * Return a standardized success JSON response.
     *
     * @param  array<string, mixed>|null  $meta
     */
    public function successResponse(
        mixed $data = null,
        string $message = 'Operation completed successfully.',
        int $code = 200,
        ?array $meta = null
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data ?? (object) [],
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $code);
    }

    /**
     * Return a standardized paginated JSON response.
     */
    public function paginatedResponse(
        LengthAwarePaginator $paginator,
        string $message = 'Records retrieved successfully.',
        ?array $meta = null
    ): JsonResponse {
        $metaData = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];

        if ($meta !== null) {
            $metaData = array_merge($metaData, $meta);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginator->items(),
            'meta' => $metaData,
        ], 200);
    }

    /**
     * Return a standardized error JSON response.
     */
    public function errorResponse(
        string $message,
        int $code = 400,
        mixed $errors = null
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }
}
