<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    use HasFactory;

    protected $table = 'hotels';

    protected $primaryKey = 'hotel_id';

    protected $fillable = [
        'name',
        'description',
        'location',
        'address',
        'contact_phone',
        'contact_email',
        'status',
    ];

    public function images(): HasMany
    {
        return $this->hasMany(HotelImage::class, 'hotel_id', 'hotel_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'hotel_id', 'hotel_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'hotel_id', 'hotel_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'hotel_id', 'hotel_id');
    }
}
