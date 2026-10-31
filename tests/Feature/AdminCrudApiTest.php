<?php

use App\Models\Amenity;
use App\Models\Hotel;
use App\Models\LoyaltyAccount;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function createAdminUser(): User
{
    return User::create([
        'name' => 'System Admin',
        'email' => 'admin@test.rw',
        'phone' => '+250788111222',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'admin',
        'status' => 'active',
    ]);
}

function createGuestUser(): User
{
    $guest = User::create([
        'name' => 'Guest User',
        'email' => 'guest@test.rw',
        'phone' => '+250788333444',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    LoyaltyAccount::create([
        'user_id' => $guest->user_id,
        'total_points' => 0,
        'available_points' => 0,
    ]);

    return $guest;
}

test('admin can create a hotel with images and retrieve it', function () {
    Storage::fake('public');
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    $file = UploadedFile::fake()->image('hotel.jpg');

    $response = $this->postJson('/api/v1/hotels', [
        'name' => 'Kigali Serena Luxury',
        'description' => 'Five star luxury hotel in Kigali center',
        'location' => 'Kigali',
        'address' => 'Boulevard de la Revolution',
        'contact_phone' => '+250788999000',
        'contact_email' => 'info@kigaliserena.rw',
        'status' => 'active',
        'images' => [$file],
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Hotel created successfully.',
        ]);

    $this->assertDatabaseHas('hotels', [
        'name' => 'Kigali Serena Luxury',
        'location' => 'Kigali',
    ]);

    $hotel = Hotel::where('name', 'Kigali Serena Luxury')->first();
    expect($hotel->images)->toHaveCount(1);
    Storage::disk('public')->assertExists($hotel->images->first()->image_path);

    // Verify audit log
    $this->assertDatabaseHas('audit_logs', [
        'action' => 'create',
        'target_table' => 'hotels',
        'target_id' => $hotel->hotel_id,
    ]);
});

test('hotel cannot be deactivated or deleted when active reservations exist', function () {
    $admin = createAdminUser();
    $guest = createGuestUser();
    Sanctum::actingAs($admin);

    $hotel = Hotel::create([
        'name' => 'Lake Kivu Serena',
        'description' => 'Lakeside resort',
        'location' => 'Rubavu',
        'address' => 'Rubavu Lake Road',
        'contact_phone' => '+250788555666',
        'contact_email' => 'lake@serena.rw',
        'status' => 'active',
    ]);

    $roomType = RoomType::create([
        'type_name' => 'Deluxe Suite',
        'description' => 'Luxury suite',
        'maximum_capacity' => 2,
    ]);

    $room = Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '101',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 150000,
        'capacity' => 2,
        'status' => 'available',
    ]);

    // Create an active reservation
    Reservation::create([
        'confirmation_code' => 'RES-20261101-ABCDE',
        'user_id' => $guest->user_id,
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(2)->toDateString(),
        'check_out' => now()->addDays(5)->toDateString(),
        'number_of_guests' => 2,
        'total_amount' => 450000,
        'payment_status' => 'unpaid',
        'reservation_status' => 'confirmed',
    ]);

    // Attempt deactivation
    $updateResponse = $this->putJson("/api/v1/hotels/{$hotel->hotel_id}", [
        'status' => 'inactive',
    ]);

    $updateResponse->assertStatus(409)
        ->assertJson(['success' => false]);

    // Attempt deletion
    $deleteResponse = $this->deleteJson("/api/v1/hotels/{$hotel->hotel_id}");

    $deleteResponse->assertStatus(409)
        ->assertJson(['success' => false]);

    $this->assertDatabaseHas('hotels', ['hotel_id' => $hotel->hotel_id]);
});

test('room type cannot be deleted if rooms are assigned', function () {
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    $hotel = Hotel::create([
        'name' => 'Test Hotel',
        'description' => 'Hotel description',
        'location' => 'Kigali',
        'address' => 'Test Address',
        'contact_phone' => '+250788111000',
        'contact_email' => 'test@hotel.rw',
        'status' => 'active',
    ]);

    $roomType = RoomType::create([
        'type_name' => 'Standard Double',
        'description' => 'Double bed',
        'maximum_capacity' => 2,
    ]);

    Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '201',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 80000,
        'capacity' => 2,
        'status' => 'available',
    ]);

    $response = $this->deleteJson("/api/v1/room-types/{$roomType->room_type_id}");

    $response->assertStatus(409)
        ->assertJson([
            'success' => false,
            'message' => 'Cannot delete room type with assigned rooms.',
        ]);
});

