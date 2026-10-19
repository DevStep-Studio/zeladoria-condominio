<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Assembly extends Model
{
    public $timestamps = false;

    protected $table = 'assemblies';

    protected $fillable = ['condo_id', 'title', 'kind', 'mode', 'notice_at', 'first_call_at', 'second_call_at', 'location', 'online_link', 'quorum_first', 'quorum_second', 'status', 'minutes', 'recording_url', 'created_by_id', 'description', 'start_time', 'end_time', 'guidelines', 'audience_scope', 'target_block_id', 'target_unit_id', 'responsible_id', 'responsible_name', 'confirmation_deadline', 'reminders_config', 'attachments', 'notice_document_url', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'notice_at' => 'datetime',
        'first_call_at' => 'datetime',
        'second_call_at' => 'datetime',
        'quorum_first' => 'integer',
        'quorum_second' => 'integer',
        'created_by_id' => 'integer',
        'target_block_id' => 'integer',
        'target_unit_id' => 'integer',
        'responsible_id' => 'integer',
        'confirmation_deadline' => 'datetime',
        'reminders_config' => 'array',
        'attachments' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
