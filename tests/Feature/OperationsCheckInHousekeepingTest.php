<?php

use App\Models\CheckIn;
use App\Models\Checkout;
use App\Models\Hotel;
use App\Models\HousekeepingTask;
use App\Models\LoyaltyAccount;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $this->receptionist = User::factory()->create(['role' => 'receptionist', 'status' => 'active']);
    $this->housekeeper = User::factory()->create(['role' => 'housekeeping', 'status' => 'active']);
    $this->guest = User::factory()->create(['role' => 'guest', 'status' => 'active']);

    $this->hotel = Hotel::create([
        'name' => 'Kigali Test Hotel',
        'description' => 'A wonderful test hotel in Kigali',
        'location' => 'Kigali',
        'address' => 'KN 3 Ave, Kigali',
        'contact_phone' => '+250788000111',
        'contact_email' => 'kigali@test.rw',
        'status' => 'active',
    ]);

    $this->roomType = RoomType::create([
        'type_name' => 'Deluxe Suite',
        'description' => 'Spacious suite with balcony',
        'maximum_capacity' => 2,
    ]);

    $this->room = Room::create([
        'hotel_id' => $this->hotel->hotel_id,
        'room_number' => '101',
        'room_type_id' => $this->roomType->room_type_id,
        'price_per_night' => 50000.00,
        'capacity' => 2,
        'description' => 'Cozy room',
        'status' => 'available',
    ]);

    LoyaltyAccount::create([
        'user_id' => $this->guest->user_id,
        'total_points' => 0,
        'available_points' => 0,
    ]);
});

test('receptionist can view reception dashboard KPIs and operational summaries', function () {
    $response = $this->actingAs($this->receptionist)
        ->getJson('/api/v1/reception/dashboard');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'expected_arrivals',
                'current_guests',
                'scheduled_departures',
                'room_status_summary' => [
                    'total',
                    'available',
                    'reserved',
                    'occupied',
                    'dirty',
                    'clean',
                    'under_maintenance',
                ],
            ],
        ]);
});

test('guest cannot access reception dashboard', function () {
    $response = $this->actingAs($this->guest)
        ->getJson('/api/v1/reception/dashboard');

    $response->assertForbidden();
});

test('receptionist can lookup reservation by confirmation code case-insensitively', function () {
    $reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-ABC123',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'number_of_guests' => 1,
        'total_amount' => 100000.00,
        'payment_status' => 'unpaid',
        'reservation_status' => 'confirmed',
    ]);

    $response = $this->actingAs($this->receptionist)
        ->getJson('/api/v1/reception/lookup/kgl-2026-abc123');

    $response->assertOk()
        ->assertJsonPath('data.reservation.confirmation_code', 'KGL-2026-ABC123');
});

