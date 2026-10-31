<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $table = 'rooms';

    protected $primaryKey = 'room_id';

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'room_number',
        'room_type_id',
        'price_per_night',
        'capacity',
        'description',
        'status',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotel_id', 'hotel_id');
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id', 'room_type_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoomImage::class, 'room_id', 'room_id');
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'room_amenities', 'room_id', 'amenity_id');
    }

    public function roomAmenities(): HasMany
    {
        return $this->hasMany(RoomAmenity::class, 'room_id', 'room_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'room_id', 'room_id');
    }

    public function housekeepingTasks(): HasMany
    {
        return $this->hasMany(HousekeepingTask::class, 'room_id', 'room_id');
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(MaintenanceLog::class, 'room_id', 'room_id');
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'room_id', 'room_id');
    }
}
