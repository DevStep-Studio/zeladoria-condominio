<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyMinuteDownload extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_minute_downloads';

    protected $fillable = ['assembly_id', 'minutes_id', 'version', 'user_id', 'unit_id', 'downloaded_at'];

    protected $casts = [
        'assembly_id' => 'integer',
        'minutes_id' => 'integer',
        'user_id' => 'integer',
        'unit_id' => 'integer',
        'downloaded_at' => 'datetime',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
