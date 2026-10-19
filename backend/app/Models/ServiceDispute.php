<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceDispute extends Model
{
    public $timestamps = false;

    protected $table = 'service_disputes';

    protected $fillable = ['request_id', 'opened_by_id', 'reason', 'description', 'status', 'resolution_notes', 'resolved_by_id', 'resolved_at', 'created_at'];

    protected $casts = [
        'request_id' => 'integer',
        'opened_by_id' => 'integer',
        'resolved_by_id' => 'integer',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }
}
