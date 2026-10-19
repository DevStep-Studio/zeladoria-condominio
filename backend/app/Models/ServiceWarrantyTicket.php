<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceWarrantyTicket extends Model
{
    public $timestamps = false;

    protected $table = 'service_warranty_tickets';

    protected $fillable = ['request_id', 'quote_id', 'customer_id', 'vendor_id', 'description', 'status', 'resolution_notes', 'created_at', 'resolved_at'];

    protected $casts = [
        'request_id' => 'integer',
        'quote_id' => 'integer',
        'customer_id' => 'integer',
        'vendor_id' => 'integer',
        'created_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

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
}
