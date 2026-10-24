<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SystemIncident extends Model
{
    public $timestamps = false;

    protected $table = 'system_incidents';

    protected $fillable = [
        'code',
        'title',
        'description',
        'type',
        'category',
        'source_module',
        'priority',
        'status',
        'condo_id',
        'condo_name',
        'assignee_id',
        'assignee_name',
        'fingerprint',
        'occurrences_count',
        'first_seen_at',
        'last_seen_at',
        'resolved_at',
        'resolved_by_id',
        'resolved_by_name',
        'resolution_notes',
        'is_manual',
        'start_date',
        'end_date',
        'recommended_action',
        'target_audience',
        'environment',
        'correlation_id',
        'app_version',
        'technical_context',
        'stack_trace',
        'related_entity_type',
        'related_entity_id',
        'related_url',
        'silenced',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'condo_id' => 'integer',
        'assignee_id' => 'integer',
        'occurrences_count' => 'integer',
        'is_manual' => 'boolean',
        'silenced' => 'boolean',
        'technical_context' => 'array',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'resolved_at' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(IncidentActivity::class, 'incident_id')->orderBy('created_at', 'asc');
    }

    public function occurrences(): HasMany
    {
        return $this->hasMany(IncidentOccurrence::class, 'incident_id')->orderByDesc('created_at');
    }
}
