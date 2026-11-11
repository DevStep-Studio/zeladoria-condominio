<?php

use App\Services\PasswordService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $email = 'testegabriel@gmail.com';
        $user = DB::table('users')->where('email', $email)->first();

        if ($user) {
            DB::table('users')->where('id', $user->id)->update([
                'is_super_admin' => 1,
                'status' => 'ativo',
            ]);
        } else {
            DB::table('users')->insert([
                'name' => 'Gabriel (Superadmin)',
                'email' => $email,
                'password_hash' => app(PasswordService::class)->hash('demo1234'),
                'is_super_admin' => 1,
                'status' => 'ativo',
                'theme' => 'light',
                'created_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Preserva o acesso para evitar bloqueio acidental
    }
};

