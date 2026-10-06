"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assemblies,
  assemblyAgenda,
  assemblyAttendance,
  assemblyMinutes,
  assemblyMinuteVersions,
  assemblyNotificationLogs,
  assemblyVotes,
  memberships,
  units,
  users,
} from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { suggestMinutesSummary, summarize } from "@/lib/ai";
import { dateBR, maybeDate, num, str } from "@/lib/utils";

const ADMIN_ROLES = ["superadmin", "sindico"] as const;

async function getAudienceUserIds(condoId: number, scope: string, blockId?: number | null, unitId?: number | null) {
  if (scope === "unidade" && unitId) {
    const rows = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.condoId, condoId), eq(memberships.unitId, unitId)));
    return rows.map((r) => r.userId);
  }

  if (scope === "bloco" && blockId) {
    const rows = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .innerJoin(units, eq(units.id, memberships.unitId))
      .where(and(eq(memberships.condoId, condoId), eq(units.blockId, blockId)));
    return rows.map((r) => r.userId);
  }

  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.condoId, condoId));
  return rows.map((r) => r.userId);
}

/* ------------------------------------------------ CADASTRO E EDIÇÃO ---- */

export async function saveAssemblyAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const id = num(formData, "id");
  const title = str(formData, "title");
  const firstCall = maybeDate(formData, "firstCallAt");
  if (!title || !firstCall) return;

  const isDraft = formData.get("isDraft") === "true";
  const status = isDraft ? "rascunho" : str(formData, "status", "agendada");
  const scope = str(formData, "audienceScope", "todos");
  const targetBlockId = num(formData, "targetBlockId") || null;
  const targetUnitId = num(formData, "targetUnitId") || null;

  const payload = {
    condoId,
    title,
    kind: str(formData, "kind", "ordinaria"),
    mode: str(formData, "mode", "hibrida"),
    firstCallAt: firstCall,
    secondCallAt: maybeDate(formData, "secondCallAt"),
    startTime: str(formData, "startTime") || null,
    endTime: str(formData, "endTime") || null,
    location: str(formData, "location") || null,
    onlineLink: str(formData, "onlineLink") || null,
    quorumFirst: num(formData, "quorumFirst", 50),
    quorumSecond: num(formData, "quorumSecond", 25),
    status,
    description: str(formData, "description") || null,
    guidelines: str(formData, "guidelines") || null,
    audienceScope: scope,
    targetBlockId,
    targetUnitId,
    responsibleName: str(formData, "responsibleName") || session.user.name,
    responsibleId: num(formData, "responsibleId") || session.user.id,
    confirmationDeadline: maybeDate(formData, "confirmationDeadline"),
    noticeDocumentUrl: str(formData, "noticeDocumentUrl") || null,
    updatedAt: new Date(),
  };

  let assemblyId = id;
  if (id) {
    await db.update(assemblies).set(payload).where(and(eq(assemblies.id, id), eq(assemblies.condoId, condoId)));
    await logAudit({ session, condoId, action: "editar", entity: "assembleia", entityId: id, summary: `Editou assembleia "${title}"` });
  } else {
    const [row] = await db.insert(assemblies).values({ ...payload, createdById: session.user.id }).returning();
    assemblyId = row.id;
    await logAudit({ session, condoId, action: "criar", entity: "assembleia", entityId: row.id, summary: `Cadastrou assembleia "${title}"` });
  }

  // Pauta
  const agendaText = str(formData, "agenda");
  if (agendaText) {
    const items = agendaText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (items.length > 0) {
      if (id) {
        await db.delete(assemblyAgenda).where(eq(assemblyAgenda.assemblyId, id));
      }
      await db.insert(assemblyAgenda).values(
        items.map((item, index) => ({
          assemblyId,
          position: index + 1,
          title: item,
          votingType: str(formData, "votingType", "unidade"),
        })),
      );
    }
  }

  revalidatePath("/painel/assembleias");
  revalidatePath("/painel");
}

/* ---------------------------------------------------- NOTIFICAÇÕES ---- */

