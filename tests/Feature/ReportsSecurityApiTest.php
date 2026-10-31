<?php

use App\Models\AuditLog;
use App\Models\FraudFlag;
use App\Models\Hotel;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $this->receptionist = User::factory()->create(['role' => 'receptionist', 'status' => 'active']);
    $this->guest = User::factory()->create(['role' => 'guest', 'status' => 'active']);

    $this->hotel = Hotel::create([
        'name' => 'Kigali Grand Hotel',
        'description' => 'Luxury hotel',
        'location' => 'Kigali',
        'address' => 'KN 3 Ave',
        'contact_phone' => '+250788111222',
        'contact_email' => 'info@kigaligrand.rw',
        'status' => 'active',
    ]);

    $this->roomType = RoomType::create([
        'type_name' => 'Executive Suite',
        'description' => 'Top floor suite',
        'maximum_capacity' => 2,
    ]);

    $this->room = Room::create([
        'hotel_id' => $this->hotel->hotel_id,
        'room_number' => '301',
        'room_type_id' => $this->roomType->room_type_id,
        'price_per_night' => 120000.00,
        'capacity' => 2,
        'status' => 'available',
    ]);

    $this->reservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-REP001',
        'user_id' => $this->guest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'number_of_guests' => 2,
        'total_amount' => 240000.00,
        'payment_status' => 'paid',
        'reservation_status' => 'confirmed',
    ]);

    Payment::create([
        'reservation_id' => $this->reservation->reservation_id,
        'amount' => 240000.00,
        'payment_method' => 'card',
        'transaction_reference' => 'PAY-TEST-001',
        'payment_status' => 'completed',
        'paid_at' => now(),
    ]);
});

test('admin can retrieve executive analytics payload with aggregate metrics', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/api/v1/reports/analytics');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'executive_kpis' => [
                    'total_hotels',
                    'total_rooms',
                    'available_rooms',
                    'occupied_rooms',
                    'occupancy_rate_percent',
                    'active_reservations',
                    'total_revenue',
                    'cancellation_rate_percent',
                    'avg_satisfaction_rating',
                ],
                'room_status_distribution',
                'revenue_trend',
                'revenue_by_branch',
                'revenue_by_room_type',
                'staff_performance',
            ],
        ]);

    $kpis = $response->json('data.executive_kpis');
    expect($kpis['total_hotels'])->toBeGreaterThanOrEqual(1);
    expect($kpis['total_revenue'])->toBeGreaterThanOrEqual(240000.0);
});

test('non-admin cannot access analytics reports', function () {
    $response = $this->actingAs($this->guest)
        ->getJson('/api/v1/reports/analytics');

    $response->assertForbidden();
});

test('admin can export analytics report as PDF', function () {
    $response = $this->actingAs($this->admin)
        ->get('/api/v1/reports/export/pdf');

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

test('admin can export analytics report as CSV stream', function () {
    $response = $this->actingAs($this->admin)
        ->get('/api/v1/reports/export/csv');

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

test('admin can view and filter audit logs and fraud flags', function () {
    AuditLog::create([
        'user_id' => $this->admin->user_id,
        'action' => 'test_action',
        'target_table' => 'reservations',
        'target_id' => $this->reservation->reservation_id,
        'ip_address' => '127.0.0.1',
        'created_at' => now(),
    ]);

    $flag = FraudFlag::create([
        'user_id' => $this->guest->user_id,
        'ip_address' => '192.168.1.100',
        'activity_description' => 'Simulated high velocity bookings',
        'risk_level' => 'high',
        'review_status' => 'pending',
        'created_at' => now(),
    ]);

    $logRes = $this->actingAs($this->admin)->getJson('/api/v1/security/audit-logs');
    $logRes->assertOk()->assertJsonPath('meta.kpis.total_logs', 1);

    $flagRes = $this->actingAs($this->admin)->getJson('/api/v1/security/fraud-flags');
    $flagRes->assertOk()->assertJsonPath('meta.kpis.total_flags', 1);

    // Guest cannot access security endpoints
    $guestRes = $this->actingAs($this->guest)->getJson('/api/v1/security/fraud-flags');
    $guestRes->assertForbidden();
});

test('admin can review fraud flag and suspend user account', function () {
    $suspiciousGuest = User::factory()->create(['role' => 'guest', 'status' => 'active']);

    $flag = FraudFlag::create([
        'user_id' => $suspiciousGuest->user_id,
        'ip_address' => '10.0.0.50',
        'activity_description' => 'Repeated overlapping reservation spam',
        'risk_level' => 'high',
        'review_status' => 'pending',
        'created_at' => now(),
    ]);

    $response = $this->actingAs($this->admin)
        ->patchJson("/api/v1/security/fraud-flags/{$flag->flag_id}", [
            'review_status' => 'resolved',
            'suspend_user' => true,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.review_status', 'resolved');

    expect($suspiciousGuest->fresh()->status)->toBe('suspended');
});

test('admin can broadcast promotional notification to active guests', function () {
    $response = $this->actingAs($this->admin)
        ->postJson('/api/v1/notifications/broadcast-promo', [
            'title' => 'Special Off-Peak 25% Discount!',
            'message' => 'Book any luxury lakeview room this weekend and receive a complimentary dinner.',
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $promoNotification = Notification::where('user_id', $this->guest->user_id)
        ->where('notification_type', 'promo')
        ->first();

    expect($promoNotification)->not->toBeNull();
    expect($promoNotification->title)->toBe('Special Off-Peak 25% Discount!');
});

test('stay reminders command sends checkin reminder for tomorrow arrivals', function () {
    $tomorrowGuest = User::factory()->create(['role' => 'guest', 'status' => 'active']);

    $tomorrowReservation = Reservation::create([
        'confirmation_code' => 'KGL-2026-TMRW',
        'user_id' => $tomorrowGuest->user_id,
        'room_id' => $this->room->room_id,
        'check_in' => now()->addDay()->toDateString(),
        'check_out' => now()->addDays(3)->toDateString(),
        'number_of_guests' => 1,
        'total_amount' => 360000.00,
        'payment_status' => 'paid',
        'reservation_status' => 'confirmed',
    ]);

    $this->artisan('hotel:send-reminders')->assertExitCode(0);

    $reminder = Notification::where('user_id', $tomorrowGuest->user_id)
        ->where('notification_type', 'checkin')
        ->first();

    expect($reminder)->not->toBeNull();
    expect($reminder->message)->toContain('KGL-2026-TMRW');
});
