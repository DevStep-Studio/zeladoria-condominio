# Camada de Pagamentos — Zeladoria Pay

## 1. Gateway Abstraction (`PaymentGateway`)

A interface agnóstica de gateway está definida em `src/lib/services/payments/payment-gateway.ts`:

```typescript
export interface PaymentGateway {
  readonly providerName: string;
  createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse>;
  parseWebhookEvent(rawPayload: string | Record<string, any>, signature?: string): WebhookEventPayload;
  refundCharge?(pspPaymentId: string, amountCents?: number): Promise<{ success: boolean; pspRefundId?: string }>;
  releasePayout?(options: ReleasePayoutOptions): Promise<{ success: boolean; pspTransferId?: string; status: string }>;
}
```

## 2. Driver Asaas (`AsaasGatewayAdapter`)

Implementado em `src/lib/services/payments/asaas-adapter.ts`.
- **Produção**: Requer `ASAAS_API_KEY`. Caso ausente em `NODE_ENV === "production"`, lança exceção imediata bloqueando operações inseguras.
- **Desenvolvimento / Sandbox**: Se sem credenciais em ambiente local de desenvolvimento, utiliza gerador determinístico de Pix Copia e Cola e QR Code SVG com IDs prefixados por `pay_sim_` para testes de fluxo.

## 3. Modelo de Dados (`paymentOrders`)

Cada transação financeira gera uma linha na tabela `paymentOrders`:

- `id`: Chave primária sequencial
- `code`: Código amigável (ex: `PAY-VIS-2026-XXXX`, `PAY-SRV-2026-YYYY`, `PAY-ADD-2026-ZZZZ`)
- `requestId`: ID da solicitação de serviço associada
- `contractId`: ID do contrato digital (quando aplicável)
- `vendorId`: ID do prestador recebedor
- `customerId`: ID do morador pagador
- `purpose`: `"vistoria"` ou `"servico"`
- `amountGrossCents`: Valor total pago pelo morador
- `platformFeeCents`: Valor retido pela plataforma (comissão)
- `netVendorCents`: Valor líquido a ser repassado ao prestador
- `status`: `"pending"`, `"paid"`, `"failed"`, `"refunded"`, `"in_dispute"`
- `pspPaymentId`: Identificador da transação no provedor financeiro (ex: Asaas)
- `pixQrCode`: Data URI do SVG para leitura do QR Code
- `pixCopiaECola`: String alfanumérica Pix para copiar e colar
- `paidAt`: Timestamp de confirmação do pagamento
- `failedAt`: Timestamp de falha ou cancelamento

## 4. Política Anti-Fraude e Anti-Simulação
1. **Regra de Produção**: Nenhuma transação pode ser aprovada por requisição manual ou payload do frontend. Apenas webhooks validados ou consultas diretas à API do PSP atualizam `status = "paid"`.
2. **Separação de Ordens**: Uma vistoria técnica e um serviço principal têm identificadores e ordens distintas, garantindo conciliação contábil 1:1.
