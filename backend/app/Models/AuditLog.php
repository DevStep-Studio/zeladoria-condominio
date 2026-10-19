<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AuditLog extends Model
{
    public $timestamps = false;

    protected $table = 'audit_logs';

    protected $fillable = ['condo_id', 'user_id', 'user_name', 'action', 'entity', 'entity_id', 'summary', 'before', 'after', 'ip', 'user_agent', 'origin', 'critical', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'user_id' => 'integer',
        'before' => 'array',
        'after' => 'array',
        'critical' => 'boolean',
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
