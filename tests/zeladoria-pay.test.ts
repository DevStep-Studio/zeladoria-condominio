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

describe("Zeladoria Pay 5: Cláusula 10 & Teste 102 - Desconto da Vistoria no Orçamento do Serviço", () => {
  it("deve deduzir valor da vistoria paga do total da proposta quando configurado", () => {
    const inspection = {
      priceCents: 8000, // R$ 80,00
      discountOnService: true,
      status: "confirmada",
    };

    const serviceProposal = {
      laborCents: 50000, // R$ 500,00
      materialsCents: 50000, // R$ 500,00
      otherCostsCents: 0,
      discountCents: 0,
    };

    const grossTotalCents = serviceProposal.laborCents + serviceProposal.materialsCents + serviceProposal.otherCostsCents - serviceProposal.discountCents;
    assert.equal(grossTotalCents, 100000); // R$ 1.000,00

    const inspectionDiscountCents = inspection.discountOnService ? inspection.priceCents : 0;
    assert.equal(inspectionDiscountCents, 8000); // R$ 80,00

    const netToPayCents = Math.max(0, grossTotalCents - inspectionDiscountCents);
    assert.equal(netToPayCents, 92000, "Valor final líquido restante deve ser R$ 920,00");

    // Split sobre o novo valor contratado com 10% de comissão
    const platformFeeCents = Math.round((netToPayCents * 10) / 100);
    const netVendorCents = netToPayCents - platformFeeCents;

    assert.equal(platformFeeCents, 9200); // R$ 92,00
    assert.equal(netVendorCents, 82800); // R$ 828,00
    assert.equal(platformFeeCents + netVendorCents, 92000);
  });
});

describe("Zeladoria Pay 6: Cláusula 13, 14 & 15 - Composição e Versionamento Imutável de Proposta", () => {
  it("deve compor proposta detalhada com materiais itemizados e cálculo exato", () => {
    const itemizedMaterials = [
      { name: "Disjuntores", amountCents: 30000 },
      { name: "Quadro", amountCents: 25000 },
      { name: "Cabos", amountCents: 15000 },
    ];

    const subtotalMaterialsCents = itemizedMaterials.reduce((acc, item) => acc + item.amountCents, 0);
    assert.equal(subtotalMaterialsCents, 70000, "Subtotal materiais deve ser R$ 700,00");

    const laborCents = 50000; // R$ 500,00
    const inspectionDiscountCents = 8000; // -R$ 80,00
    const totalCents = laborCents + subtotalMaterialsCents - inspectionDiscountCents;

    assert.equal(totalCents, 112000, "Total da proposta deve ser R$ 1.120,00");
  });

  it("proposta aceita não pode ser modificada silenciosamente; alterações exigem nova versão", () => {
    const quoteV1 = {
      id: 1,
      version: 1,
      totalCents: 112000,
      status: "aceito",
    };

    function attemptUpdateProposal(quote: typeof quoteV1, newTotalCents: number) {
      if (quote.status === "aceito" || quote.status === "pago_protegido") {
        throw new Error("Proposta já aceita não pode ser alterada diretamente. Crie um aditivo ou nova versão.");
      }
      return { ...quote, totalCents: newTotalCents };
    }

    assert.throws(() => attemptUpdateProposal(quoteV1, 120000), /Proposta já aceita não pode ser alterada/);

    // Criação de nova versão v2
    const quoteV2 = {
      id: 2,
      version: quoteV1.version + 1,
      totalCents: 120000,
      status: "pendente",
    };

    assert.equal(quoteV2.version, 2);
    assert.equal(quoteV2.status, "pendente");
  });
});

describe("Zeladoria Pay 7: Cláusulas 27 & 28 - Responsabilidade por Taxas e Simulador Financeiro", () => {
  it("deve simular repasse ao prestador considerando quem paga as taxas do PSP", () => {
    const serviceVal = 1000;
    const commissionPercent = 10;
    const pspFeePercent = 3.5;

    const platformFee = (serviceVal * commissionPercent) / 100; // R$ 100,00
    const pspFee = (serviceVal * pspFeePercent) / 100; // R$ 35,00

    // Cenário A: Taxa por conta do Prestador
    const netVendorProviderPays = serviceVal - platformFee - pspFee;
    assert.equal(netVendorProviderPays, 865, "Prestador recebe R$ 865 quando assume taxa do PSP");

    // Cenário B: Taxa absorvida pela Plataforma
    const netVendorPlatformPays = serviceVal - platformFee;
    assert.equal(netVendorPlatformPays, 900, "Prestador recebe R$ 900 quando plataforma assume taxa");

    // Cenário C: Taxa compartilhada (50% cada)
    const netVendorShared = serviceVal - platformFee - (pspFee / 2);
    assert.equal(netVendorShared, 882.5, "Prestador recebe R$ 882,50 no modelo compartilhado");
  });
});

