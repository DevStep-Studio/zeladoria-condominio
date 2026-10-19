<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CustomerFavorite extends Model
{
    public $timestamps = false;

    protected $table = 'customer_favorites';

    protected $fillable = ['customer_id', 'vendor_id', 'created_at'];

    protected $casts = [
        'customer_id' => 'integer',
        'vendor_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
