<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyMinuteVersion extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_minute_versions';

    protected $fillable = ['minutes_id', 'assembly_id', 'version', 'file_url', 'file_name', 'file_size_kb', 'content', 'summary', 'change_reason', 'created_by_id', 'created_at'];

    protected $casts = [
        'minutes_id' => 'integer',
        'assembly_id' => 'integer',
        'file_size_kb' => 'integer',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }
}
