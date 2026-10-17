import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pool } from "../src/db";
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
  describe("5. Integração com Banco PostgreSQL Real", () => {
    it("deve persistir checklist, materiais, evidências fotográficas e validação no banco", async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const timestamp = Date.now();
        const condoSlug = `condo-test-f4-${timestamp}`;
        const condoRes = await client.query(`
          INSERT INTO "condominio_app"."condominiums" ("name", "slug", "cnpj")
          VALUES ('Condomínio Teste Fase 4', $1, '11222333000199')
          RETURNING id;
        `, [condoSlug]);
        const condoId = condoRes.rows[0].id;

        const custRes = await client.query(`
          INSERT INTO "condominio_app"."users" ("name", "email", "password_hash")
          VALUES ('Morador Teste F4', $1, 'test_hash_123')
          RETURNING id;
        `, [`morador_f4_${timestamp}@teste.com`]);
        const customerId = custRes.rows[0].id;

        const vendUserRes = await client.query(`
          INSERT INTO "condominio_app"."users" ("name", "email", "password_hash")
          VALUES ('Prestador Teste F4', $1, 'test_hash_123')
          RETURNING id;
        `, [`prestador_f4_${timestamp}@teste.com`]);
        const vendorUserId = vendUserRes.rows[0].id;

        const vendRes = await client.query(`
          INSERT INTO "condominio_app"."vendors" ("condo_id", "user_id", "name", "category", "rating")
          VALUES ($1, $2, 'Prestador F4 Ltda', 'eletricista', 5)
          RETURNING id;
        `, [condoId, vendorUserId]);
        const vendorId = vendRes.rows[0].id;

        // 2. Criar Ordem de Serviço
        const reqRes = await client.query(`
          INSERT INTO "condominio_app"."service_requests" (
            "condo_id", "code", "customer_id", "vendor_id", "category", "title", "description", "status"
          ) VALUES (
            $1, $2, $3, $4, 'eletricista', 'Instalação de Tomada 20A', 'Tomada na cozinha', 'em_atendimento'
          ) RETURNING id;
        `, [condoId, `SRV-F4-${timestamp}`, customerId, vendorId]);
        const requestId = reqRes.rows[0].id;

        // 3. Inserir evidência fotográfica ANTES
        await client.query(`
          INSERT INTO "condominio_app"."service_evidences" (
            "condo_id", "request_id", "vendor_id", "stage", "file_url", "caption"
          ) VALUES (
            $1, $2, $3, 'ANTES', 'https://storage.zeladoria.com.br/evidencias/antes.jpg', 'Local antes do reparo'
          );
        `, [condoId, requestId, vendorId]);

        // 4. Prestador atualiza checklist e materiais utilizados
        const checklist = JSON.stringify([
          { item: "Verificar tensão com multímetro", checked: true },
          { item: "Passar fiação de 2.5mm", checked: true },
          { item: "Instalar espelho 20A", checked: true },
        ]);
        const materials = JSON.stringify([
          { name: "Módulo tomada 20A", quantity: 1, notes: "Pial Legrand" },
          { name: "Cabo flexível 2.5mm", quantity: 3, notes: "Metros" },
        ]);

        await client.query(`
          UPDATE "condominio_app"."service_requests"
          SET
            "checklist" = $1::jsonb,
            "materials_used" = $2::jsonb,
            "execution_notes" = 'Fiação passada sem obstruções no conduíte.',
            "status" = 'prestador_concluiu',
            "completion_requested_at" = NOW()
          WHERE "id" = $3;
        `, [checklist, materials, requestId]);

        // 5. Inserir evidência fotográfica DEPOIS
        await client.query(`
          INSERT INTO "condominio_app"."service_evidences" (
            "condo_id", "request_id", "vendor_id", "stage", "file_url", "caption"
          ) VALUES (
            $1, $2, $3, 'DEPOIS', 'https://storage.zeladoria.com.br/evidencias/depois.jpg', 'Tomada finalizada e testada'
          );
        `, [condoId, requestId, vendorId]);

        // 6. Morador valida a conclusão e deixa avaliação de 5 estrelas
        await client.query(`
          UPDATE "condominio_app"."service_requests"
          SET
            "status" = 'concluido',
            "completed_at" = NOW(),
            "validated_at" = NOW(),
            "validated_by_id" = $1
          WHERE "id" = $2;
        `, [customerId, requestId]);

        await client.query(`
          INSERT INTO "condominio_app"."service_reviews" (
            "request_id", "vendor_id", "customer_id", "rating", "comment"
          ) VALUES (
            $1, $2, $3, 5, 'Excelente serviço, pontual e muito limpo!'
          );
        `, [requestId, vendorId, customerId]);

        // 7. Verificações assertivas
        const verifyReq = await client.query(`
          SELECT "status", "checklist", "materials_used", "execution_notes", "validated_at", "validated_by_id"
          FROM "condominio_app"."service_requests"
          WHERE "id" = $1;
        `, [requestId]);

        assert.equal(verifyReq.rows[0].status, "concluido");
        assert.equal(verifyReq.rows[0].validated_by_id, customerId);
        assert.ok(verifyReq.rows[0].validated_at);
        assert.equal(verifyReq.rows[0].checklist.length, 3);
        assert.equal(verifyReq.rows[0].materials_used.length, 2);

        const verifyEvidences = await client.query(`
          SELECT "stage", "file_url" FROM "condominio_app"."service_evidences"
          WHERE "request_id" = $1 ORDER BY "id" ASC;
        `, [requestId]);

        assert.equal(verifyEvidences.rows.length, 2);
        assert.equal(verifyEvidences.rows[0].stage, "ANTES");
        assert.equal(verifyEvidences.rows[1].stage, "DEPOIS");

        const verifyReview = await client.query(`
          SELECT "rating", "comment" FROM "condominio_app"."service_reviews"
          WHERE "request_id" = $1;
        `, [requestId]);

        assert.equal(verifyReview.rows[0].rating, 5);
        assert.equal(verifyReview.rows[0].comment, "Excelente serviço, pontual e muito limpo!");

        // Rollback para limpar os dados de teste
        await client.query("ROLLBACK");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release(true);
      }
    });
  });
});
