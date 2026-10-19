<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Notification extends Model
{
    public $timestamps = false;

    protected $table = 'notifications';

    protected $fillable = ['condo_id', 'user_id', 'title', 'body', 'channel', 'link', 'read_at', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'user_id' => 'integer',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
