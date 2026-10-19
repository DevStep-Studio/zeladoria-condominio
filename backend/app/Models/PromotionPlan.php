<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PromotionPlan extends Model
{
    public $timestamps = false;

    protected $table = 'promotion_plans';

    protected $fillable = ['condo_id', 'name', 'type', 'duration_days', 'price_cents', 'badge', 'active', 'description', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'duration_days' => 'integer',
        'price_cents' => 'integer',
        'active' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
