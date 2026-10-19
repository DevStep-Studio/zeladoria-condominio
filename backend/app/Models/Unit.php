<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Unit extends Model
{
    public $timestamps = false;

    protected $table = 'units';

    protected $fillable = ['condo_id', 'block_id', 'number', 'floor', 'fraction', 'kind', 'status', 'parking_spots', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'block_id' => 'integer',
        'floor' => 'integer',
        'parking_spots' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class, 'block_id');
    }
}
