<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ImportJob extends Model
{
    public $timestamps = false;

    protected $table = 'import_jobs';

    protected $fillable = ['condo_id', 'kind', 'file_name', 'total', 'succeeded', 'failed', 'errors', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'total' => 'integer',
        'succeeded' => 'integer',
        'failed' => 'integer',
        'errors' => 'array',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