export async function notifyAssemblyAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  const triggerEvent = str(formData, "triggerEvent", "nova_assembleia");
  if (!assemblyId) return;

  const [assembly] = await db
    .select()
    .from(assemblies)
    .where(and(eq(assemblies.id, assemblyId), eq(assemblies.condoId, condoId)))
    .limit(1);
  if (!assembly) return;

  const userIds = await getAudienceUserIds(condoId, assembly.audienceScope, assembly.targetBlockId, assembly.targetUnitId);
  if (userIds.length === 0) return;

  let title = `Convocação de Assembleia: ${assembly.title}`;
  let body = `Data: ${dateBR(assembly.firstCallAt)} ${assembly.startTime ?? ""}. Local/Link: ${assembly.location || assembly.onlineLink || "A definir"}. Consulte os documentos e confirme sua presença.`;

  if (triggerEvent === "alteracao_data_horario") {
    title = `Alteração de Data/Horário: ${assembly.title}`;
    body = `A assembleia teve seu horário alterado para ${dateBR(assembly.firstCallAt)} ${assembly.startTime ?? ""}.`;
  } else if (triggerEvent === "alteracao_local") {
    title = `Alteração de Local: ${assembly.title}`;
    body = `O local/link da assembleia foi alterado para: ${assembly.location || assembly.onlineLink || "Consulte no painel"}.`;
  } else if (triggerEvent === "cancelamento") {
    title = `Assembleia Cancelada: ${assembly.title}`;
    body = `A assembleia agendada para ${dateBR(assembly.firstCallAt)} foi cancelada.`;
  } else if (triggerEvent === "publicacao_ata") {
    title = `Ata Publicada: ${assembly.title}`;
    body = `A ata oficial e o resumo da assembleia já estão disponíveis para consulta e download no sistema.`;
  } else if (triggerEvent === "atualizacao_ata") {
    title = `Atualização da Ata: ${assembly.title}`;
    body = `Uma nova versão da ata da assembleia foi publicada. Consulte o histórico de documentos.`;
  } else if (triggerEvent.startsWith("lembrete")) {
    title = `Lembrete de Assembleia: ${assembly.title}`;
    body = `A assembleia será realizada em breve (${dateBR(assembly.firstCallAt)} às ${assembly.startTime || "horário previsto"}). Confirme sua presença.`;
  }

  await notify(condoId, userIds, title, body, "/painel/assembleias");

  if (assembly.status === "agendada" && triggerEvent === "nova_assembleia") {
    await db.update(assemblies).set({ status: "convocacao_enviada", noticeAt: new Date() }).where(eq(assemblies.id, assemblyId));
  } else if (triggerEvent === "cancelamento") {
    await db.update(assemblies).set({ status: "cancelada" }).where(eq(assemblies.id, assemblyId));
  }

  await db.insert(assemblyNotificationLogs).values({
    assemblyId,
    condoId,
    triggerEvent,
    channel: "app",
    recipientsCount: userIds.length,
    deliveredCount: userIds.length,
    readCount: 0,
    failedCount: 0,
    createdById: session.user.id,
  });

  await logAudit({ session, condoId, action: "notificar", entity: "assembleia", entityId: assemblyId, summary: `Disparou notificação (${triggerEvent}) para ${userIds.length} moradores` });
  revalidatePath("/painel/assembleias");
}

/* ------------------------------------------- CONFIRMAÇÃO E PRESENÇA ---- */

export async function confirmAttendanceAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;

  const status = str(formData, "status", "confirmado");
  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId") || session.unitId;
  const proxyForUnitId = num(formData, "proxyForUnitId") || null;
  const proxyDoc = str(formData, "proxyDoc") || null;
  const proxyName = str(formData, "proxyName") || null;
  const proxyCpf = str(formData, "proxyCpf") || null;

  const [existing] = await db
    .select()
    .from(assemblyAttendance)
    .where(and(eq(assemblyAttendance.assemblyId, assemblyId), eq(assemblyAttendance.userId, session.user.id)))
    .limit(1);

  const historyItem = {
    timestamp: new Date().toISOString(),
    action: status === "confirmado" ? "Confirmou presença" : "Informou ausência",
    userName: session.user.name,
    note: proxyName ? `Procurador: ${proxyName}` : undefined,
  };

  if (existing) {
    const currentHistory = (existing.history as { timestamp: string; action: string; userName?: string }[]) || [];
    await db
      .update(assemblyAttendance)
      .set({
        status,
        unitId,
        proxyForUnitId,
        proxyDoc,
        proxyName,
        proxyCpf,
        history: [...currentHistory, historyItem],
        checkinAt: status === "confirmado" ? new Date() : null,
      })
      .where(eq(assemblyAttendance.id, existing.id));
  } else {
    await db.insert(assemblyAttendance).values({
      assemblyId,
      unitId,
      userId: session.user.id,
      status,
      proxyForUnitId,
      proxyDoc,
      proxyName,
      proxyCpf,
      history: [historyItem],
      checkinAt: status === "confirmado" ? new Date() : null,
    });
  }

  await logAudit({ session, condoId, action: "confirmar_presenca", entity: "assembleia", entityId: assemblyId, summary: `${status === "confirmado" ? "Confirmou presença" : "Informou ausência"}` });
  revalidatePath("/painel/assembleias");
}

