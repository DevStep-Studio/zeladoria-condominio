<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class OccurrenceComment extends Model
{
    public $timestamps = false;

    protected $table = 'occurrence_comments';

    protected $fillable = ['occurrence_id', 'user_id', 'body', 'internal', 'created_at'];

    protected $casts = [
        'occurrence_id' => 'integer',
        'user_id' => 'integer',
        'internal' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(Occurrence::class, 'occurrence_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
