<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class IncidentOccurrence extends Model
{
    public $timestamps = false;

    protected $table = 'incident_occurrences';

    protected $fillable = [
        'incident_id',
        'correlation_id',
        'message',
        'context',
        'created_at',
    ];

    protected $casts = [
        'incident_id' => 'integer',
        'context' => 'array',
        'created_at' => 'datetime',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(SystemIncident::class, 'incident_id');
    }
}
