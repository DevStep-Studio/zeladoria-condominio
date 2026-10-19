<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

final class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    public $timestamps = false;

    protected $table = 'users';

    protected $guarded = ['id', 'is_super_admin'];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'emergency_contacts' => 'array',
        'dependents' => 'array',
        'vehicles' => 'array',
        'notification_preferences' => 'array',
        'two_factor_enabled' => 'boolean',
        'is_super_admin' => 'boolean',
        'first_access_at' => 'datetime',
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }
}
