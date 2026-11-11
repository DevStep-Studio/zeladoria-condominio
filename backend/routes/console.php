<?php

use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:superadmin {email=testegabriel@gmail.com}', function (string $email) {
    $email = mb_strtolower(trim($email));
    $user = User::where('email', $email)->first();

    if (! $user) {
        $id = DB::table('users')->insertGetId([
            'name' => 'Gabriel (Superadmin)',
            'email' => $email,
            'password_hash' => app(PasswordService::class)->hash('demo1234'),
            'is_super_admin' => 1,
            'status' => 'ativo',
            'theme' => 'light',
            'created_at' => now(),
        ]);
        $this->info("Usuário {$email} criado com sucesso (ID: {$id}) e promovido a superadmin com senha padrão 'demo1234'.");

        return 0;
    }

    DB::table('users')->where('id', $user->id)->update([
        'is_super_admin' => 1,
        'status' => 'ativo',
    ]);
    $this->info("Usuário {$email} (ID: {$user->id}) atualizado para superadmin com sucesso!");

    return 0;
})->purpose('Promove ou cria um usuário como superadmin da plataforma');


