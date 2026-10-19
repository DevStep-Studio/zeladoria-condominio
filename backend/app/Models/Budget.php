<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Budget extends Model
{
    public $timestamps = false;

    protected $table = 'budgets';

    protected $fillable = ['condo_id', 'year', 'category', 'planned_cents'];

    protected $casts = [
        'condo_id' => 'integer',
        'year' => 'integer',
        'planned_cents' => 'integer',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
