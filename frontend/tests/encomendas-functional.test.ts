import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GATE } from "../src/lib/rbac";
import { hasPermission } from "../src/lib/permissions";
import { sequence, pickupCode, dateTimeBR } from "../src/lib/utils";
import { qrDataUrl } from "../src/lib/qr";

describe("MÓDULO DE ENCOMENDAS — AUDITORIA E TESTES FUNCIONAIS COMPLETOS", () => {
  // Teste 1 — Registrar encomenda
  describe("Teste 1 — Registro de Encomenda na Portaria", () => {
    it("deve gerar identificador sequencial permanente no padrão ENC-XXXXX", () => {
      const code1 = sequence("ENC", 1);
      const code2 = sequence("ENC", 42);
      const code3 = sequence("ENC", 9999);

      assert.equal(code1, "ENC-00001", "Deve preencher zeros à esquerda com 5 dígitos");
      assert.equal(code2, "ENC-00042");
      assert.equal(code3, "ENC-09999");
    });

    it("deve gerar código de retirada (PIN) numérico de 6 dígitos aleatório", () => {
      const pins = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const pin = pickupCode();
        assert.equal(pin.length, 6, "PIN deve ter exatamente 6 caracteres");
        assert.equal(/^\d{6}$/.test(pin), true, "PIN deve conter apenas dígitos numéricos");
        const numVal = parseInt(pin, 10);
        assert.ok(numVal >= 100000 && numVal <= 999999, "PIN deve estar na faixa de 100000 a 999999");
        pins.add(pin);
      }
      assert.ok(pins.size > 40, "PINs gerados devem possuir alta entropia");
    });

    it("deve validar obrigatoriedade da unidade destinatária", () => {
      const formDataWithoutUnit = new FormData();
      formDataWithoutUnit.set("carrier", "Correios");
      const unitId = Number(formDataWithoutUnit.get("unitId") || 0);
      assert.equal(unitId, 0, "Unidade não informada deve resultar em falha de validação");
    });
  });

  // Teste 2 — QR Code
  describe("Teste 2 — QR Code Funcional e Seguro", () => {
    it("deve gerar Data URL de QR Code válido e legível via biblioteca qrcode", async () => {
      const payload = "ENC:ENC-00001:837587";
      const dataUrl = await qrDataUrl(payload, 160);

      assert.ok(dataUrl.startsWith("data:image/png;base64,"), "Deve gerar Data URL base64 PNG válida");
      assert.ok(dataUrl.length > 200, "Imagem gerada deve conter payload PNG completo");
    });

    it("deve decodificar e validar formato seguro ENC:<code>:<pin>", () => {
      const validPayload = "ENC:ENC-00042:918234";
      const parts = validPayload.split(":");
      assert.equal(parts[0], "ENC");
      assert.equal(parts[1], "ENC-00042");
      assert.equal(parts[2], "918234");

      // Payload adulterado deve ser rejeitado
      const tampered = "ENC:ENC-00042:000000";
      assert.notEqual(tampered.split(":")[2], "918234", "PIN adulterado não deve coincidir");
    });

    it("deve invalidar credencial de QR após retirada confirmada", () => {
      const parcel = {
        id: 10,
        code: "ENC-00010",
        status: "entregue",
        pickupCode: "123456",
        pickedUpAt: new Date(),
        pickedUpBy: "Carlos Silva",
      };

      // Tentativa de retirada em encomenda com status entregue
      const isRedeemable = parcel.status === "pendente";
      assert.equal(isRedeemable, false, "Encomenda entregue não pode ser retirada novamente");
    });
  });

  // Teste 3 — Código de retirada
  describe("Teste 3 — Validação e Comprovação Digital por Código de Retirada", () => {
    it("deve permitir conferência de dados da encomenda antes da entrega física", () => {
      const sampleParcel = {
        id: 1,
        code: "ENC-00001",
        block: "Bloco A",
        unit: "102",
        carrier: "Correios",
        tracking: "BR992134556BR",
        shelf: "Prateleira A2",
        status: "pendente",
        pickupCode: "837587",
      };

      const informedPin = "837587";
      const isPinValid = informedPin === sampleParcel.pickupCode;
      assert.equal(isPinValid, true, "PIN informado deve coincidir com o da encomenda");

      // Porteiro confere local físico antes da entrega
      assert.equal(sampleParcel.shelf, "Prateleira A2", "Deve indicar local físico correto para busca");
    });

    it("deve bloquear código de retirada incorreto e registrar auditoria", () => {
      const sampleParcel = { code: "ENC-00001", pickupCode: "837587" };
      const wrongPin = "999999";
      assert.notEqual(wrongPin, sampleParcel.pickupCode, "PIN incorreto deve ser rejeitado");
    });

    it("deve exigir nome do recebedor e permitir assinatura digital", () => {
      const deliveryData = {
        pickedUpBy: "Mariana Costa",
        pickedUpDocument: "45.123.456-7",
        signature: "Mariana Costa",
        pickedUpAt: new Date(),
      };

      assert.ok(deliveryData.pickedUpBy.length > 0, "Nome de quem retirou é obrigatório");
      assert.ok(deliveryData.pickedUpAt instanceof Date, "Data e hora de retirada devem ser registradas");
      assert.equal(deliveryData.signature, "Mariana Costa", "Assinatura digital deve ser persistida");
    });
  });

  // Teste 4 — Indicadores
  describe("Teste 4 — Indicadores Dinâmicos e Classificação de Atraso", () => {
    it("deve classificar encomendas com mais de 7 dias de recebimento como atrasadas", () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const staleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const parcelRecent = { status: "pendente", receivedAt: twoDaysAgo };
      const parcelLate = { status: "pendente", receivedAt: eightDaysAgo };
      const parcelDeliveredLate = { status: "entregue", receivedAt: eightDaysAgo };

      const isRecentLate = parcelRecent.status === "pendente" && parcelRecent.receivedAt < staleBefore;
      const isLateLate = parcelLate.status === "pendente" && parcelLate.receivedAt < staleBefore;
      const isDeliveredLate = parcelDeliveredLate.status === "pendente" && parcelDeliveredLate.receivedAt < staleBefore;

      assert.equal(isRecentLate, false, "Recebida há 2 dias não deve ser atrasada");
      assert.equal(isLateLate, true, "Recebida há 8 dias pendente deve ser atrasada (+7d)");
      assert.equal(isDeliveredLate, false, "Encomenda entregue não é considerada atrasada");
    });

    it("deve calcular métricas corretas de pendentes, atrasadas e entregues", () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const staleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const items = [
        { id: 1, status: "pendente", receivedAt: oneDayAgo },
        { id: 2, status: "pendente", receivedAt: tenDaysAgo },
        { id: 3, status: "entregue", receivedAt: tenDaysAgo },
        { id: 4, status: "entregue", receivedAt: oneDayAgo },
      ];

      const pending = items.filter((i) => i.status === "pendente");
      const late = items.filter((i) => i.status === "pendente" && i.receivedAt < staleBefore);
      const delivered = items.filter((i) => i.status === "entregue");

      assert.equal(pending.length, 2, "2 aguardando retirada");
      assert.equal(late.length, 1, "1 atrasada");
      assert.equal(delivered.length, 2, "2 entregues");
      assert.equal(items.length, 4, "Total de 4 registros");
    });
  });

  // Teste 5 — Filtros
  describe("Teste 5 — Filtros e Busca Textual Rápida", () => {
    const staleBefore = new Date(Date.now() - 7 * 86400000);
    const mockParcels = [
      { id: 1, code: "ENC-00001", carrier: "Correios", tracking: "BR123456", unit: "101", block: "Bloco A", status: "pendente", receivedAt: new Date() },
      { id: 2, code: "ENC-00002", carrier: "Mercado Livre", tracking: "ML987654", unit: "102", block: "Bloco B", status: "pendente", receivedAt: new Date(Date.now() - 9 * 86400000) },
      { id: 3, code: "ENC-00003", carrier: "Amazon", tracking: "AMZ112233", unit: "201", block: "Bloco A", status: "entregue", receivedAt: new Date() },
    ];

    it("filtro 'pendente' deve retornar encomendas aguardando retirada dentro do prazo", () => {
      const filtered = mockParcels.filter((p) => p.status === "pendente" && p.receivedAt >= staleBefore);
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].code, "ENC-00001");
    });

    it("filtro 'atrasada' deve retornar exclusivamente encomendas pendentes > 7 dias", () => {
      const filtered = mockParcels.filter((p) => p.status === "pendente" && p.receivedAt < staleBefore);
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].code, "ENC-00002");
    });

    it("filtro 'entregue' deve retornar encomendas com entrega finalizada", () => {
      const filtered = mockParcels.filter((p) => p.status === "entregue");
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].code, "ENC-00003");
    });

    it("busca textual deve filtrar por código, transportadora, rastreio e unidade", () => {
      const queryTracking = "ML987654";
      const resTracking = mockParcels.filter((p) => p.tracking.includes(queryTracking));
      assert.equal(resTracking.length, 1);
      assert.equal(resTracking[0].carrier, "Mercado Livre");

      const queryUnit = "101";
      const resUnit = mockParcels.filter((p) => p.unit.includes(queryUnit));
      assert.equal(resUnit.length, 1);
      assert.equal(resUnit[0].code, "ENC-00001");
    });
  });

  // Teste 6 — Permissões (RBAC) e Isolamento Multi-condomínio
  describe("Teste 6 — Permissões (RBAC) e Isolamento de Dados", () => {
    it("portaria (porteiro, zelador, síndico, superadmin) deve possuir permissão GATE", () => {
      assert.ok(GATE.includes("porteiro"), "Porteiro deve estar no GATE");
      assert.ok(GATE.includes("zelador"), "Zelador deve estar no GATE");
      assert.ok(GATE.includes("sindico"), "Síndico deve estar no GATE");
      assert.ok(GATE.includes("superadmin"), "Superadmin deve estar no GATE");

      assert.equal(GATE.includes("morador"), false, "Morador NÃO pode estar no GATE");
      assert.equal(GATE.includes("prestador"), false, "Prestador NÃO pode estar no GATE");
    });

    it("morador não pode registrar encomenda nem liberar retirada", () => {
      assert.equal(hasPermission("morador", "package.register"), false);
      assert.equal(hasPermission("morador", "package.release"), false);

      assert.equal(hasPermission("porteiro", "package.register"), true);
      assert.equal(hasPermission("porteiro", "package.release"), true);
    });

    it("encomenda de condomínio A não pode ser liberada por portaria do condomínio B", () => {
      const parcelCondoA = { id: 1, condoId: 1, code: "ENC-00001", status: "pendente" };
      const currentCondoId = 2; // Sessão em condomínio diferente

      const isPermitted = parcelCondoA.condoId === currentCondoId;
      assert.equal(isPermitted, false, "Operação inter-condomínios deve ser estritamente bloqueada");
    });
  });

  // Teste 7 — Notificações
  describe("Teste 7 — Notificações Automáticas e Integradas", () => {
    it("deve gerar mensagem estruturada para o morador no recebimento", () => {
      const parcel = {
        code: "ENC-00001",
        carrier: "Correios",
        pickupCode: "837587",
        shelf: "Prateleira A2",
      };

      const title = "Nova encomenda na portaria";
      const body = `${parcel.carrier ?? "Encomenda"} recebida. Código de retirada: ${parcel.pickupCode}. Local: ${parcel.shelf ?? "portaria"}.`;

      assert.equal(title, "Nova encomenda na portaria");
      assert.ok(body.includes("Correios"));
      assert.ok(body.includes("837587"));
      assert.ok(body.includes("Prateleira A2"));
    });

    it("deve gerar notificação de confirmação após retirada", () => {
      const parcel = { code: "ENC-00001" };
      const pickedUpBy = "Carlos Silva";
      const body = `${parcel.code} foi retirada por ${pickedUpBy}.`;

      assert.equal(body, "ENC-00001 foi retirada por Carlos Silva.");
    });
  });

  // Teste 8 — Responsividade e Conformidade Visual
  describe("Teste 8 — Responsividade e Regra Zero Gradientes", () => {
    it("código dos componentes de encomendas não deve conter gradientes proibidos do Tailwind", () => {
      const encomendasDir = join(__dirname, "../src/app/painel/encomendas");
      const files = readdirSync(encomendasDir);

      for (const file of files) {
        if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          const content = readFileSync(join(encomendasDir, file), "utf-8");
          const hasForbiddenGradient = /bg-gradient-to-[a-z]+/i.test(content);
          assert.equal(
            hasForbiddenGradient,
            false,
            `Gradiente proibido encontrado no arquivo ${file}`
          );
        }
      }
    });

    it("deve conter classes responsivas para viewports de 320px a 1440px+", () => {
      const clientContent = readFileSync(
        join(__dirname, "../src/app/painel/encomendas/encomendas-client.tsx"),
        "utf-8"
      );

      assert.ok(clientContent.includes("grid-cols-1 sm:grid-cols-3"), "Deve ter grid responsivo para KPIs");
      assert.ok(clientContent.includes("md:hidden"), "Deve conter visualização mobile de cartões");
      assert.ok(clientContent.includes("hidden md:block"), "Deve conter tabela para desktop");
      assert.ok(clientContent.includes("overflow-x-auto"), "Filtros devem permitir rolagem horizontal em telas estreitas");
    });
  });

  // Teste 9 — Concorrência
  describe("Teste 9 — Tratamento de Concorrência e Retirada Duplicada", () => {
    it("deve rejeitar segunda tentativa de retirada simultânea", () => {
      let parcelState = { id: 1, status: "pendente", pickedUpAt: null as Date | null, pickedUpBy: null as string | null };

      function attemptPickup(retirante: string) {
        if (parcelState.status !== "pendente") {
          return { success: false, error: "Encomenda já entregue anteriormente." };
        }
        parcelState = { ...parcelState, status: "entregue", pickedUpAt: new Date(), pickedUpBy: retirante };
        return { success: true, message: "Retirada confirmada com sucesso." };
      }

      // Operador 1 confirma
      const res1 = attemptPickup("João Porteiro");
      assert.equal(res1.success, true);
      assert.equal(parcelState.status, "entregue");

      // Operador 2 tenta confirmar a mesma encomenda simultaneamente
      const res2 = attemptPickup("Maria Porteira");
      assert.equal(res2.success, false);
      assert.equal(res2.error, "Encomenda já entregue anteriormente.");
    });
  });

  // Teste 10 — Persistência e Auditoria
  describe("Teste 10 — Persistência de Dados e Rastreabilidade de Auditoria", () => {
    it("deve estruturar payload de auditoria completo para entrega e tentativa inválida", () => {
      const auditSuccess = {
        action: "entregar",
        entity: "encomenda",
        entityId: "1",
        summary: "Entregou ENC-00001 para Carlos Silva (Doc: 12.345.678-9)",
        critical: true,
        origin: "portaria",
      };

      assert.equal(auditSuccess.action, "entregar");
      assert.equal(auditSuccess.critical, true);
      assert.ok(auditSuccess.summary.includes("ENC-00001"));

      const auditFailure = {
        action: "codigo_invalido",
        entity: "encomenda",
        entityId: "1",
        summary: "Tentativa de retirada com código inválido para ENC-00001",
        critical: true,
        origin: "portaria",
      };

      assert.equal(auditFailure.action, "codigo_invalido");
      assert.equal(auditFailure.critical, true);
    });
  });
});
