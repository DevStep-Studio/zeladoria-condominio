<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PollOption extends Model
{
    public $timestamps = false;

    protected $table = 'poll_options';

    protected $fillable = ['poll_id', 'label'];

    protected $casts = [
        'poll_id' => 'integer',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class, 'poll_id');
    }
}
