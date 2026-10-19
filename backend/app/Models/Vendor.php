<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Vendor extends Model
{
    public $timestamps = false;

    protected $table = 'vendors';

    protected $fillable = ['condo_id', 'user_id', 'slug', 'name', 'cnpj', 'provider_type', 'company_name', 'category', 'contact_name', 'phone', 'email', 'rating', 'active', 'notes', 'photo_url', 'cover_url', 'whatsapp', 'description', 'service_area', 'service_radius_km', 'lat', 'lng', 'experience_years', 'response_time_minutes', 'working_hours', 'price_from_cents', 'cep', 'address_street', 'address_number', 'address_neighborhood', 'address_city', 'address_state', 'bank_info', 'pix_info', 'identity_verification', 'specialties', 'services', 'portfolio', 'documents', 'onboarding_status', 'is_online', 'available_now', 'verified', 'verified_at', 'verified_by_id', 'sponsored', 'completed_jobs', 'created_at'];

    protected $casts = [
        'condo_id' => 'integer',
        'user_id' => 'integer',
        'rating' => 'integer',
        'active' => 'boolean',
        'service_radius_km' => 'integer',
        'lat' => 'float',
        'lng' => 'float',
        'experience_years' => 'integer',
        'response_time_minutes' => 'integer',
        'price_from_cents' => 'integer',
        'bank_info' => 'array',
        'pix_info' => 'array',
        'identity_verification' => 'array',
        'specialties' => 'array',
        'services' => 'array',
        'portfolio' => 'array',
        'documents' => 'array',
        'is_online' => 'boolean',
        'available_now' => 'boolean',
        'verified' => 'boolean',
        'verified_at' => 'datetime',
        'verified_by_id' => 'integer',
        'sponsored' => 'boolean',
        'completed_jobs' => 'integer',
        'created_at' => 'datetime',
    ];

    public function condo(): BelongsTo
    {
        return $this->belongsTo(Condominium::class, 'condo_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
