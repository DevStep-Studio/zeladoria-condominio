<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Visitor extends Model
{
    public $timestamps = false;

    protected $table = 'visitors';

    protected $fillable = ['condo_id', 'name', 'document', 'doc_type', 'phone', 'photo_url', 'kind', 'company', 'vehicle_plate', 'recurring', 'blocked', 'block_reason', 'notes', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'recurring' => 'boolean',
        'blocked' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
