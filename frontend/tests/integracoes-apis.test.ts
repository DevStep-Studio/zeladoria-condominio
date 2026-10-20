import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  canMakeApiCall,
  recordApiUsage,
  toggleIntegration,
  getIntegrationsSummary,
  getRecentApiLogs,
} from "../src/lib/services/integrations/usage-tracker";
import {
  calculateHaversineMeters,
  calculateHaversineKm,
  isWithinCoverageRadius,
  formatDistanceText,
  formatRadiusLabel,
  STANDARD_RADIUS_PRESETS_METERS,
} from "../src/lib/services/geo";
import { validateCnpj, formatCnpj, lookupCompanyByCnpj } from "../src/lib/services/integrations/brasilapi";
import { geocodeAddress, reverseGeocode, GEOAPIFY_ATTRIBUTION } from "../src/lib/services/integrations/geoapify";
import { lookupCep } from "../src/lib/services/cep";
import { buildHtmlTemplate, sendTransactionalEmail } from "../src/lib/services/integrations/resend";
import { dispatchOneSignalPush } from "../src/lib/services/integrations/onesignal";

describe("1. Monitor de Consumo, Cotas e Telemetria (usage-tracker)", () => {
  it("deve permitir chamadas dentro do limite do plano gratuito", () => {
    const check = canMakeApiCall("geoapify");
    assert.equal(check.allowed, true, "Deve permitir chamadas dentro da cota");
  });

  it("deve respeitar desativação manual temporária de uma integração", () => {
    toggleIntegration("onesignal", false);
    const checkDisabled = canMakeApiCall("onesignal");
    assert.equal(checkDisabled.allowed, false, "Deve bloquear quando integração estiver pausada");
    assert.match(checkDisabled.reason || "", /desativada temporariamente/);

    // Reativa para os próximos testes
    toggleIntegration("onesignal", true);
    const checkEnabled = canMakeApiCall("onesignal");
    assert.equal(checkEnabled.allowed, true, "Deve permitir após reativação");
  });

  it("deve registrar telemetria e alimentar o resumo de status com cotas", () => {
    recordApiUsage({
      service: "geoapify",
      action: "unit_test_action",
      success: true,
      statusCode: 200,
      durationMs: 45,
      creditsConsumed: 1,
      message: "Teste unitário de registro de telemetria",
    });

    const summary = getIntegrationsSummary();
    const geoStatus = summary.find((s) => s.id === "geoapify");
    assert.ok(geoStatus, "Geoapify deve estar listado no resumo");
    assert.equal(geoStatus.dailyQuota, 3000, "Cota do plano gratuito deve ser de 3.000 créditos/dia");
    assert.ok(geoStatus.dailyUsed >= 1, "Consumo diário deve refletir a chamada registrada");

    const logs = getRecentApiLogs();
    assert.ok(logs.length > 0, "Deve haver registros no buffer de logs");
    assert.equal(logs[0].service, "geoapify");
    assert.equal(logs[0].action, "unit_test_action");
  });
});

describe("2. PostGIS / Utilitários Geoespaciais e Raio de Atendimento", () => {
  it("deve calcular a distância esférica em metros com alta precisão (Haversine / ST_Distance_Sphere)", () => {
    // Coordenadas: Av. Paulista 1000 (-23.5657, -46.6515) até Praça da Sé (-23.5505, -46.6333)
    // Distância real em linha reta ~ 2.45 km (2400m - 2500m)
    const meters = calculateHaversineMeters(-23.5657, -46.6515, -23.5505, -46.6333);
    assert.ok(meters >= 2300 && meters <= 2600, `Distância calculada (${meters}m) deve estar no intervalo esperado`);

    const km = calculateHaversineKm(-23.5657, -46.6515, -23.5505, -46.6333);
    assert.ok(km >= 2.3 && km <= 2.6, `Distância em km (${km}) deve ser coerente`);
  });

  it("deve aplicar a regra de que o raio pertence ao prestador", () => {
    const providerLat = -23.5657;
    const providerLng = -46.6515;

    // Cenário A: Prestador com raio de 5.000 metros (5 km) atende condomínio a 2.500 metros
    const condoNearby = isWithinCoverageRadius({
      providerLat,
      providerLng,
      providerRadiusMeters: 5000,
      targetLat: -23.5505,
      targetLng: -46.6333,
    });
    assert.equal(condoNearby.within, true, "Condomínio dentro de 5km deve ser atendido");
    assert.ok(condoNearby.distanceMeters! <= 5000);

    // Cenário B: Prestador com raio restrito de 1.000 metros (1 km) NÃO atende condomínio a 2.500 metros
    const condoTooFar = isWithinCoverageRadius({
      providerLat,
      providerLng,
      providerRadiusMeters: 1000,
      targetLat: -23.5505,
      targetLng: -46.6333,
    });
    assert.equal(condoTooFar.within, false, "Fora do raio do prestador, ele NÃO deve atender");
  });

  it("deve suportar os presets oficiais de raio em metros", () => {
    assert.deepEqual(STANDARD_RADIUS_PRESETS_METERS, [1000, 3000, 5000, 10000, 20000, 30000, 50000, 100000]);
    assert.equal(formatRadiusLabel(5000), "5 km (5.000 m)");
    assert.equal(formatRadiusLabel(500), "500 metros");
  });

  it("deve formatar texto de distância adequadamente", () => {
    assert.equal(formatDistanceText(4.2), "4,2 km");
    assert.equal(formatDistanceText(null), "Atende seu condomínio");
  });
});

