import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  can,
  type Permission,
} from "../src/lib/permissions";
import {
  getNavigationGroups,
  getMobileNavItems,
} from "../src/lib/navigation";
import type { Role } from "../src/lib/auth";

describe("Navegação por Perfil e RBAC — Auditoria e Matrizes de Acesso", () => {
  // -------------------------------------------------------------
  // 1. MATRIZ DE ROLES & PERMISSÕES
  // -------------------------------------------------------------
  test("Morador não deve possuir permissões administrativas ou de gestão", () => {
    // Permissões permitidas para Morador
    assert.equal(can("morador", "occurrence.view_own"), true);
    assert.equal(can("morador", "occurrence.create"), true);
    assert.equal(can("morador", "reservation.view_own"), true);
    assert.equal(can("morador", "reservation.create"), true);
    assert.equal(can("morador", "provider.view"), true);
    assert.equal(can("morador", "marketplace.request.create"), true);

    // Permissões proibidas para Morador
    assert.equal(can("morador", "occurrence.view_all"), false);
    assert.equal(can("morador", "service_order.view"), false);
    assert.equal(can("morador", "maintenance.view"), false);
    assert.equal(can("morador", "user.manage"), false);
    assert.equal(can("morador", "audit.view"), false);
    assert.equal(can("morador", "condominium.settings.manage"), false);
    assert.equal(can("morador", "financial.view"), false);
    assert.equal(can("morador", "platform.admin" as Permission), false);
  });

  test("Prestador não deve possuir nenhuma função de administração condominial", () => {
    // Permissões permitidas para Prestador
    assert.equal(can("prestador", "provider.calls.view"), true);
    assert.equal(can("prestador", "provider.quote.create"), true);
    assert.equal(can("prestador", "provider.profile.update"), true);
    assert.equal(can("prestador", "provider.earnings.view"), true);

    // Proibido para Prestador
    assert.equal(can("prestador", "reservation.view_own"), false);
    assert.equal(can("prestador", "reservation.view_all"), false);
    assert.equal(can("prestador", "assembly.view"), false);
    assert.equal(can("prestador", "document.view"), false);
    assert.equal(can("prestador", "occurrence.view_all"), false);
    assert.equal(can("prestador", "service_order.view"), false);
    assert.equal(can("prestador", "financial.view"), false);
    assert.equal(can("prestador", "condominium.settings.manage"), false);
    assert.equal(can("prestador", "platform.admin" as Permission), false);
  });

  test("Síndico deve gerenciar condomínio mas não é Admin da Plataforma", () => {
    // Síndico gerencia seu condomínio
    assert.equal(can("sindico", "occurrence.view_all"), true);
    assert.equal(can("sindico", "service_order.view"), true);
    assert.equal(can("sindico", "maintenance.view"), true);
    assert.equal(can("sindico", "reservation.view_all"), true);
    assert.equal(can("sindico", "user.manage"), true);
    assert.equal(can("sindico", "audit.view"), true);
    assert.equal(can("sindico", "condominium.settings.manage"), true);

    // Síndico NÃO é Admin do ecossistema Zeladoria
    assert.equal(can("sindico", "platform.admin" as Permission), false);
  });

  test("Superadmin possui acesso completo à plataforma", () => {
    assert.equal(hasPermission("superadmin", "platform.admin" as Permission), true);
    assert.equal(hasPermission("superadmin", "occurrence.view_all"), true);
    assert.equal(hasPermission("superadmin", "condominium.settings.manage"), true);
  });

  // -------------------------------------------------------------
  // 2. CONFIGURAÇÃO CENTRAL DE NAVEGAÇÃO DESKTOP
  // -------------------------------------------------------------
  test("Menu do Morador reflete sua rotina e serviços sem poluição administrativa", () => {
    const groups = getNavigationGroups("morador");
    const groupTitles = groups.map((g) => g.title.toLowerCase());

    assert.ok(groupTitles.includes("minha rotina"), "Deve conter Minha rotina");
    assert.ok(groupTitles.includes("condomínio"), "Deve conter Condomínio");
    assert.ok(groupTitles.includes("serviços"), "Deve conter Serviços");
    assert.ok(groupTitles.includes("conta"), "Deve conter Conta");

    // Garantir que não exibe grupos administrativos
    assert.equal(groupTitles.includes("operação"), false);
    assert.equal(groupTitles.includes("gestão"), false);
    assert.equal(groupTitles.includes("administração"), false);
    assert.equal(groupTitles.includes("plataforma"), false);
    assert.equal(groupTitles.includes("zeladoria pay"), false);

    // Itens específicos
    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    assert.ok(allHrefs.includes("/painel/ocorrencias"));
    assert.ok(allHrefs.includes("/painel/reservas"));
    assert.ok(allHrefs.includes("/painel/visitantes"));
    assert.ok(allHrefs.includes("/painel/encomendas"));
    assert.ok(allHrefs.includes("/painel/servicos"));
    assert.ok(allHrefs.includes("/painel/servicos?tab=minhas-contratacoes"));
    assert.ok(allHrefs.includes("/painel/servicos?tab=favoritos"));
    assert.ok(allHrefs.includes("/painel/perfil"));
    assert.ok(allHrefs.includes("/painel/ajuda"));

    // Proibidos para morador
    assert.equal(allHrefs.includes("/painel/ordens"), false);
    assert.equal(allHrefs.includes("/painel/manutencao"), false);
    assert.equal(allHrefs.includes("/painel/moradores"), false);
    assert.equal(allHrefs.includes("/painel/configuracoes"), false);
    assert.equal(allHrefs.includes("/painel/admin/zeladoria-pay"), false);
  });

  test("Menu do Síndico contém as áreas de gestão e operação", () => {
    const groups = getNavigationGroups("sindico");
    const groupTitles = groups.map((g) => g.title.toLowerCase());

    assert.ok(groupTitles.includes("operação"), "Deve conter Operação");
    assert.ok(groupTitles.includes("comunidade"), "Deve conter Comunidade");
    assert.ok(groupTitles.includes("comunicação"), "Deve conter Comunicação");
    assert.ok(groupTitles.includes("serviços"), "Deve conter Serviços");
    assert.ok(groupTitles.includes("gestão"), "Deve conter Gestão");
    assert.ok(groupTitles.includes("administração"), "Deve conter Administração");

    // Proibido no menu do síndico
    assert.equal(groupTitles.includes("plataforma"), false);
    assert.equal(groupTitles.includes("trabalho"), false);
    assert.equal(groupTitles.includes("meu negócio"), false);

    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    assert.ok(allHrefs.includes("/painel/ocorrencias"));
    assert.ok(allHrefs.includes("/painel/ordens"));
    assert.ok(allHrefs.includes("/painel/manutencao"));
    assert.ok(allHrefs.includes("/painel/reservas"));
    assert.ok(allHrefs.includes("/painel/visitantes"));
    assert.ok(allHrefs.includes("/painel/comunicados"));
    assert.ok(allHrefs.includes("/painel/assembleias"));
    assert.ok(allHrefs.includes("/painel/moradores"));
    assert.ok(allHrefs.includes("/painel/configuracoes"));
    assert.ok(allHrefs.includes("/painel/auditoria"));
  });

  test("Menu do Prestador prioriza Oportunidades, Atendimentos e Negócio sem funções condominiais", () => {
    const groups = getNavigationGroups("prestador");
    const groupTitles = groups.map((g) => g.title.toLowerCase());

    assert.ok(groupTitles.includes("trabalho"), "Deve conter Trabalho");
    assert.ok(groupTitles.includes("meu negócio"), "Deve conter Meu negócio");
    assert.ok(groupTitles.includes("reputação"), "Deve conter Reputação");
    assert.ok(groupTitles.includes("financeiro"), "Deve conter Financeiro");
    assert.ok(groupTitles.includes("crescimento"), "Deve conter Crescimento");
    assert.ok(groupTitles.includes("conta"), "Deve conter Conta");

    // Proibido no menu do prestador
    assert.equal(groupTitles.includes("Minha Rotina"), false);
    assert.equal(groupTitles.includes("Operação"), false);
    assert.equal(groupTitles.includes("Gestão"), false);
    assert.equal(groupTitles.includes("Administração"), false);

    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    // Prioridade máxima: Oportunidades e Atendimentos
    assert.ok(allHrefs.includes("/prestador/chamados?tab=oportunidades"));
    assert.ok(allHrefs.includes("/prestador/chamados?tab=atendimentos"));
    assert.ok(allHrefs.includes("/prestador/chamados?tab=orcamentos"));
    assert.ok(allHrefs.includes("/prestador/agenda"));
    assert.ok(allHrefs.includes("/prestador/perfil"));
    assert.ok(allHrefs.includes("/prestador/servicos"));
    assert.ok(allHrefs.includes("/prestador/portfolio"));
    assert.ok(allHrefs.includes("/prestador/disponibilidade"));
    assert.ok(allHrefs.includes("/prestador/avaliacoes"));
    assert.ok(allHrefs.includes("/prestador/ganhos"));
    assert.ok(allHrefs.includes("/prestador/destaque"));
  });

  test("Menu do Admin da Plataforma foca no ecossistema e negócio", () => {
    const groups = getNavigationGroups("superadmin");
    const groupTitles = groups.map((g) => g.title);

    assert.ok(groupTitles.includes("Plataforma"), "Deve conter Plataforma");
    assert.ok(groupTitles.includes("Marketplace"), "Deve conter Marketplace");
    assert.ok(groupTitles.includes("Zeladoria Pay"), "Deve conter Zeladoria Pay");
    assert.ok(groupTitles.includes("Operação"), "Deve conter Operação");
    assert.ok(groupTitles.includes("Sistema"), "Deve conter Sistema");

    const allHrefs = groups.flatMap((g) => [g.href, ...g.items.map((i) => i.href)].filter(Boolean) as string[]);
    assert.ok(allHrefs.includes("/painel/admin/condominios"));
    assert.ok(allHrefs.includes("/painel/admin/marketplace"));
    assert.ok(allHrefs.includes("/painel/admin/zeladoria-pay?tab=pagamentos"));
    assert.ok(allHrefs.includes("/painel/chamados"));
    assert.ok(allHrefs.includes("/painel/auditoria"));
  });

  // -------------------------------------------------------------
  // 3. NAVEGAÇÃO MOBILE (BOTTOM NAV) ESPECÍFICA POR PERFIL
  // -------------------------------------------------------------
  test("Bottom Navigation móvel possui no máximo 5 itens e segue especificação de cada perfil", () => {
    const moradorMobile = getMobileNavItems("morador");
    assert.equal(moradorMobile.length <= 5, true);
    assert.deepEqual(
      moradorMobile.map((i) => i.id),
      ["inicio", "ocorrencias", "reservas", "servicos", "perfil"]
    );

    const prestadorMobile = getMobileNavItems("prestador");
    assert.equal(prestadorMobile.length <= 5, true);
    assert.deepEqual(
      prestadorMobile.map((i) => i.id),
      ["inicio", "oportunidades", "atendimentos", "financeiro", "perfil"]
    );

    const sindicoMobile = getMobileNavItems("sindico");
    assert.equal(sindicoMobile.length <= 5, true);
    assert.deepEqual(
      sindicoMobile.map((i) => i.id),
      ["inicio", "pendencias", "operacao", "comunidade", "mais"]
    );

    const adminMobile = getMobileNavItems("superadmin");
    assert.equal(adminMobile.length <= 5, true);
    assert.deepEqual(
      adminMobile.map((i) => i.id),
      ["dashboard", "marketplace", "financeiro", "alertas", "mais"]
    );
  });

  // -------------------------------------------------------------
  // 4. TESTE MULTI-ROLE & CONTEXT SWITCHING (Seções 30, 31, 56)
  // -------------------------------------------------------------
  test("Usuário com múltiplos papéis (Morador no A, Síndico no B, Prestador) alterna contexto com recálculo instantâneo", () => {
    // Simulação do usuário Rafael
    const rafaelMemberships = [
      { condoId: 101, condoName: "Residencial A", role: "morador" as Role },
      { condoId: 102, condoName: "Condomínio B", role: "sindico" as Role },
    ];
    const hasVendorProfile = true;

    // 1. Cálculo de availableRoles para Rafael
    const availableRoles = new Set<Role>();
    rafaelMemberships.forEach((m) => availableRoles.add(m.role));
    if (hasVendorProfile) availableRoles.add("prestador");

    assert.equal(availableRoles.has("morador"), true);
    assert.equal(availableRoles.has("sindico"), true);
    assert.equal(availableRoles.has("prestador"), true);
    assert.equal(availableRoles.has("superadmin"), false); // Rafael não é admin da plataforma

    // 2. Quando Rafael atua como Morador (Condomínio A)
    const activeRoleMorador = "morador" as Role;
    const moradorNav = getNavigationGroups(activeRoleMorador);
    const moradorTitles = moradorNav.map((g) => g.title.toLowerCase());
    assert.ok(moradorTitles.includes("minha rotina"));
    assert.equal(moradorTitles.includes("operação"), false);
    assert.equal(can(activeRoleMorador, "service_order.view"), false);
    assert.equal(can(activeRoleMorador, "occurrence.view_own"), true);

    // 3. Quando Rafael alterna para Síndico (Condomínio B)
    const activeRoleSindico = "sindico" as Role;
    const sindicoNav = getNavigationGroups(activeRoleSindico);
    const sindicoTitles = sindicoNav.map((g) => g.title.toLowerCase());
    assert.ok(sindicoTitles.includes("operação"));
    assert.ok(sindicoTitles.includes("gestão"));
    assert.equal(sindicoTitles.includes("trabalho"), false);
    assert.equal(can(activeRoleSindico, "service_order.view"), true);
    assert.equal(can(activeRoleSindico, "platform.admin" as Permission), false);

    // 4. Quando Rafael alterna para Prestador
    const activeRolePrestador = "prestador" as Role;
    const prestadorNav = getNavigationGroups(activeRolePrestador);
    const prestadorTitles = prestadorNav.map((g) => g.title.toLowerCase());
    assert.ok(prestadorTitles.includes("trabalho"));
    assert.ok(prestadorTitles.includes("meu negócio"));
    assert.ok(prestadorTitles.includes("financeiro"));
    assert.equal(prestadorTitles.includes("minha rotina"), false);
    assert.equal(prestadorTitles.includes("operação"), false);
    assert.equal(can(activeRolePrestador, "reservation.view_all"), false);
    assert.equal(can(activeRolePrestador, "provider.calls.view"), true);
  });

  // -------------------------------------------------------------
  // 5. TESTES DE SEGURANÇA E ROUTE GUARDS (Seções 2, 41, 52-55)
  // -------------------------------------------------------------
  test("Route Guards: Morador e Síndico não podem acessar rotas de plataforma nem vazar dados", () => {
    // Morador tentando /admin ou funções de síndico
    assert.equal(can("morador", "platform.admin" as Permission), false);
    assert.equal(can("morador", "platform.marketplace.manage" as Permission), false);
    assert.equal(can("morador", "service_order.view"), false);
    assert.equal(can("morador", "maintenance.view"), false);

    // Prestador tentando áreas condominiais
    assert.equal(can("prestador", "occurrence.view_all"), false);
    assert.equal(can("prestador", "reservation.view_all"), false);
    assert.equal(can("prestador", "condominium.settings.manage"), false);

    // Síndico tentando área da plataforma
    assert.equal(can("sindico", "platform.admin" as Permission), false);
    assert.equal(can("sindico", "platform.condos.manage" as Permission), false);

    // Apenas superadmin acessa plataforma
    assert.equal(can("superadmin", "platform.admin" as Permission), true);
    assert.equal(can("superadmin", "platform.marketplace.manage" as Permission), true);
  });
});