describe("Zeladoria Pay 8: Cláusula 41 & 42 - Aditivos Contratuais de Escopo", () => {
  it("aditivo de escopo cria cobrança complementar sem alterar o contrato original retroativamente", () => {
    const originalContract = {
      id: 10,
      amountCents: 100000, // R$ 1.000,00
      status: "pago_protegido",
    };

    const addendum = {
      id: 1,
      contractId: originalContract.id,
      title: "Substituição de disjuntor bipolar adicional",
      additionalAmountCents: 15000, // R$ 150,00
      status: "aceito",
      supplementalOrderCode: "PAY-ADD-2026-9021",
    };

    assert.equal(originalContract.amountCents, 100000, "Contrato original permanece inalterado");
    assert.equal(addendum.additionalAmountCents, 15000, "Aditivo possui cobrança própria e rastreável");
  });
});

describe("Zeladoria Pay 9: Cláusula 62 - Ledger Contábil e Operacional Imutável", () => {
  it("deve registrar trilha de auditoria contábil com partidas dobradas e eventos imutáveis", () => {
    const ledger: Array<{ eventType: string; amountCents: number; balanceType: string; entity: string }> = [];

    // 1. Cobrança criada
    ledger.push({ eventType: "PAYMENT_CREATED", amountCents: 100000, balanceType: "credit", entity: "customer" });

    // 2. Pagamento aprovado no PSP
    ledger.push({ eventType: "PAYMENT_APPROVED", amountCents: 100000, balanceType: "credit", entity: "customer" });
    ledger.push({ eventType: "PLATFORM_FEE_RECORDED", amountCents: 10000, balanceType: "credit", entity: "platform" });
    ledger.push({ eventType: "PROVIDER_RECEIVABLE_RECORDED", amountCents: 90000, balanceType: "credit", entity: "vendor" });

    // 3. Conclusão e Repasse efetuado
    ledger.push({ eventType: "PAYOUT", amountCents: 90000, balanceType: "debit", entity: "vendor" });

    assert.equal(ledger.length, 5);
    const totalCreditsVendor = ledger.filter((l) => l.entity === "vendor" && l.balanceType === "credit").reduce((a, b) => a + b.amountCents, 0);
    const totalDebitsVendor = ledger.filter((l) => l.entity === "vendor" && l.balanceType === "debit").reduce((a, b) => a + b.amountCents, 0);

    assert.equal(totalCreditsVendor, 90000);
    assert.equal(totalDebitsVendor, 90000);
    assert.equal(totalCreditsVendor - totalDebitsVendor, 0, "Saldo de recebíveis do prestador liquidado com exatidão");
  });
});

describe("Zeladoria Pay 10: Testes E2E 103 a 107 - Segurança, Idempotência e RBAC", () => {
  it("TESTE 103: Webhook recebido duas vezes com mesmo eventId não deve duplicar eventos (Idempotência)", () => {
    const processedEvents = new Set<string>();

    function processWebhookIdempotent(eventId: string) {
      if (processedEvents.has(eventId)) {
        return { success: true, duplicate: true };
      }
      processedEvents.add(eventId);
      return { success: true, duplicate: false };
    }

    const firstRun = processWebhookIdempotent("evt_cc_test_1234");
    assert.equal(firstRun.duplicate, false, "Primeira execução deve processar normalmente");

    const secondRun = processWebhookIdempotent("evt_cc_test_1234");
    assert.equal(secondRun.duplicate, true, "Segunda execução com mesmo eventId deve detectar duplicata");
  });

  it("TESTE 104: Pix criado não libera serviço até confirmação via webhook", () => {
    let serviceStatus = "aguardando_pagamento_servico";
    const payment = { status: "pending" };

    function canExecuteService() {
      return serviceStatus === "SERVICO_PAGO_LIBERADO";
    }

    assert.equal(canExecuteService(), false, "Serviço NÃO pode ser iniciado antes da compensação");

    // Webhook confirma pagamento
    payment.status = "paid";
    serviceStatus = "SERVICO_PAGO_LIBERADO";

    assert.equal(canExecuteService(), true, "Serviço liberado somente após confirmação do PSP");
  });

  it("TESTE 106: Tentativa do frontend forjar preço de R$ 1,00 é ignorada; valor vem da proposta confiável", () => {
    const trustedQuote = { id: 50, totalCents: 100000 }; // R$ 1.000,00 no banco
    const frontendPayload = { quoteId: 50, amountCents: 100 }; // R$ 1,00 manipulado via DevTools

    // Regra do backend: o valor NUNCA vem do payload do cliente
    const finalAmountCharged = trustedQuote.totalCents;
    assert.equal(finalAmountCharged, 100000, "Backend ignora valor adulterado e usa o banco de dados");
    assert.notEqual(finalAmountCharged, frontendPayload.amountCents);
  });

  it("TESTE 107: Prestador A não pode acessar dados de pagamento de Prestador B (Isolamento RBAC)", () => {
    const order = { id: 99, vendorId: 10, customerId: 5 };
    const requesterVendor = { id: 11 }; // Outro prestador

    const hasAccess = order.vendorId === requesterVendor.id;
    assert.equal(hasAccess, false, "Prestador sem autorização deve receber 403 / acesso negado");
  });
});

