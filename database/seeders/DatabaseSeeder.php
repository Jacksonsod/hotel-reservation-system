<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Models\Checkout;
use App\Models\FraudFlag;
use App\Models\GuestServiceOrder;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\HousekeepingTask;
use App\Models\Invoice;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\MaintenanceLog;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\ReservationGuest;
use App\Models\Review;
use App\Models\Room;
use App\Models\RoomAmenity;
use App\Models\RoomImage;
use App\Models\RoomType;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with realistic hotel reservation data.
     */
    public function run(): void
    {
        // ─────────────────────────────────────────────────────
        // 1. USERS — 4 default accounts + 3 guests + 2 staff
        // ─────────────────────────────────────────────────────
        $hashedPassword = Hash::make('Hotel@2026');

        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@rphotels.rw',
            'phone' => '+250788100001',
            'password' => $hashedPassword,
            'role' => 'admin',
            'status' => 'active',
        ]);

        $receptionist = User::create([
            'name' => 'Front Desk Receptionist',
            'email' => 'reception@rphotels.rw',
            'phone' => '+250788100002',
            'password' => $hashedPassword,
            'role' => 'receptionist',
            'status' => 'active',
        ]);

        $housekeeper = User::create([
            'name' => 'Housekeeping Staff',
            'email' => 'housekeeping@rphotels.rw',
            'phone' => '+250788100003',
            'password' => $hashedPassword,
            'role' => 'housekeeping',
            'status' => 'active',
        ]);

        $guest = User::create([
            'name' => 'Jean Pierre Habimana',
            'email' => 'guest@rphotels.rw',
            'phone' => '+250788200001',
            'password' => $hashedPassword,
            'role' => 'guest',
            'status' => 'active',
        ]);

        // 3 additional guest users
        $guest2 = User::create([
            'name' => 'Marie Claire Uwimana',
            'email' => 'marie.uwimana@gmail.com',
            'phone' => '+250788200002',
            'password' => $hashedPassword,
            'role' => 'guest',
            'status' => 'active',
        ]);

        $guest3 = User::create([
            'name' => 'Patrick Nkurunziza',
            'email' => 'patrick.nk@yahoo.com',
            'phone' => '+250788200003',
            'password' => $hashedPassword,
            'role' => 'guest',
            'status' => 'active',
        ]);

        $guest4 = User::create([
            'name' => 'Diane Mutoni',
            'email' => 'diane.mutoni@outlook.com',
            'phone' => '+250788200004',
            'password' => $hashedPassword,
            'role' => 'guest',
            'status' => 'active',
        ]);

        // 2 extra staff members
        $receptionist2 = User::create([
            'name' => 'Emmanuel Mugisha',
            'email' => 'emmanuel.mugisha@rphotels.rw',
            'phone' => '+250788100004',
            'password' => $hashedPassword,
            'role' => 'receptionist',
            'status' => 'active',
        ]);

        $housekeeper2 = User::create([
            'name' => 'Grace Ingabire',
            'email' => 'grace.ingabire@rphotels.rw',
            'phone' => '+250788100005',
            'password' => $hashedPassword,
            'role' => 'housekeeping',
            'status' => 'active',
        ]);

        // ─────────────────────────────────────────────────────
        // 2. HOTELS & HOTEL IMAGES — 3 branches
        // ─────────────────────────────────────────────────────
        $hotel1 = Hotel::create([
            'name' => 'RP Karongi Lake Resort',
            'description' => 'A serene lakeside resort nestled on the shores of Lake Kivu in Karongi, offering breathtaking views, world-class amenities, and authentic Rwandan hospitality. Perfect for leisure travelers and conference guests alike.',
            'location' => 'Karongi',
            'address' => 'KN 45 St, Karongi District, Western Province, Rwanda',
            'contact_phone' => '+250788300001',
            'contact_email' => 'karongi@rphotels.rw',
            'status' => 'active',
        ]);

        $hotel2 = Hotel::create([
            'name' => 'Kigali Grand Convention Hotel',
            'description' => 'A premier business and convention hotel located in the heart of Kigali City. Featuring state-of-the-art conference facilities, executive suites, and fine dining restaurants for discerning corporate and diplomatic guests.',
            'location' => 'Kigali',
            'address' => 'KG 7 Ave, Kigali City, Rwanda',
            'contact_phone' => '+250788300002',
            'contact_email' => 'kigali@rphotels.rw',
            'status' => 'active',
        ]);

        $hotel3 = Hotel::create([
            'name' => 'Rubavu Waterfront Palms',
            'description' => 'An exclusive waterfront property on the beautiful Lake Kivu shoreline in Rubavu. Combining tropical elegance with modern comforts, this hotel is ideal for romantic getaways and family vacations near the Congo-Nile Trail.',
            'location' => 'Rubavu',
            'address' => 'RB 12 Ave, Rubavu District, Western Province, Rwanda',
            'contact_phone' => '+250788300003',
            'contact_email' => 'rubavu@rphotels.rw',
            'status' => 'active',
        ]);

        $hotels = [$hotel1, $hotel2, $hotel3];

        // Hotel Images (placeholders)
        foreach ($hotels as $hotel) {
            for ($i = 1; $i <= 3; $i++) {
                HotelImage::create([
                    'hotel_id' => $hotel->hotel_id,
                    'image_path' => "hotels/hotel_{$hotel->hotel_id}_image_{$i}.jpg",
                    'uploaded_at' => now(),
                ]);
            }
        }

        // ─────────────────────────────────────────────────────
        // 3. ROOM TYPES & AMENITIES
        // ─────────────────────────────────────────────────────
        $rtStandard = RoomType::create([
            'type_name' => 'Standard Single',
            'description' => 'A comfortable single room with essential amenities, ideal for solo business travelers.',
            'maximum_capacity' => 1,
        ]);

        $rtDeluxe = RoomType::create([
            'type_name' => 'Deluxe Double',
            'description' => 'A spacious double room with premium furnishings and enhanced comfort for couples.',
            'maximum_capacity' => 2,
        ]);

        $rtSuite = RoomType::create([
            'type_name' => 'Executive Lakeview Suite',
            'description' => 'A luxurious suite featuring panoramic lake views, separate living area, and exclusive executive amenities.',
            'maximum_capacity' => 3,
        ]);

        $rtVilla = RoomType::create([
            'type_name' => 'Presidential Family Villa',
            'description' => 'The pinnacle of luxury — a private villa with multiple bedrooms, private pool access, butler service, and world-class family entertainment.',
            'maximum_capacity' => 6,
        ]);

        $roomTypes = [$rtStandard, $rtDeluxe, $rtSuite, $rtVilla];

        // 8 Standard Amenities
        $amenityWifi = Amenity::create(['amenity_name' => 'High-Speed Wi-Fi', 'description' => 'Complimentary 100Mbps fiber-optic wireless internet access throughout the property.']);
        $amenityAC = Amenity::create(['amenity_name' => 'Air Conditioning', 'description' => 'Individual climate control with silent split-unit air conditioning system.']);
        $amenityLakeView = Amenity::create(['amenity_name' => 'Lake View Balcony', 'description' => 'Private balcony with panoramic views of Lake Kivu and surrounding hills.']);
        $amenityTV = Amenity::create(['amenity_name' => 'Smart TV', 'description' => '55-inch 4K Smart TV with streaming apps and international satellite channels.']);
        $amenityMiniBar = Amenity::create(['amenity_name' => 'Mini Bar', 'description' => 'Fully stocked mini bar with local and imported beverages and snacks.']);
        $amenitySafe = Amenity::create(['amenity_name' => 'Room Safe', 'description' => 'Electronic in-room safe large enough for laptops and valuables.']);
        $amenityBreakfast = Amenity::create(['amenity_name' => 'Breakfast Included', 'description' => 'Complimentary full breakfast buffet featuring local and continental cuisine.']);
        $amenityDesk = Amenity::create(['amenity_name' => 'Workspace Desk', 'description' => 'Ergonomic workspace desk with USB charging ports and adjustable lighting.']);

        $allAmenities = [$amenityWifi, $amenityAC, $amenityLakeView, $amenityTV, $amenityMiniBar, $amenitySafe, $amenityBreakfast, $amenityDesk];

        // ─────────────────────────────────────────────────────
        // 4. ROOMS — 18 rooms (6 per branch)
        // ─────────────────────────────────────────────────────
        $allRooms = [];
        $roomConfigs = [
            // [room_number, room_type_index, price, capacity, status]
            ['101', 0, 35000, 1, 'available'],
            ['102', 0, 35000, 1, 'clean'],
            ['103', 1, 65000, 2, 'available'],
            ['104', 1, 65000, 2, 'reserved'],
            ['105', 2, 120000, 3, 'occupied'],
            ['106', 3, 250000, 6, 'available'],
        ];

        $branchPrefixes = ['1', '2', '3']; // 101-106, 201-206, 301-306
        $roomStatuses = [
            ['available', 'clean', 'available', 'reserved', 'occupied', 'available'],
            ['available', 'dirty', 'reserved', 'available', 'clean', 'under_maintenance'],
            ['occupied', 'available', 'clean', 'available', 'dirty', 'available'],
        ];

        foreach ($hotels as $hIdx => $hotel) {
            foreach ($roomConfigs as $rIdx => $config) {
                $roomNumber = $branchPrefixes[$hIdx].substr($config[0], 1);
                $room = Room::create([
                    'hotel_id' => $hotel->hotel_id,
                    'room_number' => $roomNumber,
                    'room_type_id' => $roomTypes[$config[1]]->room_type_id,
                    'price_per_night' => $config[2],
                    'capacity' => $config[3],
                    'description' => "Room {$roomNumber} at {$hotel->name} — {$roomTypes[$config[1]]->type_name}",
                    'status' => $roomStatuses[$hIdx][$rIdx],
                ]);
                $allRooms[] = $room;

                // Room image placeholder
                RoomImage::create([
                    'room_id' => $room->room_id,
                    'image_path' => "rooms/room_{$room->room_id}_image_1.jpg",
                    'uploaded_at' => now(),
                ]);

                // Assign amenities based on room type
                $amenitySubset = match ($config[1]) {
                    0 => [$amenityWifi, $amenityAC, $amenityDesk],                                          // Standard
                    1 => [$amenityWifi, $amenityAC, $amenityTV, $amenitySafe, $amenityDesk],                 // Deluxe
                    2 => [$amenityWifi, $amenityAC, $amenityLakeView, $amenityTV, $amenityMiniBar, $amenitySafe, $amenityBreakfast], // Suite
                    3 => $allAmenities,                                                                     // Villa — all 8
                };
                foreach ($amenitySubset as $amenity) {
                    RoomAmenity::create([
                        'room_id' => $room->room_id,
                        'amenity_id' => $amenity->amenity_id,
                    ]);
                }
            }
        }

        // ─────────────────────────────────────────────────────
        // 5. SERVICES — 4 per branch (12 total)
        // ─────────────────────────────────────────────────────
        $serviceTemplates = [
            ['Airport Shuttle Transfer', 'Comfortable private vehicle transfer between Kigali International Airport and the hotel.', 25000],
            ['Lake Boat Tour', 'Scenic 2-hour guided boat tour on Lake Kivu with complimentary refreshments.', 45000],
            ['Full Board Buffet', 'All-day dining pass including breakfast, lunch, and dinner at the hotel restaurant.', 30000],
            ['Express Laundry Service', 'Same-day premium laundry and dry-cleaning service with hotel delivery.', 8000],
        ];

        $allServices = [];
        foreach ($hotels as $hotel) {
            foreach ($serviceTemplates as $template) {
                $service = Service::create([
                    'hotel_id' => $hotel->hotel_id,
                    'service_name' => $template[0],
                    'description' => $template[1],
                    'price' => $template[2],
                    'status' => 'active',
                ]);
                $allServices[] = $service;
            }
        }

        // ─────────────────────────────────────────────────────
        // 6. RESERVATIONS — varied statuses for dashboard testing
        // ─────────────────────────────────────────────────────
        $now = Carbon::now();

        // Reservation 1: Completed stay (checked_out, paid) — guest at hotel 1
        $res1 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(20)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest->user_id,
            'room_id' => $allRooms[0]->room_id, // Hotel 1, Room 101
            'check_in' => $now->copy()->subDays(20)->toDateString(),
            'check_out' => $now->copy()->subDays(17)->toDateString(),
            'number_of_guests' => 1,
            'total_amount' => 105000, // 3 nights × 35,000
            'payment_status' => 'paid',
            'reservation_status' => 'checked_out',
        ]);

        // Reservation 2: Currently checked in — guest2 at hotel 1
        $res2 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(2)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest2->user_id,
            'room_id' => $allRooms[4]->room_id, // Hotel 1, Room 105 (occupied)
            'check_in' => $now->copy()->subDays(2)->toDateString(),
            'check_out' => $now->copy()->addDays(3)->toDateString(),
            'number_of_guests' => 2,
            'total_amount' => 600000, // 5 nights × 120,000
            'payment_status' => 'paid',
            'reservation_status' => 'checked_in',
        ]);

        // Reservation 3: Upcoming confirmed — guest3 at hotel 2
        $res3 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest3->user_id,
            'room_id' => $allRooms[8]->room_id, // Hotel 2, Room 203 (reserved)
            'check_in' => $now->copy()->addDays(5)->toDateString(),
            'check_out' => $now->copy()->addDays(8)->toDateString(),
            'number_of_guests' => 2,
            'total_amount' => 195000, // 3 nights × 65,000
            'payment_status' => 'partially_paid',
            'reservation_status' => 'confirmed',
        ]);

        // Reservation 4: Cancelled — guest4 at hotel 3
        $res4 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(10)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest4->user_id,
            'room_id' => $allRooms[14]->room_id, // Hotel 3, Room 303
            'check_in' => $now->copy()->subDays(5)->toDateString(),
            'check_out' => $now->copy()->subDays(2)->toDateString(),
            'number_of_guests' => 2,
            'total_amount' => 195000,
            'payment_status' => 'unpaid',
            'reservation_status' => 'cancelled',
        ]);

        // Reservation 5: Completed stay — guest2 at hotel 2 (for review)
        $res5 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(30)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest2->user_id,
            'room_id' => $allRooms[11]->room_id, // Hotel 2, Room 206
            'check_in' => $now->copy()->subDays(30)->toDateString(),
            'check_out' => $now->copy()->subDays(27)->toDateString(),
            'number_of_guests' => 4,
            'total_amount' => 750000, // 3 nights × 250,000
            'payment_status' => 'paid',
            'reservation_status' => 'checked_out',
        ]);

        // Reservation 6: Pending reservation — guest at hotel 3
        $res6 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest->user_id,
            'room_id' => $allRooms[17]->room_id, // Hotel 3, Room 306
            'check_in' => $now->copy()->addDays(10)->toDateString(),
            'check_out' => $now->copy()->addDays(14)->toDateString(),
            'number_of_guests' => 5,
            'total_amount' => 1000000, // 4 nights × 250,000
            'payment_status' => 'unpaid',
            'reservation_status' => 'pending',
        ]);

        // Reservation 7: Checked-in at hotel 3
        $res7 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(1)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest3->user_id,
            'room_id' => $allRooms[12]->room_id, // Hotel 3, Room 301 (occupied)
            'check_in' => $now->copy()->subDays(1)->toDateString(),
            'check_out' => $now->copy()->addDays(4)->toDateString(),
            'number_of_guests' => 3,
            'total_amount' => 600000, // 5 nights × 120,000
            'payment_status' => 'paid',
            'reservation_status' => 'checked_in',
        ]);

        // Reservation 8: Another completed stay at hotel 1 — for loyalty points
        $res8 = Reservation::create([
            'confirmation_code' => 'RES-'.$now->copy()->subDays(45)->format('Ymd').'-'.strtoupper(Str::random(5)),
            'user_id' => $guest->user_id,
            'room_id' => $allRooms[2]->room_id, // Hotel 1, Room 103
            'check_in' => $now->copy()->subDays(45)->toDateString(),
            'check_out' => $now->copy()->subDays(42)->toDateString(),
            'number_of_guests' => 2,
            'total_amount' => 195000,
            'payment_status' => 'paid',
            'reservation_status' => 'checked_out',
        ]);

        // ─────────────────────────────────────────────────────
        // 7. RESERVATION GUESTS
        // ─────────────────────────────────────────────────────
        ReservationGuest::create([
            'reservation_id' => $res1->reservation_id,
            'full_name' => 'Jean Pierre Habimana',
            'identification_number' => 'RW1199880012345',
            'contact_phone' => '+250788200001',
        ]);

        ReservationGuest::create([
            'reservation_id' => $res2->reservation_id,
            'full_name' => 'Marie Claire Uwimana',
            'identification_number' => 'RW1199580067890',
            'contact_phone' => '+250788200002',
        ]);
        ReservationGuest::create([
            'reservation_id' => $res2->reservation_id,
            'full_name' => 'Claude Uwimana',
            'identification_number' => 'RW1199480054321',
            'contact_phone' => '+250788200010',
        ]);

        ReservationGuest::create([
            'reservation_id' => $res3->reservation_id,
            'full_name' => 'Patrick Nkurunziza',
            'identification_number' => 'RW1199280034567',
            'contact_phone' => '+250788200003',
        ]);

        ReservationGuest::create([
            'reservation_id' => $res5->reservation_id,
            'full_name' => 'Marie Claire Uwimana',
            'identification_number' => 'RW1199580067890',
            'contact_phone' => '+250788200002',
        ]);

        ReservationGuest::create([
            'reservation_id' => $res7->reservation_id,
            'full_name' => 'Patrick Nkurunziza',
            'identification_number' => 'RW1199280034567',
            'contact_phone' => '+250788200003',
        ]);
        ReservationGuest::create([
            'reservation_id' => $res7->reservation_id,
            'full_name' => 'Aline Nkurunziza',
            'identification_number' => 'RW1199780012345',
            'contact_phone' => '+250788200011',
        ]);

        // ─────────────────────────────────────────────────────
        // 8. PAYMENTS
        // ─────────────────────────────────────────────────────
        Payment::create([
            'reservation_id' => $res1->reservation_id,
            'amount' => 105000,
            'payment_method' => 'mobile_money',
            'transaction_reference' => 'PAY-'.$now->copy()->subDays(20)->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(20),
        ]);

        Payment::create([
            'reservation_id' => $res2->reservation_id,
            'amount' => 600000,
            'payment_method' => 'card',
            'transaction_reference' => 'PAY-'.$now->copy()->subDays(2)->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(2),
        ]);

        Payment::create([
            'reservation_id' => $res3->reservation_id,
            'amount' => 100000,
            'payment_method' => 'mobile_money',
            'transaction_reference' => 'PAY-'.$now->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(1),
        ]);

        Payment::create([
            'reservation_id' => $res5->reservation_id,
            'amount' => 750000,
            'payment_method' => 'cash',
            'transaction_reference' => 'PAY-'.$now->copy()->subDays(30)->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(30),
        ]);

        Payment::create([
            'reservation_id' => $res7->reservation_id,
            'amount' => 600000,
            'payment_method' => 'card',
            'transaction_reference' => 'PAY-'.$now->copy()->subDays(1)->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(1),
        ]);

        Payment::create([
            'reservation_id' => $res8->reservation_id,
            'amount' => 195000,
            'payment_method' => 'mobile_money',
            'transaction_reference' => 'PAY-'.$now->copy()->subDays(45)->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'completed',
            'paid_at' => $now->copy()->subDays(45),
        ]);

        // A pending payment for res6
        Payment::create([
            'reservation_id' => $res6->reservation_id,
            'amount' => 500000,
            'payment_method' => 'card',
            'transaction_reference' => 'PAY-'.$now->format('Ymd').'-'.strtoupper(Str::random(6)),
            'payment_status' => 'pending',
            'paid_at' => null,
        ]);

        // ─────────────────────────────────────────────────────
        // 9. CHECK-INS
        // ─────────────────────────────────────────────────────
        CheckIn::create([
            'reservation_id' => $res1->reservation_id,
            'room_id' => $allRooms[0]->room_id,
            'receptionist_id' => $receptionist->user_id,
            'checkin_time' => $now->copy()->subDays(20)->setHour(14)->setMinute(0),
            'special_requests' => 'Extra towels and late checkout requested.',
            'status' => 'completed',
        ]);

        CheckIn::create([
            'reservation_id' => $res2->reservation_id,
            'room_id' => $allRooms[4]->room_id,
            'receptionist_id' => $receptionist->user_id,
            'checkin_time' => $now->copy()->subDays(2)->setHour(15)->setMinute(30),
            'special_requests' => 'Anniversary celebration — please arrange flowers in room.',
            'status' => 'checked_in',
        ]);

        CheckIn::create([
            'reservation_id' => $res5->reservation_id,
            'room_id' => $allRooms[11]->room_id,
            'receptionist_id' => $receptionist2->user_id,
            'checkin_time' => $now->copy()->subDays(30)->setHour(13)->setMinute(0),
            'special_requests' => null,
            'status' => 'completed',
        ]);

        CheckIn::create([
            'reservation_id' => $res7->reservation_id,
            'room_id' => $allRooms[12]->room_id,
            'receptionist_id' => $receptionist2->user_id,
            'checkin_time' => $now->copy()->subDays(1)->setHour(16)->setMinute(0),
            'special_requests' => 'Need a baby cot for infant.',
            'status' => 'checked_in',
        ]);

        CheckIn::create([
            'reservation_id' => $res8->reservation_id,
            'room_id' => $allRooms[2]->room_id,
            'receptionist_id' => $receptionist->user_id,
            'checkin_time' => $now->copy()->subDays(45)->setHour(14)->setMinute(30),
            'special_requests' => null,
            'status' => 'completed',
        ]);

        // ─────────────────────────────────────────────────────
        // 10. CHECKOUTS
        // ─────────────────────────────────────────────────────
        Checkout::create([
            'reservation_id' => $res1->reservation_id,
            'receptionist_id' => $receptionist->user_id,
            'checkout_time' => $now->copy()->subDays(17)->setHour(11)->setMinute(0),
            'room_charges' => 105000,
            'additional_charges' => 8000,
            'discounts' => 0,
            'total_amount' => 113000,
        ]);

        Checkout::create([
            'reservation_id' => $res5->reservation_id,
            'receptionist_id' => $receptionist2->user_id,
            'checkout_time' => $now->copy()->subDays(27)->setHour(10)->setMinute(30),
            'room_charges' => 750000,
            'additional_charges' => 45000,
            'discounts' => 0,
            'total_amount' => 795000,
        ]);

        Checkout::create([
            'reservation_id' => $res8->reservation_id,
            'receptionist_id' => $receptionist->user_id,
            'checkout_time' => $now->copy()->subDays(42)->setHour(10)->setMinute(0),
            'room_charges' => 195000,
            'additional_charges' => 0,
            'discounts' => 0,
            'total_amount' => 195000,
        ]);

        // ─────────────────────────────────────────────────────
        // 11. GUEST SERVICE ORDERS
        // ─────────────────────────────────────────────────────
        GuestServiceOrder::create([
            'reservation_id' => $res1->reservation_id,
            'service_id' => $allServices[3]->service_id, // Express Laundry at hotel 1
            'quantity' => 1,
            'unit_price' => 8000,
            'total_price' => 8000,
            'ordered_at' => $now->copy()->subDays(19),
        ]);

        GuestServiceOrder::create([
            'reservation_id' => $res2->reservation_id,
            'service_id' => $allServices[1]->service_id, // Lake Boat Tour at hotel 1
            'quantity' => 2,
            'unit_price' => 45000,
            'total_price' => 90000,
            'ordered_at' => $now->copy()->subDays(1),
        ]);

        GuestServiceOrder::create([
            'reservation_id' => $res5->reservation_id,
            'service_id' => $allServices[5]->service_id, // Lake Boat Tour at hotel 2
            'quantity' => 1,
            'unit_price' => 45000,
            'total_price' => 45000,
            'ordered_at' => $now->copy()->subDays(29),
        ]);

        GuestServiceOrder::create([
            'reservation_id' => $res7->reservation_id,
            'service_id' => $allServices[10]->service_id, // Full Board at hotel 3
            'quantity' => 3,
            'unit_price' => 30000,
            'total_price' => 90000,
            'ordered_at' => $now->copy()->subHours(12),
        ]);

        // ─────────────────────────────────────────────────────
        // 12. INVOICES
        // ─────────────────────────────────────────────────────
        Invoice::create([
            'reservation_id' => $res1->reservation_id,
            'invoice_number' => 'INV-'.$now->copy()->subDays(17)->format('Ymd').'-'.str_pad($res1->reservation_id, 5, '0', STR_PAD_LEFT),
            'subtotal' => 113000,
            'discount' => 0,
            'tax' => round(113000 * 0.18, 2),
            'total_amount' => round(113000 * 1.18, 2),
            'issued_at' => $now->copy()->subDays(17),
        ]);

        Invoice::create([
            'reservation_id' => $res5->reservation_id,
            'invoice_number' => 'INV-'.$now->copy()->subDays(27)->format('Ymd').'-'.str_pad($res5->reservation_id, 5, '0', STR_PAD_LEFT),
            'subtotal' => 795000,
            'discount' => 0,
            'tax' => round(795000 * 0.18, 2),
            'total_amount' => round(795000 * 1.18, 2),
            'issued_at' => $now->copy()->subDays(27),
        ]);

        Invoice::create([
            'reservation_id' => $res8->reservation_id,
            'invoice_number' => 'INV-'.$now->copy()->subDays(42)->format('Ymd').'-'.str_pad($res8->reservation_id, 5, '0', STR_PAD_LEFT),
            'subtotal' => 195000,
            'discount' => 0,
            'tax' => round(195000 * 0.18, 2),
            'total_amount' => round(195000 * 1.18, 2),
            'issued_at' => $now->copy()->subDays(42),
        ]);

        // ─────────────────────────────────────────────────────
        // 13. HOUSEKEEPING TASKS
        // ─────────────────────────────────────────────────────
        HousekeepingTask::create([
            'room_id' => $allRooms[0]->room_id, // Hotel 1, Room 101
            'assigned_to' => $housekeeper->user_id,
            'task_description' => 'Full room cleaning after guest checkout. Replace all linens and restock minibar.',
            'task_status' => 'clean',
            'assigned_at' => $now->copy()->subDays(17)->setHour(11)->setMinute(30),
            'completed_at' => $now->copy()->subDays(17)->setHour(13)->setMinute(0),
        ]);

        HousekeepingTask::create([
            'room_id' => $allRooms[7]->room_id, // Hotel 2, Room 202 (dirty)
            'assigned_to' => $housekeeper->user_id,
            'task_description' => 'Deep cleaning required. Guest reported spilled coffee on carpet.',
            'task_status' => 'dirty',
            'assigned_at' => $now->copy()->subHours(3),
            'completed_at' => null,
        ]);

        HousekeepingTask::create([
            'room_id' => $allRooms[16]->room_id, // Hotel 3, Room 305 (dirty)
            'assigned_to' => $housekeeper2->user_id,
            'task_description' => 'Standard turnover cleaning between guests.',
            'task_status' => 'cleaning',
            'assigned_at' => $now->copy()->subHours(1),
            'completed_at' => null,
        ]);

        HousekeepingTask::create([
            'room_id' => $allRooms[1]->room_id, // Hotel 1, Room 102 (clean)
            'assigned_to' => $housekeeper2->user_id,
            'task_description' => 'Regular daily housekeeping — make bed, clean bathroom, vacuum.',
            'task_status' => 'clean',
            'assigned_at' => $now->copy()->subDays(1)->setHour(9)->setMinute(0),
            'completed_at' => $now->copy()->subDays(1)->setHour(10)->setMinute(30),
        ]);

        // ─────────────────────────────────────────────────────
        // 14. MAINTENANCE LOGS
        // ─────────────────────────────────────────────────────
        MaintenanceLog::create([
            'room_id' => $allRooms[11]->room_id, // Hotel 2, Room 206
            'reported_by' => $receptionist2->user_id,
            'issue_description' => 'Air conditioning unit making loud rattling noise. Guest complained about sleep disruption.',
            'priority' => 'high',
            'maintenance_status' => 'in_progress',
            'reported_at' => $now->copy()->subDays(2),
            'resolved_at' => null,
        ]);

        MaintenanceLog::create([
            'room_id' => $allRooms[11]->room_id, // Hotel 2, Room 206 (under_maintenance)
            'reported_by' => $housekeeper->user_id,
            'issue_description' => 'Bathroom faucet leaking steadily. Needs plumber attention.',
            'priority' => 'medium',
            'maintenance_status' => 'pending',
            'reported_at' => $now->copy()->subDays(1),
            'resolved_at' => null,
        ]);

        MaintenanceLog::create([
            'room_id' => $allRooms[0]->room_id, // Hotel 1, Room 101
            'reported_by' => $receptionist->user_id,
            'issue_description' => 'Light bulb replacement in bedside lamp — resolved same day.',
            'priority' => 'low',
            'maintenance_status' => 'resolved',
            'reported_at' => $now->copy()->subDays(10),
            'resolved_at' => $now->copy()->subDays(10)->addHours(2),
        ]);

        // ─────────────────────────────────────────────────────
        // 15. REVIEWS
        // ─────────────────────────────────────────────────────
        Review::create([
            'user_id' => $guest->user_id,
            'hotel_id' => $hotel1->hotel_id,
            'reservation_id' => $res1->reservation_id,
            'rating' => 5,
            'comment' => 'Absolutely wonderful stay at RP Karongi Lake Resort! The lake views were breathtaking and the staff went above and beyond. Will definitely return.',
            'created_at' => $now->copy()->subDays(16),
        ]);

        Review::create([
            'user_id' => $guest2->user_id,
            'hotel_id' => $hotel2->hotel_id,
            'reservation_id' => $res5->reservation_id,
            'rating' => 4,
            'comment' => 'Excellent conference facilities and comfortable rooms. The Presidential Villa was superb. Minor issue with hot water in the morning but resolved quickly.',
            'created_at' => $now->copy()->subDays(26),
        ]);

        Review::create([
            'user_id' => $guest->user_id,
            'hotel_id' => $hotel1->hotel_id,
            'reservation_id' => $res8->reservation_id,
            'rating' => 4,
            'comment' => 'Great value for money. The Deluxe Double room was spacious and clean. Breakfast buffet was diverse and delicious.',
            'created_at' => $now->copy()->subDays(41),
        ]);

        // ─────────────────────────────────────────────────────
        // 16. LOYALTY ACCOUNTS
        // ─────────────────────────────────────────────────────
        $loyaltyGuest = LoyaltyAccount::create([
            'user_id' => $guest->user_id,
            'total_points' => 413, // floor((133540 + 195000) / 1000) roughly
            'available_points' => 413,
            'updated_at' => $now->copy()->subDays(17),
        ]);

        $loyaltyGuest2 = LoyaltyAccount::create([
            'user_id' => $guest2->user_id,
            'total_points' => 938, // floor(938100 / 1000)
            'available_points' => 938,
            'updated_at' => $now->copy()->subDays(27),
        ]);

        $loyaltyGuest3 = LoyaltyAccount::create([
            'user_id' => $guest3->user_id,
            'total_points' => 0,
            'available_points' => 0,
            'updated_at' => $now,
        ]);

        $loyaltyGuest4 = LoyaltyAccount::create([
            'user_id' => $guest4->user_id,
            'total_points' => 0,
            'available_points' => 0,
            'updated_at' => $now,
        ]);

        // ─────────────────────────────────────────────────────
        // 17. LOYALTY TRANSACTIONS
        // ─────────────────────────────────────────────────────
        LoyaltyTransaction::create([
            'loyalty_id' => $loyaltyGuest->loyalty_id,
            'reservation_id' => $res8->reservation_id,
            'transaction_type' => 'earned',
            'points' => 195,
            'description' => 'Points earned from completed stay at RP Karongi Lake Resort (Reservation #'.$res8->reservation_id.').',
            'created_at' => $now->copy()->subDays(42),
        ]);

        LoyaltyTransaction::create([
            'loyalty_id' => $loyaltyGuest->loyalty_id,
            'reservation_id' => $res1->reservation_id,
            'transaction_type' => 'earned',
            'points' => 218,
            'description' => 'Points earned from completed stay at RP Karongi Lake Resort (Reservation #'.$res1->reservation_id.').',
            'created_at' => $now->copy()->subDays(17),
        ]);

        LoyaltyTransaction::create([
            'loyalty_id' => $loyaltyGuest2->loyalty_id,
            'reservation_id' => $res5->reservation_id,
            'transaction_type' => 'earned',
            'points' => 938,
            'description' => 'Points earned from completed stay at Kigali Grand Convention Hotel (Reservation #'.$res5->reservation_id.').',
            'created_at' => $now->copy()->subDays(27),
        ]);

        // ─────────────────────────────────────────────────────
        // 18. NOTIFICATIONS
        // ─────────────────────────────────────────────────────
        Notification::create([
            'user_id' => $guest->user_id,
            'title' => 'Booking Confirmed',
            'message' => 'Your reservation '.$res1->confirmation_code.' has been confirmed. Check-in: '.$res1->check_in->format('M d, Y').'.',
            'notification_type' => 'booking',
            'is_read' => true,
            'created_at' => $now->copy()->subDays(20),
        ]);

        Notification::create([
            'user_id' => $guest->user_id,
            'title' => 'Payment Received',
            'message' => 'Payment of RWF 105,000 received for reservation '.$res1->confirmation_code.'. Thank you!',
            'notification_type' => 'payment',
            'is_read' => true,
            'created_at' => $now->copy()->subDays(20),
        ]);

        Notification::create([
            'user_id' => $guest2->user_id,
            'title' => 'Welcome — Check-In Complete',
            'message' => 'You have successfully checked in to Room 105 at RP Karongi Lake Resort. Enjoy your stay!',
            'notification_type' => 'checkin',
            'is_read' => false,
            'created_at' => $now->copy()->subDays(2),
        ]);

        Notification::create([
            'user_id' => $guest3->user_id,
            'title' => 'Reservation Confirmed',
            'message' => 'Your upcoming reservation '.$res3->confirmation_code.' at Kigali Grand Convention Hotel is confirmed.',
            'notification_type' => 'booking',
            'is_read' => false,
            'created_at' => $now->copy()->subDays(1),
        ]);

        Notification::create([
            'user_id' => $housekeeper->user_id,
            'title' => 'New Cleaning Task Assigned',
            'message' => 'You have been assigned a cleaning task for Room 202 at Kigali Grand Convention Hotel.',
            'notification_type' => 'housekeeping',
            'is_read' => false,
            'created_at' => $now->copy()->subHours(3),
        ]);

        Notification::create([
            'user_id' => $receptionist->user_id,
            'title' => 'Maintenance Report Filed',
            'message' => 'A maintenance issue has been reported for Room 101 — light bulb replacement.',
            'notification_type' => 'maintenance',
            'is_read' => true,
            'created_at' => $now->copy()->subDays(10),
        ]);

        Notification::create([
            'user_id' => $guest->user_id,
            'title' => 'Holiday Season Promo',
            'message' => 'Book your December holiday at any RP Hotels branch and get 20% off! Use code HOLIDAY2026.',
            'notification_type' => 'promo',
            'is_read' => false,
            'created_at' => $now->copy()->subDays(3),
        ]);

        // ─────────────────────────────────────────────────────
        // 19. AUDIT LOGS
        // ─────────────────────────────────────────────────────
        AuditLog::create([
            'user_id' => $admin->user_id,
            'action' => 'created_hotel',
            'target_table' => 'hotels',
            'target_id' => $hotel1->hotel_id,
            'ip_address' => '192.168.1.100',
            'created_at' => $now->copy()->subDays(60),
        ]);

        AuditLog::create([
            'user_id' => $admin->user_id,
            'action' => 'created_hotel',
            'target_table' => 'hotels',
            'target_id' => $hotel2->hotel_id,
            'ip_address' => '192.168.1.100',
            'created_at' => $now->copy()->subDays(60),
        ]);

        AuditLog::create([
            'user_id' => $admin->user_id,
            'action' => 'created_hotel',
            'target_table' => 'hotels',
            'target_id' => $hotel3->hotel_id,
            'ip_address' => '192.168.1.100',
            'created_at' => $now->copy()->subDays(60),
        ]);

        AuditLog::create([
            'user_id' => $guest->user_id,
            'action' => 'created_reservation',
            'target_table' => 'reservations',
            'target_id' => $res1->reservation_id,
            'ip_address' => '41.186.24.55',
            'created_at' => $now->copy()->subDays(21),
        ]);

        AuditLog::create([
            'user_id' => $receptionist->user_id,
            'action' => 'performed_checkin',
            'target_table' => 'check_ins',
            'target_id' => 1,
            'ip_address' => '192.168.1.101',
            'created_at' => $now->copy()->subDays(20),
        ]);

        AuditLog::create([
            'user_id' => $admin->user_id,
            'action' => 'updated_user_status',
            'target_table' => 'users',
            'target_id' => $guest4->user_id,
            'ip_address' => '192.168.1.100',
            'created_at' => $now->copy()->subDays(5),
        ]);

        // ─────────────────────────────────────────────────────
        // 20. FRAUD FLAGS
        // ─────────────────────────────────────────────────────
        FraudFlag::create([
            'user_id' => $guest4->user_id,
            'ip_address' => '41.186.99.200',
            'activity_description' => 'User created 4 reservations with unpaid status within 24 hours. Potential booking spam detected.',
            'risk_level' => 'medium',
            'review_status' => 'pending',
            'created_at' => $now->copy()->subDays(10),
        ]);

        FraudFlag::create([
            'user_id' => null,
            'ip_address' => '102.22.45.180',
            'activity_description' => '5 new user accounts registered from the same IP address within 45 minutes. Possible account farming.',
            'risk_level' => 'high',
            'review_status' => 'reviewed',
            'created_at' => $now->copy()->subDays(7),
        ]);

        FraudFlag::create([
            'user_id' => $guest3->user_id,
            'ip_address' => '41.186.24.60',
            'activity_description' => 'User submitted 3 overlapping reservation attempts for the same dates within 10 minutes.',
            'risk_level' => 'low',
            'review_status' => 'dismissed',
            'created_at' => $now->copy()->subDays(3),
        ]);
    }
}
