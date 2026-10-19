<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyMinute extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_minutes';

    protected $fillable = ['assembly_id', 'condo_id', 'status', 'current_version', 'file_url', 'file_name', 'file_size_kb', 'file_format', 'content', 'summary', 'ai_suggested_summary', 'summary_status', 'summary_approved_by_id', 'summary_approved_at', 'published_at', 'published_by_id', 'created_at', 'updated_at'];

    protected $casts = [
        'assembly_id' => 'integer',
        'condo_id' => 'integer',
        'file_size_kb' => 'integer',
        'summary_approved_by_id' => 'integer',
        'summary_approved_at' => 'datetime',
        'published_at' => 'datetime',
        'published_by_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
