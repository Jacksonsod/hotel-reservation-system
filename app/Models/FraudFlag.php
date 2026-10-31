<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudFlag extends Model
{
    protected $table = 'fraud_flags';

    protected $primaryKey = 'flag_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'ip_address',
        'activity_description',
        'risk_level',
        'review_status',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
