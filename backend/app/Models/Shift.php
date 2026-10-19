<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Shift extends Model
{
    public $timestamps = false;

    protected $table = 'shifts';

    protected $fillable = ['condo_id', 'user_id', 'period', 'status', 'started_at', 'ended_at', 'handover_to_id', 'handover_notes', 'pending_items', 'checklist'];

    protected $casts = [
        'condo_id' => 'integer',
        'user_id' => 'integer',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'handover_to_id' => 'integer',
        'checklist' => 'array',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
