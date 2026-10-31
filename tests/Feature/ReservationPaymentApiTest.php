<?php

use App\Models\Hotel;
use App\Models\Invoice;
use App\Models\LoyaltyAccount;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function createTestHotelAndRoom(string $roomStatus = 'available', int $capacity = 2, float $price = 100000): array
{
    $hotel = Hotel::create([
        'name' => 'Kigali Marriott Grand',
        'description' => 'Luxury hotel in Kigali center',
        'location' => 'Kigali',
        'address' => 'KN 3 Ave',
        'contact_phone' => '+250788111222',
        'contact_email' => 'info@kigalimarriott.rw',
        'status' => 'active',
    ]);

    $roomType = RoomType::create([
        'type_name' => 'Superior King',
        'description' => 'King size bed with city views',
        'maximum_capacity' => $capacity,
    ]);

    $room = Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '101',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => $price,
        'capacity' => $capacity,
        'status' => $roomStatus,
    ]);

    return [$hotel, $roomType, $room];
}

function createGuest(string $email = 'guest@example.com', int $points = 100): User
{
    $user = User::create([
        'name' => 'Valued Guest',
        'email' => $email,
        'phone' => '+250788999888',
        'password' => Hash::make('Hotel@2026'),
        'role' => 'guest',
        'status' => 'active',
    ]);

    LoyaltyAccount::create([
        'user_id' => $user->user_id,
        'total_points' => $points,
        'available_points' => $points,
    ]);

    return $user;
}

test('real-time availability excludes overlapping bookings and maintenance rooms', function () {
    [$hotel, $roomType, $room1] = createTestHotelAndRoom('available', 2, 80000);

    // Create room 2 (under maintenance)
    $room2 = Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '102',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 80000,
        'capacity' => 2,
        'status' => 'under_maintenance',
    ]);

    // Create room 3 (available)
    $room3 = Room::create([
        'hotel_id' => $hotel->hotel_id,
        'room_number' => '103',
        'room_type_id' => $roomType->room_type_id,
        'price_per_night' => 80000,
        'capacity' => 2,
        'status' => 'available',
    ]);

    $guest = createGuest();

    // Create reservation for room 1 from Nov 10 to Nov 15
    Reservation::create([
        'confirmation_code' => 'RES-20261110-AAAAA',
        'user_id' => $guest->user_id,
        'room_id' => $room1->room_id,
        'check_in' => '2026-11-10',
        'check_out' => '2026-11-15',
        'number_of_guests' => 2,
        'total_amount' => 400000,
        'payment_status' => 'unpaid',
        'reservation_status' => 'confirmed',
    ]);

    // Search for dates Nov 12 to Nov 14 (overlaps room 1)
    $response = $this->getJson('/api/v1/public/availability?check_in=2026-11-12&check_out=2026-11-14');

    $response->assertStatus(200);
    $data = $response->json('data');

    // Room 1 is excluded (overlapping)
    // Room 2 is excluded (under_maintenance)
    // Room 3 is included (available)
    $roomIds = array_column($data, 'room_id');
    expect($roomIds)->not->toContain($room1->room_id);
    expect($roomIds)->not->toContain($room2->room_id);
    expect($roomIds)->toContain($room3->room_id);
});

test('double booking the same room for overlapping dates is rejected with 409 conflict and logs overlap attempt', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest1 = createGuest('guest1@example.com');
    $guest2 = createGuest('guest2@example.com');

    // Guest 1 books Nov 10 to Nov 15
    Sanctum::actingAs($guest1);
    $booking1 = $this->postJson('/api/v1/reservations', [
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(2)->toDateString(),
        'check_out' => now()->addDays(5)->toDateString(),
        'number_of_guests' => 2,
    ]);
    $booking1->assertStatus(201);

    // Guest 2 attempts overlapping booking
    Sanctum::actingAs($guest2);
    $booking2 = $this->postJson('/api/v1/reservations', [
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(3)->toDateString(),
        'check_out' => now()->addDays(6)->toDateString(),
        'number_of_guests' => 2,
    ]);

    $booking2->assertStatus(409)
        ->assertJson(['success' => false]);

    // Check that overlapping attempt was logged in audit_logs
    $this->assertDatabaseHas('audit_logs', [
        'action' => 'overlapping_booking_attempt',
        'target_table' => 'rooms',
        'target_id' => $room->room_id,
    ]);
});

test('loyalty points can be redeemed during booking and are refunded on cancellation', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest = createGuest('loyalty_guest@example.com', 200); // 200 points = 10,000 RWF

    Sanctum::actingAs($guest);

    // Book 2 nights: 2 * 100,000 = 200,000. Redeem 100 points (-5,000 RWF). Tax: (195,000)*0.18 = 35,100. Total: 230,100.
    $checkIn = now()->addDays(2)->toDateString();
    $checkOut = now()->addDays(4)->toDateString();

    $response = $this->postJson('/api/v1/reservations', [
        'room_id' => $room->room_id,
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'number_of_guests' => 2,
        'redeem_points' => 100,
    ]);

    $response->assertStatus(201);
    $reservationId = $response->json('data.reservation_id');

    // Available points should now be 100
    $guestAccount = LoyaltyAccount::where('user_id', $guest->user_id)->first();
    expect($guestAccount->available_points)->toBe(100);

    // Cancel reservation
    $cancelRes = $this->postJson("/api/v1/reservations/{$reservationId}/cancel");
    $cancelRes->assertStatus(200);

    // Points should be restored to 200
    $guestAccount->refresh();
    expect($guestAccount->available_points)->toBe(200);

    // Check adjusted transaction created
    $this->assertDatabaseHas('loyalty_transactions', [
        'loyalty_id' => $guestAccount->loyalty_id,
        'reservation_id' => $reservationId,
        'transaction_type' => 'adjusted',
        'points' => 100,
    ]);
});

