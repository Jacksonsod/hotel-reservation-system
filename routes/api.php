<?php

use App\Http\Controllers\Api\AmenityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomTypeController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (Prefixed with /api/v1)
|--------------------------------------------------------------------------
*/

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
    });
});

// Public Read-Only Search Routes
Route::prefix('public')->group(function () {
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{hotel}', [HotelController::class, 'show']);
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/room-types', [RoomTypeController::class, 'index']);
    Route::get('/amenities', [AmenityController::class, 'index']);
    Route::get('/services', [ServiceController::class, 'index']);
});

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // Authenticated Read Access for Staff & Guests
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{hotel}', [HotelController::class, 'show']);
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::get('/room-types', [RoomTypeController::class, 'index']);
    Route::get('/room-types/{room_type}', [RoomTypeController::class, 'show']);
    Route::get('/amenities', [AmenityController::class, 'index']);
    Route::get('/amenities/{amenity}', [AmenityController::class, 'show']);
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);

    // Admin Role-Protected Management Routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/verify-access', function () {
            return response()->json(['success' => true, 'message' => 'Admin access granted.']);
        });

        // Hotels CRUD
        Route::post('/hotels', [HotelController::class, 'store']);
        Route::put('/hotels/{hotel}', [HotelController::class, 'update']);
        Route::post('/hotels/{hotel}', [HotelController::class, 'update']);
        Route::delete('/hotels/{hotel}/images/{image}', [HotelController::class, 'destroyImage']);
        Route::delete('/hotels/{hotel}', [HotelController::class, 'destroy']);

        // Room Types CRUD
        Route::post('/room-types', [RoomTypeController::class, 'store']);
        Route::put('/room-types/{room_type}', [RoomTypeController::class, 'update']);
        Route::delete('/room-types/{room_type}', [RoomTypeController::class, 'destroy']);

        // Amenities CRUD
        Route::post('/amenities', [AmenityController::class, 'store']);
        Route::put('/amenities/{amenity}', [AmenityController::class, 'update']);
        Route::delete('/amenities/{amenity}', [AmenityController::class, 'destroy']);

        // Services CRUD
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        // Rooms CRUD
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{room}', [RoomController::class, 'update']);
        Route::post('/rooms/{room}', [RoomController::class, 'update']);
        Route::delete('/rooms/{room}/images/{image}', [RoomController::class, 'destroyImage']);
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy']);

        // Users & Roles CRUD
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
