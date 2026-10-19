import {
  CreateChargeInput,
  CreateChargeResult,
  CreateRecipientInput,
  CreateRecipientResult,
  ParsedWebhookEvent,
  PaymentGatewayAdapter,
} from "./types";

export class AsaasGatewayAdapter implements PaymentGatewayAdapter {
  readonly providerName = "asaas" as const;

  private apiKey: string | null;
  private baseUrl: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || null;
    const env = process.env.ASAAS_ENVIRONMENT || "sandbox";
    this.baseUrl =
      env === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/v3";
    this.webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || "zeladoria_asaas_secret_default";
  }

  /**
   * 1. Criar subconta / carteira do prestador no Asaas
   * https://docs.asaas.com/reference/criar-uma-subconta
   */
  async createRecipient(input: CreateRecipientInput): Promise<CreateRecipientResult> {
    if (process.env.NODE_ENV === "production" && !this.apiKey) {
      throw new Error(
        "Credenciais do PSP (ASAAS_API_KEY) ausentes em ambiente de produção. Simulação de gateway proibida em produção."
      );
    }

    if (this.apiKey) {
      try {
        const res = await fetch(`${this.baseUrl}/accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: this.apiKey,
          },
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            cpfCnpj: input.cpfCnpj.replace(/\D/g, ""),
            mobilePhone: input.phone.replace(/\D/g, ""),
            companyType: input.accountType === "company" ? "LIMITED" : "INDIVIDUAL",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("Asaas API subconta warning:", errData);
          if (process.env.NODE_ENV === "production") {
            throw new Error(`Falha ao registrar subconta no PSP Asaas: ${JSON.stringify(errData)}`);
          }
          // Fallback para sandbox simulation se endpoint falhar em ambiente de testes/dev
          return this.simulateRecipient(input);
        }

        const data = await res.json();
        return {
          pspAccountId: data.id || data.walletId,
          pspApiKey: data.apiKey,
          status: "active",
        };
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
        console.warn("Erro ao comunicar com Asaas API, usando simulação sandbox:", err);
        return this.simulateRecipient(input);
      }
    }

    return this.simulateRecipient(input);
  }

  /**
   * 2. Criar cobrança (Pix / Cartão) com Split
   * https://docs.asaas.com/reference/criar-uma-nova-cobranca
   */
  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const value = (input.amountCents / 100).toFixed(2);
    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    if (this.apiKey) {
      try {
        const splitConfig = input.split
          ? [
              {
                walletId: input.split.recipientAccountId,
                fixedValue: Number((input.split.netVendorCents / 100).toFixed(2)),
              },
            ]
          : undefined;

        const payload: Record<string, any> = {
          customer: input.customer.email, // ou customerId cadastrado
          billingType: input.billingType,
          value: Number(value),
          dueDate,
          description: `Zeladoria Pay: ${input.purpose === "vistoria" ? "Vistoria Técnica" : "Serviço Residencial"} - Pedido ${input.orderCode}`,
          externalReference: input.orderCode,
          split: splitConfig,
        };

        const res = await fetch(`${this.baseUrl}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: this.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          // Buscar QR Code Pix se billingType for PIX
          let pixCopiaECola = data.pixCopiaECola;
          let pixQrCode = data.pixQrCode;

          if (input.billingType === "PIX" && data.id) {
            const pixRes = await fetch(`${this.baseUrl}/payments/${data.id}/pixQrCode`, {
              headers: { access_token: this.apiKey },
            });
            if (pixRes.ok) {
              const pixData = await pixRes.json();
              pixCopiaECola = pixData.payload;
              pixQrCode = pixData.encodedImage;
            }
          }

          return {
            pspPaymentId: data.id,
            invoiceUrl: data.invoiceUrl || data.bankSlipUrl,
            pixQrCode,
            pixCopiaECola,
            expiresAt: input.expirationSeconds
              ? new Date(Date.now() + input.expirationSeconds * 1000)
              : undefined,
            status: "pending",
          };
        } else {
          const errData = await res.text();
          console.warn("Erro ao criar cobrança no Asaas:", res.status, errData);
          if (process.env.NODE_ENV === "production") {
            throw new Error(`Asaas PSP retornou erro ${res.status}: ${errData}`);
          }
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === "production") {
          throw err;
        }
        console.warn("Erro ao criar cobrança no Asaas, usando simulação:", err);
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("Chave de API do gateway Asaas (ASAAS_API_KEY) não configurada no ambiente de produção.");
    }

    return this.simulateCharge(input);
  }

  /**
   * 3. Reembolso
   */
  async refundCharge(pspPaymentId: string, amountCents?: number): Promise<{ success: boolean; refundId?: string }> {
    if (this.apiKey && !pspPaymentId.startsWith("pay_sim_")) {
      try {
        const payload: Record<string, any> = {};
        if (amountCents) payload.value = Number((amountCents / 100).toFixed(2));

        const res = await fetch(`${this.baseUrl}/payments/${pspPaymentId}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: this.apiKey,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok && process.env.NODE_ENV === "production") {
          throw new Error(`Falha no reembolso no Asaas: ${JSON.stringify(data)}`);
        }
        return { success: res.ok, refundId: data.id };
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
        // Fallback simulation
      }
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Simulated refund is prohibited in production mode.");
    }

    return { success: true, refundId: `ref_sim_${Date.now()}` };
  }

  /**
   * 4. Liberação do Repasse / Payout condicionado
   */
  async releasePayout(pspPaymentId: string): Promise<{ success: boolean; payoutId?: string }> {
    if (this.apiKey && !pspPaymentId.startsWith("pay_sim_")) {
      try {
        const res = await fetch(`${this.baseUrl}/payments/${pspPaymentId}/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: this.apiKey,
          },
        });
        const data = await res.json().catch(() => ({}));
        return { success: res.ok, payoutId: data.id || `payout_${Date.now()}` };
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
        console.warn("Asaas releasePayout warning:", err);
      }
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Simulated payout is prohibited in production mode.");
    }

    return { success: true, payoutId: `payout_sim_${Date.now()}` };
  }

  /**
   * 5. Validação de assinatura do Webhook
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    const token =
      headers["asaas-access-token"] ||
      headers["x-asaas-access-token"] ||
      headers["authorization"] ||
      headers["x-webhook-token"];

    if (!token) {
      if (process.env.NODE_ENV === "production") return false;
      return true;
    }

    if (process.env.NODE_ENV === "production") {
      if (!process.env.ASAAS_WEBHOOK_SECRET) {
        console.error("Segurança: ASAAS_WEBHOOK_SECRET não configurado em ambiente de produção!");
        return false;
      }
      return token === this.webhookSecret;
    }

    return token === this.webhookSecret || token.includes("zeladoria");
  }

  /**
   * 6. Parse do evento do Webhook do Asaas
   */
  parseWebhookEvent(rawBody: string): ParsedWebhookEvent {
    const parsed = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    const eventName = (parsed.event || "").toUpperCase();

    let eventType: ParsedWebhookEvent["eventType"] = "OTHER";

    if (eventName === "PAYMENT_CONFIRMED" || eventName === "PAYMENT_RECEIVED") {
      eventType = "PAYMENT_CONFIRMED";
    } else if (eventName === "PAYMENT_REFUNDED") {
      eventType = "PAYMENT_REFUNDED";
    } else if (eventName === "PAYMENT_SPLIT_PAID" || eventName === "SPLIT_PAID") {
      eventType = "SPLIT_PAID";
    }

    const pspPaymentId = parsed.payment?.id || parsed.paymentId || parsed.id || "";
    const amountVal = parsed.payment?.value || parsed.value || 0;

    return {
      eventId: parsed.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      eventType,
      pspPaymentId,
      amountCents: Math.round(Number(amountVal) * 100),
      rawPayload: parsed,
    };
  }

  // --- MÉTODOS AUXILIARES DE SIMULAÇÃO (SANDBOX FIRST) ---

  private simulateRecipient(input: CreateRecipientInput): CreateRecipientResult {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Simulated recipient is prohibited in production mode.");
    }

    const slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      pspAccountId: `cacc_asaas_vendor_${input.vendorId}_${slug.slice(0, 8)}`,
      pspApiKey: `sub_key_${Date.now()}`,
      status: "active",
    };
  }

  private simulateCharge(input: CreateChargeInput): CreateChargeResult {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Simulated charge is prohibited in production mode.");
    }

    const paymentId = `pay_sim_${input.orderCode.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    const value = (input.amountCents / 100).toFixed(2);

    // Mock Pix Copia e Cola padronizado BR Code
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0136zeladoria-pay-order-${input.orderCode}520400005303986540${value.length < 5 ? `0${value}` : value}5802BR5920ZELADORIA SERVICOS6009SAO PAULO62070503***6304ABCD`;

    return {
      pspPaymentId: paymentId,
      invoiceUrl: `https://sandbox.asaas.com/i/${paymentId}`,
      pixCopiaECola,
      // Data URL de imagem SVG para renderizar o QR code na tela mesmo sem internet externa
      pixQrCode: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%230F172A"><rect width="100" height="100" fill="%23FFFFFF"/><rect x="10" y="10" width="25" height="25" fill="%230055D4"/><rect x="65" y="10" width="25" height="25" fill="%230055D4"/><rect x="10" y="65" width="25" height="25" fill="%230055D4"/><rect x="15" y="15" width="15" height="15" fill="%23FFFFFF"/><rect x="70" y="15" width="15" height="15" fill="%23FFFFFF"/><rect x="15" y="70" width="15" height="15" fill="%23FFFFFF"/><rect x="42" y="42" width="16" height="16" fill="%230055D4"/><text x="50" y="94" font-size="6" text-anchor="middle" font-family="sans-serif" fill="%2364748B">R$ ${value}</text></svg>`,
      expiresAt: input.expirationSeconds
        ? new Date(Date.now() + input.expirationSeconds * 1000)
        : undefined,
      status: "pending",
    };
  }
}
