import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { can, hasPermission, type Permission } from "../src/lib/permissions";
import { ALL_STAFF, EVERYONE, type Role } from "../src/lib/rbac";
import { getNavigationGroups, getMobileNavItems } from "../src/lib/navigation";

// --- Helpers para Simulação de Isolamento Multi-tenant e Sessão ---
const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const target = Buffer.from(hash, "hex");
  if (candidate.length !== target.length) return false;
  return timingSafeEqual(candidate, target);
}

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function parseSessionCookie(raw: string | undefined): number | null {
  if (!raw) return null;
  const [id, expires, signature] = raw.split(".");
  if (!id || !expires || !signature) return null;
  if (sign(`${id}.${expires}`) !== signature) return null;
  if (Number(expires) < Date.now()) return null;
  return Number(id);
}

describe("FASE 1 — FUNDAÇÃO: Auditoria, Multi-Tenancy, RBAC e Gestão de Condomínios", () => {
  // --------------------------------------------------------------------------
  // 1. ISOLAMENTO MULTI-TENANT E MODELAGEM DE CONDOMÍNIOS, BLOCOS E UNIDADES
  // --------------------------------------------------------------------------
  describe("1. Isolamento Multi-Tenant e Estrutura de Unidades", () => {
    it("deve gerar slug único, higienizado e sem caracteres especiais", () => {
      const name = "Condomínio Reserva das Flores & Bosque São Paulo!";
      const baseSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 45);

      assert.equal(baseSlug, "condominio-reserva-das-flores-bosque-sao-paul");
      assert.ok(!baseSlug.includes("&"));
      assert.ok(!baseSlug.includes(" "));
      assert.ok(!baseSlug.includes("!"));
    });

    it("deve calcular corretamente a numeração de andares e apartamentos ao criar blocos", () => {
      const unitsPerBlock = 16;
      const generatedUnits: { number: string; floor: number }[] = [];

      for (let u = 1; u <= unitsPerBlock; u++) {
        const floor = Math.floor((u - 1) / 4) + 1;
        const pos = ((u - 1) % 4) + 1;
        const unitNumber = `${floor}${pos < 10 ? "0" : ""}${pos}`;
        generatedUnits.push({ number: unitNumber, floor });
      }

      assert.equal(generatedUnits.length, 16);
      // Andar 1
      assert.deepEqual(generatedUnits[0], { number: "101", floor: 1 });
      assert.deepEqual(generatedUnits[3], { number: "104", floor: 1 });
      // Andar 2
      assert.deepEqual(generatedUnits[4], { number: "201", floor: 2 });
      assert.deepEqual(generatedUnits[7], { number: "204", floor: 2 });
      // Andar 4
      assert.deepEqual(generatedUnits[15], { number: "404", floor: 4 });
    });

    it("deve simular bloqueio de IDOR entre Condomínio A e Condomínio B", () => {
      // Simula uma tabela de ordens de serviço ou ocorrências vinculada a condoId
      interface TenantResource {
        id: number;
        condoId: number;
        title: string;
      }

      const mockDb: TenantResource[] = [
        { id: 101, condoId: 1, title: "Manutenção Bomba Condomínio A" },
        { id: 102, condoId: 2, title: "Reparo Portão Condomínio B" },
      ];

      function getResourceSecure(resourceId: number, userCondoId: number): TenantResource | null {
        const item = mockDb.find((r) => r.id === resourceId);
        if (!item || item.condoId !== userCondoId) {
          return null; // Isolamento rigoroso
        }
        return item;
      }

      // Usuário do Condomínio 1 tenta acessar recurso do Condomínio 1 -> Permitido
      const allowed = getResourceSecure(101, 1);
      assert.ok(allowed !== null);
      assert.equal(allowed?.title, "Manutenção Bomba Condomínio A");

      // Usuário do Condomínio 1 tenta acessar recurso do Condomínio 2 -> Bloqueado
      const forbidden = getResourceSecure(102, 1);
      assert.equal(forbidden, null, "Tentativa de acesso entre tenants deve ser bloqueada");
    });
  });

  // --------------------------------------------------------------------------
  // 2. AUTENTICAÇÃO E CRIPTOGRAFIA
  // --------------------------------------------------------------------------
  describe("2. Autenticação e Segurança de Sessão", () => {
    it("deve criar hashes de senha seguros com scrypt e salt aleatório", () => {
      const pass = "ZeladoriaAdmin2026";
      const hashA = hashPassword(pass);
      const hashB = hashPassword(pass);

      assert.notEqual(hashA, hashB, "Dois hashes para a mesma senha devem ter salts diferentes");
      assert.equal(verifyPassword(pass, hashA), true);
      assert.equal(verifyPassword(pass, hashB), true);
      assert.equal(verifyPassword("senhaInvalida", hashA), false);
    });

    it("deve rejeitar cookies de sessão adulterados ou expirados", () => {
      const validCookie = generateSessionCookie(42, 3600);
      assert.equal(parseSessionCookie(validCookie), 42);

      // Adulteração do ID
      const tamperedCookie = validCookie.replace(/^42\./, "99.");
      assert.equal(parseSessionCookie(tamperedCookie), null, "Cookie adulterado deve ser rejeitado");

      // Cookie já expirado (-10 segundos)
      const expiredCookie = generateSessionCookie(42, -10);
      assert.equal(parseSessionCookie(expiredCookie), null, "Cookie expirado deve ser rejeitado");
    });
  });

  // --------------------------------------------------------------------------
  // 3. RBAC E CONTROLE DE ACESSO
  // --------------------------------------------------------------------------
  describe("3. Papéis, Permissões e Contexto de Usuário", () => {
    it("Superadmin possui todas as permissões globais de administração", () => {
      assert.equal(can("superadmin", "platform.admin"), true);
      assert.equal(can("superadmin", "condominium.settings.manage"), true);
      assert.equal(can("superadmin", "user.manage"), true);
      assert.equal(can("superadmin", "financial.view"), true);
    });

    it("Síndico gerencia o condomínio mas não possui permissão de plataforma SaaS", () => {
      assert.equal(can("sindico", "occurrence.view_all"), true);
      assert.equal(can("sindico", "service_order.manage"), true);
      assert.equal(can("sindico", "financial.manage"), true);
      assert.equal(can("sindico", "user.manage"), true);
      assert.equal(can("sindico", "platform.admin"), false, "Síndico não pode ter permissão platform.admin");
    });

    it("Morador não possui acesso a rotas de gestão nem dados de outros moradores", () => {
      assert.equal(can("morador", "occurrence.view_own"), true);
      assert.equal(can("morador", "occurrence.create"), true);
      assert.equal(can("morador", "occurrence.view_all"), false);
      assert.equal(can("morador", "service_order.view"), false);
      assert.equal(can("morador", "user.manage"), false);
      assert.equal(can("morador", "financial.view"), false);
    });

    it("Prestador não possui permissões condominiais internas", () => {
      assert.equal(can("prestador", "provider.calls.view"), true);
      assert.equal(can("prestador", "provider.quote.create"), true);
      assert.equal(can("prestador", "occurrence.view_all"), false);
      assert.equal(can("prestador", "reservation.view_all"), false);
      assert.equal(can("prestador", "condominium.settings.manage"), false);
    });

    it("Zelador e Porteiro possuem permissões de staff operacional mas não financeiras", () => {
      assert.equal(can("zelador", "occurrence.view_all"), true);
      assert.equal(can("zelador", "service_order.manage"), true);
      assert.equal(can("zelador", "financial.manage"), false);

      assert.equal(can("porteiro", "occurrence.create"), true);
      assert.equal(can("porteiro", "financial.view"), false);
      assert.equal(can("porteiro", "condominium.settings.manage"), false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. NAVEGAÇÃO SEGREGADA POR ROLE
  // --------------------------------------------------------------------------
  describe("4. Navegação e Menus Isolados por Perfil", () => {
    it("Gera menus adequados e sem vazamentos para o perfil Morador", () => {
      const groups = getNavigationGroups("morador");
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

      assert.ok(allHrefs.includes("/painel/ocorrencias"));
      assert.ok(allHrefs.includes("/painel/reservas"));
      assert.ok(allHrefs.includes("/painel/servicos"));
      assert.ok(allHrefs.includes("/painel/servicos?tab=minhas-contratacoes"));

      // Não pode conter áreas restritas
      assert.ok(!allHrefs.includes("/painel/admin"));
      assert.ok(!allHrefs.includes("/painel/financeiro"));
      assert.ok(!allHrefs.includes("/painel/manutencao"));
    });

    it("Gera menus adequados para o perfil Prestador", () => {
      const groups = getNavigationGroups("prestador");
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

      assert.ok(allHrefs.includes("/prestador/chamados?tab=oportunidades"));
      assert.ok(allHrefs.includes("/prestador/agenda"));
      assert.ok(allHrefs.includes("/prestador/perfil"));
      assert.ok(allHrefs.includes("/prestador/ganhos"));

      // Não pode conter rotas de condomínio
      assert.ok(!allHrefs.includes("/painel/ocorrencias"));
      assert.ok(!allHrefs.includes("/painel/reservas"));
      assert.ok(!allHrefs.includes("/painel/admin"));
    });

    it("Gera menus administrativos completos para o Superadmin", () => {
      const groups = getNavigationGroups("superadmin");
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

      assert.ok(allHrefs.includes("/painel/admin/condominios"));
      assert.ok(allHrefs.includes("/painel/admin/usuarios"));
      assert.ok(allHrefs.includes("/painel/admin/prestadores"));
    });
  });
});
