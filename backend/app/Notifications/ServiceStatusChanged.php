<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ServiceStatusChanged extends Notification
{
    public function __construct(
        public readonly string $code,
        public readonly string $title,
        public readonly string $status,
        public readonly bool $forProvider,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $labels = [
            'aceito' => 'Atendimento aceito', 'a_caminho' => 'Prestador a caminho',
            'chegou' => 'Prestador chegou ao local', 'em_atendimento' => 'Serviço em execução',
            'prestador_concluiu' => 'Prestador concluiu: aguardando confirmação do morador',
            'concluido' => 'Serviço concluído e confirmado', 'cancelado' => 'Atendimento cancelado',
            'correcao_solicitada' => 'Correção solicitada pelo morador', 'em_disputa' => 'Disputa aberta no atendimento',
            'proposta_enviada' => 'Novo orçamento enviado', 'orcamento_aprovado' => 'Orçamento aprovado',
            'vistoria_proposta' => 'Vistoria proposta', 'vistoria_agendada' => 'Vistoria agendada',
            'vistoria_realizada' => 'Vistoria realizada', 'diagnostico_registrado' => 'Diagnóstico registrado',
            'visit_offered' => 'Vistoria proposta', 'visit_scheduled' => 'Vistoria agendada',
            'visit_payment_pending' => 'Pagamento da vistoria pendente', 'visit_paid' => 'Pagamento da vistoria confirmado',
            'quote_sent' => 'Novo orçamento enviado', 'quote_accepted' => 'Orçamento aprovado',
            'payment_pending' => 'Pagamento pendente', 'paid_protected' => 'Pagamento protegido confirmado',
            'service_scheduled' => 'Serviço agendado', 'provider_on_the_way' => 'Prestador a caminho',
            'provider_arrived' => 'Prestador chegou ao local', 'in_progress' => 'Serviço em execução',
            'provider_completed' => 'Prestador concluiu: aguardando confirmação do morador',
            'customer_confirmed' => 'Conclusão confirmada pelo morador', 'completed' => 'Serviço concluído e confirmado',
            'aguardando_pagamento' => 'Pagamento pendente', 'aguardando_pagamento_servico' => 'Pagamento do serviço pendente',
            'aguardando_pagamento_vistoria' => 'Pagamento da vistoria pendente', 'servico_pago_liberado' => 'Pagamento do serviço confirmado',
            'vistoria_confirmada' => 'Vistoria confirmada', 'em_deslocamento' => 'Prestador a caminho',
            'disputed' => 'Disputa aberta no atendimento', 'in_dispute' => 'Disputa aberta no atendimento',
            'reembolsado' => 'Reembolso registrado', 'refunded' => 'Reembolso registrado',
            'canceled' => 'Atendimento cancelado', 'cancelled' => 'Atendimento cancelado',
        ];
        $label = $labels[strtolower($this->status)] ?? 'Seu atendimento foi atualizado. Confira os detalhes no painel';
        $path = $this->forProvider ? '/prestador/chamados' : '/painel/servicos?tab=minhascontratacoes';
        $mail = (new MailMessage)->subject($label.' — '.$this->code)
            ->greeting('Olá!')->line($label.'.')
            ->line('Protocolo: '.$this->code)->line('Serviço: '.$this->title);
        if (in_array(strtolower($this->status), ['prestador_concluiu', 'provider_completed'], true)) {
            $mail->line('A execução foi informada como finalizada pelo profissional. O morador ainda precisa conferir o serviço e confirmar a conclusão no painel.');
        }

        return $mail->action('Acompanhar atendimento', rtrim(config('services.frontend.url'), '/').$path)
            ->salutation('Equipe Zeladoria Condomínio');
    }
}
