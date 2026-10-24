<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class IncidentActivity extends Model
{
    public $timestamps = false;

    protected $table = 'incident_activities';

    protected $fillable = [
        'incident_id',
        'user_id',
        'user_name',
        'action',
        'notes',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'incident_id' => 'integer',
        'user_id' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(SystemIncident::class, 'incident_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
