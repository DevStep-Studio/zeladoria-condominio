<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Condominium extends Model
{
    public $timestamps = false;

    protected $table = 'condominiums';

    protected $fillable = ['name', 'slug', 'cnpj', 'address', 'city', 'state', 'plan', 'modules', 'brand_color', 'public_page', 'onboarding_step', 'onboarding_done', 'storage_used_mb', 'storage_limit_mb', 'latitude', 'longitude', 'created_at'];

    protected $casts = [
        'modules' => 'array',
        'public_page' => 'boolean',
        'onboarding_step' => 'integer',
        'onboarding_done' => 'boolean',
        'storage_used_mb' => 'integer',
        'storage_limit_mb' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'created_at' => 'datetime',
    ];
}
