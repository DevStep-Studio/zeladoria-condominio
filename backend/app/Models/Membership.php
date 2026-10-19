<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Membership extends Model
{
    public $timestamps = false;

    protected $table = 'memberships';

    protected $fillable = ['user_id', 'condo_id', 'role', 'unit_id', 'relation', 'status', 'invited_at', 'accepted_at', 'created_at'];

    protected $casts = [
        'user_id' => 'integer',
        'condo_id' => 'integer',
        'unit_id' => 'integer',
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
