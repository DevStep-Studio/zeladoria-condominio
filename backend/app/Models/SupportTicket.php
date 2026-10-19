<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SupportTicket extends Model
{
    public $timestamps = false;

    protected $table = 'support_tickets';

    protected $fillable = ['condo_id', 'user_id', 'subject', 'body', 'category', 'priority', 'status', 'answer', 'satisfaction', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'user_id' => 'integer',
        'satisfaction' => 'integer',
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