test('payment exceeding outstanding balance is rejected with 422, while valid payment updates status', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest = createGuest('payment_guest@example.com', 0);

    Sanctum::actingAs($guest);

    // Book 1 night: 100,000 + 18,000 VAT = 118,000 RWF
    $checkIn = now()->addDays(1)->toDateString();
    $checkOut = now()->addDays(2)->toDateString();

    $res = $this->postJson('/api/v1/reservations', [
        'room_id' => $room->room_id,
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'number_of_guests' => 1,
    ]);
    $res->assertStatus(201);
    $reservationId = $res->json('data.reservation_id');
    $totalAmount = (float) $res->json('data.total_amount'); // 118000

    // Attempt paying 150,000 (exceeds balance of 118,000)
    $overpayRes = $this->postJson("/api/v1/reservations/{$reservationId}/payments", [
        'amount' => 150000,
        'payment_method' => 'card',
    ]);
    $overpayRes->assertStatus(422)
        ->assertJson(['success' => false]);

    // Partial payment of 50,000
    $partialRes = $this->postJson("/api/v1/reservations/{$reservationId}/payments", [
        'amount' => 50000,
        'payment_method' => 'mobile_money',
    ]);
    $partialRes->assertStatus(201);

    $reservation = Reservation::find($reservationId);
    expect($reservation->payment_status)->toBe('partially_paid');

    // Remaining payment of 68,000
    $finalRes = $this->postJson("/api/v1/reservations/{$reservationId}/payments", [
        'amount' => 68000,
        'payment_method' => 'card',
    ]);
    $finalRes->assertStatus(201);

    $reservation->refresh();
    expect($reservation->payment_status)->toBe('paid');
});

test('duplicate payment with identical amount within 10 seconds is rejected', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest = createGuest('duplicate_payment@example.com', 0);

    Sanctum::actingAs($guest);

    $res = $this->postJson('/api/v1/reservations', [
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(1)->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'number_of_guests' => 1,
    ]);
    $reservationId = $res->json('data.reservation_id');

    // First payment
    $res1 = $this->postJson("/api/v1/reservations/{$reservationId}/payments", [
        'amount' => 20000,
        'payment_method' => 'mobile_money',
    ]);
    $res1->assertStatus(201);

    // Immediate second payment with same amount
    $res2 = $this->postJson("/api/v1/reservations/{$reservationId}/payments", [
        'amount' => 20000,
        'payment_method' => 'mobile_money',
    ]);
    $res2->assertStatus(422)
        ->assertJson(['success' => false]);
});

test('guests cannot review a reservation that is not checked out', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest = createGuest('review_guest@example.com');

    $reservation = Reservation::create([
        'confirmation_code' => 'RES-20261101-REV01',
        'user_id' => $guest->user_id,
        'room_id' => $room->room_id,
        'check_in' => now()->subDays(5)->toDateString(),
        'check_out' => now()->subDays(2)->toDateString(),
        'number_of_guests' => 2,
        'total_amount' => 236000,
        'payment_status' => 'paid',
        'reservation_status' => 'confirmed', // not checked_out yet
    ]);

    Sanctum::actingAs($guest);

    $reviewRes = $this->postJson('/api/v1/reviews', [
        'reservation_id' => $reservation->reservation_id,
        'rating' => 5,
        'comment' => 'Exceptional stay, breathtaking view!',
    ]);

    $reviewRes->assertStatus(422)
        ->assertJson(['success' => false]);

    // Update reservation to checked_out
    $reservation->update(['reservation_status' => 'checked_out']);

    $validReview = $this->postJson('/api/v1/reviews', [
        'reservation_id' => $reservation->reservation_id,
        'rating' => 5,
        'comment' => 'Exceptional stay, breathtaking view!',
    ]);

    $validReview->assertStatus(201)
        ->assertJson(['success' => true]);
});

test('invoice and receipt pdf endpoints return 200 with application/pdf content type', function () {
    [$hotel, $roomType, $room] = createTestHotelAndRoom('available', 2, 100000);
    $guest = createGuest('pdf_guest@example.com');

    $reservation = Reservation::create([
        'confirmation_code' => 'RES-20261101-PDF01',
        'user_id' => $guest->user_id,
        'room_id' => $room->room_id,
        'check_in' => now()->addDays(1)->toDateString(),
        'check_out' => now()->addDays(3)->toDateString(),
        'number_of_guests' => 2,
        'total_amount' => 236000,
        'payment_status' => 'paid',
        'reservation_status' => 'confirmed',
    ]);

    Invoice::create([
        'reservation_id' => $reservation->reservation_id,
        'invoice_number' => 'INV-20261101-00001',
        'subtotal' => 200000,
        'discount' => 0,
        'tax' => 36000,
        'total_amount' => 236000,
        'issued_at' => now(),
    ]);

    $payment = Payment::create([
        'reservation_id' => $reservation->reservation_id,
        'amount' => 236000,
        'payment_method' => 'card',
        'transaction_reference' => 'PAY-20261101-PDF001',
        'payment_status' => 'completed',
        'paid_at' => now(),
    ]);

    Sanctum::actingAs($guest);

    // Invoice PDF
    $invoicePdfRes = $this->get("/api/v1/invoices/{$reservation->reservation_id}/pdf");
    $invoicePdfRes->assertStatus(200);
    expect($invoicePdfRes->headers->get('content-type'))->toBe('application/pdf');

    // Receipt PDF
    $receiptPdfRes = $this->get("/api/v1/payments/{$payment->payment_id}/receipt-pdf");
    $receiptPdfRes->assertStatus(200);
    expect($receiptPdfRes->headers->get('content-type'))->toBe('application/pdf');
});
