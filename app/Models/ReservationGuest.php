<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationGuest extends Model
{
    use HasFactory;

    protected $table = 'reservation_guests';

    protected $primaryKey = 'guest_id';

    public $timestamps = false;

    protected $fillable = [
        'reservation_id',
        'full_name',
        'identification_number',
        'contact_phone',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id', 'reservation_id');
    }
}
