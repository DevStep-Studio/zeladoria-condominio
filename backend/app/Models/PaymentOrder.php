<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PaymentOrder extends Model
{
    public $timestamps = false;

    protected $table = 'payment_orders';

    protected $fillable = ['code', 'condo_id', 'request_id', 'contract_id', 'quote_id', 'customer_id', 'vendor_id', 'purpose', 'amount_gross_cents', 'platform_fee_cents', 'net_vendor_cents', 'commission_percent', 'billing_type', 'installments', 'currency', 'external_reference', 'psp_provider', 'psp_payment_id', 'psp_invoice_url', 'pix_qr_code', 'pix_copia_e_cola', 'status', 'paid_at', 'released_at', 'failed_at', 'refunded_at', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'request_id' => 'integer',
        'contract_id' => 'integer',
        'quote_id' => 'integer',
        'customer_id' => 'integer',
        'vendor_id' => 'integer',
        'amount_gross_cents' => 'integer',
        'platform_fee_cents' => 'integer',
        'net_vendor_cents' => 'integer',
        'commission_percent' => 'integer',
        'installments' => 'integer',
        'paid_at' => 'datetime',
        'released_at' => 'datetime',
        'failed_at' => 'datetime',
        'refunded_at' => 'datetime',
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

    public function serviceContract(): BelongsTo
    {
        return $this->belongsTo(ServiceContract::class, 'contract_id');
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
}
