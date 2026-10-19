<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PaymentRecipient extends Model
{
    public $timestamps = false;

    protected $table = 'payment_recipients';

    protected $fillable = ['vendor_id', 'psp_provider', 'psp_account_id', 'psp_api_key', 'account_type', 'pix_key', 'status', 'created_at', 'updated_at'];

    protected $casts = [
        'vendor_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
