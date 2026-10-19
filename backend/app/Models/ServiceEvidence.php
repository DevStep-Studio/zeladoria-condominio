<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceEvidence extends Model
{
    public $timestamps = false;

    protected $table = 'service_evidences';

    protected $fillable = ['condo_id', 'request_id', 'contract_id', 'vendor_id', 'stage', 'file_url', 'caption', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'request_id' => 'integer',
        'contract_id' => 'integer',
        'vendor_id' => 'integer',
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

    public function serviceContract(): BelongsTo
    {
        return $this->belongsTo(ServiceContract::class, 'contract_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
