import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db";
import { assemblies, assemblyAgenda, assemblyVotes, condominiums, users, memberships } from "../src/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureSeed } from "../src/db/seed";
import { ensureDatabase } from "../src/db/setup";

describe("Módulo de Assembleias — Votação e Alteração de Votos", () => {
  before(async () => {
    await ensureDatabase();
    await ensureSeed();
  });

  it("1. Deve permitir registrar voto, alterar entre SIM, NÃO e ABSTENÇÃO sem duplicar", async () => {
    // Buscar uma pauta e usuário válidos
    const [condo] = await db.select().from(condominiums).limit(1);
    assert.ok(condo, "Condomínio deve existir");

    const [user] = await db.select().from(users).limit(1);
    assert.ok(user, "Usuário deve existir");

    const [assembly] = await db.select().from(assemblies).where(and(eq(assemblies.condoId, condo.id), eq(assemblies.status, "convocacao_enviada"))).limit(1);
    assert.ok(assembly, "Assembleia ativa deve existir");

    const [agenda] = await db.select().from(assemblyAgenda).where(and(eq(assemblyAgenda.assemblyId, assembly.id), eq(assemblyAgenda.requiresVoting, true))).limit(1);
    assert.ok(agenda, "Pauta com votação deve existir");

    // Limpar votos do usuário de teste nesta pauta antes do teste
    await db.delete(assemblyVotes).where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)));

    // 1. Simular Primeiro Voto: SIM
    const [existing1] = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)))
      .limit(1);
    assert.equal(existing1, undefined, "Não deve haver voto prévio");

    await db.insert(assemblyVotes).values({
      assemblyId: assembly.id,
      agendaId: agenda.id,
      userId: user.id,
      choice: "sim",
      weight: "1.00",
    });

    const votesAfterSim = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)));
    assert.equal(votesAfterSim.length, 1, "Deve existir exatamente 1 voto registrado");
    assert.equal(votesAfterSim[0].choice, "sim");

    // 2. Simular Alteração de Voto: SIM -> NÃO (UPSERT / UPDATE)
    const [existing2] = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)))
      .limit(1);
    assert.ok(existing2, "Deve encontrar o voto anterior");

    await db
      .update(assemblyVotes)
      .set({ choice: "nao" })
      .where(eq(assemblyVotes.id, existing2.id));

    const votesAfterNao = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)));
    assert.equal(votesAfterNao.length, 1, "Deve continuar existindo exatamente 1 voto (sem duplicatas)");
    assert.equal(votesAfterNao[0].choice, "nao", "Voto deve ter sido alterado para 'nao'");

    // 3. Simular Alteração de Voto: NÃO -> ABSTENÇÃO
    await db
      .update(assemblyVotes)
      .set({ choice: "abstencao" })
      .where(eq(assemblyVotes.id, existing2.id));

    const votesAfterAbs = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)));
    assert.equal(votesAfterAbs.length, 1, "Deve continuar com exatamente 1 voto ativo");
    assert.equal(votesAfterAbs[0].choice, "abstencao", "Voto deve ter sido alterado para 'abstencao'");

    // 4. Testar Totais Calculados
    const allVotes = await db
      .select()
      .from(assemblyVotes)
      .where(eq(assemblyVotes.agendaId, agenda.id));

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
    const [agenda] = await db.select().from(assemblyAgenda).limit(1);
    const [user] = await db.select().from(users).limit(1);
    if (!agenda || !user) return;

    // Tentar inserir duplicado direto deve falhar pela constraint única
    await db.delete(assemblyVotes).where(and(eq(assemblyVotes.agendaId, agenda.id), eq(assemblyVotes.userId, user.id)));

    await db.insert(assemblyVotes).values({
      assemblyId: agenda.assemblyId,
      agendaId: agenda.id,
      userId: user.id,
      choice: "sim",
    });

    let duplicateFailed = false;
    try {
      await db.insert(assemblyVotes).values({
        assemblyId: agenda.assemblyId,
        agendaId: agenda.id,
        userId: user.id,
        choice: "nao",
      });
    } catch {
      duplicateFailed = true;
    }

    assert.equal(duplicateFailed, true, "Inserção duplicada com mesmo userId e agendaId deve ser rejeitada pela constraint");
  });
});
