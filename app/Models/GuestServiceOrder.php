<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestServiceOrder extends Model
{
    protected $table = 'guest_service_orders';

    protected $primaryKey = 'order_id';

    public $timestamps = false;

    protected $fillable = [
        'reservation_id',
        'service_id',
        'quantity',
        'unit_price',
        'total_price',
        'ordered_at',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id', 'reservation_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }
}
