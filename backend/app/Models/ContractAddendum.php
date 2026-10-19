<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ContractAddendum extends Model
{
    public $timestamps = false;

    protected $table = 'contract_addendums';

    protected $fillable = ['request_id', 'quote_id', 'contract_id', 'vendor_id', 'title', 'reason', 'description', 'additional_amount_cents', 'status', 'payment_order_id', 'photos', 'estimated_extra_hours', 'accepted_at', 'rejected_at', 'created_at', 'updated_at'];

    protected $casts = [
        'request_id' => 'integer',
        'quote_id' => 'integer',
        'contract_id' => 'integer',
        'vendor_id' => 'integer',
        'additional_amount_cents' => 'integer',
        'payment_order_id' => 'integer',
        'photos' => 'array',
        'estimated_extra_hours' => 'integer',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(ServiceQuote::class, 'quote_id');
    }

    public function serviceContract(): BelongsTo
    {
        return $this->belongsTo(ServiceContract::class, 'contract_id');
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
