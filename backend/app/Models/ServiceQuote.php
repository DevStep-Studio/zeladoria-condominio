<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceQuote extends Model
{
    public $timestamps = false;

    protected $table = 'service_quotes';

    protected $fillable = ['request_id', 'vendor_id', 'inspection_id', 'version', 'title', 'scope_description', 'itemized_materials', 'labor_cents', 'materials_cents', 'other_costs_cents', 'discount_cents', 'inspection_discount_cents', 'total_cents', 'description', 'available_at', 'conditions', 'estimated_days', 'warranty_days', 'contract_hash', 'terms_accepted_at', 'user_ip', 'valid_until', 'expires_at', 'sent_at', 'accepted_at', 'status', 'created_at'];

    protected $casts = [
        'request_id' => 'integer',
        'vendor_id' => 'integer',
        'inspection_id' => 'integer',
        'version' => 'integer',
        'itemized_materials' => 'array',
        'labor_cents' => 'integer',
        'materials_cents' => 'integer',
        'other_costs_cents' => 'integer',
        'discount_cents' => 'integer',
        'inspection_discount_cents' => 'integer',
        'total_cents' => 'integer',
        'estimated_days' => 'integer',
        'warranty_days' => 'integer',
        'terms_accepted_at' => 'datetime',
        'valid_until' => 'datetime',
        'expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(ServiceInspection::class, 'inspection_id');
    }
}
