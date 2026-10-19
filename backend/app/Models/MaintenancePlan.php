<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MaintenancePlan extends Model
{
    public $timestamps = false;

    protected $table = 'maintenance_plans';

    protected $fillable = ['condo_id', 'asset_id', 'title', 'frequency_days', 'checklist', 'vendor_id', 'responsible', 'next_due_at', 'last_done_at', 'active'];

    protected $casts = [
        'condo_id' => 'integer',
        'asset_id' => 'integer',
        'frequency_days' => 'integer',
        'checklist' => 'array',
        'vendor_id' => 'integer',
        'active' => 'boolean',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
