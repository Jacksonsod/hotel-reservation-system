<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    use HasFactory;

    protected $table = 'check_ins';

    protected $primaryKey = 'checkin_id';

    public $timestamps = false;

    protected $fillable = [
        'reservation_id',
        'room_id',
        'receptionist_id',
        'checkin_time',
        'special_requests',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'checkin_time' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id', 'reservation_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id', 'room_id');
    }

    public function receptionist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receptionist_id', 'user_id');
    }
}
