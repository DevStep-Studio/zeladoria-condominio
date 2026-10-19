<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Occurrence extends Model
{
    public $timestamps = false;

    protected $table = 'occurrences';

    protected $fillable = ['condo_id', 'shift_id', 'code', 'visibility', 'category', 'severity', 'status', 'title', 'description', 'exact_location', 'latitude', 'longitude', 'actions_taken', 'occurred_at', 'reported_by_id', 'assigned_to_id', 'unit_id', 'block_id', 'attachments', 'estimated_deadline', 'resolved_at', 'resident_rating', 'resident_comment', 'ack_by_id', 'ack_at', 'locked', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'shift_id' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'occurred_at' => 'datetime',
        'reported_by_id' => 'integer',
        'assigned_to_id' => 'integer',
        'unit_id' => 'integer',
        'block_id' => 'integer',
        'attachments' => 'array',
        'estimated_deadline' => 'datetime',
        'resolved_at' => 'datetime',
        'resident_rating' => 'integer',
        'ack_by_id' => 'integer',
        'ack_at' => 'datetime',
        'locked' => 'boolean',
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

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class, 'block_id');
    }
}
