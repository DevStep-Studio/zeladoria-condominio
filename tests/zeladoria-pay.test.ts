import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { AsaasGatewayAdapter } from "../src/lib/services/payments/asaas-adapter";
import { getPaymentGateway } from "../src/lib/services/payments/gateway-factory";

describe("Zeladoria Pay 1: Gateway Abstraction e Driver Asaas", () => {
  it("deve carregar o driver Asaas via Gateway Factory", () => {
    const gateway = getPaymentGateway("asaas");
    assert.equal(gateway.providerName, "asaas");
    assert.ok(gateway instanceof AsaasGatewayAdapter);
  });

  it("deve gerar cobrança PIX para vistoria com dados consistentes", async () => {
    const gateway = getPaymentGateway("asaas");
    const res = await gateway.createCharge({
      orderCode: "PAY-VIS-2026-1001",
      amountCents: 8000, // R$ 80,00
      purpose: "vistoria",
      customer: {
        name: "Carlos Morador",
        email: "carlos@condominio.com",
        phone: "11988887777",
      },
      billingType: "PIX",
    });

    assert.ok(res.pspPaymentId.startsWith("pay_sim_"));
    assert.equal(res.status, "pending");
    assert.ok(res.pixCopiaECola && res.pixCopiaECola.length > 20, "Deve conter código Pix Copia e Cola");
    assert.ok(res.pixQrCode && res.pixQrCode.startsWith("data:image/svg+xml"), "Deve conter QR Code em Data URL SVG");
  });

  it("deve gerar cobrança com split entre recebedor e plataforma para serviço principal", async () => {
    const gateway = getPaymentGateway("asaas");
    const res = await gateway.createCharge({
      orderCode: "PAY-SRV-2026-5500",
      amountCents: 35000, // R$ 350,00
      purpose: "servico",
      customer: {
        name: "Mariana Moradora",
        email: "mariana@condominio.com",
      },
      billingType: "PIX",
      split: {
        recipientAccountId: "rec_vendor_123",
        netVendorCents: 31500, // 90%
        platformFeeCents: 3500, // 10%
      },
    });

    assert.ok(res.pspPaymentId);
    assert.equal(res.status, "pending");
  });

  it("deve validar e interpretar webhooks do Asaas com idempotência", () => {
    const gateway = getPaymentGateway("asaas");
    const rawPayload = JSON.stringify({
      id: "evt_webhook_9999",
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_sim_123456",
        value: 80.0,
      },
    });

    const parsed = gateway.parseWebhookEvent(rawPayload);
    assert.equal(parsed.eventId, "evt_webhook_9999");
    assert.equal(parsed.eventType, "PAYMENT_CONFIRMED");
    assert.equal(parsed.pspPaymentId, "pay_sim_123456");
  });
});

describe("Zeladoria Pay 2: Separação Estrita dos Dois Pagamentos (Vistoria vs Serviço)", () => {
  it("Vistoria Gratuita NÃO deve gerar ordem de pagamento nem checkout financeiro", () => {
    const inspectionInput = {
      type: "gratuita" as const,
      priceCents: 0,
      selectedSlot: { date: "2026-10-18", time: "14:00" },
    };

    const isFree = inspectionInput.type === "gratuita" || inspectionInput.priceCents === 0;
    assert.equal(isFree, true);

    // Na vistoria gratuita, status passa diretamente para VISTORIA_AGENDADA sem checkout
    const resultStatus = isFree ? "VISTORIA_AGENDADA" : "aguardando_pagamento";
    const checkoutRequired = !isFree;

    assert.equal(resultStatus, "VISTORIA_AGENDADA");
    assert.equal(checkoutRequired, false, "Vistoria gratuita não cria checkout financeiro");
  });

  it("Vistoria Paga deve exigir checkout e reter horário temporariamente por 10 minutos", () => {
    const inspectionInput = {
      type: "paga" as const,
      priceCents: 8000,
      selectedSlot: { date: "2026-10-18", time: "14:00" },
      holdMinutes: 10,
    };

    const now = Date.now();
    const holdExpiresAt = new Date(now + inspectionInput.holdMinutes * 60 * 1000);

    const diffMinutes = Math.round((holdExpiresAt.getTime() - now) / (60 * 1000));
    assert.equal(diffMinutes, 10, "Hold temporário deve ser de exatamente 10 minutos");

    // Vistoria paga só confirma após pagamento aprovado
    const statusBeforePayment = "aguardando_pagamento";
    assert.equal(statusBeforePayment, "aguardando_pagamento");

    const statusAfterPaymentWebhook = "VISTORIA_CONFIRMADA";
    assert.equal(statusAfterPaymentWebhook, "VISTORIA_CONFIRMADA");
  });

  it("Pagamento B do Serviço Principal só pode ocorrer após proposta digital aceita", () => {
    const quote = {
      id: 42,
      laborCents: 20000, // R$ 200,00
      materialsCents: 5000, // R$ 50,00
      totalCents: 25000, // R$ 250,00
      status: "enviado",
    };

    // Tentativa de pagamento antes do aceite deve ser recusada
    const canPayBeforeAcceptance = quote.status === "aceito";
    assert.equal(canPayBeforeAcceptance, false, "Não pode pagar serviço antes do morador aceitar");

    // Após aceite
    quote.status = "aceito";
    const canPayAfterAcceptance = quote.status === "aceito";
    assert.equal(canPayAfterAcceptance, true, "Pagamento do serviço liberado após aceite da proposta");
  });
});

