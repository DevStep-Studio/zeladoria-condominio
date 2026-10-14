/**
 * Types & Contracts for Zeladoria Pay Gateway Abstraction
 * Permite suporte a Asaas, Pagar.me e Mercado Pago sob a mesma interface
 */

export type GatewayProvider = "asaas" | "pagarme" | "mercadopago";

export type PaymentPurpose = "vistoria" | "servico";

export type PaymentOrderStatus =
  | "pending" // Cobrança emitida aguardando pagamento do morador
  | "paid" // Pagamento recebido/confirmado pelo PSP
  | "retained" // Valor retido no PSP com repasse condicionado (Zeladoria Protege)
  | "released" // Repasse ao prestador efetuado no split
  | "in_dispute" // Morador abriu contestação; repasse em hold de mediação
  | "refunded" // Estornado de volta ao morador
  | "cancelled"; // Expirado ou cancelado

export interface SplitRule {
  recipientAccountId: string; // Subconta / WalletId no PSP
  netVendorCents: number; // Valor líquido que vai para o prestador
  platformFeeCents: number; // Valor de comissão que vai para a Zeladoria
}

export interface CreateRecipientInput {
  vendorId: number;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  accountType?: "individual" | "company";
  pixKey?: string;
}

export interface CreateRecipientResult {
  pspAccountId: string; // Ex: cacc_12345 (walletId Asaas)
  pspApiKey?: string;
  status: "active" | "pending_kyc" | "suspended";
}

export interface CreateChargeInput {
  orderCode: string; // Ex: PAY-VIS-2026-0001 ou PAY-SRV-2026-0001
  amountCents: number;
  purpose: PaymentPurpose;
  customer: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
  };
  billingType: "PIX" | "CREDIT_CARD";
  expirationSeconds?: number; // Para reserva de horário (ex: 600s = 10 min)
  split?: SplitRule;
}

export interface CreateChargeResult {
  pspPaymentId: string; // ID da cobrança no PSP
  invoiceUrl?: string; // URL da fatura/checkout
  pixQrCode?: string; // QR Code Base64 / SVG para exibição na tela
  pixCopiaECola?: string; // Código Pix copia e cola
  expiresAt?: Date;
  status?: PaymentOrderStatus;
}

export interface ParsedWebhookEvent {
  eventId: string;
  eventType: "PAYMENT_CONFIRMED" | "PAYMENT_RECEIVED" | "PAYMENT_REFUNDED" | "SPLIT_PAID" | "OTHER";
  pspPaymentId: string;
  amountCents?: number;
  rawPayload: any;
}

export interface PaymentGatewayAdapter {
  readonly providerName: GatewayProvider;

  /**
   * Registra uma subconta/carteira de recebedor para o prestador
   */
  createRecipient(input: CreateRecipientInput): Promise<CreateRecipientResult>;

  /**
   * Cria uma cobrança com Pix / Cartão e split configurado
   */
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;

  /**
   * Libera o repasse da subconta/split quando condicionado
   */
  releasePayout?(pspPaymentId: string): Promise<{ success: boolean; payoutId?: string }>;

  /**
   * Reembolsa ou estorna o pagamento de volta ao cliente
   */
  refundCharge(pspPaymentId: string, amountCents?: number): Promise<{ success: boolean; refundId?: string }>;

  /**
   * Valida a assinatura de autenticidade do webhook
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean;

  /**
   * Normaliza o payload do webhook do PSP em um evento canônico
   */
  parseWebhookEvent(rawBody: string): ParsedWebhookEvent;
}
