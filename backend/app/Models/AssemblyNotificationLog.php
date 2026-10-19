<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyNotificationLog extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_notification_logs';

    protected $fillable = ['assembly_id', 'condo_id', 'trigger_event', 'channel', 'sent_at', 'recipients_count', 'delivered_count', 'read_count', 'failed_count', 'failure_details', 'created_by_id'];

    protected $casts = [
        'assembly_id' => 'integer',
        'condo_id' => 'integer',
        'sent_at' => 'datetime',
        'recipients_count' => 'integer',
        'delivered_count' => 'integer',
        'read_count' => 'integer',
        'failed_count' => 'integer',
        'created_by_id' => 'integer',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
