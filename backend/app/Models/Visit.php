<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Visit extends Model
{
    public $timestamps = false;

    protected $table = 'visits';

    protected $fillable = ['condo_id', 'visitor_id', 'unit_id', 'host_user_id', 'purpose', 'status', 'qr_token', 'valid_from', 'valid_until', 'authorized_by_id', 'authorized_at', 'denied_reason', 'checkin_at', 'checkin_by_id', 'checkout_at', 'checkout_by_id', 'vehicle_plate', 'notes', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'visitor_id' => 'integer',
        'unit_id' => 'integer',
        'host_user_id' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'authorized_by_id' => 'integer',
        'authorized_at' => 'datetime',
        'checkin_at' => 'datetime',
        'checkin_by_id' => 'integer',
        'checkout_at' => 'datetime',
        'checkout_by_id' => 'integer',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class, 'visitor_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
