<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Block extends Model
{
    public $timestamps = false;

    protected $table = 'blocks';

    protected $fillable = ['condo_id', 'name', 'floors', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'floors' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
