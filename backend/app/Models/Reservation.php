<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Reservation extends Model
{
    public $timestamps = false;

    protected $table = 'reservations';

    protected $fillable = ['condo_id', 'amenity_id', 'unit_id', 'user_id', 'date', 'start_time', 'end_time', 'guests', 'guest_list', 'total_cents', 'deposit_cents', 'payment_status', 'status', 'rejection_reason', 'cancellation_reason', 'cancelled_at', 'approved_at', 'approved_by_id', 'rules_accepted', 'qr_token', 'checkin_at', 'notes', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'amenity_id' => 'integer',
        'unit_id' => 'integer',
        'user_id' => 'integer',
        'guests' => 'integer',
        'guest_list' => 'array',
        'total_cents' => 'integer',
        'deposit_cents' => 'integer',
        'cancelled_at' => 'datetime',
        'approved_at' => 'datetime',
        'approved_by_id' => 'integer',
        'rules_accepted' => 'boolean',
        'checkin_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function amenity(): BelongsTo
    {
        return $this->belongsTo(Amenity::class, 'amenity_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
