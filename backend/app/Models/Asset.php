<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Asset extends Model
{
    public $timestamps = false;

    protected $table = 'assets';

    protected $fillable = ['condo_id', 'name', 'category', 'location', 'brand', 'serial', 'installed_at', 'status', 'notes'];

    protected $casts = [
        'condo_id' => 'integer',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
