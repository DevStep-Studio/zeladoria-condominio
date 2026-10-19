<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Transaction extends Model
{
    public $timestamps = false;

    protected $table = 'transactions';

    protected $fillable = ['condo_id', 'kind', 'category', 'cost_center', 'description', 'amount_cents', 'due_date', 'paid_date', 'status', 'vendor_id', 'reserve_fund', 'attachment_url', 'created_by_id', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'amount_cents' => 'integer',
        'vendor_id' => 'integer',
        'reserve_fund' => 'boolean',
        'created_by_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
