<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AgendaEvent extends Model
{
    public $timestamps = false;

    protected $table = 'agenda_events';

    protected $fillable = ['condo_id', 'title', 'description', 'category', 'date', 'start_time', 'end_time', 'location', 'responsible', 'audience_scope', 'attachments', 'reminder', 'recurrence', 'status', 'amenity_id', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'attachments' => 'array',
        'amenity_id' => 'integer',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function amenity(): BelongsTo
    {
        return $this->belongsTo(Amenity::class, 'amenity_id');
    }
}
