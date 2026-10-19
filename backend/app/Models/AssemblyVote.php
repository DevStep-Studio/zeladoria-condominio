<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssemblyVote extends Model
{
    public $timestamps = false;

    protected $table = 'assembly_votes';

    protected $fillable = ['assembly_id', 'agenda_id', 'unit_id', 'user_id', 'choice', 'weight', 'created_at'];

    protected $casts = [
        'assembly_id' => 'integer',
        'agenda_id' => 'integer',
        'unit_id' => 'integer',
        'user_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }

    public function agendaItem(): BelongsTo
    {
        return $this->belongsTo(AssemblyAgenda::class, 'agenda_id');
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
