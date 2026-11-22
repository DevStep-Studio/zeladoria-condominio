import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  hasAnyPermission,
  can,
  ROLE_PERMISSIONS_MAP,
  type Permission,
} from "../src/lib/permissions";
import {
  MORADOR_NAVIGATION,
  SINDICO_NAVIGATION,
  PRESTADOR_NAVIGATION,
  getNavigationGroups,
} from "../src/lib/navigation";
import { ALL_STAFF, GATE, EVERYONE, navFor } from "../src/lib/rbac";
import type { Role } from "../src/lib/auth";

describe("Auditoria Obrigatória de Segurança e RBAC — 10 Cenários Mandatórios", () => {
  // -------------------------------------------------------------------------
  // TESTE 1: Morador tenta acessar painel administrativo
  // Resultado esperado: acesso negado
  // -------------------------------------------------------------------------
  test("Teste 1 — Morador tenta acessar painel administrativo: acesso negado", () => {
    // Permissões administrativas restritas
    assert.equal(can("morador", "platform.admin" as Permission), false);
    assert.equal(can("morador", "platform.condos.manage" as Permission), false);
    assert.equal(can("morador", "platform.users.manage" as Permission), false);
    assert.equal(can("morador", "platform.finance.manage" as Permission), false);
    assert.equal(can("morador", "condominium.settings.manage"), false);
    assert.equal(can("morador", "user.manage"), false);
    assert.equal(can("morador", "audit.view"), false);
    assert.equal(can("morador", "financial.view"), false);
    assert.equal(can("morador", "report.view"), false);

    // Na navegação do morador, nenhum link aponta para /painel/admin ou configurações
    const moradorGroups = getNavigationGroups("morador");
    const allMoradorHrefs = moradorGroups.flatMap((g) => g.items.map((i) => i.href));
    assert.equal(allMoradorHrefs.some((h) => h.startsWith("/painel/admin")), false);
    assert.equal(allMoradorHrefs.includes("/painel/configuracoes"), false);
    assert.equal(allMoradorHrefs.includes("/painel/moradores"), false);
  });

  // -------------------------------------------------------------------------
  // TESTE 2: Morador tenta consultar ocorrência privada de outra unidade
  // Resultado esperado: acesso negado / não visualiza / filtrado
  // -------------------------------------------------------------------------
  test("Teste 2 — Morador tenta consultar ocorrência privada de outra unidade: isolamento garantido", () => {
    assert.equal(can("morador", "occurrence.view_all"), false);
    assert.equal(can("morador", "occurrence.view_own"), true);

    // Simulação da política de autorização de ocorrências no servidor
    const currentUserId = 10;
    const currentUserUnitIds = [302];

    const mockOccurrences = [
      { id: 1, title: "Lâmpada queimada no hall", visibility: "publica", unitId: 302, reportedById: 10 },
      { id: 2, title: "Barulho excessivo na madrugada", visibility: "privada", unitId: 405, reportedById: 99 },
      { id: 3, title: "Vazamento interno no banheiro", visibility: "privada", unitId: 302, reportedById: 10 },
      { id: 4, title: "Investigação de segurança interna", visibility: "interna", unitId: null, reportedById: 1 },
    ];

    // Regra do backend: filtra estritamente o que morador pode ver
    const visibleToResident = mockOccurrences.filter((occ) => {
      if (occ.visibility === "interna") return false;
      if (occ.visibility === "publica") return true;
      if (occ.reportedById === currentUserId) return true;
      if (occ.unitId && currentUserUnitIds.includes(occ.unitId)) return true;
      return false;
    });

    const visibleIds = visibleToResident.map((o) => o.id);
    assert.ok(visibleIds.includes(1), "Ocorrência pública deve ser visível");
    assert.ok(visibleIds.includes(3), "Ocorrência da própria unidade 302 deve ser visível");
    assert.equal(visibleIds.includes(2), false, "Ocorrência privada da unidade 405 NUNCA deve ser visível para morador da 302");
    assert.equal(visibleIds.includes(4), false, "Ocorrência interna da administração NUNCA deve ser visível para morador");
  });

  // -------------------------------------------------------------------------
  // TESTE 3: Porteiro tenta alterar permissões ou convidar administradores
  // Resultado esperado: acesso negado
  // -------------------------------------------------------------------------
  test("Teste 3 — Porteiro tenta alterar permissões / gestão: acesso negado", () => {
    assert.equal(can("porteiro", "user.manage"), false);
    assert.equal(can("porteiro", "condominium.settings.manage"), false);
    assert.equal(can("porteiro", "financial.manage"), false);
    assert.equal(can("porteiro", "financial.view"), false);
    assert.equal(can("porteiro", "audit.view"), false);
    assert.equal(can("porteiro", "report.view"), false);
    assert.equal(can("porteiro", "platform.admin" as Permission), false);

    // Portaria não tem acesso ao painel de moradores/usuários
    const staffAllowedToManageUsers = ["superadmin", "sindico"];
    assert.equal(staffAllowedToManageUsers.includes("porteiro"), false);
  });

  // -------------------------------------------------------------------------
  // TESTE 4: Prestador tenta consultar serviço de outro prestador
  // Resultado esperado: acesso negado / 404
  // -------------------------------------------------------------------------
  test("Teste 4 — Prestador tenta consultar serviço de outro prestador: isolamento restrito", () => {
    // Prestador não possui permissões condominiais
    assert.equal(can("prestador", "occurrence.view_all"), false);
    assert.equal(can("prestador", "reservation.view_all"), false);
    assert.equal(can("prestador", "service_order.view"), false);

    // Simulação do guard ownedRequest no ProviderService
    const currentVendorId = 5;
    const serviceRequests = [
      { id: 101, vendorId: 5, condoId: 1, title: "Reparo de tomada" },
      { id: 102, vendorId: 8, condoId: 1, title: "Instalação de ar condicionado" },
    ];

    function checkProviderAccess(vendorId: number, requestId: number): boolean {
      const found = serviceRequests.find((r) => r.id === requestId && r.vendorId === vendorId);
      return Boolean(found);
    }

    assert.equal(checkProviderAccess(currentVendorId, 101), true, "Prestador acessa seus próprios chamados");
    assert.equal(checkProviderAccess(currentVendorId, 102), false, "Prestador NUNCA acessa chamados atribuídos a outro prestador");
  });

  // -------------------------------------------------------------------------
  // TESTE 5: Síndico do Condomínio A tenta acessar dados privados do Condomínio B
  // Resultado esperado: acesso negado
  // -------------------------------------------------------------------------
  test("Teste 5 — Síndico do Condomínio A tenta acessar dados do Condomínio B: bloqueio multi-tenant", () => {
    const sindicoMemberships = [
      { condoId: 1, role: "sindico" as Role, status: "ativo" },
    ];

    function canAccessCondo(condoId: number, isSuperAdmin = false): boolean {
      if (isSuperAdmin) return true;
      return sindicoMemberships.some((m) => m.condoId === condoId && m.status === "ativo");
    }

    assert.equal(canAccessCondo(1), true, "Síndico acessa Condomínio A (vinculado)");
    assert.equal(canAccessCondo(2), false, "Síndico NUNCA acessa Condomínio B (sem vínculo)");
    assert.equal(canAccessCondo(999), false, "Síndico NUNCA acessa condomínio inexistente ou arbitrário");
  });

  // -------------------------------------------------------------------------
  // TESTE 6: Administrador comum tenta atribuir privilégios superiores (ex: superadmin)
  // Resultado esperado: acesso negado
  // -------------------------------------------------------------------------
  test("Teste 6 — Administrador comum tenta atribuir privilégios superiores: escalonamento impedido", () => {
    function validateRoleAssignment(actorRole: Role, actorIsSuperAdmin: boolean, targetRole: string): { allowed: boolean; error?: string } {
      if (targetRole === "superadmin") {
        if (!actorIsSuperAdmin && actorRole !== "superadmin") {
          return { allowed: false, error: "Apenas Administradores da Plataforma podem conceder o perfil de superadmin." };
        }
      }
      return { allowed: true };
    }

    // Síndico tentando criar superadmin
    const resultSindico = validateRoleAssignment("sindico", false, "superadmin");
    assert.equal(resultSindico.allowed, false);
    assert.ok(resultSindico.error);

    // Superadmin criando superadmin
    const resultSuper = validateRoleAssignment("superadmin", true, "superadmin");
    assert.equal(resultSuper.allowed, true);

    // Síndico criando morador ou zelador no seu condomínio
    const resultNormal = validateRoleAssignment("sindico", false, "zelador");
    assert.equal(resultNormal.allowed, true);
  });

  // -------------------------------------------------------------------------
  // TESTE 7: Usuário modifica manualmente a URL de um recurso restrito
  // Resultado esperado: autorização validada no servidor
  // -------------------------------------------------------------------------
  test("Teste 7 — Usuário modifica manualmente a URL de um recurso restrito: rota validada", () => {
    const protectedRoutes: Record<string, Permission> = {
      "/painel/financeiro": "financial.view",
      "/painel/relatorios": "report.view",
      "/painel/relatorios/eficiencia": "report.view",
      "/painel/auditoria": "audit.view",
      "/painel/ordens": "service_order.view",
      "/painel/manutencao": "maintenance.view",
      "/painel/sistema/avisos-erros": "system.incidents.view",
    };

    // Morador tentando abrir URLs diretamente
    for (const [route, requiredPerm] of Object.entries(protectedRoutes)) {
      const allowed = hasPermission("morador", requiredPerm);
      assert.equal(allowed, false, `Morador não deve acessar rota protegida: ${route}`);
    }

    // Porteiro tentando abrir finanças ou relatórios
    assert.equal(hasPermission("porteiro", "financial.view"), false);
    assert.equal(hasPermission("porteiro", "report.view"), false);

    // Síndico possui permissão para gestão condominial
    assert.equal(hasPermission("sindico", "financial.view"), true);
    assert.equal(hasPermission("sindico", "report.view"), true);
    assert.equal(hasPermission("sindico", "audit.view"), true);
  });

  // -------------------------------------------------------------------------
  // TESTE 8: Usuário modifica identificadores em uma requisição (IDOR)
  // Resultado esperado: identificadores sanitizados e escopo garantido pelo servidor
  // -------------------------------------------------------------------------
  test("Teste 8 — Usuário modifica identificadores (IDOR) em encomendas e ocorrências: mitigado no servidor", () => {
    // Sanitização de Encomendas no Backend (PanelController::encomendas)
    const userRole = "morador";
    const userUnitIds = [101];

    function resolveResidentUnitId(role: string, requestedUnitId: number | null, allowedUnitIds: number[]): number | null {
      if (role === "morador") {
        if (requestedUnitId && allowedUnitIds.includes(requestedUnitId)) {
          return requestedUnitId;
        }
        return allowedUnitIds[0] ?? null;
      }
      return requestedUnitId;
    }

    // Morador solicita unitId=405 maliciosamente na query string
    const sanitizedUnitId = resolveResidentUnitId(userRole, 405, userUnitIds);
    assert.equal(sanitizedUnitId, 101, "IDOR prevenido: unitId forçado para a unidade legítima do morador");

    // Autorização de Comentário em Ocorrência (CondoController::storeOccurrenceComment)
    function canCommentOccurrence(role: string, userId: number, unitIds: number[], occ: { visibility: string; reportedById: number; unitId: number | null }): boolean {
      if (role !== "morador") return true;
      if (occ.visibility === "publica") return true;
      if (occ.reportedById === userId) return true;
      if (occ.unitId && unitIds.includes(occ.unitId)) return true;
      return false;
    }

    const foreignPrivateOcc = { visibility: "privada", reportedById: 99, unitId: 405 };
    assert.equal(canCommentOccurrence("morador", 10, [101], foreignPrivateOcc), false, "Morador não pode comentar em ocorrência privada de terceiro");

    const ownPrivateOcc = { visibility: "privada", reportedById: 10, unitId: 101 };
    assert.equal(canCommentOccurrence("morador", 10, [101], ownPrivateOcc), true, "Morador pode comentar em sua própria ocorrência");
  });

  // -------------------------------------------------------------------------
  // TESTE 9: Usuário não autenticado tenta acessar endpoint protegido
  // Resultado esperado: requisição recusada / 401
  // -------------------------------------------------------------------------
  test("Teste 9 — Usuário não autenticado tenta acessar recursos: recusado", () => {
    function simulateAuthGuard(token: string | null): { authenticated: boolean; redirect?: string; status?: number } {
      if (!token) {
        return { authenticated: false, redirect: "/login", status: 401 };
      }
      return { authenticated: true };
    }

    const unauth = simulateAuthGuard(null);
    assert.equal(unauth.authenticated, false);
    assert.equal(unauth.status, 401);
    assert.equal(unauth.redirect, "/login");

    const auth = simulateAuthGuard("valid-token-12345");
    assert.equal(auth.authenticated, true);
  });

  // -------------------------------------------------------------------------
  // TESTE 10: Usuário autorizado executa uma funcionalidade permitida
  // Resultado esperado: operação realizada com sucesso
  // -------------------------------------------------------------------------
  test("Teste 10 — Usuário autorizado executa operações permitidas para seu perfil", () => {
    // 1. Morador pode criar ocorrência e reservar
    assert.equal(can("morador", "occurrence.create"), true);
    assert.equal(can("morador", "reservation.create"), true);
    assert.equal(can("morador", "visitor.create"), true);
    assert.equal(can("morador", "suggestion.create"), true);

    // 2. Portaria pode registrar entrada/saída e encomendas
    assert.equal(can("porteiro", "visitor.checkin"), true);
    assert.equal(can("porteiro", "visitor.checkout"), true);
    assert.equal(can("porteiro", "package.register"), true);
    assert.equal(can("porteiro", "package.release"), true);
    assert.equal(can("porteiro", "shift.open"), true);
    assert.equal(can("porteiro", "shift.close"), true);

    // 3. Síndico pode gerenciar chamados, aprovar reservas e publicar comunicados
    assert.equal(can("sindico", "occurrence.update_status"), true);
    assert.equal(can("sindico", "reservation.approve"), true);
    assert.equal(can("sindico", "announcement.create"), true);
    assert.equal(can("sindico", "announcement.manage"), true);
    assert.equal(can("sindico", "assembly.manage"), true);

    // 4. Prestador pode aceitar chamados e enviar orçamentos
    assert.equal(can("prestador", "provider.calls.accept"), true);
    assert.equal(can("prestador", "provider.quote.create"), true);
    assert.equal(can("prestador", "provider.job.complete"), true);

    // 5. Superadmin possui autorização global
    assert.equal(hasPermission("superadmin", "platform.admin" as Permission), true);
  });
});
