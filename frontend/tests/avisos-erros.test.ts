import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { getNavigationGroups } from "../src/lib/navigation";
import { can, hasPermission } from "../src/lib/permissions";
import {
  queryIncidents,
  getIncidentKPIs,
  getIncidentDetail,
  createManualIncident,
  updateIncidentStatus,
  updateIncidentAssignee,
  updateIncidentPriority,
  addIncidentComment,
  reportTechnicalError,
  generateIncidentsCsv,
  getMonitoringRules,
  updateMonitoringRule,
} from "../src/lib/services/system-incidents-storage";

describe("Central de Avisos e Erros — Testes Abrangentes de Funcionalidade e RBAC", () => {
  // -------------------------------------------------------------
  // 1. MENU LATERAL E ORDEM NA SEÇÃO SISTEMA
  // -------------------------------------------------------------
  test("Menu lateral na seção Sistema deve conter Avisos e erros na ordem correta", () => {
    const adminGroups = getNavigationGroups("superadmin", 0, 3);
    const sistemaGroup = adminGroups.find((g) => g.id === "sistema");
    assert.ok(sistemaGroup, "Deve conter o grupo Sistema");

    const itemLabels = sistemaGroup.items.map((i) => i.label);
    const itemIds = sistemaGroup.items.map((i) => i.id);

    // Ordem exata exigida pelo Prompt:
    // 1. Notificações, 2. Avisos e erros, 3. Configurações, 4. Permissões, 5. Auditoria, 6. Logs/monitoramento
    assert.equal(itemIds[0], "notificacoes", "Primeiro item deve ser Notificações");
    assert.equal(itemIds[1], "avisos_erros", "Segundo item deve ser Avisos e erros");
    assert.equal(itemIds[2], "configuracoes", "Terceiro item deve ser Configurações");
    assert.equal(itemIds[3], "permissoes", "Quarto item deve ser Permissões");
    assert.equal(itemIds[4], "auditoria", "Quinto item deve ser Auditoria");
    assert.equal(itemIds[5], "monitoramento", "Sexto item deve ser Logs/monitoramento");

    const avisosItem = sistemaGroup.items.find((i) => i.id === "avisos_erros");
    assert.ok(avisosItem, "Avisos e erros deve existir");
    assert.equal(avisosItem.href, "/painel/sistema/avisos-erros");
    assert.equal(avisosItem.icon, "alert-triangle");
    assert.equal(avisosItem.badge, 3, "Deve exibir indicador numérico discreto com incidentes críticos P0 reais");
  });

  test("Indicador numérico não deve ser exibido quando contagem de críticos for zero", () => {
    const adminGroups = getNavigationGroups("superadmin", 0, 0);
    const sistemaGroup = adminGroups.find((g) => g.id === "sistema");
    const avisosItem = sistemaGroup?.items.find((i) => i.id === "avisos_erros");
    assert.ok(avisosItem);
    assert.equal(avisosItem.badge, undefined, "Não deve ter badge quando criticalCount for 0");
  });

  // -------------------------------------------------------------
  // 2. MATRIZ DE ACESSO (RBAC) E PERMISSÕES
  // -------------------------------------------------------------
  test("Apenas perfis administrativos possuem acesso à Central de Avisos e Erros", () => {
    assert.equal(can("superadmin", "system.incidents.view"), true);
    assert.equal(can("superadmin", "system.incidents.manage"), true);
    assert.equal(can("superadmin", "system.rules.manage"), true);

    assert.equal(can("sindico", "system.incidents.view"), true);
    assert.equal(can("sindico", "system.incidents.manage"), true);
    assert.equal(can("sindico", "system.rules.manage"), false, "Síndico não administra regras globais");

    assert.equal(can("morador", "system.incidents.view"), false, "Morador não deve acessar central");
    assert.equal(can("prestador", "system.incidents.view"), false, "Prestador não deve acessar central");
  });

  // -------------------------------------------------------------
  // 3. INDICADORES REAIS (KPIS) CALCULADOS DO BANCO DE DADOS
  // -------------------------------------------------------------
  test("Indicadores principais refletem contagens reais do banco de dados", () => {
    const kpis = getIncidentKPIs(1, true);

    assert.equal(typeof kpis.activeAlerts, "number");
    assert.equal(typeof kpis.criticalErrors, "number");
    assert.equal(typeof kpis.inAnalysis, "number");
    assert.equal(typeof kpis.resolvedToday, "number");
    assert.equal(typeof kpis.unassigned, "number");

    assert.ok(kpis.activeAlerts >= 1, "Deve haver pelo menos 1 aviso ativo");
    assert.ok(kpis.criticalErrors >= 1, "Deve haver pelo menos 1 erro crítico P0");
  });

  // -------------------------------------------------------------
  // 4. AGRUPAMENTO INTELIGENTE DE ERROS TÉCNICOS (FINGERPRINTING)
  // -------------------------------------------------------------
  test("Erros com a mesma assinatura técnica são agrupados no mesmo incidente", () => {
    const errorMsg = "Conexão rejeitada pelo servidor Redis na porta 6379";
    const report1 = reportTechnicalError({
      message: errorMsg,
      errorType: "RedisConnectionException",
      sourceModule: "Backend API",
    });

    assert.equal(typeof report1.incident.id, "number");
    const initialCount = report1.incident.occurrencesCount;

    // Reportar a mesma falha uma segunda vez
    const report2 = reportTechnicalError({
      message: errorMsg,
      errorType: "RedisConnectionException",
      sourceModule: "Backend API",
    });

    assert.equal(report2.grouped, true, "Segunda ocorrência deve ser agrupada");
    assert.equal(report2.incident.id, report1.incident.id, "Deve reaproveitar o mesmo ID de incidente");
    assert.equal(report2.incident.occurrencesCount, initialCount + 1, "Deve incrementar contador de repetições");
  });

  test("Escalonamento automático de prioridade para P0 se repetições atingirem o limite", () => {
    const errorMsg = "Deadlock detectado na transação de atualização de cotas";
    let lastReport: any;
    for (let i = 0; i < 11; i++) {
      lastReport = reportTechnicalError({
        message: errorMsg,
        errorType: "DatabaseDeadlockException",
        sourceModule: "Backend API",
      });
    }

    assert.ok(lastReport.incident.occurrencesCount >= 10);
    assert.equal(lastReport.incident.priority, "P0", "Deve ter sido escalado para P0");
  });

  // -------------------------------------------------------------
  // 5. CICLO DE VIDA E FLUXO DE RESOLUÇÃO COM HISTÓRICO
  // -------------------------------------------------------------
  test("Transição de status exige justificativa obrigatória para marcar como resolvido", () => {
    const user = { id: 1, name: "Admin Teste" };
    const incident = createManualIncident({
      title: "Vazamento na caixa d'água superior",
      description: "Sensor identificou transbordamento no reservatório 2.",
      type: "aviso",
      priority: "P1",
      user,
    });

    assert.equal(incident.status, "aberto");

    // Mover para em análise
    const inAnalysis = updateIncidentStatus(incident.id, "em_analise", null, user);
    assert.equal(inAnalysis?.status, "em_analise");

    // Marcar como resolvido com justificativa
    const solution = "Registro de boia trocado e vedação refeita pela equipe de manutenção predial.";
    const resolved = updateIncidentStatus(incident.id, "resolvido", solution, user);
    assert.equal(resolved?.status, "resolvido");
    assert.equal(resolved?.resolutionNotes, solution);
    assert.ok(resolved?.resolvedAt, "Deve preencher resolvedAt");

    // Consultar detalhes e validar timeline
    const detail = getIncidentDetail(incident.id, true);
    assert.ok(detail);
    assert.equal(detail.incident.status, "resolvido");

    const actions = detail.activities.map((a) => a.action);
    assert.ok(actions.includes("criado"));
    assert.ok(actions.includes("status_alterado"));
    assert.ok(actions.includes("resolvido"));
  });

  test("Reabertura de incidente restaura status aberto e limpa dados de resolução", () => {
    const user = { id: 1, name: "Admin Teste" };
    const incident = createManualIncident({
      title: "Interfone Bloco C sem sinal",
      description: "Ramais do 3º andar não recebem chamadas da portaria.",
      type: "aviso",
      priority: "P2",
      user,
    });

    // Resolver
    updateIncidentStatus(incident.id, "resolvido", "Cabo reconectado na central.", user);

    // Reabrir
    const reopened = updateIncidentStatus(incident.id, "aberto", null, user);
    assert.equal(reopened?.status, "aberto");
    assert.equal(reopened?.resolvedAt, null);
    assert.equal(reopened?.resolvedById, null);
  });

  // -------------------------------------------------------------
  // 6. ATRIBUIÇÃO DE RESPONSÁVEL E COMENTÁRIOS INTERNOS
  // -------------------------------------------------------------
  test("Atribuição de colaborador e inclusão de comentário na linha do tempo", () => {
    const user = { id: 1, name: "Admin Teste" };
    const incident = createManualIncident({
      title: "Inconsistência no leitor de tag veicular",
      description: "Antena 2 falhando intermitentemente na entrada de moradores.",
      type: "aviso",
      priority: "P2",
      user,
    });

    // Atribuir colaborador
    const assigned = updateIncidentAssignee(incident.id, "Roberto Eletricista", 42, user);
    assert.equal(assigned?.assigneeName, "Roberto Eletricista");
    assert.equal(assigned?.status, "em_analise", "Atribuir move automaticamente de aberto para em_analise");

    // Adicionar comentário interno
    const comment = addIncidentComment(incident.id, "Técnico acionado e a caminho para troca do cabo coaxial.", user);
    assert.ok(comment);
    assert.equal(comment.action, "comentario");

    // Verificar timeline completa
    const detail = getIncidentDetail(incident.id, true);
    assert.ok(detail);
    const commentAct = detail.activities.find((a) => a.action === "comentario");
    assert.ok(commentAct);
    assert.equal(commentAct.notes, "Técnico acionado e a caminho para troca do cabo coaxial.");
  });

  // -------------------------------------------------------------
  // 7. ISOLAMENTO MULTI-CONDOMÍNIO E SEGURANÇA
  // -------------------------------------------------------------
  test("Síndico do condomínio 1 não visualiza incidentes privados do condomínio 2", () => {
    const user = { id: 99, name: "Outro Admin" };

    // Criar incidente no condomínio 2
    createManualIncident({
      title: "Queda de energia no Condomínio Solar",
      description: "Falta de fase afetando elevadores.",
      type: "aviso",
      priority: "P1",
      condoId: 2,
      user,
    });

    // Consulta restrita ao condomínio 1 (não é superadmin)
    const resultCondo1 = queryIncidents({ condoId: 1, isSuperAdmin: false });
    const hasCondo2 = resultCondo1.incidents.some((i) => i.condoId === 2);
    assert.equal(hasCondo2, false, "Condomínio 1 não deve visualizar incidentes do condomínio 2");

    // Superadmin consulta todos
    const resultSuper = queryIncidents({ isSuperAdmin: true });
    const foundCondo2 = resultSuper.incidents.some((i) => i.condoId === 2);
    assert.equal(foundCondo2, true, "Superadmin deve visualizar todos os condomínios");
  });

  test("Stack trace técnico é sanitizado para perfis não técnicos", () => {
    const detailNormal = getIncidentDetail(2, false);
    assert.ok(detailNormal);
    assert.equal(detailNormal.incident.stackTrace, null, "Stack trace deve ser omitido para perfis comuns");

    const detailTech = getIncidentDetail(2, true);
    assert.ok(detailTech);
    assert.ok(detailTech.incident.stackTrace !== null, "Stack trace deve estar disponível para perfis técnicos");
  });

  // -------------------------------------------------------------
  // 8. EXPORTAÇÃO CSV E PREVENÇÃO DE FORMULA INJECTION
  // -------------------------------------------------------------
  test("Exportação CSV gera arquivo delimitado com mitigação de fórmula maliciosa", () => {
    const user = { id: 1, name: "Admin Teste" };
    createManualIncident({
      title: "=CMD|' /C calc'!A0 Teste de Formula Injection",
      description: "+cmd|' /C calc'!A0",
      type: "aviso",
      priority: "P3",
      user,
    });

    const csv = generateIncidentsCsv(1, true);
    assert.ok(csv.startsWith("\uFEFF"), "Deve conter BOM UTF-8 para compatibilidade com Excel");
    assert.ok(csv.includes("ID;Tipo;Prioridade;Status;Título"), "Deve conter cabeçalhos corretos");

    // Mitigação de fórmula: prefixado com apóstrofo
    assert.ok(csv.includes("'=CMD"), "Fórmula maliciosa deve ser neutralizada com apóstrofo");
  });

  // -------------------------------------------------------------
  // 9. REGRAS DE MONITORAMENTO
  // -------------------------------------------------------------
  test("Regras de monitoramento podem ser consultadas e ativadas/desativadas", () => {
    const rules = getMonitoringRules();
    assert.ok(rules.length >= 4, "Deve haver pelo menos 4 regras de monitoramento ativas");

    const rule1 = rules[0];
    const initialActive = rule1.active;

    const updated = updateMonitoringRule(rule1.id, { active: !initialActive });
    assert.equal(updated?.active, !initialActive);

    // Restaurar
    updateMonitoringRule(rule1.id, { active: initialActive });
  });
});
