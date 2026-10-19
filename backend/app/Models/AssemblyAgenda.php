<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyAgenda extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_agenda';

    protected $fillable = ['assembly_id', 'position', 'title', 'description', 'voting_type', 'status', 'result', 'attachments', 'presenter', 'discussion_result', 'decision', 'notes', 'requires_voting', 'voting_result'];

    protected $casts = [
        'assembly_id' => 'integer',
        'position' => 'integer',
        'attachments' => 'array',
        'requires_voting' => 'boolean',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }
}
