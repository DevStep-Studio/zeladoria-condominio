<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Charge extends Model
{
    public $timestamps = false;

    protected $table = 'charges';

    protected $fillable = ['condo_id', 'unit_id', 'reference', 'description', 'amount_cents', 'due_date', 'paid_at', 'status', 'method'];

    protected $casts = [
        'condo_id' => 'integer',
        'unit_id' => 'integer',
        'amount_cents' => 'integer',
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
