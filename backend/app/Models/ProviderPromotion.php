<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ProviderPromotion extends Model
{
    public $timestamps = false;

    protected $table = 'provider_promotions';

    protected $fillable = ['condo_id', 'vendor_id', 'plan_id', 'type', 'category_id', 'region', 'starts_at', 'ends_at', 'status', 'amount_cents', 'payment_status', 'impressions', 'clicks', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'vendor_id' => 'integer',
        'plan_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'amount_cents' => 'integer',
        'impressions' => 'integer',
        'clicks' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PromotionPlan::class, 'plan_id');
    }
}