export async function adminRecordAttendanceAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES, "conselho", "zelador"]);
  const assemblyId = num(formData, "assemblyId");
  const targetUserId = num(formData, "userId");
  const targetUnitId = num(formData, "unitId");
  const status = str(formData, "status", "confirmado");
  if (!assemblyId) return;

  const historyItem = {
    timestamp: new Date().toISOString(),
    action: `Registro manual por ${session.user.name}`,
    userName: session.user.name,
  };

  const [existing] = await db
    .select()
    .from(assemblyAttendance)
    .where(and(eq(assemblyAttendance.assemblyId, assemblyId), eq(assemblyAttendance.unitId, targetUnitId)))
    .limit(1);

  if (existing) {
    const currentHistory = (existing.history as { timestamp: string; action: string }[]) || [];
    await db
      .update(assemblyAttendance)
      .set({ status, history: [...currentHistory, historyItem], checkinAt: new Date() })
      .where(eq(assemblyAttendance.id, existing.id));
  } else {
    await db.insert(assemblyAttendance).values({
      assemblyId,
      unitId: targetUnitId,
      userId: targetUserId || session.user.id,
      status,
      history: [historyItem],
      checkinAt: new Date(),
    });
  }

  await logAudit({ session, condoId, action: "presenca_manual", entity: "assembleia", entityId: assemblyId, summary: `Registrou presença da unidade #${targetUnitId}` });
  revalidatePath("/painel/assembleias");
}

/* ---------------------------------------------------- VOTACÃO E PAUTA ---- */

export type VoteChoice = "sim" | "nao" | "abstencao";

export type VoteAssemblyPayload = {
  assemblyId: number;
  agendaId: number;
  choice: VoteChoice | string;
  unitId?: number | null;
};

export type VoteAssemblyResult = {
  success: boolean;
  vote?: VoteChoice;
  isChange?: boolean;
  totals?: {
    sim: number;
    nao: number;
    abstencao: number;
  };
  error?: string;
};

