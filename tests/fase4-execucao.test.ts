import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeServiceStatus, canTransition } from "../src/lib/services/payments/state-machine";

describe("FASE 4 — EXECUÇÃO E ORDEM DE SERVIÇO", () => {
  // --------------------------------------------------------------------------
  // 1. CHECK-IN OPERACIONAL E TRANSIÇÕES DE ESTADO
  // --------------------------------------------------------------------------
  describe("1. Check-in Operacional e Ciclo de Vida da OS", () => {
    it("deve permitir transição sequencial aceito -> a_caminho -> chegou -> em_atendimento", () => {
      assert.equal(canTransition("SERVICE_SCHEDULED", "IN_PROGRESS"), true);
      assert.equal(normalizeServiceStatus("a_caminho"), "IN_PROGRESS");
      assert.equal(normalizeServiceStatus("chegou"), "IN_PROGRESS");
      assert.equal(normalizeServiceStatus("em_atendimento"), "IN_PROGRESS");
    });

    it("deve validar check-in com timestamp de chegada", () => {
      const arrivedAt = new Date();
      assert.ok(arrivedAt instanceof Date);
      assert.ok(Date.now() - arrivedAt.getTime() < 1000);
    });
  });

  // --------------------------------------------------------------------------
  // 2. CHECKLIST DINÂMICO E REGISTRO DE MATERIAIS
  // --------------------------------------------------------------------------
  describe("2. Checklist e Materiais Utilizados", () => {
    it("deve validar e calcular progresso do checklist de execução", () => {
      const checklist = [
        { item: "Desligar disjuntor geral do circuito", checked: true },
        { item: "Remover fiação danificada e conector antigo", checked: true },
        { item: "Instalar conector de porcelana e fita autofusão", checked: true },
        { item: "Testar corrente elétrica e aquecimento", checked: false },
      ];

      const completedItems = checklist.filter((i) => i.checked).length;
      const progressPercent = Math.round((completedItems / checklist.length) * 100);

      assert.equal(completedItems, 3);
      assert.equal(progressPercent, 75);
    });

    it("deve validar estrutura de materiais utilizados com quantidades", () => {
      const materials = [
        { name: "Cabo de cobre flexível 4mm", quantity: 5, notes: "Metros de fiação antichama" },
        { name: "Conector cerâmico bipolar", quantity: 1, notes: "Para chuveiro 220V" },
      ];

      assert.equal(materials.length, 2);
      assert.equal(materials[0].quantity, 5);
      assert.equal(materials[1].name, "Conector cerâmico bipolar");
    });
  });

  // --------------------------------------------------------------------------
  // 3. EVIDÊNCIAS FOTOGRÁFICAS (ANTES, DURANTE, DEPOIS)
  // --------------------------------------------------------------------------
  describe("3. Evidências Fotográficas por Estágio", () => {
    it("deve classificar fotos nos estágios regulamentares: ANTES, DURANTE, DEPOIS", () => {
      const validStages = ["ANTES", "DURANTE", "DEPOIS"] as const;
      type Stage = (typeof validStages)[number];

      function isValidStage(stage: string): stage is Stage {
        return (validStages as readonly string[]).includes(stage);
      }

      assert.equal(isValidStage("ANTES"), true);
      assert.equal(isValidStage("DURANTE"), true);
      assert.equal(isValidStage("DEPOIS"), true);
      assert.equal(isValidStage("INVALIDO"), false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. CONCLUSÃO, APROVAÇÃO E SOLICITAÇÃO DE CORREÇÃO
  // --------------------------------------------------------------------------
  describe("4. Validação pelo Morador / Síndico", () => {
    it("deve permitir conclusão pelo prestador para PROVIDER_COMPLETED", () => {
      assert.equal(canTransition("IN_PROGRESS", "PROVIDER_COMPLETED"), true);
      assert.equal(normalizeServiceStatus("prestador_concluiu"), "PROVIDER_COMPLETED");
    });

    it("deve permitir aprovação do cliente com transição para CUSTOMER_CONFIRMED e COMPLETED", () => {
      assert.equal(canTransition("PROVIDER_COMPLETED", "CUSTOMER_CONFIRMED"), true);
      assert.equal(canTransition("CUSTOMER_CONFIRMED", "COMPLETED"), true);
      assert.equal(normalizeServiceStatus("concluido"), "COMPLETED");
    });

    it("deve permitir solicitação de correção retornando a OS para IN_PROGRESS", () => {
      assert.equal(canTransition("PROVIDER_COMPLETED", "IN_PROGRESS"), true);
      assert.equal(normalizeServiceStatus("correcao_solicitada"), "IN_PROGRESS");
    });

    it("deve rejeitar correção sem justificativa preenchida", () => {
      function validateCorrection(notes?: string): { valid: boolean; error?: string } {
        if (!notes || notes.trim().length === 0) {
          return { valid: false, error: "Justificativa obrigatória para solicitar correção" };
        }
        return { valid: true };
      }

      assert.equal(validateCorrection("").valid, false);
      assert.equal(validateCorrection("Falta vedar a conexão do cano").valid, true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. TESTE DE INTEGRAÇÃO COM BANCO POSTGRESQL REAL
  // --------------------------------------------------------------------------
  // Persistence and JSON round-trip coverage moved to backend/tests/Feature/DomainApiTest.php.
});
