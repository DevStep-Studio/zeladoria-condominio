<?php

namespace App\Notifications;

use Carbon\CarbonImmutable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ServiceRequested extends Notification
{
    public function __construct(
        public readonly string $code,
        public readonly string $title,
        public readonly string $description,
        public readonly string $condoName,
        public readonly string $customerName,
        public readonly ?string $providerName,
        public readonly ?string $scheduledDate,
        public readonly ?string $scheduledTime,
        public readonly bool $forProvider,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $path = $this->forProvider ? '/prestador/chamados' : '/painel/servicos?tab=minhascontratacoes';
        $mail = (new MailMessage)
            ->subject(($this->forProvider ? 'Nova solicitação de serviço: ' : 'Solicitação registrada: ').$this->code)
            ->greeting('Olá!')
            ->line($this->forProvider ? $this->customerName.' solicitou um atendimento com você.' : 'Sua solicitação de atendimento foi registrada com sucesso.')
            ->line('Protocolo: '.$this->code)
            ->line('Serviço: '.$this->title)
            ->line('Descrição: '.$this->description)
            ->line('Condomínio: '.$this->condoName);
        if ($this->providerName) {
            $mail->line('Prestador: '.$this->providerName);
        }
        if ($this->scheduledDate) {
            $mail->line('Data solicitada: '.CarbonImmutable::parse($this->scheduledDate)->format('d/m/Y').($this->scheduledTime ? ' — '.$this->scheduledTime : ''));
        }

        return $mail->line('A solicitação está aguardando atendimento ou orçamento; acompanhe as próximas atualizações no painel.')
            ->action('Acompanhar solicitação', rtrim(config('services.frontend.url'), '/').$path)
            ->salutation('Equipe Zeladoria Condomínio');
    }
}