test('room capacity cannot exceed room type maximum capacity', function () {
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    $hotel = Hotel::create([
        'name' => 'Test Hotel',
        'description' => 'Hotel description',
        'location' => 'Kigali',
        'address' => 'Test Address',
        'contact_phone' => '+250788111000',
        'contact_email' => 'test@hotel.rw',
        'status' => 'active',
    ]);

    $roomType = RoomType::create([
        'type_name' => 'Single Room',
        'description' => 'Single bed',
        'maximum_capacity' => 1,
    ]);

    $response = $this->postJson('/api/v1/rooms', [
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '301',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 50000,
        'capacity' => 4, // Exceeds maximum_capacity 1
        'status' => 'available',
    ]);

    $response->assertStatus(422)
        ->assertJson(['success' => false]);
});

test('room cannot be deactivated or deleted when active reservations exist', function () {
    $admin = createAdminUser();
    $guest = createGuestUser();
    Sanctum::actingAs($admin);

    $hotel = Hotel::create([
        'name' => 'Test Hotel',
        'description' => 'Hotel description',
        'location' => 'Kigali',
        'address' => 'Test Address',
        'contact_phone' => '+250788111000',
        'contact_email' => 'test@hotel.rw',
        'status' => 'active',
    ]);

    $roomType = RoomType::create([
        'type_name' => 'Family Suite',
        'description' => 'Family suite',
        'maximum_capacity' => 4,
    ]);

    $room = Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '401',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 200000,
        'capacity' => 4,
        'status' => 'available',
    ]);

    Reservation::create([
        'confirmation_code' => 'RES-20261101-11223',
        'user_id' => $guest->user_id,
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(1)->toDateString(),
        'check_out' => now()->addDays(3)->toDateString(),
        'number_of_guests' => 3,
        'total_amount' => 400000,
        'payment_status' => 'unpaid',
        'reservation_status' => 'pending',
    ]);

    // Attempt setting to inactive
    $updateResponse = $this->putJson("/api/v1/rooms/{$room->room_id}", [
        'status' => 'inactive',
    ]);

    $updateResponse->assertStatus(409)
        ->assertJson(['success' => false]);

    // Attempt setting to under_maintenance
    $maintenanceResponse = $this->putJson("/api/v1/rooms/{$room->room_id}", [
        'status' => 'under_maintenance',
    ]);

    $maintenanceResponse->assertStatus(409)
        ->assertJson(['success' => false]);

    // Attempt deletion
    $deleteResponse = $this->deleteJson("/api/v1/rooms/{$room->room_id}");

    $deleteResponse->assertStatus(409)
        ->assertJson(['success' => false]);
});

test('amenity and service CRUD operations succeed', function () {
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    $hotel = Hotel::create([
        'name' => 'Test Hotel',
        'description' => 'Hotel description',
        'location' => 'Kigali',
        'address' => 'Test Address',
        'contact_phone' => '+250788111000',
        'contact_email' => 'test@hotel.rw',
        'status' => 'active',
    ]);

    // Amenity create
    $amenityRes = $this->postJson('/api/v1/amenities', [
        'amenity_name' => 'High-Speed Wi-Fi 6',
        'description' => 'Ultra fast wireless internet',
    ]);
    $amenityRes->assertStatus(201);
    $amenityId = $amenityRes->json('data.amenity_id');

    // Service create
    $serviceRes = $this->postJson('/api/v1/services', [
        'hotel_id' => $hotel->hotel_id,
        'service_name' => 'Airport Express Shuttle',
        'description' => 'Private airport pickup and drop-off',
        'price' => 35000,
        'status' => 'active',
    ]);
    $serviceRes->assertStatus(201);
    $serviceId = $serviceRes->json('data.service_id');

    // Delete service
    $deleteService = $this->deleteJson("/api/v1/services/{$serviceId}");
    $deleteService->assertStatus(200);

    // Delete amenity
    $deleteAmenity = $this->deleteJson("/api/v1/amenities/{$amenityId}");
    $deleteAmenity->assertStatus(200);
});

test('admin cannot deactivate, suspend or delete their own account', function () {
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    // Attempt self-deactivation
    $updateRes = $this->putJson("/api/v1/users/{$admin->user_id}", [
        'status' => 'inactive',
    ]);
    $updateRes->assertStatus(403);

    // Attempt self-suspension
    $suspendRes = $this->putJson("/api/v1/users/{$admin->user_id}", [
        'status' => 'suspended',
    ]);
    $suspendRes->assertStatus(403);

    // Attempt self-deletion
    $deleteRes = $this->deleteJson("/api/v1/users/{$admin->user_id}");
    $deleteRes->assertStatus(403);
});

test('admin can create guest user and loyalty account is automatically provisioned', function () {
    $admin = createAdminUser();
    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/v1/users', [
        'name' => 'New Guest',
        'email' => 'newguest@test.rw',
        'phone' => '+250788777888',
        'password' => 'Hotel@2026',
        'role' => 'guest',
        'status' => 'active',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'User created successfully.',
        ]);

    $createdUser = User::where('email', 'newguest@test.rw')->first();
    expect($createdUser)->not->toBeNull();
    expect($createdUser->loyaltyAccount)->not->toBeNull();
    expect($createdUser->loyaltyAccount->total_points)->toBe(0);
});
