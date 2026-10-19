<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::toMailUsing(function (object $user, string $token): MailMessage {
            $url = rtrim(config('services.frontend.url'), '/').'/redefinir-senha?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()]);

            return (new MailMessage)
                ->subject('Redefinição de senha — Zeladoria Condomínio')
                ->greeting('Olá, '.$user->name.'!')
                ->line('Recebemos uma solicitação para redefinir sua senha.')
                ->action('Redefinir minha senha', $url)
                ->line('Este link é de uso único e expira em 60 minutos.')
                ->line('Se você não solicitou a alteração, ignore esta mensagem.');
        });
    }
}
