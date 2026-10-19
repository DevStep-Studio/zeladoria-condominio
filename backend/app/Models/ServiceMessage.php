<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceMessage extends Model
{
    public $timestamps = false;

    protected $table = 'service_messages';

    protected $fillable = ['request_id', 'sender_id', 'sender_role', 'body', 'attachment_url', 'read_at', 'created_at'];

    protected $casts = [
        'request_id' => 'integer',
        'sender_id' => 'integer',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'request_id');
    }
}
