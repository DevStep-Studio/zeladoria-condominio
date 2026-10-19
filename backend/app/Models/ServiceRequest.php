<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceRequest extends Model
{
    public $timestamps = false;

    protected $table = 'service_requests';

    protected $fillable = ['condo_id', 'code', 'customer_id', 'vendor_id', 'mode', 'category', 'title', 'description', 'urgency', 'scheduled_date', 'scheduled_time_slot', 'location', 'unit_id', 'attachments', 'status', 'accepted_at', 'arrived_at', 'started_at', 'completed_at', 'cancelled_at', 'cancelled_by', 'cancel_reason', 'estimated_amount_cents', 'final_amount_cents', 'platform_fee_cents', 'commission_rate_percent', 'payment_method', 'is_paid', 'inspection_id', 'payment_order_id', 'checklist', 'materials_used', 'execution_notes', 'completion_requested_at', 'validated_at', 'validated_by_id', 'correction_notes', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'customer_id' => 'integer',
        'vendor_id' => 'integer',
        'unit_id' => 'integer',
        'attachments' => 'array',
        'accepted_at' => 'datetime',
        'arrived_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'cancelled_by' => 'integer',
        'estimated_amount_cents' => 'integer',
        'final_amount_cents' => 'integer',
        'platform_fee_cents' => 'integer',
        'commission_rate_percent' => 'integer',
        'is_paid' => 'boolean',
        'inspection_id' => 'integer',
        'payment_order_id' => 'integer',
        'checklist' => 'array',
        'materials_used' => 'array',
        'completion_requested_at' => 'datetime',
        'validated_at' => 'datetime',
        'validated_by_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(ServiceInspection::class, 'inspection_id');
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class, 'payment_order_id');
    }
}