export async function voteAssemblyAction(
  input: FormData | VoteAssemblyPayload
): Promise<VoteAssemblyResult> {
  try {
    const { session, condoId } = await requireCondo();

    let assemblyId: number;
    let agendaId: number;
    let rawChoice: string;
    let inputUnitId: number | null = null;

    if (input instanceof FormData) {
      assemblyId = num(input, "assemblyId");
      agendaId = num(input, "agendaId");
      rawChoice = str(input, "choice");
      inputUnitId = num(input, "unitId") || null;
    } else {
      assemblyId = Number(input.assemblyId);
      agendaId = Number(input.agendaId);
      rawChoice = String(input.choice || "");
      inputUnitId = input.unitId ? Number(input.unitId) : null;
    }

    if (!assemblyId || !agendaId || !rawChoice) {
      return { success: false, error: "Dados da votação incompletos." };
    }

    const normalizedChoice = rawChoice.trim().toLowerCase();
    if (!["sim", "nao", "abstencao"].includes(normalizedChoice)) {
      return { success: false, error: "Opção inválida. Escolha SIM, NÃO ou ABSTENÇÃO." };
    }
    const choice = normalizedChoice as VoteChoice;

    // Verificar se a assembleia existe e pertence ao condomínio
    const [assembly] = await db
      .select()
      .from(assemblies)
      .where(and(eq(assemblies.id, assemblyId), eq(assemblies.condoId, condoId)))
      .limit(1);

    if (!assembly) {
      return { success: false, error: "Assembleia não encontrada." };
    }

    // Verificar se a votação da assembleia ainda está aberta
    const closedStatuses = ["cancelada", "finalizada", "ata_em_revisao", "ata_publicada"];
    if (closedStatuses.includes(assembly.status)) {
      return {
        success: false,
        error:
          assembly.status === "cancelada"
            ? "Esta assembleia foi cancelada."
            : "A votação desta assembleia já foi encerrada.",
      };
    }

    // Validação de escopo para morador
    if (session.role === "morador") {
      if (assembly.audienceScope === "unidade" && assembly.targetUnitId && assembly.targetUnitId !== session.unitId) {
        return { success: false, error: "Esta votação é restrita a outra unidade." };
      }
      if (assembly.audienceScope === "bloco" && assembly.targetBlockId && session.unitId) {
        const [u] = await db
          .select({ blockId: units.blockId })
          .from(units)
          .where(eq(units.id, session.unitId))
          .limit(1);
        if (u && u.blockId !== assembly.targetBlockId) {
          return { success: false, error: "Esta votação é restrita a outro bloco." };
        }
      }
    }

    // Verificar se a pauta existe e pertence à assembleia
    const [agenda] = await db
      .select()
      .from(assemblyAgenda)
      .where(and(eq(assemblyAgenda.id, agendaId), eq(assemblyAgenda.assemblyId, assemblyId)))
      .limit(1);

    if (!agenda) {
      return { success: false, error: "Pauta não encontrada nesta assembleia." };
    }

    if (!agenda.requiresVoting) {
      return { success: false, error: "Esta pauta não requer votação." };
    }

    // Determinar unidade e peso da fração
    const unitId = session.role === "morador" ? session.unitId : inputUnitId || session.unitId;
    let weight = "1.00";
    if (unitId) {
      const [unit] = await db.select({ fraction: units.fraction }).from(units).where(eq(units.id, unitId)).limit(1);
      if (unit?.fraction) {
        weight = unit.fraction;
      }
    }

    // Verificar voto existente (garantindo apenas 1 voto ativo por usuário e pauta)
    const [existing] = await db
      .select()
      .from(assemblyVotes)
      .where(and(eq(assemblyVotes.agendaId, agendaId), eq(assemblyVotes.userId, session.user.id)))
      .limit(1);

    const isChange = !!existing && existing.choice !== choice;

    if (existing) {
      await db
        .update(assemblyVotes)
        .set({
          choice,
          weight,
          assemblyId,
          unitId,
        })
        .where(eq(assemblyVotes.id, existing.id));

      if (isChange) {
        await logAudit({
          session,
          condoId,
          action: "votar",
          entity: "assembleia",
          entityId: assemblyId,
          summary: `Alterou voto de "${existing.choice.toUpperCase()}" para "${choice.toUpperCase()}" na pauta "${agenda.title}"`,
        });
      }
    } else {
      await db.insert(assemblyVotes).values({
        assemblyId,
        agendaId,
        unitId,
        userId: session.user.id,
        choice,
        weight,
      });

      await logAudit({
        session,
        condoId,
        action: "votar",
        entity: "assembleia",
        entityId: assemblyId,
        summary: `Registrou voto "${choice.toUpperCase()}" na pauta "${agenda.title}"`,
      });
    }

    // Calcular totais atualizados em tempo real no banco
    const allVotes = await db
      .select({ choice: assemblyVotes.choice })
      .from(assemblyVotes)
      .where(eq(assemblyVotes.agendaId, agendaId));

    const totals = {
      sim: allVotes.filter((v) => v.choice === "sim").length,
      nao: allVotes.filter((v) => v.choice === "nao").length,
      abstencao: allVotes.filter((v) => v.choice === "abstencao").length,
    };

    revalidatePath("/painel/assembleias");

    return {
      success: true,
      vote: choice,
      isChange,
      totals,
    };
  } catch (err: any) {
    console.error("Erro ao registrar voto na assembleia:", err);
    return {
      success: false,
      error: err?.message || "Erro inesperado ao registrar o voto.",
    };
  }
}

export async function saveAgendaItemResultAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const agendaId = num(formData, "agendaId");
  if (!agendaId) return;

  await db
    .update(assemblyAgenda)
    .set({
      discussionResult: str(formData, "discussionResult") || null,
      decision: str(formData, "decision") || null,
      notes: str(formData, "notes") || null,
      votingResult: str(formData, "votingResult") || null,
      status: str(formData, "status", "concluido"),
    })
    .where(eq(assemblyAgenda.id, agendaId));

  await logAudit({ session, condoId, action: "registrar_deliberacao", entity: "pauta_assembleia", entityId: agendaId, summary: "Atualizou deliberação da pauta" });
  revalidatePath("/painel/assembleias");
}

