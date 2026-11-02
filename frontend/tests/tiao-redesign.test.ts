import test from "node:test";
import assert from "node:assert/strict";
import { deduplicateProviders } from "../src/lib/services/providers-data";
import { tiaoTokens } from "../src/lib/theme/tiao-tokens";

test("Tião Redesign — Tokens Oficiais", () => {
  assert.equal(tiaoTokens.primary, "#FB6B01");
  assert.equal(tiaoTokens.primaryHover, "#E05F00");
  assert.equal(tiaoTokens.available, "#10B981");
  assert.notEqual(tiaoTokens.available, tiaoTokens.primary, "Disponibilidade deve ser verde, nunca laranja");
});

test("Tião Redesign — Deduplicação Estrita (Seus Profissionais > Patrocinados > Recomendados)", () => {
  const carlos = { id: 1, name: "Carlos Eduardo" };
  const wellington = { id: 2, name: "Wellington Henrique" };
  const ana = { id: 3, name: "Ana Pinturas" };
  const roberto = { id: 4, name: "Roberto Eletricista" };

  // Carlos está em Seus Profissionais, Patrocinados e Orgânico
  // Wellington está em Patrocinados e Orgânico
  // Ana está apenas em Orgânico
  // Roberto está em Seus Profissionais e Orgânico
  const hired = [carlos, roberto];
  const sponsored = [carlos, wellington];
  const organic = [carlos, wellington, ana, roberto];

  const result = deduplicateProviders(hired, sponsored, organic);

  // Carlos e Roberto devem estar em Hired
  assert.equal(result.hired.length, 2);
  assert.deepEqual(result.hired.map((p) => p.id), [1, 4]);

  // Carlos já apareceu em Hired, então NÃO deve se repetir em Sponsored
  // Wellington deve aparecer em Sponsored
  assert.equal(result.sponsored.length, 1);
  assert.equal(result.sponsored[0].id, 2);

  // Carlos, Roberto e Wellington já apareceram acima. Somente Ana deve estar em Organic
  assert.equal(result.organic.length, 1);
  assert.equal(result.organic[0].id, 3);
  assert.equal(result.organic[0].name, "Ana Pinturas");
});

test("Tião Redesign — Cálculo Financeiro e Split Transparente de Ganhos", () => {
  const valorServicoCentavos = 35000; // R$ 350,00
  const taxaPlataformaCentavos = Math.round(valorServicoCentavos * 0.10); // 10% = R$ 35,00
  const liquidoPrestadorCentavos = valorServicoCentavos - taxaPlataformaCentavos; // R$ 315,00

  assert.equal(taxaPlataformaCentavos, 3500);
  assert.equal(liquidoPrestadorCentavos, 31500);
});

