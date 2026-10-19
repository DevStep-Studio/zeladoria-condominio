import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inferCategory,
  inferSeverity,
  generateSuggestedTitle,
  detectEmergency,
  CATEGORIES_CATALOG,
} from "../src/lib/services/occurrence-inference";

describe("Inferência de Ocorrências - Heurística e IA Invisível", () => {
  it("TESTE 1: deve sugerir Iluminação quando texto falar de lâmpada queimada", () => {
    const text = "Lâmpada do terceiro andar queimada.";
    const cat = inferCategory(text);
    assert.equal(cat.key, "iluminacao");
    assert.equal(cat.label, "Iluminação");

    const title = generateSuggestedTitle(text, cat.label);
    assert.ok(title.includes("Lâmpada") || title.includes("queimada"));
  });

  it("TESTE 2: deve sugerir Vazamento quando texto falar de vazando bastante", () => {
    const text = "Está vazando bastante água perto da garagem.";
    const cat = inferCategory(text);
    assert.ok(cat.key === "vazamento" || cat.key === "hidraulica");

    const severity = inferSeverity(text);
    assert.ok(severity === "alta" || severity === "media");
  });

  it("TESTE 3: deve detectar emergência para vazamento de gás ou incêndio", () => {
    const textGas = "Tem um cheiro de gás forte no corredor do 4º andar";
    const alertGas = detectEmergency(textGas);
    assert.equal(alertGas.isEmergency, true);
    assert.ok(alertGas.reason?.includes("gás"));

    const textFogo = "Princípio de fogo no quadro de luz";
    const alertFogo = detectEmergency(textFogo);
    assert.equal(alertFogo.isEmergency, true);

    const textNormal = "A lâmpada do hall social apagou ontem à noite";
    const alertNormal = detectEmergency(textNormal);
    assert.equal(alertNormal.isEmergency, false);
  });

  it("TESTE 4: deve gerar título amigável removendo vícios de linguagem", () => {
    const text = "Olá, gostaria de avisar que a maçaneta da porta de entrada está solta.";
    const title = generateSuggestedTitle(text, "Estrutura");
    assert.ok(!title.toLowerCase().startsWith("olá"));
    assert.ok(!title.toLowerCase().startsWith("gostaria de avisar"));
    assert.ok(title.toLowerCase().includes("maçaneta"));
  });

  it("TESTE 5: catálogo deve conter exatamente as 15 categorias sem remover nenhuma", () => {
    assert.equal(CATEGORIES_CATALOG.length, 15);
    const keys = CATEGORIES_CATALOG.map((c) => c.key);
    assert.ok(keys.includes("eletrica"));
    assert.ok(keys.includes("hidraulica"));
    assert.ok(keys.includes("iluminacao"));
    assert.ok(keys.includes("elevador"));
    assert.ok(keys.includes("portao"));
    assert.ok(keys.includes("garagem"));
    assert.ok(keys.includes("limpeza"));
    assert.ok(keys.includes("seguranca"));
    assert.ok(keys.includes("piscina"));
    assert.ok(keys.includes("jardinagem"));
    assert.ok(keys.includes("estrutura"));
    assert.ok(keys.includes("vazamento"));
    assert.ok(keys.includes("infiltracao"));
    assert.ok(keys.includes("ruido"));
    assert.ok(keys.includes("outros"));
  });
});
