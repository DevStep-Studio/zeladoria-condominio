<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PushSubscription extends Model
{
    public $timestamps = false;

    protected $table = 'push_subscriptions';

    protected $fillable = ['user_id', 'condo_id', 'endpoint', 'p256dh', 'auth', 'created_at'];

    protected $casts = [
        'user_id' => 'integer',
        'condo_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
