<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Parcel extends Model
{
    public $timestamps = false;

    protected $table = 'parcels';

    protected $fillable = ['condo_id', 'unit_id', 'code', 'kind', 'carrier', 'tracking_code', 'description', 'photo_url', 'shelf', 'status', 'pickup_code', 'received_by_id', 'received_at', 'picked_up_at', 'picked_up_by', 'picked_up_document', 'signature', 'notes'];

    protected $casts = [
        'condo_id' => 'integer',
        'unit_id' => 'integer',
        'received_by_id' => 'integer',
        'received_at' => 'datetime',
        'picked_up_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
