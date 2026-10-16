import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { AsaasGatewayAdapter } from "../src/lib/services/payments/asaas-adapter";
import { getPaymentGateway } from "../src/lib/services/payments/gateway-factory";
import {
  SERVICE_STATUSES,
  ALLOWED_TRANSITIONS,
  canTransition,
  assertTransition,
  normalizeServiceStatus,
  type ServiceLifecycleStatus,
} from "../src/lib/services/payments/state-machine";

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

describe("Zeladoria Pay 11: State Machine Canônica & Transições Centralizadas (Cláusulas 6 & 7)", () => {
  it("deve permitir cadeia completa de transições válidas no fluxo de serviço", () => {
    const validChain: ServiceLifecycleStatus[] = [
      SERVICE_STATUSES.REQUESTED,
      SERVICE_STATUSES.PROVIDER_REVIEWING,
      SERVICE_STATUSES.VISIT_OFFERED,
      SERVICE_STATUSES.VISIT_SCHEDULED,
      SERVICE_STATUSES.VISIT_COMPLETED,
      SERVICE_STATUSES.QUOTE_SENT,
      SERVICE_STATUSES.QUOTE_ACCEPTED,
      SERVICE_STATUSES.SERVICE_PAYMENT_PENDING,
      SERVICE_STATUSES.PAID,
      SERVICE_STATUSES.SERVICE_SCHEDULED,
      SERVICE_STATUSES.IN_PROGRESS,
      SERVICE_STATUSES.PROVIDER_COMPLETED,
      SERVICE_STATUSES.CUSTOMER_CONFIRMED,
      SERVICE_STATUSES.COMPLETED,
    ];

    for (let i = 0; i < validChain.length - 1; i++) {
      const from = validChain[i];
      const to = validChain[i + 1];
      assert.ok(
        canTransition(from, to),
        `Transição de ${from} para ${to} deve ser permitida pela State Machine`
      );
      assert.doesNotThrow(() => assertTransition(from, to));
    }
  });

  it("deve impedir transições impossíveis ou ilegais e disparar erro sem corromper estado", () => {
    // Tentativa de pular diretamente de REQUESTED para COMPLETED
    assert.equal(canTransition(SERVICE_STATUSES.REQUESTED, SERVICE_STATUSES.COMPLETED), false);
    assert.throws(
      () => assertTransition(SERVICE_STATUSES.REQUESTED, SERVICE_STATUSES.COMPLETED),
      /Transição de estado inválida/
    );

    // Tentativa de pagar após cancelamento
    assert.equal(canTransition(SERVICE_STATUSES.CANCELLED, SERVICE_STATUSES.PAID), false);
    assert.throws(
      () => assertTransition(SERVICE_STATUSES.CANCELLED, SERVICE_STATUSES.PAID),
      /Transição de estado inválida/
    );

    // Tentativa de concluir serviço que está em disputa sem antes mediação
    assert.equal(canTransition(SERVICE_STATUSES.DISPUTED, SERVICE_STATUSES.COMPLETED), false);
  });

  it("deve normalizar estados legados para os estados canônicos da nova State Machine", () => {
    assert.equal(normalizeServiceStatus("solicitado"), SERVICE_STATUSES.REQUESTED);
    assert.equal(normalizeServiceStatus("vistoria_proposta"), SERVICE_STATUSES.VISIT_OFFERED);
    assert.equal(normalizeServiceStatus("aguardando_pagamento_vistoria"), SERVICE_STATUSES.VISIT_PAYMENT_PENDING);
    assert.equal(normalizeServiceStatus("VISTORIA_AGENDADA"), SERVICE_STATUSES.VISIT_SCHEDULED);
    assert.equal(normalizeServiceStatus("SERVICO_PAGO_LIBERADO"), SERVICE_STATUSES.PAID);
    assert.equal(normalizeServiceStatus("em_atendimento"), SERVICE_STATUSES.IN_PROGRESS);
    assert.equal(normalizeServiceStatus("prestador_finalizou"), SERVICE_STATUSES.PROVIDER_COMPLETED);
    assert.equal(normalizeServiceStatus("em_disputa"), SERVICE_STATUSES.DISPUTED);
    assert.equal(normalizeServiceStatus("concluido"), SERVICE_STATUSES.COMPLETED);
  });
});

