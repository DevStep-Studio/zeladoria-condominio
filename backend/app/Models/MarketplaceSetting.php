<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MarketplaceSetting extends Model
{
    public $timestamps = false;

    protected $table = 'marketplace_settings';

    protected $fillable = ['condo_id', 'commission_percent', 'visit_commission_percent', 'slot_hold_minutes', 'inspection_fee_max_cents', 'dispute_window_hours', 'auto_release_hours', 'processing_fee_payer', 'estimated_psp_fee_percent', 'payments_enabled', 'paid_visits_enabled', 'pix_enabled', 'card_enabled', 'installments_enabled', 'payouts_enabled', 'zeladoria_protege_enabled', 'max_installments', 'default_quote_validity_hours', 'require_before_photo', 'created_at', 'updated_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'commission_percent' => 'integer',
        'visit_commission_percent' => 'integer',
        'slot_hold_minutes' => 'integer',
        'inspection_fee_max_cents' => 'integer',
        'dispute_window_hours' => 'integer',
        'auto_release_hours' => 'integer',
        'payments_enabled' => 'boolean',
        'paid_visits_enabled' => 'boolean',
        'pix_enabled' => 'boolean',
        'card_enabled' => 'boolean',
        'installments_enabled' => 'boolean',
        'payouts_enabled' => 'boolean',
        'zeladoria_protege_enabled' => 'boolean',
        'max_installments' => 'integer',
        'default_quote_validity_hours' => 'integer',
        'require_before_photo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }
}
