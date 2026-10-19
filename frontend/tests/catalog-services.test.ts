import test from "node:test";
import assert from "node:assert/strict";
import {
  OFFICIAL_CATEGORIES,
  getCategoryById,
  getAllServices,
} from "../src/lib/services/categories-catalog";

test("Catálogo de Serviços: Categorias obrigatórias da referência Houser Pro estão presentes", () => {
  const categoryIds = OFFICIAL_CATEGORIES.map((c) => c.id);

  assert.ok(categoryIds.includes("eletricista"), "Eletricista deve estar presente");
  assert.ok(categoryIds.includes("encanador"), "Encanador deve estar presente");
  assert.ok(categoryIds.includes("chaveiro"), "Chaveiro deve estar presente");
  assert.ok(categoryIds.includes("diarista"), "Diarista deve estar presente");
  assert.ok(categoryIds.includes("instalacoes"), "Instalações deve estar presente");
  assert.ok(categoryIds.includes("estofados"), "Estofados deve estar presente");
  assert.ok(categoryIds.includes("assistencia_tecnica"), "Assistência técnica deve estar presente");
  assert.ok(categoryIds.includes("limpeza"), "Limpeza deve estar presente");
});

test("Catálogo de Serviços: Granularidade de serviços de Eletricista e Instalação", () => {
  const eletricista = getCategoryById("eletricista");
  assert.ok(eletricista, "Categoria eletricista encontrada");

  const eleNames = eletricista.services.map((s) => s.name);
  assert.ok(
    eleNames.some((n) => n.includes("Lâmpada ou Reator")),
    "Deve conter Instalação de Lâmpada ou Reator"
  );
  assert.ok(
    eleNames.some((n) => n.includes("Luminária de Jardim")),
    "Deve conter Instalação de Luminária de Jardim"
  );
  assert.ok(
    eleNames.some((n) => n.includes("Luminária de Sobrepor")),
    "Deve conter Instalação de Luminária de Sobrepor"
  );

  const instalacoes = getCategoryById("instalacoes");
  assert.ok(instalacoes, "Categoria instalações encontrada");

  const insNames = instalacoes.services.map((s) => s.name);
  assert.ok(insNames.some((n) => n.includes("Suporte de TV")), "Deve conter Suporte de TV");
  assert.ok(insNames.some((n) => n.includes("Cortina")), "Deve conter Cortina");
  assert.ok(insNames.some((n) => n.includes("Persiana")), "Deve conter Persiana");
  assert.ok(insNames.some((n) => n.includes("Bandô")), "Deve conter Bandô");
});

test("Catálogo de Serviços: Diarista e Limpeza Residencial de 4 Horas", () => {
  const diarista = getCategoryById("diarista");
  assert.ok(diarista, "Categoria diarista encontrada");

  const diaNames = diarista.services.map((s) => s.name);
  assert.ok(
    diaNames.some((n) => n.includes("Limpeza Residencial de 4 Horas")),
    "Deve conter Limpeza Residencial de 4 Horas"
  );
});

test("Catálogo de Serviços: Todo serviço possui tempo estimado, preço base e garantia padrão", () => {
  const allServices = getAllServices();
  assert.ok(allServices.length > 20, "Catálogo deve possuir ampla variedade de serviços");

  for (const s of allServices) {
    assert.ok(s.id, "Serviço deve ter ID");
    assert.ok(s.name, `Serviço ${s.id} deve ter nome`);
    assert.ok(s.estimatedDurationMinutes > 0, `Serviço ${s.id} deve ter duração estimada > 0`);
    assert.ok(s.warrantyDays >= 30, `Serviço ${s.id} deve ter garantia de no mínimo 30 dias`);
    assert.ok(s.priceFromCents > 0, `Serviço ${s.id} deve ter preço base positivo`);
  }
});
