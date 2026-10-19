import { test } from "node:test";
import assert from "node:assert";
import {
  buildWhatsAppMessage,
  generateWhatsAppDirectLink,
  sendWhatsAppNotification,
  getWhatsAppNotificationStatus,
} from "../src/lib/services/whatsapp/whatsapp-service";

test("WhatsApp: Template NOVA_SOLICITACAO gera mensagem e deep link válidos", () => {
  const params = {
    condoName: "Condomínio Residencial Jardins",
    recipientName: "Carlos Silva",
    serviceCode: "OS-2026-904",
    serviceTitle: "Troca de Lâmpadas e Reatores",
    actionUrl: "https://zeladoria.app/prestador/chamados?code=OS-2026-904",
  };

  const { title, body, formattedMessage } = buildWhatsAppMessage("NOVA_SOLICITACAO", params);

  assert.ok(title.includes("OS-2026-904"));
  assert.ok(body.includes("Carlos Silva"));
  assert.ok(formattedMessage.includes("ZELADORIA CONDOMÍNIO"));
  assert.ok(formattedMessage.includes("Troca de Lâmpadas"));
  assert.ok(formattedMessage.includes("https://zeladoria.app/prestador/chamados?code=OS-2026-904"));

  const directLink = generateWhatsAppDirectLink("11987654321", "NOVA_SOLICITACAO", params);
  assert.ok(directLink.startsWith("https://wa.me/5511987654321?text="));
  assert.ok(directLink.includes(encodeURIComponent("OS-2026-904")));
});

test("WhatsApp: Idempotência evita envios duplicados acidentais", async () => {
  const payload = {
    condoId: 1,
    userId: 10,
    phone: "11987654321",
    template: "NOVA_SOLICITACAO" as const,
    templateParams: {
      recipientName: "Carlos",
      serviceCode: "OS-IDEM-001",
      serviceTitle: "Limpeza 4 Horas",
    },
    idempotencyKey: "wpp_order_OS-IDEM-001_10",
  };

  const first = await sendWhatsAppNotification(payload);
  assert.strictEqual(first.success, true);
  assert.strictEqual(first.duplicated, false);

  // Segundo envio com a mesma idempotencyKey deve ser detectado como duplicado
  const second = await sendWhatsAppNotification(payload);
  assert.strictEqual(second.success, true);
  assert.strictEqual(second.duplicated, true);
  assert.strictEqual(second.messageId, first.messageId);

  const status = getWhatsAppNotificationStatus("wpp_order_OS-IDEM-001_10");
  assert.ok(status);
  assert.strictEqual(status?.status, "sent");
});
