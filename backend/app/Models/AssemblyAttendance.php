<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyAttendance extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_attendance';

    protected $fillable = ['assembly_id', 'unit_id', 'user_id', 'status', 'proxy_for_unit_id', 'proxy_doc', 'proxy_name', 'proxy_cpf', 'history', 'checkin_at', 'created_at'];

    protected $casts = [
        'assembly_id' => 'integer',
        'unit_id' => 'integer',
        'user_id' => 'integer',
        'proxy_for_unit_id' => 'integer',
        'history' => 'array',
        'checkin_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
