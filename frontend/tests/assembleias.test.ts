import { apiOperation } from "@/lib/api/server";
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

describe("Módulo de Assembleias — Votação e Alteração de Votos", () => {
  before(async () => {

  });

  it("1. Deve permitir registrar voto, alterar entre SIM, NÃO e ABSTENÇÃO sem duplicar", async () => {
    // Buscar uma pauta e usuário válidos
    const [condo] = await apiOperation("tests.assembleias-test.001", []);
    assert.ok(condo, "Condomínio deve existir");

    const [user] = await apiOperation("tests.assembleias-test.002", []);
    assert.ok(user, "Usuário deve existir");

    const [assembly] = await apiOperation("tests.assembleias-test.003", [condo.id]);
    assert.ok(assembly, "Assembleia ativa deve existir");

    const [agenda] = await apiOperation("tests.assembleias-test.004", [assembly.id]);
    assert.ok(agenda, "Pauta com votação deve existir");

    // Limpar votos do usuário de teste nesta pauta antes do teste
    await apiOperation("tests.assembleias-test.005", [agenda.id, user.id]);

    // 1. Simular Primeiro Voto: SIM
    const [existing1] = await apiOperation("tests.assembleias-test.006", [agenda.id, user.id]);
    assert.equal(existing1, undefined, "Não deve haver voto prévio");

    await apiOperation("tests.assembleias-test.007", [{
      assemblyId: assembly.id,
      agendaId: agenda.id,
      userId: user.id,
      choice: "sim",
      weight: "1.00",
    }]);

    const votesAfterSim = await apiOperation("tests.assembleias-test.008", [agenda.id, user.id]);
    assert.equal(votesAfterSim.length, 1, "Deve existir exatamente 1 voto registrado");
    assert.equal(votesAfterSim[0].choice, "sim");

    // 2. Simular Alteração de Voto: SIM -> NÃO (UPSERT / UPDATE)
    const [existing2] = await apiOperation("tests.assembleias-test.009", [agenda.id, user.id]);
    assert.ok(existing2, "Deve encontrar o voto anterior");

    await apiOperation("tests.assembleias-test.010", [{ choice: "nao" }, existing2.id]);

    const votesAfterNao = await apiOperation("tests.assembleias-test.011", [agenda.id, user.id]);
    assert.equal(votesAfterNao.length, 1, "Deve continuar existindo exatamente 1 voto (sem duplicatas)");
    assert.equal(votesAfterNao[0].choice, "nao", "Voto deve ter sido alterado para 'nao'");

    // 3. Simular Alteração de Voto: NÃO -> ABSTENÇÃO
    await apiOperation("tests.assembleias-test.012", [{ choice: "abstencao" }, existing2.id]);

    const votesAfterAbs = await apiOperation("tests.assembleias-test.013", [agenda.id, user.id]);
    assert.equal(votesAfterAbs.length, 1, "Deve continuar com exatamente 1 voto ativo");
    assert.equal(votesAfterAbs[0].choice, "abstencao", "Voto deve ter sido alterado para 'abstencao'");

    // 4. Testar Totais Calculados
    const allVotes = await apiOperation("tests.assembleias-test.014", [agenda.id]);

    const totals = {
      sim: allVotes.filter((v) => v.choice === "sim").length,
      nao: allVotes.filter((v) => v.choice === "nao").length,
      abstencao: allVotes.filter((v) => v.choice === "abstencao").length,
    };

    assert.equal(typeof totals.sim, "number");
    assert.equal(typeof totals.nao, "number");
    assert.equal(typeof totals.abstencao, "number");
    assert.equal(totals.abstencao >= 1, true, "Deve conter pelo menos o voto de abstenção do usuário");
  });

  it("2. Validação de constraint única de banco (userId + agendaId)", async () => {
    const [agenda] = await apiOperation("tests.assembleias-test.015", []);
    const [user] = await apiOperation("tests.assembleias-test.016", []);
    if (!agenda || !user) return;

    // Tentar inserir duplicado direto deve falhar pela constraint única
    await apiOperation("tests.assembleias-test.017", [agenda.id, user.id]);

    await apiOperation("tests.assembleias-test.018", [{
      assemblyId: agenda.assemblyId,
      agendaId: agenda.id,
      userId: user.id,
      choice: "sim",
    }]);

    let duplicateFailed = false;
    try {
      await apiOperation("tests.assembleias-test.019", [{
        assemblyId: agenda.assemblyId,
        agendaId: agenda.id,
        userId: user.id,
        choice: "nao",
      }]);
    } catch {
      duplicateFailed = true;
    }

    assert.equal(duplicateFailed, true, "Inserção duplicada com mesmo userId e agendaId deve ser rejeitada pela constraint");
  });
});
