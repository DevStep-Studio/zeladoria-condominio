<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AmenityBlock extends Model
{
    public $timestamps = false;

    protected $table = 'amenity_blocks';

    protected $fillable = ['condo_id', 'amenity_id', 'start_date', 'end_date', 'start_time', 'end_time', 'recurrent_day', 'reason', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'amenity_id' => 'integer',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function amenity(): BelongsTo
    {
        return $this->belongsTo(Amenity::class, 'amenity_id');
    }
}
