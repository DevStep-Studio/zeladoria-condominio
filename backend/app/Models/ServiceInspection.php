<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceInspection extends Model
{
    public $timestamps = false;

    protected $table = 'service_inspections';

    protected $fillable = ['request_id', 'vendor_id', 'type', 'price_cents', 'discount_on_service', 'estimated_duration_minutes', 'notes', 'available_slots', 'selected_slot', 'hold_expires_at', 'payment_order_id', 'provider_arrived_at', 'status', 'diagnostic_report', 'evidence_photos', 'completed_at', 'created_at', 'updated_at'];

    protected $casts = [
        'request_id' => 'integer',
        'vendor_id' => 'integer',
        'price_cents' => 'integer',
        'discount_on_service' => 'boolean',
        'estimated_duration_minutes' => 'integer',
        'available_slots' => 'array',
        'selected_slot' => 'array',
        'hold_expires_at' => 'datetime',
        'payment_order_id' => 'integer',
        'provider_arrived_at' => 'datetime',
        'evidence_photos' => 'array',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
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
