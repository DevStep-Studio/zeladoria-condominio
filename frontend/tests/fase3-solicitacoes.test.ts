import { apiOperation } from "@/lib/api/server";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateHaversineKm } from "../src/lib/services/geo";

describe("FASE 3 — SOLICITAÇÕES E DISTRIBUIÇÃO COM CONCORRÊNCIA", () => {
  // --------------------------------------------------------------------------
  // 1. REGRAS DE ABERTURA DE SOLICITAÇÃO
  // --------------------------------------------------------------------------
  describe("1. Abertura e Validação de Solicitações", () => {
    it("deve validar campos obrigatórios da solicitação de serviço", () => {
      interface RequestPayload {
        condoId: number;
        customerId: number;
        category: string;
        title: string;
        description: string;
        urgency: "agora" | "hoje" | "agendar";
      }

      function validateRequest(payload: Partial<RequestPayload>): { valid: boolean; error?: string } {
        if (!payload.condoId) return { valid: false, error: "Condomínio é obrigatório" };
        if (!payload.customerId) return { valid: false, error: "Solicitante é obrigatório" };
        if (!payload.category) return { valid: false, error: "Categoria é obrigatória" };
        if (!payload.title || payload.title.trim().length < 5) return { valid: false, error: "Título muito curto" };
        if (!payload.description || payload.description.trim().length < 10) return { valid: false, error: "Descrição detalhada é obrigatória" };
        return { valid: true };
      }

      assert.equal(validateRequest({ condoId: 1, customerId: 10, category: "eletricista", title: "Troca chuveiro 220V", description: "Chuveiro queimou no banheiro social" }).valid, true);
      assert.equal(validateRequest({ condoId: 1, customerId: 10, title: "Curto" }).valid, false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. MOTOR DE DISTRIBUIÇÃO GEOGRÁFICA E ESPECIALIDADES
  // --------------------------------------------------------------------------
  describe("2. Distribuição Geográfica de Oportunidades", () => {
    it("deve filtrar prestadores considerando categoria principal OU especialidades secundárias e raio", () => {
      const condoLocation = { lat: -23.5855, lng: -46.6784 }; // Itaim Bibi
      const requestCategory = "seguranca_eletronica";

      interface ProviderCandidate {
        id: number;
        name: string;
        category: string;
        specialties: string[];
        isOnline: boolean;
        lat: number;
        lng: number;
        radiusKm: number;
      }

      const candidates: ProviderCandidate[] = [
        {
          id: 1,
          name: "Carlos (Eletricista com especialidade em CFTV)",
          category: "eletricista",
          specialties: ["eletricista", "seguranca_eletronica"],
          isOnline: true,
          lat: -23.5615,
          lng: -46.6920, // ~3.4 km
          radiusKm: 10,
        },
        {
          id: 2,
          name: "Marcos (Pintor apenas)",
          category: "pintura",
          specialties: ["pintura"],
          isOnline: true,
          lat: -23.5615,
          lng: -46.6920,
          radiusKm: 10,
        },
        {
          id: 3,
          name: "CFTV Brasil (Fora da área de cobertura)",
          category: "seguranca_eletronica",
          specialties: ["seguranca_eletronica"],
          isOnline: true,
          lat: -22.9099,
          lng: -47.0626, // Campinas ~85 km
          radiusKm: 15,
        },
        {
          id: 4,
          name: "Segurança Total (Offline)",
          category: "seguranca_eletronica",
          specialties: ["seguranca_eletronica"],
          isOnline: false,
          lat: -23.5800,
          lng: -46.6800, // ~1 km
          radiusKm: 15,
        },
      ];

      const eligible = candidates.filter((p) => {
        // 1. Disponibilidade
        if (!p.isOnline) return false;
        // 2. Especialidade
        const matchesCategory = p.category === requestCategory || p.specialties.includes(requestCategory);
        if (!matchesCategory) return false;
        // 3. Raio geográfico
        const distKm = calculateHaversineKm(condoLocation.lat, condoLocation.lng, p.lat, p.lng);
        return distKm <= p.radiusKm;
      });

      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].id, 1);
      assert.equal(eligible[0].name, "Carlos (Eletricista com especialidade em CFTV)");
    });
  });

  // --------------------------------------------------------------------------
  // 3. CENÁRIO 4 DO PROMPT MESTRE: CONCORRÊNCIA ATÔMICA NO ACEITE
  // --------------------------------------------------------------------------
  describe("3. Concorrência Atômica no Aceite (Cenário 4)", () => {
    it("deve simular duas requisições concorrentes de aceite e garantir que apenas uma confirme e a outra falhe com segurança", async () => {

      const [firstCondo] = await apiOperation("tests.fase3-solicitacoes-test.001", []);
      const [firstUser] = await apiOperation("tests.fase3-solicitacoes-test.002", []);
      assert.ok(firstCondo && firstUser);

      // 1. Cria chamado de teste aberto com vaga única
      const [testReq] = await apiOperation("tests.fase3-solicitacoes-test.003", [{
          condoId: firstCondo.id,
          customerId: firstUser.id,
          code: `SRV-RACE-${Date.now().toString().slice(-4)}`,
          category: "eletricista",
          title: "Disjuntor disparando teste concorrência",
          description: "Teste de concorrência com dois prestadores aceitando no mesmo instante",
          status: "buscando_prestador",
        }]);

      assert.ok(testReq.id > 0);

      // Função atômica simulando o aceite pelo servidor
      async function attemptAccept(requestId: number, vendorId: number): Promise<{ success: boolean }> {
        const updated = await apiOperation("tests.fase3-solicitacoes-test.004", [{
            vendorId,
            status: "aceito",
            acceptedAt: new Date(),
            updatedAt: new Date(),
          }, requestId]);

        return { success: updated.length > 0 };
      }

      // 2. Dispara duas tentativas simultâneas (Prestador 101 e Prestador 102)
      const [result1, result2] = await Promise.all([
        attemptAccept(testReq.id, 101),
        attemptAccept(testReq.id, 102),
      ]);

      // EXATAMENTE UMA deve ser verdadeira e a outra falsa!
      const successCount = (result1.success ? 1 : 0) + (result2.success ? 1 : 0);
      assert.equal(successCount, 1, "Exatamente um prestador deve conseguir assumir a vaga única");

      // 3. Verifica o estado final no banco de dados
      const [finalReq] = await apiOperation("tests.fase3-solicitacoes-test.005", [testReq.id]);

      assert.equal(finalReq.status, "aceito");
      assert.ok(finalReq.vendorId === 101 || finalReq.vendorId === 102);

      // 4. Limpeza segura
      await apiOperation("tests.fase3-solicitacoes-test.006", [testReq.id]);
    });
  });
});
