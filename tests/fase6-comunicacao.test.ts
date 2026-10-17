import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppMessage,
  sendWhatsAppNotification,
  processWhatsAppDeliveryWebhook,
  getWhatsAppNotificationStatus,
  WhatsAppTemplateKey,
} from "../src/lib/services/whatsapp/whatsapp-service";

after(async () => {
  const { pool } = await import("../src/db");
  await pool.end();
});

describe("FASE 6 — COMUNICAÇÃO E WHATSAPP", () => {
  // --------------------------------------------------------------------------
  // 1. TEMPLATES ESTRUTURADOS PARA CADA MOMENTO DA JORNADA
  // --------------------------------------------------------------------------
  describe("1. Templates Estruturados de Mensagens", () => {
    it("deve gerar template oficial para NOVA_SOLICITACAO com formatação e deep link", () => {
      const msg = buildWhatsAppMessage("NOVA_SOLICITACAO", {
        condoName: "Residencial Jardins",
        recipientName: "Carlos Eletricista",
        serviceCode: "SRV-2026-0042",
        serviceTitle: "Substituição de Quadro de Disjuntores",
        actionUrl: "https://app.zeladoriacondominio.com.br/prestador/chamados/42",
      });

      assert.ok(msg.title.includes("SRV-2026-0042"));
      assert.ok(msg.formattedMessage.includes("Carlos Eletricista"));
      assert.ok(msg.formattedMessage.includes("Residencial Jardins"));
      assert.ok(msg.formattedMessage.includes("Substituição de Quadro de Disjuntores"));
      assert.ok(msg.formattedMessage.includes("https://app.zeladoriacondominio.com.br/prestador/chamados/42"));
    });

    it("deve gerar template oficial para PROPOSTA_RECEBIDA com proteção Zeladoria Protege", () => {
      const msg = buildWhatsAppMessage("PROPOSTA_RECEBIDA", {
        recipientName: "Maria da Silva",
        serviceCode: "SRV-2026-0089",
        serviceTitle: "Instalação de Tomadas 20A",
        providerName: "Carlos Eletricista",
        amountFormatted: "R$ 350,00",
      });

      assert.ok(msg.formattedMessage.includes("Maria da Silva"));
      assert.ok(msg.formattedMessage.includes("Carlos Eletricista"));
      assert.ok(msg.formattedMessage.includes("R$ 350,00"));
      assert.ok(msg.formattedMessage.includes("Zeladoria Protege"));
    });

    it("deve gerar template oficial para CONCLUSAO_SOLICITADA incentivando validação 'Tudo Certo!'", () => {
      const msg = buildWhatsAppMessage("CONCLUSAO_SOLICITADA", {
        recipientName: "João Morador",
        serviceCode: "SRV-2026-0105",
        serviceTitle: "Conserto de Vazamento de Pia",
        providerName: "AquaFix Desentupidora",
      });

      assert.ok(msg.formattedMessage.includes("Tudo Certo!"));
      assert.ok(msg.formattedMessage.includes("SRV-2026-0105"));
    });

    it("deve gerar template oficial para CORRECAO_SOLICITADA com notas do cliente", () => {
      const msg = buildWhatsAppMessage("CORRECAO_SOLICITADA", {
        recipientName: "Carlos Prestador",
        serviceCode: "SRV-2026-0105",
        serviceTitle: "Instalação Elétrica",
        notes: "O espelho da tomada ficou desalinhado na parede da sala",
      });

      assert.ok(msg.formattedMessage.includes("O espelho da tomada ficou desalinhado"));
      assert.ok(msg.formattedMessage.includes("Carlos Prestador"));
    });

    it("deve suportar todos os templates da jornada de serviço", () => {
      const templates: WhatsAppTemplateKey[] = [
        "NOVA_SOLICITACAO",
        "PROPOSTA_RECEBIDA",
        "PAGAMENTO_CONFIRMADO",
        "PRESTADOR_A_CAMINHO",
        "PRESTADOR_CHEGOU",
        "CONCLUSAO_SOLICITADA",
        "SERVICO_APROVADO",
        "CORRECAO_SOLICITADA",
        "DISPUTA_ABERTA",
      ];

      for (const t of templates) {
        const res = buildWhatsAppMessage(t, {
          recipientName: "Teste",
          serviceCode: "SRV-001",
          serviceTitle: "Serviço Teste",
        });
        assert.ok(res.title.length > 0);
        assert.ok(res.body.length > 0);
        assert.ok(res.formattedMessage.length > 0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. IDEMPOTÊNCIA NO ENVIO DE NOTIFICAÇÕES
  // --------------------------------------------------------------------------
  describe("2. Idempotência e Prevenção de Mensagens Duplicadas", () => {
    it("deve evitar disparos duplicados para a mesma chave de idempotência", async () => {
      const idempotencyKey = `wpp:test:fase6:${Date.now()}`;

      // Primeiro envio
      const res1 = await sendWhatsAppNotification({
        condoId: 1,
        userId: 10,
        phone: "(11) 99876-5432",
        template: "PRESTADOR_A_CAMINHO",
        templateParams: {
          recipientName: "Morador Teste",
          serviceCode: "SRV-2026-9999",
          serviceTitle: "Reparo Hidráulico",
          providerName: "Mario Encanador",
        },
        idempotencyKey,
      });

      assert.equal(res1.success, true);
      assert.equal(res1.duplicated, false);
      assert.ok(res1.messageId);

      // Segundo envio com exatamente a mesma chave (ex: retry de rede, clique duplo)
      const res2 = await sendWhatsAppNotification({
        condoId: 1,
        userId: 10,
        phone: "(11) 99876-5432",
        template: "PRESTADOR_A_CAMINHO",
        templateParams: {
          recipientName: "Morador Teste",
          serviceCode: "SRV-2026-9999",
          serviceTitle: "Reparo Hidráulico",
          providerName: "Mario Encanador",
        },
        idempotencyKey,
      });

      assert.equal(res2.success, true);
      assert.equal(res2.duplicated, true);
      assert.equal(res2.messageId, res1.messageId, "Deve retornar o mesmo messageId anterior sem duplicar");
    });
  });

  // --------------------------------------------------------------------------
  // 3. WEBHOOK RECEIVER DE STATUS DE ENTREGA
  // --------------------------------------------------------------------------
  describe("3. Webhook Receiver e Rastreamento de Entrega", () => {
    it("deve atualizar status da mensagem de 'sent' para 'delivered' e 'read'", async () => {
      const idempotencyKey = `wpp:delivery:test:${Date.now()}`;

      const sendRes = await sendWhatsAppNotification({
        condoId: 1,
        userId: 20,
        phone: "(41) 99111-2233",
        template: "PAGAMENTO_CONFIRMADO",
        templateParams: {
          recipientName: "Carlos Prestador",
          serviceCode: "SRV-2026-8888",
          serviceTitle: "Manutenção de Bomba",
          amountFormatted: "R$ 800,00",
        },
        idempotencyKey,
      });

      // Status inicial
      const initial = getWhatsAppNotificationStatus(idempotencyKey);
      assert.equal(initial?.status, "sent");

      // Webhook de Entrega (delivered)
      const deliveredWebhook = processWhatsAppDeliveryWebhook({
        messageId: sendRes.messageId,
        event: "delivered",
        timestamp: new Date().toISOString(),
      });

      assert.equal(deliveredWebhook.success, true);
      assert.equal(deliveredWebhook.updatedStatus?.status, "delivered");

      // Webhook de Leitura (read)
      const readWebhook = processWhatsAppDeliveryWebhook({
        messageId: sendRes.messageId,
        event: "read",
        timestamp: new Date().toISOString(),
      });

      assert.equal(readWebhook.success, true);
      assert.equal(readWebhook.updatedStatus?.status, "read");
    });

    it("deve registrar falha com motivo de erro se mensagem não puder ser entregue", () => {
      const result = processWhatsAppDeliveryWebhook({
        messageId: "non_existent_message_id",
        event: "failed",
        error: "Número de telefone inexistente",
      });

      assert.equal(result.success, false);
    });
  });
});
