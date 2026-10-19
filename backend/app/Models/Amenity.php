<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Amenity extends Model
{
    public $timestamps = false;

    protected $table = 'amenities';

    protected $fillable = ['condo_id', 'name', 'category', 'description', 'capacity', 'fee_cents', 'deposit_cents', 'pricing_type', 'reservation_model', 'slot_duration_minutes', 'rules', 'images', 'features', 'open_time', 'close_time', 'days_schedule', 'interval_minutes', 'blocked_days', 'max_hours', 'min_advance_hours', 'max_advance_days', 'limit_per_unit', 'limit_interval', 'cancellation_deadline_hours', 'request_guest_list', 'requires_approval', 'active'];

    protected $casts = [
        'condo_id' => 'integer',
        'capacity' => 'integer',
        'fee_cents' => 'integer',
        'deposit_cents' => 'integer',
        'slot_duration_minutes' => 'integer',
        'images' => 'array',
        'features' => 'array',
        'days_schedule' => 'array',
        'interval_minutes' => 'integer',
        'blocked_days' => 'array',
        'max_hours' => 'integer',
        'min_advance_hours' => 'integer',
        'max_advance_days' => 'integer',
        'limit_per_unit' => 'integer',
        'cancellation_deadline_hours' => 'integer',
        'request_guest_list' => 'boolean',
        'requires_approval' => 'boolean',
        'active' => 'boolean',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
