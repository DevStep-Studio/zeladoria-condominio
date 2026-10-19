<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class PaymentWebhookEvent extends Model
{
    public $timestamps = false;

    protected $table = 'payment_webhook_events';

    protected $fillable = ['provider', 'event_id', 'event_type', 'payload', 'status', 'created_at'];

    protected $casts = [
        'payload' => 'array',
        'created_at' => 'datetime',
    ];
}