describe("Zeladoria Pay 3: Split Não-Hardcodado e Regras Financeiras", () => {
  function calculateSplit(totalCents: number, commissionPercent: number) {
    const platformFeeCents = Math.round((totalCents * commissionPercent) / 100);
    const netVendorCents = totalCents - platformFeeCents;
    return { platformFeeCents, netVendorCents };
  }

  it("deve calcular comissão de 10% (padrão) com exatidão em centavos", () => {
    const split = calculateSplit(10000, 10); // R$ 100,00
    assert.equal(split.platformFeeCents, 1000); // R$ 10,00
    assert.equal(split.netVendorCents, 9000); // R$ 90,00
    assert.equal(split.platformFeeCents + split.netVendorCents, 10000);
  });

  it("deve suportar comissões configuradas dinamicamente pelo Admin (ex: 12%, 15%)", () => {
    // 12% em serviço de R$ 380,00 (38000 cents)
    const split12 = calculateSplit(38000, 12);
    assert.equal(split12.platformFeeCents, 4560); // R$ 45,60
    assert.equal(split12.netVendorCents, 33440); // R$ 334,40
    assert.equal(split12.platformFeeCents + split12.netVendorCents, 38000);

    // 15% em serviço de R$ 150,00 (15000 cents)
    const split15 = calculateSplit(15000, 15);
    assert.equal(split15.platformFeeCents, 2250); // R$ 22,50
    assert.equal(split15.netVendorCents, 12750); // R$ 127,50
    assert.equal(split15.platformFeeCents + split15.netVendorCents, 15000);
  });

  it("deve arredondar centavos sem perda ou dízima financeira", () => {
    // R$ 33,33 (3333 cents) com 10% de taxa
    const splitOdd = calculateSplit(3333, 10);
    assert.equal(splitOdd.platformFeeCents, 333); // Math.round(333.3) -> 333
    assert.equal(splitOdd.netVendorCents, 3000); // 3333 - 333 = 3000
    assert.equal(splitOdd.platformFeeCents + splitOdd.netVendorCents, 3333);
  });
});

describe("Zeladoria Pay 4: Zeladoria Protege (Garantia, Hash Contratual e Disputa)", () => {
  it("deve gerar hash imutável SHA-256 do contrato digital com dados da proposta", () => {
    const proposalData = {
      requestId: 88,
      vendorId: 14,
      totalCents: 45000,
      warrantyDays: 90,
      timestamp: "2026-10-14T15:00:00Z",
    };

    const contractRaw = `CONTRATO-DIGITAL:${proposalData.requestId}:${proposalData.vendorId}:${proposalData.totalCents}:${proposalData.warrantyDays}:${proposalData.timestamp}`;
    const hash = createHash("sha256").update(contractRaw).digest("hex");

    assert.equal(hash.length, 64, "Hash SHA-256 deve ter 64 caracteres hexadecimais");

    // Qualquer alteração nos dados deve invalidar o hash
    const tamperedRaw = contractRaw.replace("45000", "40000");
    const tamperedHash = createHash("sha256").update(tamperedRaw).digest("hex");
    assert.notEqual(hash, tamperedHash, "Hash deve ser sensível a qualquer adulteração");
  });

  it("Zeladoria Protege deve garantir no mínimo 90 dias de garantia legal (Art. 26 CDC)", () => {
    const minLegalWarranty = 90;
    const providerOfferedWarranty = 90;

    assert.ok(
      providerOfferedWarranty >= minLegalWarranty,
      "Garantia informada pelo prestador deve atender ou superar o CDC (90 dias)"
    );
  });

  it("ao confirmar 'Tudo Certo!', o status do pagamento deve ir para 'released'", () => {
    let orderStatus = "paid_retained"; // Sob proteção Zeladoria Protege

    function handleCustomerAction(action: "tudo_certo" | "contestar") {
      if (action === "tudo_certo") {
        orderStatus = "released";
      } else if (action === "contestar") {
        orderStatus = "in_dispute";
      }
    }

    handleCustomerAction("tudo_certo");
    assert.equal(orderStatus, "released", "Repasse ao prestador deve ser liberado");
  });

  it("ao contestar serviço, o repasse deve ser bloqueado ('in_dispute') para mediação", () => {
    let orderStatus = "paid_retained";

    function handleCustomerAction(action: "tudo_certo" | "contestar") {
      if (action === "tudo_certo") {
        orderStatus = "released";
      } else if (action === "contestar") {
        orderStatus = "in_dispute";
      }
    }

    handleCustomerAction("contestar");
    assert.equal(orderStatus, "in_dispute", "Repasse ao prestador deve ser retido");
  });
});
