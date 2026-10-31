<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory;

    protected $table = 'reservations';

    protected $primaryKey = 'reservation_id';

    protected $fillable = [
        'confirmation_code',
        'user_id',
        'room_id',
        'check_in',
        'check_out',
        'number_of_guests',
        'total_amount',
        'payment_status',
        'reservation_status',
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date',
            'check_out' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id', 'room_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(ReservationGuest::class, 'reservation_id', 'reservation_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'reservation_id', 'reservation_id');
    }

    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class, 'reservation_id', 'reservation_id');
    }

    public function checkout(): HasOne
    {
        return $this->hasOne(Checkout::class, 'reservation_id', 'reservation_id');
    }

    public function serviceOrders(): HasMany
    {
        return $this->hasMany(GuestServiceOrder::class, 'reservation_id', 'reservation_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'reservation_id', 'reservation_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class, 'reservation_id', 'reservation_id');
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'reservation_id', 'reservation_id');
    }
}
