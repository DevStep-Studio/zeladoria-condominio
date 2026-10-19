<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Announcement extends Model
{
    public $timestamps = false;

    protected $table = 'announcements';

    protected $fillable = ['condo_id', 'title', 'body', 'category', 'priority', 'audience', 'block_id', 'pinned', 'show_on_tv', 'author_id', 'published_at', 'expires_at', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'block_id' => 'integer',
        'pinned' => 'boolean',
        'show_on_tv' => 'boolean',
        'author_id' => 'integer',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class, 'block_id');
    }
}
