<?php

use App\Models\AuditLog;
use App\Models\LoyaltyAccount;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('user can register successfully with valid credentials and receives token, loyalty account, and welcome notification', function () {
    $payload = [
        'name' => 'Alice Test',
        'email' => 'alice@example.com',
        'phone' => '+250788111222',
        'password' => 'Hotel@2026',
        'password_confirmation' => 'Hotel@2026',
    ];

    $response = $this->postJson('/api/v1/auth/register', $payload);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'token',
                'user' => [
                    'user_id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'status',
                ],
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'alice@example.com',
        'role' => 'guest',
        'status' => 'active',
    ]);

    $user = User::where('email', 'alice@example.com')->first();
    expect($user)->not->toBeNull();

    // Check loyalty account was created
    $loyalty = LoyaltyAccount::where('user_id', $user->user_id)->first();
    expect($loyalty)->not->toBeNull();
    expect($loyalty->total_points)->toBe(0);

    // Check welcome notification was sent
    $notification = Notification::where('user_id', $user->user_id)->first();
    expect($notification)->not->toBeNull();
    expect($notification->is_read)->toBeFalse();

    // Check audit log was created
    $auditLog = AuditLog::where('action', 'user_registered')->where('user_id', $user->user_id)->first();
    expect($auditLog)->not->toBeNull();
});

test('registration rejects weak passwords that violate the complexity policy', function () {
    $weakPasswords = [
        'short',           // too short (< 8 chars)
        'alllowercase123!', // no uppercase
        'NoSpecialChar123', // no special char
        'NoNumberAtAll!@#', // no number
        'InvalidChar 123!A', // invalid space character
    ];

    foreach ($weakPasswords as $weakPassword) {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Weak Password Tester',
            'email' => 'weak_'.uniqid().'@example.com',
            'phone' => '+250788111222',
            'password' => $weakPassword,
            'password_confirmation' => $weakPassword,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
});

test('registration rejects invalid phone numbers', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Invalid Phone Tester',
        'email' => 'invalidphone@example.com',
        'phone' => '123', // less than 10 digits
        'password' => 'Hotel@2026',
        'password_confirmation' => 'Hotel@2026',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

test('user can log in with valid credentials and receive token and unread notifications count', function () {
    $user = User::create([
        'name' => 'Bob Reception',
        'email' => 'bob@rphotels.rw',
        'phone' => '+250788333444',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'receptionist',
        'status' => 'active',
    ]);

    Notification::create([
        'user_id' => $user->user_id,
        'title' => 'Shift Notice',
        'message' => 'Morning shift starting at 07:00.',
        'notification_type' => 'booking',
        'is_read' => false,
        'created_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'bob@rphotels.rw',
        'password' => 'Hotel@2026',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'email' => 'bob@rphotels.rw',
                    'role' => 'receptionist',
                ],
                'unread_notifications_count' => 1,
            ],
        ]);

    expect($response->json('data.token'))->not->toBeNull();

    // Verify audit log recorded login
    $this->assertDatabaseHas('audit_logs', [
        'action' => 'user_login',
        'user_id' => $user->user_id,
    ]);
});

test('login fails with invalid password and returns 401', function () {
    User::create([
        'name' => 'Charlie Test',
        'email' => 'charlie@example.com',
        'phone' => '+250788555666',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'charlie@example.com',
        'password' => 'WrongPassword!123',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Invalid email or password.',
        ]);
});

test('login fails with suspended or inactive account and returns 403', function () {
    User::create([
        'name' => 'Suspended Guest',
        'email' => 'suspended@example.com',
        'phone' => '+250788777888',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'suspended',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'suspended@example.com',
        'password' => 'Hotel@2026',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can retrieve their profile via /api/v1/auth/me', function () {
    $user = User::create([
        'name' => 'Diane Guest',
        'email' => 'diane@example.com',
        'phone' => '+250788999000',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'email' => 'diane@example.com',
                ],
            ],
        ]);
});

test('authenticated user can update their personal profile', function () {
    $user = User::create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
        'phone' => '+250788111000',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson('/api/v1/auth/profile', [
        'name' => 'Updated Name',
        'email' => 'original@example.com',
        'phone' => '+250788222000',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'name' => 'Updated Name',
                'phone' => '+250788222000',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'user_id' => $user->user_id,
        'name' => 'Updated Name',
        'phone' => '+250788222000',
    ]);
});

test('role middleware protects admin routes against non-admin roles and returns 403', function () {
    $guestUser = User::create([
        'name' => 'Guest User',
        'email' => 'guest_role@example.com',
        'phone' => '+250788333000',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    Sanctum::actingAs($guestUser);

    // Guest accessing admin-protected route
    $response = $this->getJson('/api/v1/admin/verify-access');
    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Forbidden: You do not have permission to access this resource.',
        ]);

    // Now test with Admin
    $adminUser = User::create([
        'name' => 'Admin User',
        'email' => 'admin_role@example.com',
        'phone' => '+250788444000',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    Sanctum::actingAs($adminUser);

    $adminResponse = $this->getJson('/api/v1/admin/verify-access');
    $adminResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Admin access granted.',
        ]);
});

test('notifications API marks single and all notifications as read', function () {
    $user = User::create([
        'name' => 'Notification User',
        'email' => 'notif_user@example.com',
        'phone' => '+250788555000',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    $notif1 = Notification::create([
        'user_id' => $user->user_id,
        'title' => 'Test 1',
        'message' => 'Message 1',
        'notification_type' => 'booking',
        'is_read' => false,
        'created_at' => now(),
    ]);

    $notif2 = Notification::create([
        'user_id' => $user->user_id,
        'title' => 'Test 2',
        'message' => 'Message 2',
        'notification_type' => 'promo',
        'is_read' => false,
        'created_at' => now(),
    ]);

    Sanctum::actingAs($user);

    // List notifications
    $listRes = $this->getJson('/api/v1/notifications');
    $listRes->assertStatus(200)
        ->assertJson([
            'data' => [
                'unread_count' => 2,
            ],
        ]);

    // Mark single as read
    $patchRes = $this->patchJson("/api/v1/notifications/{$notif1->notification_id}/read");
    $patchRes->assertStatus(200);
    expect($notif1->fresh()->is_read)->toBeTrue();

    // Mark all as read
    $allRes = $this->postJson('/api/v1/notifications/read-all');
    $allRes->assertStatus(200);
    expect($notif2->fresh()->is_read)->toBeTrue();
});
