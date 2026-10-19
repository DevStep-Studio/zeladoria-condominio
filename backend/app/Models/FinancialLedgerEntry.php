<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class FinancialLedgerEntry extends Model
{
    public $timestamps = false;

    protected $table = 'financial_ledger_entries';

    protected $fillable = ['condo_id', 'request_id', 'payment_order_id', 'event_type', 'amount_cents', 'balance_type', 'entity_type', 'reference_code', 'description', 'metadata', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'request_id' => 'integer',
        'payment_order_id' => 'integer',
        'amount_cents' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class, 'payment_order_id');
    }
}
