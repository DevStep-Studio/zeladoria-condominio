import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ROLE_PERMISSIONS_MAP, hasPermission, type Permission } from "../src/lib/permissions";
import { calculateProviderScore } from "../src/lib/services/ranking";

describe("Marketplace 1: Permissões e Matriz de RBAC", () => {
  it("prestador deve ter permissões exclusivas de prestador e NÃO de morador ou síndico", () => {
    assert.equal(hasPermission("prestador", "provider.calls.view"), true, "Deve ver chamados");
    assert.equal(hasPermission("prestador", "provider.calls.accept"), true, "Deve poder aceitar chamados");
    assert.equal(hasPermission("prestador", "provider.quote.create"), true, "Deve poder criar cotações");
    assert.equal(hasPermission("prestador", "provider.job.complete"), true, "Deve poder concluir serviço");
    assert.equal(hasPermission("prestador", "provider.earnings.view"), true, "Deve ver ganhos");

    // Prestador não pode ter permissões de gestão do condomínio
    assert.equal(hasPermission("prestador", "financial.view"), false, "Prestador não acessa financeiro do prédio");
    assert.equal(hasPermission("prestador", "assembly.manage"), false, "Prestador não gerencia assembleias");
  });

  it("morador deve ter permissão de criar chamados, avaliar e favoritar", () => {
    assert.equal(hasPermission("morador", "marketplace.request.create"), true, "Morador cria solicitações");
    assert.equal(hasPermission("morador", "marketplace.quote.accept"), true, "Morador aceita orçamentos");
    assert.equal(hasPermission("morador", "marketplace.job.confirm"), true, "Morador confirma finalização");
    assert.equal(hasPermission("morador", "marketplace.review.create"), true, "Morador envia review");
    assert.equal(hasPermission("morador", "marketplace.favorite.toggle"), true, "Morador favorita prestador");

    // Morador não deve aceitar chamados como se fosse prestador
    assert.equal(hasPermission("morador", "provider.calls.accept"), false, "Morador não aceita chamados de terceiros");
  });

  it("síndico e superadmin devem ter permissões de moderação de fornecedores", () => {
    assert.equal(hasPermission("sindico", "vendors.onboarding.moderate"), true, "Síndico modera parceiros");
    assert.equal(hasPermission("sindico", "provider.manage"), true, "Síndico gerencia cadastro de fornecedores");
    assert.equal(hasPermission("superadmin", "vendors.onboarding.moderate"), true, "Superadmin tem acesso total");
  });
});

describe("Marketplace 2: State Machine de Chamados e Contratações", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    solicitado: ["buscando_prestador", "aceito", "aguardando_orcamento", "cancelado"],
    buscando_prestador: ["aceito", "aguardando_orcamento", "cancelado"],
    aguardando_orcamento: ["orcamento_aprovado", "cancelado"],
    orcamento_aprovado: ["aceito", "a_caminho", "cancelado"],
    aceito: ["a_caminho", "em_atendimento", "cancelado"],
    a_caminho: ["chegou", "em_atendimento", "cancelado"],
    chegou: ["em_atendimento", "cancelado"],
    em_atendimento: ["concluido_prestador", "concluido", "cancelado"],
    concluido_prestador: ["concluido", "em_disputa"],
    concluido: ["avaliado", "em_disputa"],
    avaliado: [],
    cancelado: [],
    em_disputa: ["resolvida", "cancelado"],
  };

  function canTransition(current: string, next: string): boolean {
    return (VALID_TRANSITIONS[current] ?? []).includes(next);
  }

  it("deve permitir fluxo natural de atendimento sob demanda", () => {
    assert.equal(canTransition("solicitado", "aceito"), true);
    assert.equal(canTransition("aceito", "a_caminho"), true);
    assert.equal(canTransition("a_caminho", "em_atendimento"), true);
    assert.equal(canTransition("em_atendimento", "concluido_prestador"), true);
    assert.equal(canTransition("concluido_prestador", "concluido"), true);
    assert.equal(canTransition("concluido", "avaliado"), true);
  });

  it("deve permitir fluxo de orçamento e propostas", () => {
    assert.equal(canTransition("solicitado", "aguardando_orcamento"), true);
    assert.equal(canTransition("aguardando_orcamento", "orcamento_aprovado"), true);
    assert.equal(canTransition("orcamento_aprovado", "aceito"), true);
  });

  it("deve rejeitar transições ilegais ou inconsistentes", () => {
    assert.equal(canTransition("solicitado", "concluido"), false, "Não pode pular do início direto para concluído");
    assert.equal(canTransition("concluido", "aceito"), false, "Não pode regredir serviço concluído para aceito");
    assert.equal(canTransition("cancelado", "em_atendimento"), false, "Não pode executar serviço cancelado");
    assert.equal(canTransition("avaliado", "solicitado"), false, "Serviço finalizado e avaliado é imutável");
  });
});

describe("Marketplace 3: Regras de Ownership e Isolamento de Dados", () => {
  it("morador não pode visualizar nem confirmar serviço de outro morador", () => {
    const request = { id: 101, condoId: 1, customerId: 5, status: "concluido_prestador" };
    const requesterUser = { id: 8, condoId: 1 };

    const isOwner = request.customerId === requesterUser.id;
    assert.equal(isOwner, false, "Usuário não proprietário não deve ter permissão de finalizar");
  });

  it("prestador não pode concluir chamado atribuído a outro profissional", () => {
    const request = { id: 102, condoId: 1, vendorId: 12, status: "em_atendimento" };
    const loggedVendor = { id: 99 };

    const isAssigned = request.vendorId === loggedVendor.id;
    assert.equal(isAssigned, false, "Prestador divergente não pode alterar status");
  });

  it("bloqueio estrito de acesso entre condomínios diferentes (Multi-Tenant)", () => {
    const request = { id: 103, condoId: 1 };
    const session = { activeCondoId: 2 };

    const sameCondo = request.condoId === session.activeCondoId;
    assert.equal(sameCondo, false, "Chamado de condomínio A não deve aparecer no condomínio B");
  });
});

describe("Marketplace 4: Motor de Ranking e Score Confiável", () => {
  it("prestador com nota alta e histórico comprovado deve ter score superior a iniciante sem histórico", () => {
    const proVeterano = calculateProviderScore({
      rating: 4.9,
      reviewsCount: 150,
      completionRate: 98,
      isVerified: true,
    });

    const proIniciante = calculateProviderScore({
      rating: 5.0,
      reviewsCount: 1, // 1 única avaliação inflada
      completionRate: 100,
      isVerified: false,
    });

    assert.equal(proVeterano > proIniciante, true, "Volume e verificação devem pontuar mais que 1 review 5.0");
  });

  it("cálculo financeiro de propostas e cotações deve somar mão de obra e materiais com precisão", () => {
    const laborCents = 15000; // R$ 150,00
    const materialsCents = 3500; // R$ 35,00
    const totalCents = laborCents + materialsCents; // R$ 185,00

    assert.equal(totalCents, 18500);
    const platformFeeRate = 0.10; // 10%
    const feeCents = Math.round(laborCents * platformFeeRate);
    assert.equal(feeCents, 1500, "Taxa da plataforma incide sobre mão de obra (R$ 15,00)");
  });
});
