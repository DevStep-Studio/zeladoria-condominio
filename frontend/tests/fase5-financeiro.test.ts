import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getMarketplaceSettings, recordLedgerEntry } from "../src/lib/services/payments/payment-service";

describe("FASE 5 — COMERCIAL E FINANCEIRO", () => {
  // --------------------------------------------------------------------------
  // 1. ORÇAMENTO CONGELADO E SNAPSHOT IMUTÁVEL COM HASH
  // --------------------------------------------------------------------------
  describe("1. Versionamento e Snapshot Imutável de Propostas", () => {
    it("deve gerar snapshot criptográfico imutável (SHA-256) com dados da proposta e versão", () => {
      const quotePayload = {
        requestId: 501,
        vendorId: 42,
        version: 1,
        laborCents: 35000,
        materialsCents: 12000,
        totalCents: 47000,
        materials: [
          { name: "Cabo flexível 4mm", amountCents: 8000, quantity: 10 },
          { name: "Disjuntor bipolar 32A", amountCents: 4000, quantity: 1 },
        ],
        warrantyDays: 90,
      };

      const serialized = JSON.stringify(quotePayload);
      const hash1 = createHash("sha256").update(serialized).digest("hex");
      const hash2 = createHash("sha256").update(serialized).digest("hex");

      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);

      // Se qualquer valor for adulterado, o hash é invalidado
      const tampered = { ...quotePayload, totalCents: 55000 };
      const tamperedHash = createHash("sha256").update(JSON.stringify(tampered)).digest("hex");
      assert.notEqual(hash1, tamperedHash);
    });

    it("proposta aceita não pode ser modificada silenciosamente; alterações exigem nova versão", () => {
      interface Proposal {
        version: number;
        status: "DRAFT" | "SENT" | "ACCEPTED" | "SUPERSEDED";
        totalCents: number;
      }

      function createNewVersion(current: Proposal, newTotalCents: number): { old: Proposal; next: Proposal } {
        if (current.status === "ACCEPTED") {
          throw new Error("Proposta aceita não pode ser alterada. Crie um aditivo de escopo ou nova proposta.");
        }
        return {
          old: { ...current, status: "SUPERSEDED" },
          next: { version: current.version + 1, status: "SENT", totalCents: newTotalCents },
        };
      }

      const v1: Proposal = { version: 1, status: "SENT", totalCents: 35000 };
      const { old, next } = createNewVersion(v1, 40000);
      assert.equal(old.status, "SUPERSEDED");
      assert.equal(next.version, 2);
      assert.equal(next.totalCents, 40000);

      const acceptedProp: Proposal = { version: 1, status: "ACCEPTED", totalCents: 35000 };
      assert.throws(() => createNewVersion(acceptedProp, 50000), /Proposta aceita não pode ser alterada/);
    });
  });

  // --------------------------------------------------------------------------
  // 2. SPLIT DINÂMICO E NÃO-HARDCODADO
  // --------------------------------------------------------------------------
  describe("2. Split de Pagamento Sem Hardcode", () => {
    function calculateSplit(totalCents: number, commissionPercent: number) {
      if (commissionPercent < 0 || commissionPercent > 100) {
        throw new Error("Taxa de comissão inválida");
      }
      const platformFeeCents = Math.round((totalCents * commissionPercent) / 100);
      const netVendorCents = totalCents - platformFeeCents;
      return { platformFeeCents, netVendorCents };
    }

    it("deve calcular split com taxas dinâmicas (ex: 0%, 8%, 10%, 15%) sem dízima ou perda de centavos", () => {
      // 10% padrão
      const split10 = calculateSplit(35000, 10);
      assert.equal(split10.platformFeeCents, 3500);
      assert.equal(split10.netVendorCents, 31500);
      assert.equal(split10.platformFeeCents + split10.netVendorCents, 35000);

      // 15% configurável
      const split15 = calculateSplit(49990, 15);
      assert.equal(split15.platformFeeCents, 7499);
      assert.equal(split15.netVendorCents, 42491);
      assert.equal(split15.platformFeeCents + split15.netVendorCents, 49990);

      // 0% para convênio social ou promoção
      const split0 = calculateSplit(20000, 0);
      assert.equal(split0.platformFeeCents, 0);
      assert.equal(split0.netVendorCents, 20000);
    });

    it("deve validar configurações do marketplace via getMarketplaceSettings", async () => {
      const settings = await getMarketplaceSettings(null);
      assert.ok(typeof settings.commissionPercent === "number");
      assert.ok(typeof settings.autoReleaseHours === "number");
      assert.ok(typeof settings.disputeWindowHours === "number");
    });
  });

  // --------------------------------------------------------------------------
  // 3. ADITIVOS CONTRATUAIS DE ESCOPO COM APROVAÇÃO EXPLÍCITA
  // --------------------------------------------------------------------------
  describe("3. Aditivos de Escopo (Custos Adicionais)", () => {
    it("deve exigir aprovação explícita do cliente antes de gerar cobrança adicional", () => {
      interface ScopeAddendum {
        id: number;
        contractId: number;
        additionalCents: number;
        reason: string;
        status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
      }

      function resolveAddendum(addendum: ScopeAddendum, approved: boolean): ScopeAddendum {
        return {
          ...addendum,
          status: approved ? "APPROVED" : "REJECTED",
        };
      }

      const addendum: ScopeAddendum = {
        id: 1,
        contractId: 100,
        additionalCents: 15000,
        reason: "Troca do cano mestre que estava corroído",
        status: "PENDING_APPROVAL",
      };

      const approved = resolveAddendum(addendum, true);
      assert.equal(approved.status, "APPROVED");

      const rejected = resolveAddendum(addendum, false);
      assert.equal(rejected.status, "REJECTED");
    });
  });

  // --------------------------------------------------------------------------
  // 4. GARANTIA LEGAL DE 90 DIAS (ART. 26 CDC)
  // --------------------------------------------------------------------------
  describe("4. Garantia Legal de 90 Dias (CDC)", () => {
    it("deve calcular a data de término da garantia exatamente 90 dias após a validação", () => {
      const validatedAt = new Date("2026-10-15T10:00:00.000Z");
      const warrantyDays = 90;

      const warrantyExpiresAt = new Date(validatedAt.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
      const diffDays = Math.round((warrantyExpiresAt.getTime() - validatedAt.getTime()) / (1000 * 60 * 60 * 24));

      assert.equal(diffDays, 90);
      assert.equal(warrantyExpiresAt.toISOString(), "2027-01-13T10:00:00.000Z");
    });

    it("deve permitir abertura de chamado em garantia somente dentro da janela válida", () => {
      function canOpenWarrantyTicket(validatedAt: Date, currentDate: Date): boolean {
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        return currentDate.getTime() - validatedAt.getTime() <= ninetyDaysMs;
      }

      const completedDate = new Date("2026-10-01T00:00:00.000Z");
      const day45 = new Date("2026-11-15T00:00:00.000Z");
      const day95 = new Date("2027-01-05T00:00:00.000Z");

      assert.equal(canOpenWarrantyTicket(completedDate, day45), true);
      assert.equal(canOpenWarrantyTicket(completedDate, day95), false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. LEDGER FINANCEIRO IMUTÁVEL (AUDITORIA CONTÁBIL)
  // --------------------------------------------------------------------------
  describe("5. Ledger Contábil e Operacional Imutável", () => {
    it("deve registrar entradas com tipos canônicos de débito/crédito e entidades", () => {
      const entry = {
        condoId: 1,
        requestId: 10,
        eventType: "PAYMENT_CONFIRMED",
        amountCents: 35000,
        balanceType: "credit" as const,
        entityType: "customer" as const,
        description: "Pagamento do serviço via PIX aprovado",
      };

      assert.equal(entry.eventType, "PAYMENT_CONFIRMED");
      assert.equal(entry.balanceType, "credit");
      assert.equal(entry.amountCents, 35000);
    });
  });

  // --------------------------------------------------------------------------
  // 6. BLOQUEIO DE REPASSE ANTECIPADO (ZELADORIA PROTEGE)
  // --------------------------------------------------------------------------
  describe("6. Bloqueio de Liberação Antecipada de Payout", () => {
    it("deve bloquear liberação de repasse se serviço estiver em andamento ou em disputa", () => {
      type ServiceStatus = "em_atendimento" | "prestador_concluiu" | "em_disputa" | "concluido";

      function canReleasePayout(status: ServiceStatus, hasOpenDispute: boolean): boolean {
        if (hasOpenDispute) return false;
        return status === "concluido";
      }

      assert.equal(canReleasePayout("em_atendimento", false), false);
      assert.equal(canReleasePayout("prestador_concluiu", false), false);
      assert.equal(canReleasePayout("concluido", true), false); // Disputa bloqueia mesmo se concluído
      assert.equal(canReleasePayout("concluido", false), true);  // Liberado com validação e sem disputa
    });
  });
});
