<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceReview extends Model
{
    public $timestamps = false;

    protected $table = 'service_reviews';

    protected $fillable = ['request_id', 'vendor_id', 'customer_id', 'rating', 'punctuality_rating', 'quality_rating', 'communication_rating', 'cost_benefit_rating', 'comment', 'photos', 'is_verified', 'created_at'];

    protected $casts = [
        'request_id' => 'integer',
        'vendor_id' => 'integer',
        'customer_id' => 'integer',
        'rating' => 'integer',
        'punctuality_rating' => 'integer',
        'quality_rating' => 'integer',
        'communication_rating' => 'integer',
        'cost_benefit_rating' => 'integer',
        'photos' => 'array',
        'is_verified' => 'boolean',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
