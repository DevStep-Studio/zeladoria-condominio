# Webhooks e Idempotência — Zeladoria Pay

## 1. Rota de Recepção de Webhooks

A rota `/api/webhooks/payments/[gateway]` recebe os eventos disparados pelos provedores financeiros:

```
POST /api/webhooks/payments/asaas
Content-Type: application/json
asaas-access-token: <ACCESS_TOKEN>
```

## 2. Idempotência Rigorosa (Cláusula 32)

Eventos enviados repetidamente pelo PSP (devido a retries de rede ou delays) são processados com idempotência estrita via tabela de controle de auditoria e status de ordens:

```typescript
// Se o mesmo eventId já foi processado anteriormente:
if (alreadyProcessed(eventId)) {
  return Response.json({ success: true, duplicate: true, received: true });
}
```

### Garantia de Não-Duplicação
Mesmo que o mesmo evento `PAYMENT_CONFIRMED` seja recebido 3 ou mais vezes:
- A ordem de pagamento é atualizada apenas 1 vez para `status = "paid"`.
- A comissão da Zeladoria é lançada apenas 1 vez no ledger.
- O repasse (`payout`) do prestador é computado apenas 1 vez.
- As notificações de confirmação para morador e prestador são enviadas apenas 1 vez.

## 3. Mapeamento de Eventos Suportados

| Evento do PSP (Asaas) | Evento Canônico Zeladoria Pay | Ação no Sistema |
|---|---|---|
| `PAYMENT_CONFIRMED` | `PAYMENT_APPROVED` | Atualiza `paymentOrders.status = "paid"` e transiciona serviço |
| `PAYMENT_RECEIVED` | `PAYMENT_APPROVED` | Conciliação financeira e compensação de saldo |
| `PAYMENT_OVERDUE` | `PAYMENT_FAILED` | Notifica morador para nova tentativa de pagamento |
| `PAYMENT_REFUNDED` | `PAYMENT_REFUNDED` | Registra estorno no ledger e cancela agendamento se pendente |
| `TRANSFER_COMPLETED` | `PAYOUT_PAID` | Atualiza `payouts.status = "released"` |
| `TRANSFER_FAILED` | `PAYOUT_FAILED` | Notifica administração para verificação de dados bancários |
