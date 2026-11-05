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

    protected $appends = [
        'masked_identification_number',
    ];

    public function getMaskedIdentificationNumberAttribute(): ?string
    {
        if (! $this->identification_number) {
            return null;
        }

        $id = trim($this->identification_number);
        $len = strlen($id);

        if ($len <= 4) {
            return '••••'.$id;
        }

        return '••••••••'.substr($id, -4);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id', 'reservation_id');
    }
}
