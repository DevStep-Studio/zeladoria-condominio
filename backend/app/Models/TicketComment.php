<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TicketComment extends Model
{
    public $timestamps = false;

    protected $table = 'ticket_comments';

    protected $fillable = ['ticket_id', 'user_id', 'body', 'internal', 'created_at'];

    protected $casts = [
        'ticket_id' => 'integer',
        'user_id' => 'integer',
        'internal' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