/* ----------------------------------------------- ATA, RESUMO E IA ---- */

export async function saveMinutesAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;

  const content = str(formData, "content");
  const summary = str(formData, "summary");
  const fileName = str(formData, "fileName");
  const fileUrl = str(formData, "fileUrl");
  const fileSizeKb = num(formData, "fileSizeKb", 350);
  const status = str(formData, "status", "rascunho");

  const [existing] = await db
    .select()
    .from(assemblyMinutes)
    .where(eq(assemblyMinutes.assemblyId, assemblyId))
    .limit(1);

  if (existing) {
    await db
      .update(assemblyMinutes)
      .set({
        content: content || existing.content,
        summary: summary || existing.summary,
        fileName: fileName || existing.fileName,
        fileUrl: fileUrl || existing.fileUrl,
        fileSizeKb: fileSizeKb || existing.fileSizeKb,
        status,
        updatedAt: new Date(),
      })
      .where(eq(assemblyMinutes.id, existing.id));
  } else {
    await db.insert(assemblyMinutes).values({
      assemblyId,
      condoId,
      content,
      summary,
      fileName: fileName || `ata-assembleia-${assemblyId}.pdf`,
      fileUrl,
      fileSizeKb,
      status,
      currentVersion: "1.0",
    });
  }

  if (status === "em_revisao") {
    await db.update(assemblies).set({ status: "ata_em_revisao" }).where(eq(assemblies.id, assemblyId));
  }

  await logAudit({ session, condoId, action: "salvar_ata", entity: "ata_assembleia", entityId: assemblyId, summary: `Salvou ata (${status})` });
  revalidatePath("/painel/assembleias");
}

export async function generateAISummaryAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;

  const [minutes] = await db
    .select()
    .from(assemblyMinutes)
    .where(eq(assemblyMinutes.assemblyId, assemblyId))
    .limit(1);

  const [assembly] = await db
    .select()
    .from(assemblies)
    .where(eq(assemblies.id, assemblyId))
    .limit(1);

  const minutesText = minutes?.content || assembly?.minutes || assembly?.title || "";
  const aiSuggestedSummary = suggestMinutesSummary(minutesText);

  if (minutes) {
    await db.update(assemblyMinutes).set({ aiSuggestedSummary }).where(eq(assemblyMinutes.id, minutes.id));
  } else {
    await db.insert(assemblyMinutes).values({
      assemblyId,
      condoId,
      aiSuggestedSummary,
      status: "rascunho",
      summaryStatus: "rascunho",
    });
  }

  await logAudit({ session, condoId, action: "gerar_resumo_ia", entity: "ata_assembleia", entityId: assemblyId, summary: "Gerou sugestão de resumo via IA" });
  revalidatePath("/painel/assembleias");
}

