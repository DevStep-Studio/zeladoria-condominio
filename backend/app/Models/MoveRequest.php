<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MoveRequest extends Model
{
    public $timestamps = false;

    protected $table = 'move_requests';

    protected $fillable = ['condo_id', 'unit_id', 'requested_by_id', 'kind', 'scheduled_date', 'start_time', 'end_time', 'elevator', 'carrier_name', 'carrier_doc', 'vehicle_plate', 'workers', 'description', 'art_url', 'term_accepted', 'status', 'reviewed_by_id', 'review_notes', 'deadline_at', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'unit_id' => 'integer',
        'requested_by_id' => 'integer',
        'term_accepted' => 'boolean',
        'reviewed_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
