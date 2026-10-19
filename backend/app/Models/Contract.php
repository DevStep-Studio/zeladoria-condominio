<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Contract extends Model
{
    public $timestamps = false;

    protected $table = 'contracts';

    protected $fillable = ['condo_id', 'vendor_id', 'title', 'object', 'start_at', 'end_at', 'notice_days', 'value_cents', 'billing_cycle', 'adjustment_index', 'status', 'document_url'];

    protected $casts = [
        'condo_id' => 'integer',
        'vendor_id' => 'integer',
        'notice_days' => 'integer',
        'value_cents' => 'integer',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
