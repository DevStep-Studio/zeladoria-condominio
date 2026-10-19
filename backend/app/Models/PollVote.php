<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PollVote extends Model
{
    public $timestamps = false;

    protected $table = 'poll_votes';

    protected $fillable = ['poll_id', 'option_id', 'user_id', 'unit_id', 'created_at'];

    protected $casts = [
        'poll_id' => 'integer',
        'option_id' => 'integer',
        'user_id' => 'integer',
        'unit_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class, 'poll_id');
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(PollOption::class, 'option_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