export async function approveAndPublishMinutesAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;

  const finalSummary = str(formData, "summary");
  const finalContent = str(formData, "content");
  const fileName = str(formData, "fileName") || `ata-assembleia-${condoId}-${assemblyId}.pdf`;
  const fileUrl = str(formData, "fileUrl") || `/api/assemblies/${assemblyId}/minutes/download`;

  const [existing] = await db
    .select()
    .from(assemblyMinutes)
    .where(eq(assemblyMinutes.assemblyId, assemblyId))
    .limit(1);

  let minutesId = existing?.id;
  if (existing) {
    await db
      .update(assemblyMinutes)
      .set({
        status: "publicada",
        summary: finalSummary || existing.summary || existing.aiSuggestedSummary,
        content: finalContent || existing.content,
        fileName,
        fileUrl,
        summaryStatus: "aprovado",
        summaryApprovedById: session.user.id,
        summaryApprovedAt: new Date(),
        publishedAt: new Date(),
        publishedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(assemblyMinutes.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(assemblyMinutes)
      .values({
        assemblyId,
        condoId,
        status: "publicada",
        summary: finalSummary,
        content: finalContent,
        fileName,
        fileUrl,
        summaryStatus: "aprovado",
        summaryApprovedById: session.user.id,
        summaryApprovedAt: new Date(),
        publishedAt: new Date(),
        publishedById: session.user.id,
        currentVersion: "1.0",
      })
      .returning();
    minutesId = inserted.id;
  }

  // Registrar Versao 1.0 no Historico
  if (minutesId) {
    await db.insert(assemblyMinuteVersions).values({
      minutesId,
      assemblyId,
      version: existing?.currentVersion || "1.0",
      fileUrl,
      fileName,
      content: finalContent,
      summary: finalSummary,
      changeReason: "Publicação inicial da ata aprovada",
      createdById: session.user.id,
    });
  }

  // Atualizar Assembleia
  await db.update(assemblies).set({ status: "ata_publicada", minutes: finalContent || finalSummary }).where(eq(assemblies.id, assemblyId));

  // Notificar moradores
  const [assembly] = await db.select().from(assemblies).where(eq(assemblies.id, assemblyId)).limit(1);
  if (assembly) {
    const userIds = await getAudienceUserIds(condoId, assembly.audienceScope, assembly.targetBlockId, assembly.targetUnitId);
    await notify(condoId, userIds, `Ata Publicada: ${assembly.title}`, "A ata oficial e o resumo da assembleia já estão disponíveis para leitura e download.", "/painel/assembleias");
  }

  await logAudit({ session, condoId, action: "publicar_ata", entity: "ata_assembleia", entityId: assemblyId, summary: `Publicou ata e resumo oficial da assembleia`, critical: true });
  revalidatePath("/painel/assembleias");
}

export async function updateMinutesVersionAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  const changeReason = str(formData, "changeReason");
  if (!assemblyId || !changeReason) return;

  const [minutes] = await db
    .select()
    .from(assemblyMinutes)
    .where(eq(assemblyMinutes.assemblyId, assemblyId))
    .limit(1);
  if (!minutes) return;

  const currentVer = parseFloat(minutes.currentVersion || "1.0");
  const nextVer = (currentVer + 0.1).toFixed(1);
  const newContent = str(formData, "content") || minutes.content;
  const newSummary = str(formData, "summary") || minutes.summary;
  const newFileName = str(formData, "fileName") || minutes.fileName;
  const newFileUrl = str(formData, "fileUrl") || minutes.fileUrl;

  await db
    .update(assemblyMinutes)
    .set({
      currentVersion: nextVer,
      content: newContent,
      summary: newSummary,
      fileName: newFileName,
      fileUrl: newFileUrl,
      status: "publicada",
      updatedAt: new Date(),
    })
    .where(eq(assemblyMinutes.id, minutes.id));

  await db.insert(assemblyMinuteVersions).values({
    minutesId: minutes.id,
    assemblyId,
    version: nextVer,
    fileUrl: newFileUrl,
    fileName: newFileName,
    content: newContent,
    summary: newSummary,
    changeReason,
    createdById: session.user.id,
  });

  const [assembly] = await db.select().from(assemblies).where(eq(assemblies.id, assemblyId)).limit(1);
  if (assembly) {
    const userIds = await getAudienceUserIds(condoId, assembly.audienceScope, assembly.targetBlockId, assembly.targetUnitId);
    await notify(condoId, userIds, `Atualização de Ata (v${nextVer}): ${assembly.title}`, `A ata foi atualizada. Motivo: ${summarize(changeReason, 100)}`, "/painel/assembleias");
  }

  await logAudit({ session, condoId, action: "substituir_ata", entity: "ata_assembleia", entityId: assemblyId, summary: `Publicou versão ${nextVer} da ata (Motivo: ${changeReason})`, critical: true });
  revalidatePath("/painel/assembleias");
}

export async function cancelAssemblyAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ADMIN_ROLES]);
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;

  const [assembly] = await db.select().from(assemblies).where(and(eq(assemblies.id, assemblyId), eq(assemblies.condoId, condoId))).limit(1);
  if (!assembly) return;

  await db.update(assemblies).set({ status: "cancelada", updatedAt: new Date() }).where(eq(assemblies.id, assemblyId));

  const userIds = await getAudienceUserIds(condoId, assembly.audienceScope, assembly.targetBlockId, assembly.targetUnitId);
  await notify(condoId, userIds, `Assembleia Cancelada: ${assembly.title}`, `A assembleia agendada para ${dateBR(assembly.firstCallAt)} foi cancelada.`, "/painel/assembleias");

  await logAudit({ session, condoId, action: "cancelar", entity: "assembleia", entityId: assemblyId, summary: `Cancelou assembleia "${assembly.title}"`, critical: true });
  revalidatePath("/painel/assembleias");
}
