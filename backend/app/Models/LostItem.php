<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LostItem extends Model
{
    public $timestamps = false;

    protected $table = 'lost_items';

    protected $fillable = ['condo_id', 'title', 'description', 'photo_url', 'found_location', 'found_at', 'stored_location', 'status', 'discard_after', 'claimed_by', 'claimed_unit_id', 'claimed_at', 'registered_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'claimed_unit_id' => 'integer',
        'claimed_at' => 'datetime',
        'registered_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
