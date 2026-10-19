<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Poll extends Model
{
    public $timestamps = false;

    protected $table = 'polls';

    protected $fillable = ['condo_id', 'question', 'description', 'status', 'ends_at', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'ends_at' => 'datetime',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