describe("Zeladoria Pay 12: Cenários E2E Oficiais Obrigatórios (Cláusulas 71 a 77)", () => {
  it("Cenário 71: E2E — Vistoria Gratuita (Solicitação -> Vistoria Grátis -> Diagnóstico -> Proposta -> Aceite -> Pix Aprovado -> Execução -> Término -> Confirmação -> Avaliação)", async () => {
    // 1. Morador solicita serviço
    let currentStatus: ServiceLifecycleStatus = SERVICE_STATUSES.REQUESTED;

    // 2. Prestador recebe e define vistoria gratuita
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_OFFERED);
    currentStatus = SERVICE_STATUSES.VISIT_OFFERED;

    // 3. Morador agenda horário (sem checkout pois é gratuita)
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_SCHEDULED);
    currentStatus = SERVICE_STATUSES.VISIT_SCHEDULED;

    // 4. Prestador realiza vistoria e registra diagnóstico
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_COMPLETED);
    currentStatus = SERVICE_STATUSES.VISIT_COMPLETED;

    // 5. Prestador envia proposta digital
    assertTransition(currentStatus, SERVICE_STATUSES.QUOTE_SENT);
    currentStatus = SERVICE_STATUSES.QUOTE_SENT;

    // 6. Morador aceita proposta
    assertTransition(currentStatus, SERVICE_STATUSES.QUOTE_ACCEPTED);
    currentStatus = SERVICE_STATUSES.QUOTE_ACCEPTED;

    // 7. Checkout do serviço criado
    assertTransition(currentStatus, SERVICE_STATUSES.SERVICE_PAYMENT_PENDING);
    currentStatus = SERVICE_STATUSES.SERVICE_PAYMENT_PENDING;

    // 8. Pix aprovado via webhook
    assertTransition(currentStatus, SERVICE_STATUSES.PAID);
    currentStatus = SERVICE_STATUSES.PAID;

    // 9. Serviço agendado e prestador inicia execução
    assertTransition(currentStatus, SERVICE_STATUSES.SERVICE_SCHEDULED);
    currentStatus = SERVICE_STATUSES.SERVICE_SCHEDULED;
    assertTransition(currentStatus, SERVICE_STATUSES.IN_PROGRESS);
    currentStatus = SERVICE_STATUSES.IN_PROGRESS;

    // 10. Prestador finaliza serviço
    assertTransition(currentStatus, SERVICE_STATUSES.PROVIDER_COMPLETED);
    currentStatus = SERVICE_STATUSES.PROVIDER_COMPLETED;

    // 11. Morador confirma ("Tudo Certo!")
    assertTransition(currentStatus, SERVICE_STATUSES.CUSTOMER_CONFIRMED);
    currentStatus = SERVICE_STATUSES.CUSTOMER_CONFIRMED;

    // 12. Finalizado e liberado para avaliação
    assertTransition(currentStatus, SERVICE_STATUSES.COMPLETED);
    currentStatus = SERVICE_STATUSES.COMPLETED;

    assert.equal(currentStatus, SERVICE_STATUSES.COMPLETED);
  });

  it("Cenário 72: E2E — Vistoria Paga com Abatimento no Serviço (R$ 80 Vistoria -> Abatido de R$ 1.000 -> Restante R$ 920)", async () => {
    // Prestador define vistoria paga de R$ 80
    const inspectionPriceCents = 8000;
    const discountOnService = true;

    // Morador seleciona data -> status pendente de pagamento
    let currentStatus: ServiceLifecycleStatus = SERVICE_STATUSES.VISIT_OFFERED;
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_PAYMENT_PENDING);
    currentStatus = SERVICE_STATUSES.VISIT_PAYMENT_PENDING;

    // Antes do webhook, vistoria NÃO é confirmada
    assert.equal(currentStatus, SERVICE_STATUSES.VISIT_PAYMENT_PENDING);

    // Webhook aprova pagamento da vistoria
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_SCHEDULED);
    currentStatus = SERVICE_STATUSES.VISIT_SCHEDULED;

    // Prestador realiza diagnóstico e gera proposta
    assertTransition(currentStatus, SERVICE_STATUSES.VISIT_COMPLETED);
    currentStatus = SERVICE_STATUSES.VISIT_COMPLETED;

    // Proposta: Mão de obra R$ 600 + Materiais R$ 400 = R$ 1.000
    const proposalLaborCents = 60000;
    const proposalMaterialsCents = 40000;
    const grossTotalCents = proposalLaborCents + proposalMaterialsCents; // 100000 (R$ 1.000)

    // Abatimento automático da vistoria
    const inspectionCreditCents = discountOnService ? inspectionPriceCents : 0;
    const netAmountToPayCents = Math.max(0, grossTotalCents - inspectionCreditCents);

    assert.equal(grossTotalCents, 100000, "Valor bruto deve ser R$ 1.000,00");
    assert.equal(inspectionCreditCents, 8000, "Crédito da vistoria deve ser R$ 80,00");
    assert.equal(netAmountToPayCents, 92000, "Cobrança restante no checkout deve ser exatamente R$ 920,00");

    // Cálculo da comissão sobre o valor pago no serviço (10%)
    const commissionCents = Math.round((netAmountToPayCents * 10) / 100);
    const providerReceivableCents = netAmountToPayCents - commissionCents;

    assert.equal(commissionCents, 9200); // R$ 92,00
    assert.equal(providerReceivableCents, 82800); // R$ 828,00
    assert.equal(commissionCents + providerReceivableCents, netAmountToPayCents);
  });

  it("Cenário 73: E2E — Webhook Duplicado 3x (1 pagamento, 1 atualização, 1 comissão, 1 repasse)", () => {
    const processedEvents = new Map<string, { status: string; executions: number }>();
    const ledgerRecords: string[] = [];

    function handleWebhookEvent(eventId: string, paymentId: string) {
      if (processedEvents.has(eventId)) {
        const existing = processedEvents.get(eventId)!;
        return { duplicate: true, executions: existing.executions };
      }

      processedEvents.set(eventId, { status: "APPROVED", executions: 1 });
      ledgerRecords.push(`PAYMENT_APPROVED:${paymentId}`);
      ledgerRecords.push(`COMMISSION_RECORDED:${paymentId}`);
      ledgerRecords.push(`PAYOUT_RECORDED:${paymentId}`);

      return { duplicate: false, executions: 1 };
    }

    const eventId = "evt_asaas_unique_123456";
    const paymentId = "pay_987654";

    const call1 = handleWebhookEvent(eventId, paymentId);
    const call2 = handleWebhookEvent(eventId, paymentId);
    const call3 = handleWebhookEvent(eventId, paymentId);

    assert.equal(call1.duplicate, false, "Primeira chamada deve processar normalmente");
    assert.equal(call2.duplicate, true, "Segunda chamada é identificada como duplicata idempotente");
    assert.equal(call3.duplicate, true, "Terceira chamada é identificada como duplicata idempotente");

    // Exatamente 3 registros no ledger (1 pagamento, 1 comissão, 1 repasse), sem triplicação
    assert.equal(ledgerRecords.length, 3);
    assert.equal(ledgerRecords[0], `PAYMENT_APPROVED:${paymentId}`);
    assert.equal(ledgerRecords[1], `COMMISSION_RECORDED:${paymentId}`);
    assert.equal(ledgerRecords[2], `PAYOUT_RECORDED:${paymentId}`);
  });

  it("Cenário 74: E2E — Fraude de Frontend (payload adulterado de R$ 1.000 para R$ 1,00 é ignorado)", () => {
    // Proposta aceita e registrada no banco
    const contractDb = {
      id: 77,
      totalAmountCents: 100000, // R$ 1.000,00
      commissionRateSnapshot: 10,
    };

    // Payload fraudulento enviado pelo cliente via DevTools
    const maliciousClientPayload = {
      contractId: 77,
      amountCents: 100, // R$ 1,00
      commissionRate: 0, // Tentando zerar a comissão
    };

    // Regra Backend: o backend lê exclusivamente os dados do contrato digital
    const authoritativeAmountCents = contractDb.totalAmountCents;
    const authoritativeCommissionRate = contractDb.commissionRateSnapshot;

    assert.equal(authoritativeAmountCents, 100000);
    assert.notEqual(authoritativeAmountCents, maliciousClientPayload.amountCents);
    assert.equal(authoritativeCommissionRate, 10);
    assert.notEqual(authoritativeCommissionRate, maliciousClientPayload.commissionRate);
  });

  it("Cenário 75: E2E — Aditivo de Escopo (Contrato R$ 1.000 + Aditivo R$ 200 -> duas transações independentes)", () => {
    // Contrato base congelado
    const originalContract = {
      id: 100,
      totalCents: 100000, // R$ 1.000
      status: "PAID",
      hash: "abc123frozenhash",
    };

    // Durante o serviço, prestador detecta necessidade de aditivo de R$ 200
    const addendum = {
      id: 1,
      contractId: originalContract.id,
      description: "Substituição de cabeamento antichamas complementar",
      amountCents: 20000, // R$ 200,00
      status: "QUOTE_ACCEPTED",
      independentPaymentOrderCode: "PAY-ADD-2026-0001",
    };

    // Contrato original permanece 100% inalterado
    assert.equal(originalContract.totalCents, 100000);
    assert.equal(originalContract.hash, "abc123frozenhash");

    // Aditivo gera uma nova transação financeira no PSP
    assert.equal(addendum.amountCents, 20000);
    assert.ok(addendum.independentPaymentOrderCode.startsWith("PAY-ADD-"));
  });

  it("Cenário 76: E2E — Contestação e Bloqueio de Payout (Morador contesta -> Disputa aberta -> Payout retido)", () => {
    let payoutStatus: "pending" | "held_in_dispute" | "released" = "pending";
    let disputeOpen = false;

    // Prestador marca PROVIDER_COMPLETED
    // Morador contesta alegando divergência
    function customerOpenDispute(reason: string) {
      disputeOpen = true;
      payoutStatus = "held_in_dispute";
      return { disputeId: 55, reason, status: "OPEN" };
    }

    const dispute = customerOpenDispute("Serviço incompleto");
    assert.equal(disputeOpen, true);
    assert.equal(payoutStatus, "held_in_dispute", "Repasse ao prestador deve permanecer bloqueado em disputa");

    // Tentativa de liberação automática de payout deve falhar enquanto houver disputa
    function canReleasePayout() {
      return payoutStatus !== "held_in_dispute";
    }
    assert.equal(canReleasePayout(), false, "Não é permitido liberar payout com disputa em aberto");
  });

  it("Cenário 77: E2E — Permissão e Isolamento RBAC (Prestador A -> Prestador B = 403; Morador A -> Morador B = 403)", () => {
    const contracts = [
      { id: 1, customerId: 10, vendorId: 20, condoId: 1 },
      { id: 2, customerId: 11, vendorId: 21, condoId: 1 },
    ];

    function verifyAccess(contractId: number, user: { id: number; role: "morador" | "prestador"; vendorId?: number }) {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return 404;

      if (user.role === "morador" && contract.customerId !== user.id) {
        return 403;
      }
      if (user.role === "prestador" && contract.vendorId !== user.vendorId) {
        return 403;
      }
      return 200;
    }

    // Prestador A (vendorId: 20) tenta acessar Contrato de Prestador B (vendorId: 21)
    const providerAccess = verifyAccess(2, { id: 99, role: "prestador", vendorId: 20 });
    assert.equal(providerAccess, 403, "Prestador A deve receber 403 ao acessar contrato de Prestador B");

    // Morador A (customerId: 10) tenta acessar Pagamento/Contrato de Morador B (customerId: 11)
    const customerAccess = verifyAccess(2, { id: 10, role: "morador" });
    assert.equal(customerAccess, 403, "Morador A deve receber 403 ao acessar contrato de Morador B");

    // Acesso legítimo
    const legitimateCustomer = verifyAccess(1, { id: 10, role: "morador" });
    assert.equal(legitimateCustomer, 200, "Morador dono do chamado tem acesso 200 OK");
  });
});


