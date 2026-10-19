<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Payout extends Model
{
    public $timestamps = false;

    protected $table = 'payouts';

    protected $fillable = ['condo_id', 'vendor_id', 'contract_id', 'payment_order_id', 'gateway', 'gateway_payout_id', 'gross_amount_cents', 'platform_fee_cents', 'processing_fee_cents', 'net_amount_cents', 'status', 'eligible_at', 'paid_at', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'vendor_id' => 'integer',
        'contract_id' => 'integer',
        'payment_order_id' => 'integer',
        'gross_amount_cents' => 'integer',
        'platform_fee_cents' => 'integer',
        'processing_fee_cents' => 'integer',
        'net_amount_cents' => 'integer',
        'eligible_at' => 'datetime',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function serviceContract(): BelongsTo
    {
        return $this->belongsTo(ServiceContract::class, 'contract_id');
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class, 'payment_order_id');
    }
}
