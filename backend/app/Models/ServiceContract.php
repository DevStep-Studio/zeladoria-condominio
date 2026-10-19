<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceContract extends Model
{
    public $timestamps = false;

    protected $table = 'service_contracts';

    protected $fillable = ['condo_id', 'request_id', 'quote_id', 'quote_version', 'customer_id', 'vendor_id', 'service_title', 'scope_description', 'itemized_materials', 'labor_cents', 'materials_cents', 'other_costs_cents', 'discount_cents', 'inspection_discount_cents', 'total_cents', 'commission_rate_snapshot', 'platform_fee_cents', 'net_vendor_cents', 'warranty_days', 'contract_hash', 'terms_version', 'terms_accepted_at', 'user_ip', 'conditions', 'status', 'payment_order_id', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'request_id' => 'integer',
        'quote_id' => 'integer',
        'quote_version' => 'integer',
        'customer_id' => 'integer',
        'vendor_id' => 'integer',
        'itemized_materials' => 'array',
        'labor_cents' => 'integer',
        'materials_cents' => 'integer',
        'other_costs_cents' => 'integer',
        'discount_cents' => 'integer',
        'inspection_discount_cents' => 'integer',
        'total_cents' => 'integer',
        'commission_rate_snapshot' => 'integer',
        'platform_fee_cents' => 'integer',
        'net_vendor_cents' => 'integer',
        'warranty_days' => 'integer',
        'terms_accepted_at' => 'datetime',
        'payment_order_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(ServiceQuote::class, 'quote_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class, 'payment_order_id');
    }
}
