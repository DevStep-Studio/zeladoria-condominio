<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MonitoringRule extends Model
{
    public $timestamps = false;

    protected $table = 'monitoring_rules';

    protected $fillable = [
        'name',
        'module',
        'event_condition',
        'threshold',
        'window_minutes',
        'priority',
        'default_assignee_name',
        'active',
        'action_plan',
        'created_at',
    ];

    protected $casts = [
        'threshold' => 'integer',
        'window_minutes' => 'integer',
        'active' => 'boolean',
        'created_at' => 'datetime',
    ];
}