test('receptionist can check in a guest and room status becomes occupied', function () {
    $reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-CHK001',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'number_of_guests' => 2,
        'total_amount' => 100000.00,
        'payment_status' => 'paid',
        'reservation_status' => 'confirmed',
    ]);

    $response = $this->actingAs($this->receptionist)
        ->postJson("/api/v1/reservations/{$reservation->reservation_id}/check-in", [
            'special_requests' => 'Extra pillows and late check-in',
            'companion_guests' => [
                [
                    'full_name' => 'Alice Johnson',
                    'identification_number' => '1199080001234567',
                    'contact_phone' => '+250788111222',
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.reservation_status', 'checked_in');

    expect($this->room->fresh()->status)->toBe('occupied');
    expect(CheckIn::where('reservation_id', $reservation->reservation_id)->exists())->toBeTrue();
});

test('service orders can be added to in-house guest folio and recalculates invoice', function () {
    $reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-SRV001',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'number_of_guests' => 1,
        'total_amount' => 100000.00,
        'payment_status' => 'unpaid',
        'reservation_status' => 'checked_in',
    ]);

    $service = Service::create([
        'hotel_id' => $this->hotel->hotel_id,
        'service_name' => 'Airport Shuttle',
        'description' => 'Transfer to Kigali Airport',
        'price' => 20000.00,
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->receptionist)
        ->postJson("/api/v1/reservations/{$reservation->reservation_id}/services", [
            'service_id' => $service->service_id,
            'quantity' => 1,
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.service_id', $service->service_id);

    // Reservation total must include the room charges + service order with tax
    $freshRes = $reservation->fresh();
    expect((float) $freshRes->total_amount)->toBeGreaterThan(100000.00);
});

test('checkout is blocked when guest has outstanding balance without inline payment', function () {
    $reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-OUT001',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->subDays(2)->toDateString(),
        'check_out' => now()->toDateString(),
        'number_of_guests' => 1,
        'total_amount' => 100000.00,
        'payment_status' => 'unpaid',
        'reservation_status' => 'checked_in',
    ]);

    $this->room->update(['status' => 'occupied']);

    $response = $this->actingAs($this->receptionist)
        ->postJson("/api/v1/reservations/{$reservation->reservation_id}/checkout");

    $response->assertStatus(422)
        ->assertJsonPath('success', false);

    expect($this->room->fresh()->status)->toBe('occupied');
});

test('checkout settles balance, marks room dirty, provisions housekeeping turnover and awards loyalty points', function () {
    $reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-OUT002',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->subDays(2)->toDateString(),
        'check_out' => now()->toDateString(),
        'number_of_guests' => 1,
        'total_amount' => 100000.00,
        'payment_status' => 'unpaid',
        'reservation_status' => 'checked_in',
    ]);

    $this->room->update(['status' => 'occupied']);

    // Check out with inline settlement payment
    $response = $this->actingAs($this->receptionist)
        ->postJson("/api/v1/reservations/{$reservation->reservation_id}/checkout", [
            'payment_method' => 'card',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.reservation.reservation_status', 'checked_out');

    expect($this->room->fresh()->status)->toBe('dirty');
    expect(Checkout::where('reservation_id', $reservation->reservation_id)->exists())->toBeTrue();

    // Verify HousekeepingTask turnover was auto-created
    $task = HousekeepingTask::where('room_id', $this->room->room_id)->first();
    expect($task)->not->toBeNull();
    expect($task->task_status)->toBe('dirty');

    // Verify loyalty points were awarded for completed stay (1 point per 1,000 RWF)
    $loyalty = LoyaltyAccount::where('user_id', $this->guest->user_id)->first();
    expect($loyalty->available_points)->toBeGreaterThan(0);
});

test('housekeeping task status lifecycle dirty to cleaning to clean resets room to available', function () {
    $this->room->update(['status' => 'dirty']);

    $task = HousekeepingTask::create([
        'room_id' => $this->room->room_id,
        'assigned_to' => $this->housekeeper->user_id,
        'task_description' => 'Room turnover',
        'task_status' => 'dirty',
        'assigned_at' => now(),
    ]);

    // Transition to cleaning
    $response = $this->actingAs($this->housekeeper)
        ->patchJson("/api/v1/housekeeping/tasks/{$task->task_id}/status", [
            'task_status' => 'cleaning',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.task_status', 'cleaning');

    // Transition to clean
    $response2 = $this->actingAs($this->housekeeper)
        ->patchJson("/api/v1/housekeeping/tasks/{$task->task_id}/status", [
            'task_status' => 'clean',
        ]);

    $response2->assertOk()
        ->assertJsonPath('data.task_status', 'clean');

    // Room must now be available
    expect($this->room->fresh()->status)->toBe('available');
    expect($task->fresh()->completed_at)->not->toBeNull();
});

test('reporting maintenance sets room to under_maintenance and resolving creates turnover task', function () {
    $this->room->update(['status' => 'available']);

    // 1. Report issue
    $response = $this->actingAs($this->housekeeper)
        ->postJson('/api/v1/maintenance', [
            'room_id' => $this->room->room_id,
            'issue_description' => 'Air conditioning leaking water onto carpet',
            'priority' => 'urgent',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.priority', 'urgent');

    $logId = $response->json('data.maintenance_id');
    expect($this->room->fresh()->status)->toBe('under_maintenance');

    // 2. Resolve issue
    $responseResolve = $this->actingAs($this->admin)
        ->patchJson("/api/v1/maintenance/{$logId}", [
            'maintenance_status' => 'resolved',
        ]);

    $responseResolve->assertOk()
        ->assertJsonPath('data.maintenance_status', 'resolved');

    // Room must now transition to 'dirty'
    expect($this->room->fresh()->status)->toBe('dirty');

    // Turnover housekeeping task must be auto-created
    $postMaintTask = HousekeepingTask::where('room_id', $this->room->room_id)
        ->where('task_status', 'dirty')
        ->latest('assigned_at')
        ->first();

    expect($postMaintTask)->not->toBeNull();
    expect($postMaintTask->task_description)->toContain('Turnover and post-maintenance inspection');
});
