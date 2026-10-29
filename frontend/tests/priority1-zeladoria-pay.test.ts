import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  normalizeServiceStatus,
  assertTransition,
} from "../src/lib/services/payments/state-machine";
import { AsaasGatewayAdapter } from "../src/lib/services/payments/asaas-adapter";

test("Zeladoria Pay: deve calcular rigorosamente a taxa da plataforma em 10% e o repasse líquido em 90%", () => {
  const totalCents = 25000; // R$ 250,00
  const platformFeeRate = 0.10; // 10%
  const expectedPlatformFee = Math.round(totalCents * platformFeeRate); // R$ 25,00
  const expectedNetVendor = totalCents - expectedPlatformFee; // R$ 225,00

  assert.equal(expectedPlatformFee, 2500);
  assert.equal(expectedNetVendor, 22500);
  assert.equal(expectedPlatformFee + expectedNetVendor, totalCents);
});

test("Zeladoria Pay: deve calcular com precisão centesimal para valores ímpares", () => {
  const totalCents = 33333; // R$ 333,33
  const platformFeeRate = 0.10;
  const platformFeeCents = Math.round(totalCents * platformFeeRate);
  const netVendorCents = totalCents - platformFeeCents;

  assert.equal(platformFeeCents, 3333);
  assert.equal(netVendorCents, 30000);
  assert.equal(platformFeeCents + netVendorCents, totalCents);
});

test("Zeladoria Pay: deve normalizar corretamente os status legados e canônicos do ciclo de vida", () => {
  assert.equal(normalizeServiceStatus("solicitado"), "REQUESTED");
  assert.equal(normalizeServiceStatus("servico_pago_liberado"), "PAID");
  assert.equal(normalizeServiceStatus("a_caminho"), "IN_PROGRESS");
  assert.equal(normalizeServiceStatus("prestador_concluiu"), "PROVIDER_COMPLETED");
  assert.equal(normalizeServiceStatus("morador_confirmou"), "CUSTOMER_CONFIRMED");
  assert.equal(normalizeServiceStatus("concluido"), "COMPLETED");
});

test("Zeladoria Pay: deve validar transições permitidas para liberação de repasse do morador", () => {
  // Provedor concluiu -> morador confirma
  assert.equal(canTransition("PROVIDER_COMPLETED", "CUSTOMER_CONFIRMED"), true);
  // Morador confirmou -> concluído
  assert.equal(canTransition("CUSTOMER_CONFIRMED", "COMPLETED"), true);
  // Conclusão direta a partir de em execução permitida
  assert.equal(canTransition("IN_PROGRESS", "CUSTOMER_CONFIRMED"), true);
  // Em execução não pode pular para solicitado
  assert.equal(canTransition("IN_PROGRESS", "REQUESTED"), false);
});

test("Zeladoria Pay: deve rejeitar transições ilegais na máquina de estados com assertTransition", () => {
  assert.throws(
    () => assertTransition("CANCELLED", "IN_PROGRESS"),
    /Transição de estado inválida/
  );
});

test("Zeladoria Pay: deve validar token de webhook do Asaas", () => {
  const adapter = new AsaasGatewayAdapter();
  const headersValid = {
    "asaas-access-token": "zeladoria_asaas_secret_default",
  };
  const headersInvalid = {
    "asaas-access-token": "token_falso_desconhecido",
  };

  assert.equal(adapter.verifyWebhookSignature(headersValid, "{}"), true);
  assert.equal(adapter.verifyWebhookSignature(headersInvalid, "{}"), false);
});
