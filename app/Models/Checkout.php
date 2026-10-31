<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Checkout extends Model
{
    use HasFactory;

    protected $table = 'checkouts';

    protected $primaryKey = 'checkout_id';

    public $timestamps = false;

    protected $fillable = [
        'reservation_id',
        'receptionist_id',
        'checkout_time',
        'room_charges',
        'additional_charges',
        'discounts',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'checkout_time' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id', 'reservation_id');
    }

    public function receptionist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receptionist_id', 'user_id');
    }
}
