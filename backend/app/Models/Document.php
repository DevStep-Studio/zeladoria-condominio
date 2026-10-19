<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Document extends Model
{
    public $timestamps = false;

    protected $table = 'documents';

    protected $fillable = ['condo_id', 'title', 'category', 'description', 'file_name', 'file_url', 'size_kb', 'visibility', 'version', 'uploaded_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'size_kb' => 'integer',
        'uploaded_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