describe("3. BrasilAPI — Validação e Consulta de CNPJ", () => {
  it("deve validar dígitos verificadores de CNPJs válidos e inválidos", () => {
    assert.equal(validateCnpj("00.000.000/0001-91"), true, "Banco do Brasil é válido");
    assert.equal(validateCnpj("00000000000191"), true, "Sem máscara é válido");
    assert.equal(validateCnpj("11.111.111/1111-11"), false, "Dígitos repetidos são inválidos");
    assert.equal(validateCnpj("00.000.000/0001-99"), false, "Dígito verificador incorreto é inválido");
    assert.equal(validateCnpj("1234"), false, "Incompleto é inválido");
  });

  it("deve formatar CNPJ com máscara padrão", () => {
    assert.equal(formatCnpj("00000000000191"), "00.000.000/0001-91");
  });

  it("deve retornar null graciosamente para CNPJ com formato inválido sem lançar exceções", async () => {
    const res = await lookupCompanyByCnpj("99999");
    assert.equal(res, null);
  });
});

describe("4. Geoapify & ViaCEP — Geocodificação e Endereços", () => {
  it("deve expor a atribuição obrigatória de fontes cartográficas", () => {
    assert.ok(GEOAPIFY_ATTRIBUTION.includes("OpenStreetMap"), "Deve citar OpenStreetMap");
    assert.ok(GEOAPIFY_ATTRIBUTION.includes("Geoapify"), "Deve citar Geoapify");
  });

  it("lookupCep deve validar 8 dígitos e retornar null para formato incorreto", async () => {
    const res = await lookupCep("123");
    assert.equal(res, null, "CEP com menos de 8 dígitos deve ser rejeitado imediatamente");
  });

  it("geocodeAddress deve retornar array vazio para buscas curtas sem gastar créditos", async () => {
    const res = await geocodeAddress("a");
    assert.deepEqual(res, [], "Query com menos de 3 caracteres não deve ser enviada");
  });
});

describe("5. Resend — E-mails Transacionais com Controle de Limites", () => {
  it("deve gerar template HTML profissional compatível com Zeladoria Condomínio", () => {
    const html = buildHtmlTemplate({
      title: "Boas-vindas ao Condomínio",
      greeting: "Olá, Carlos Silva!",
      contentHtml: "<p>Seu cadastro como prestador foi homologado.</p>",
      buttonText: "Acessar Plataforma",
      buttonUrl: "https://zeladoriacondominio.com.br",
    });

    assert.ok(html.includes("Zeladoria"), "Deve conter a marca Zeladoria");
    assert.ok(html.includes("#1355FF"), "Deve conter o azul oficial da plataforma");
    assert.ok(html.includes("Boas-vindas ao Condomínio"), "Deve incluir o título");
    assert.ok(html.includes("https://zeladoriacondominio.com.br"), "Deve incluir o link do botão");
  });

  it("deve respeitar chave de idempotência para evitar e-mails duplicados", async () => {
    // Primeiro envio com endereço oficial de homologação do Resend (delivered@resend.dev)
    const r1 = await sendTransactionalEmail({
      to: "delivered@resend.dev",
      subject: "Notificação de Teste Idempotente",
      text: "Mensagem de teste",
    });

    // Segundo envio imediato com mesmos parâmetros deve ser deduplicado
    const r2 = await sendTransactionalEmail({
      to: "delivered@resend.dev",
      subject: "Notificação de Teste Idempotente",
      text: "Mensagem de teste",
    });

    assert.ok(r2.success, "Segundo envio deve concluir com sucesso deduplicado");
    assert.equal(r2.simulated, true, "Segundo envio deve ser marcado como simulado por idempotência");
  });
});

describe("6. OneSignal / Web Push — Notificações com Isolamento de Condomínio", () => {
  it("deve concluir graciosamente sem erro mesmo quando OneSignal não estiver configurado no ambiente", async () => {
    const res = await dispatchOneSignalPush({
      userId: 42,
      condoId: 10,
      title: "Nova Encomenda Disponível",
      body: "Você tem um pacote aguardando retirada na portaria.",
    });

    assert.equal(res.success, true, "Não deve quebrar a operação do sistema");
    assert.ok(["onesignal", "webpush", "internal_only"].includes(res.provider));
  });
});
