<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MaintenanceOrder extends Model
{
    public $timestamps = false;

    protected $table = 'maintenance_orders';

    protected $fillable = ['condo_id', 'asset_id', 'plan_id', 'kind', 'title', 'description', 'scheduled_for', 'completed_at', 'status', 'vendor_id', 'technician', 'cost_cents', 'report', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'asset_id' => 'integer',
        'plan_id' => 'integer',
        'vendor_id' => 'integer',
        'cost_cents' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PromotionPlan::class, 'plan_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
