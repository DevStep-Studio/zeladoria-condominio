<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Ticket extends Model
{
    public $timestamps = false;

    protected $table = 'tickets';

    protected $fillable = ['condo_id', 'code', 'unit_id', 'title', 'description', 'category', 'priority', 'status', 'location', 'preferred_time', 'vendor_id', 'assigned_to_id', 'scheduled_for', 'cost_cents', 'report', 'attachments', 'ai_priority', 'ai_summary', 'opened_by_id', 'due_at', 'closed_at', 'rating', 'rating_comment', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'unit_id' => 'integer',
        'vendor_id' => 'integer',
        'assigned_to_id' => 'integer',
        'cost_cents' => 'integer',
        'attachments' => 'array',
        'opened_by_id' => 'integer',
        'due_at' => 'datetime',
        'closed_at' => 'datetime',
        'rating' => 'integer',
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

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
