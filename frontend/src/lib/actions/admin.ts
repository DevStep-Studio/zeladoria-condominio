"use server";
import { apiOperation } from "@/lib/api/server";

import { revalidatePath } from "next/cache";

import { hashPassword, requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { addDays, bool, cents, isoDate, maybeDate, num, sequence, str } from "@/lib/utils";
import { voteAssemblyAction as executeVoteAssemblyAction } from "@/lib/actions/assemblies";

const FINANCE_VIEW = ["superadmin", "sindico", "conselho"] as const;
const FINANCE_MANAGE = ["superadmin", "sindico"] as const;

/* -------------------------------------------------------- MANUTENÇÃO ---- */

export async function saveAssetAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const name = str(formData, "name");
  if (!name) return;
  const id = num(formData, "id");
  if (id) {
    await apiOperation("lib.actions.admin.001", [{
        name,
        category: str(formData, "category", "equipamento"),
        location: str(formData, "location") || null,
        brand: str(formData, "brand") || null,
        serial: str(formData, "serial") || null,
        installedAt: str(formData, "installedAt") || null,
        status: str(formData, "status", "operacional"),
        notes: str(formData, "notes") || null,
      }, id, condoId]);
    await logAudit({ session, condoId, action: "atualizar", entity: "equipamento", entityId: id, summary: `Atualizou ${name}` });
  } else {
    const [row] = await apiOperation("lib.actions.admin.002", [{
        condoId,
        name,
        category: str(formData, "category", "equipamento"),
        location: str(formData, "location") || null,
        brand: str(formData, "brand") || null,
        serial: str(formData, "serial") || null,
        installedAt: str(formData, "installedAt") || null,
        status: str(formData, "status", "operacional"),
        notes: str(formData, "notes") || null,
      }]);
    await logAudit({ session, condoId, action: "criar", entity: "equipamento", entityId: row.id, summary: `Cadastrou ${name}` });
  }
  revalidatePath("/painel/manutencao");
}

export async function deleteAssetAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  if (!id) return;
  await apiOperation("lib.actions.admin.003", [id, condoId]);
  await logAudit({ session, condoId, action: "excluir", entity: "equipamento", entityId: id, summary: `Excluiu equipamento #${id}` });
  revalidatePath("/painel/manutencao");
}

export async function savePlanAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const title = str(formData, "title");
  if (!title) return;
  const frequency = num(formData, "frequencyDays", 30);
  const id = num(formData, "id");
  const checklist = str(formData, "checklist") ? str(formData, "checklist").split("\n").map((s) => s.trim()).filter(Boolean) : [];

  if (id) {
    await apiOperation("lib.actions.admin.004", [{
        assetId: num(formData, "assetId") || null,
        title,
        frequencyDays: frequency,
        vendorId: num(formData, "vendorId") || null,
        responsible: str(formData, "responsible") || null,
        nextDueAt: str(formData, "nextDueAt") || isoDate(addDays(frequency)),
        checklist,
      }, id, condoId]);
    await logAudit({ session, condoId, action: "atualizar", entity: "plano_manutencao", entityId: id, summary: `Atualizou plano ${title}` });
  } else {
    const [row] = await apiOperation("lib.actions.admin.005", [{
        condoId,
        assetId: num(formData, "assetId") || null,
        title,
        frequencyDays: frequency,
        vendorId: num(formData, "vendorId") || null,
        responsible: str(formData, "responsible") || null,
        nextDueAt: str(formData, "nextDueAt") || isoDate(addDays(frequency)),
        checklist,
      }]);
    await logAudit({ session, condoId, action: "criar", entity: "plano_manutencao", entityId: row.id, summary: title });
  }
  revalidatePath("/painel/manutencao");
}

export async function deletePlanAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  if (!id) return;
  await apiOperation("lib.actions.admin.006", [id, condoId]);
  await logAudit({ session, condoId, action: "excluir", entity: "plano_manutencao", entityId: id, summary: `Excluiu plano #${id}` });
  revalidatePath("/painel/manutencao");
}

export async function saveOrderAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const title = str(formData, "title");
  if (!title) return;
  const id = num(formData, "id");
  if (id) {
    await apiOperation("lib.actions.admin.007", [{
        assetId: num(formData, "assetId") || null,
        planId: num(formData, "planId") || null,
        kind: str(formData, "kind", "corretiva"),
        title,
        description: str(formData, "description") || null,
        scheduledFor: str(formData, "scheduledFor") || isoDate(),
        status: str(formData, "status", "programada"),
        vendorId: num(formData, "vendorId") || null,
        technician: str(formData, "technician") || null,
        costCents: cents(formData, "cost"),
      }, id, condoId]);
    await logAudit({ session, condoId, action: "atualizar", entity: "ordem_manutencao", entityId: id, summary: `Atualizou OS ${title}` });
  } else {
    const [row] = await apiOperation("lib.actions.admin.008", [{
        condoId,
        assetId: num(formData, "assetId") || null,
        planId: num(formData, "planId") || null,
        kind: str(formData, "kind", "corretiva"),
        title,
        description: str(formData, "description") || null,
        scheduledFor: str(formData, "scheduledFor") || isoDate(),
        status: str(formData, "status", "programada"),
        vendorId: num(formData, "vendorId") || null,
        technician: str(formData, "technician") || null,
        costCents: cents(formData, "cost"),
      }]);
    await logAudit({ session, condoId, action: "criar", entity: "ordem_manutencao", entityId: row.id, summary: title });
  }
  revalidatePath("/painel/manutencao");
}

export async function updateOrderStatusAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const id = num(formData, "id");
  const newStatus = str(formData, "status", "em_andamento");
  if (!id) return;
  await apiOperation("lib.actions.admin.009", [{ status: newStatus }, id, condoId]);
  await logAudit({ session, condoId, action: "atualizar", entity: "ordem_manutencao", entityId: id, summary: `Alterou status para ${newStatus}` });
  revalidatePath("/painel/manutencao");
}

export async function generateOrderFromPlanAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const planId = num(formData, "planId");
  if (!planId) return;
  const [plan] = await apiOperation("lib.actions.admin.010", [planId, condoId]);
  if (!plan) return;

  const [order] = await apiOperation("lib.actions.admin.011", [{
      condoId,
      assetId: plan.assetId,
      planId: plan.id,
      kind: "preventiva",
      title: `Manutenção Preventiva: ${plan.title}`,
      description: plan.checklist && plan.checklist.length > 0 ? `Checklist:\n- ${plan.checklist.join("\n- ")}` : "Execução periódica de rotina preventiva.",
      scheduledFor: plan.nextDueAt || isoDate(),
      status: "programada",
      vendorId: plan.vendorId,
      technician: plan.responsible || null,
      costCents: 0,
    }]);

  await logAudit({ session, condoId, action: "criar", entity: "ordem_manutencao", entityId: order.id, summary: `Gerou OS do plano #${plan.id}` });
  revalidatePath("/painel/manutencao");
}

export async function completeOrderAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  const [order] = await apiOperation("lib.actions.admin.012", [id]);
  if (!order || order.condoId !== condoId) return;
  const cost = cents(formData, "cost");
  await apiOperation("lib.actions.admin.013", [{
      status: "concluida",
      completedAt: isoDate(),
      report: str(formData, "report") || null,
      costCents: cost > 0 ? cost : order.costCents,
    }, id]);
  if (order.planId) {
    const [plan] = await apiOperation("lib.actions.admin.014", [order.planId]);
    if (plan) {
      await apiOperation("lib.actions.admin.015", [{ lastDoneAt: isoDate(), nextDueAt: isoDate(addDays(plan.frequencyDays)) }, plan.id]);
    }
  }
  await logAudit({ session, condoId, action: "concluir", entity: "ordem_manutencao", entityId: id, summary: `Concluiu ${order.title}` });
  revalidatePath("/painel/manutencao");
}

export async function deleteOrderAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  if (!id) return;
  await apiOperation("lib.actions.admin.016", [id, condoId]);
  await logAudit({ session, condoId, action: "excluir", entity: "ordem_manutencao", entityId: id, summary: `Excluiu OS #${id}` });
  revalidatePath("/painel/manutencao");
}

/* ---------------------------------------------- FORNECEDORES / CONTRATOS */

/** Formato de linha: "Nome; Descrição; Preço (R$)" — preço opcional. */
function parseServicesTextarea(raw: string): { id: string; name: string; description: string; priceFromCents: number | null }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [name, description, price] = line.split(";").map((p) => p.trim());
      const priceValue = price ? Number(price.replace(/[^\d,.-]/g, "").replace(",", ".")) : NaN;
      return {
        id: `svc-${i}`,
        name: name || "Serviço",
        description: description || "",
        priceFromCents: Number.isFinite(priceValue) ? Math.round(priceValue * 100) : null,
      };
    });
}

/** Formato de linha: "URL da foto; Legenda" — legenda opcional. */
function parsePortfolioTextarea(raw: string): { url: string; caption: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, caption] = line.split(";").map((p) => p.trim());
      return { url: url || "", caption: caption || "" };
    })
    .filter((item) => item.url);
}

function vendorMarketplaceFields(formData: FormData) {
  const priceFrom = str(formData, "priceFrom");
  return {
    photoUrl: str(formData, "photoUrl") || null,
    whatsapp: str(formData, "whatsapp") || null,
    description: str(formData, "description") || null,
    serviceArea: str(formData, "serviceArea") || null,
    priceFromCents: priceFrom ? Math.round(Number(priceFrom.replace(",", ".")) * 100) : null,
    services: parseServicesTextarea(str(formData, "servicesText")),
    portfolio: parsePortfolioTextarea(str(formData, "portfolioText")),
  };
}

export async function saveVendorAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const name = str(formData, "name");
  if (!name) return;
  const [row] = await apiOperation("lib.actions.admin.017", [{
      condoId,
      name,
      cnpj: str(formData, "cnpj") || null,
      category: str(formData, "category", "servicos"),
      contactName: str(formData, "contactName") || null,
      phone: str(formData, "phone") || null,
      email: str(formData, "email") || null,
      rating: num(formData, "rating", 0),
      notes: str(formData, "notes") || null,
      ...vendorMarketplaceFields(formData),
    }]);
  await logAudit({ session, condoId, action: "criar", entity: "fornecedor", entityId: row.id, summary: name });
  revalidatePath("/painel/fornecedores");
  revalidatePath("/painel/servicos");
}

export async function updateVendorAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return;
  const [existing] = await apiOperation("lib.actions.admin.018", [id, condoId]);
  if (!existing) return;
  await apiOperation("lib.actions.admin.019", [{
      name,
      cnpj: str(formData, "cnpj") || null,
      category: str(formData, "category", existing.category),
      contactName: str(formData, "contactName") || null,
      phone: str(formData, "phone") || null,
      email: str(formData, "email") || null,
      notes: str(formData, "notes") || null,
      ...vendorMarketplaceFields(formData),
    }, id]);
  await logAudit({ session, condoId, action: "atualizar", entity: "fornecedor", entityId: id, summary: `Atualizou cadastro de ${name}` });
  revalidatePath("/painel/fornecedores");
  revalidatePath("/painel/servicos");
}

export async function rateVendorAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  const rating = num(formData, "rating", 5);
  await apiOperation("lib.actions.admin.020", [{ rating }, id, condoId]);
  await logAudit({ session, condoId, action: "avaliar", entity: "fornecedor", entityId: id, summary: `Avaliação ${rating}/5` });
  revalidatePath("/painel/fornecedores");
}

/** Verificação de documentação/antecedentes — decisão sensível, restrita a síndico/superadmin. */
export async function setVendorVerificationAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  const verified = bool(formData, "verified");
  const [existing] = await apiOperation("lib.actions.admin.021", [id, condoId]);
  if (!existing) return;
  await apiOperation("lib.actions.admin.022", [{
      verified,
      verifiedAt: verified ? new Date() : null,
      verifiedById: verified ? session.user.id : null,
    }, id]);
  await logAudit({
    session,
    condoId,
    action: verified ? "verificar" : "remover_verificacao",
    entity: "fornecedor",
    entityId: id,
    summary: `${verified ? "Verificou" : "Removeu verificação de"} ${existing.name}`,
    critical: true,
  });
  revalidatePath("/painel/fornecedores");
  revalidatePath("/painel/servicos");
}

/** Marca o prestador como anúncio patrocinado no marketplace — restrito a síndico/superadmin. */
export async function setVendorSponsoredAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  const sponsored = bool(formData, "sponsored");
  const [existing] = await apiOperation("lib.actions.admin.023", [id, condoId]);
  if (!existing) return;
  await apiOperation("lib.actions.admin.024", [{ sponsored }, id]);
  await logAudit({
    session,
    condoId,
    action: sponsored ? "patrocinar" : "remover_patrocinio",
    entity: "fornecedor",
    entityId: id,
    summary: `${sponsored ? "Marcou" : "Removeu marcação de"} ${existing.name} como patrocinado`,
  });
  revalidatePath("/painel/fornecedores");
  revalidatePath("/painel/servicos");
}

/** Moderação e aprovação do onboarding de novos prestadores — restrito a síndico/superadmin. */
export async function setVendorOnboardingStatusAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  const status = str(formData, "status", "aprovado");
  const [existing] = await apiOperation("lib.actions.admin.025", [id, condoId]);
  if (!existing) return;

  await apiOperation("lib.actions.admin.026", [{ onboardingStatus: status }, id]);

  await logAudit({
    session,
    condoId,
    action: "moderar_prestador",
    entity: "fornecedor",
    entityId: id,
    summary: `Alterou status de credenciamento de ${existing.name} para ${status}`,
    critical: true,
  });

  revalidatePath("/painel/fornecedores");
  revalidatePath("/painel/servicos");
}

export async function saveContractAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const title = str(formData, "title");
  const vendorId = num(formData, "vendorId");
  if (!title || !vendorId) return;
  const [row] = await apiOperation("lib.actions.admin.027", [{
      condoId,
      vendorId,
      title,
      object: str(formData, "object") || null,
      startAt: str(formData, "startAt", isoDate()),
      endAt: str(formData, "endAt", isoDate(addDays(365))),
      noticeDays: num(formData, "noticeDays", 30),
      valueCents: cents(formData, "value"),
      billingCycle: str(formData, "billingCycle", "mensal"),
      adjustmentIndex: str(formData, "adjustmentIndex", "IGPM"),
      documentUrl: str(formData, "documentUrl") || null,
    }]);
  await logAudit({ session, condoId, action: "criar", entity: "contrato", entityId: row.id, summary: title, critical: true });
  revalidatePath("/painel/fornecedores");
}

/* -------------------------------------------------------- ASSEMBLEIAS -- */

export async function createAssemblyAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const title = str(formData, "title");
  const firstCall = maybeDate(formData, "firstCallAt");
  if (!title || !firstCall) return;
  const [assembly] = await apiOperation("lib.actions.admin.028", [{
      condoId,
      title,
      kind: str(formData, "kind", "ordinaria"),
      mode: str(formData, "mode", "hibrida"),
      firstCallAt: firstCall,
      secondCallAt: maybeDate(formData, "secondCallAt"),
      location: str(formData, "location") || null,
      onlineLink: str(formData, "onlineLink") || null,
      quorumFirst: num(formData, "quorumFirst", 50),
      quorumSecond: num(formData, "quorumSecond", 25),
      createdById: session.user.id,
    }]);

  const agenda = str(formData, "agenda").split("\n").map((s) => s.trim()).filter(Boolean);
  if (agenda.length > 0) {
    await apiOperation("lib.actions.admin.029", [agenda.map((item, index) => ({
        assemblyId: assembly.id,
        position: index + 1,
        title: item,
        votingType: str(formData, "votingType", "unidade"),
      }))]);
  }
  await logAudit({ session, condoId, action: "convocar", entity: "assembleia", entityId: assembly.id, summary: title, critical: true });
  revalidatePath("/painel/assembleias");
}

export async function confirmAttendanceAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const assemblyId = num(formData, "assemblyId");
  if (!assemblyId) return;
  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId") || null;
  const existing = await apiOperation("lib.actions.admin.030", [assemblyId, session.user.id]);
  if (existing.length > 0) return;
  await apiOperation("lib.actions.admin.031", [{
    assemblyId,
    unitId,
    userId: session.user.id,
    status: str(formData, "status", "confirmado"),
    proxyForUnitId: num(formData, "proxyForUnitId") || null,
    proxyDoc: str(formData, "proxyDoc") || null,
  }]);
  await logAudit({ session, condoId, action: "confirmar_presenca", entity: "assembleia", entityId: assemblyId, summary: "Confirmou presença" });
  revalidatePath("/painel/assembleias");
}

export async function voteAssemblyAction(formData: FormData) {
  return executeVoteAssemblyAction(formData);
}

export async function publishMinutesAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  await apiOperation("lib.actions.admin.032", [{ minutes: str(formData, "minutes"), recordingUrl: str(formData, "recordingUrl") || null, status: "encerrada" }, id, condoId]);
  await logAudit({ session, condoId, action: "publicar_ata", entity: "assembleia", entityId: id, summary: "Publicou ata e gravação", critical: true });
  revalidatePath("/painel/assembleias");
}

/* ---------------------------------------------------------- FINANCEIRO -- */

export async function saveTransactionAction(formData: FormData) {
  const { session, condoId } = await requireRole([...FINANCE_MANAGE]);
  const description = str(formData, "description");
  if (!description) return;
  const [row] = await apiOperation("lib.actions.admin.033", [{
      condoId,
      kind: str(formData, "kind", "despesa"),
      category: str(formData, "category", "manutencao"),
      costCenter: str(formData, "costCenter", "administracao"),
      description,
      amountCents: cents(formData, "amount"),
      dueDate: str(formData, "dueDate", isoDate()),
      status: "pendente",
      vendorId: num(formData, "vendorId") || null,
      reserveFund: bool(formData, "reserveFund"),
      attachmentUrl: str(formData, "attachmentUrl") || null,
      createdById: session.user.id,
    }]);
  await logAudit({ session, condoId, action: "criar", entity: "lancamento", entityId: row.id, summary: `${row.kind} · ${description}`, critical: true });
  revalidatePath("/painel/financeiro");
}

export async function payTransactionAction(formData: FormData) {
  const { session, condoId } = await requireRole([...FINANCE_MANAGE]);
  const id = num(formData, "id");
  const [row] = await apiOperation("lib.actions.admin.034", [id]);
  if (!row || row.condoId !== condoId) return;
  await apiOperation("lib.actions.admin.035", [{ status: "pago", paidDate: isoDate() }, id]);
  await logAudit({
    session, condoId, action: "baixar", entity: "lancamento", entityId: id,
    summary: `Baixou ${row.description}`, before: { status: row.status }, after: { status: "pago" }, critical: true,
  });
  revalidatePath("/painel/financeiro");
}

export async function registerChargePaymentAction(formData: FormData) {
  const { session, condoId } = await requireRole([...FINANCE_MANAGE]);
  const id = num(formData, "id");
  await apiOperation("lib.actions.admin.036", [{ status: "paga", paidAt: isoDate(), method: str(formData, "method", "pix") }, id, condoId]);
  await logAudit({ session, condoId, action: "quitar", entity: "cobranca", entityId: id, summary: "Registrou pagamento", critical: true });
  revalidatePath("/painel/financeiro");
}

/* --------------------------------------------- ACHADOS / MUDANÇAS ------- */

export async function saveLostItemAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const title = str(formData, "title");
  if (!title) return;
  const [row] = await apiOperation("lib.actions.admin.037", [{
      condoId,
      title,
      description: str(formData, "description") || null,
      photoUrl: str(formData, "photoUrl") || null,
      foundLocation: str(formData, "foundLocation") || null,
      foundAt: str(formData, "foundAt", isoDate()),
      storedLocation: str(formData, "storedLocation", "Portaria"),
      discardAfter: isoDate(addDays(90)),
      registeredById: session.user.id,
    }]);
  await logAudit({ session, condoId, action: "criar", entity: "achado", entityId: row.id, summary: title });
  revalidatePath("/painel/achados");
}

export async function claimLostItemAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const id = num(formData, "id");
  const status = str(formData, "status", "devolvido");
  await apiOperation("lib.actions.admin.038", [{
      status,
      claimedBy: str(formData, "claimedBy") || null,
      claimedUnitId: num(formData, "claimedUnitId") || null,
      claimedAt: new Date(),
    }, id, condoId]);
  await logAudit({ session, condoId, action: status, entity: "achado", entityId: id, summary: `Item ${status} para ${str(formData, "claimedBy", "—")}`, critical: true });
  revalidatePath("/painel/achados");
}

export async function createMoveRequestAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId");
  if (!unitId) return;
  const [row] = await apiOperation("lib.actions.admin.039", [{
      condoId,
      unitId,
      requestedById: session.user.id,
      kind: str(formData, "kind", "mudanca"),
      scheduledDate: str(formData, "scheduledDate", isoDate()),
      startTime: str(formData, "startTime", "08:00"),
      endTime: str(formData, "endTime", "17:00"),
      elevator: str(formData, "elevator", "Serviço"),
      carrierName: str(formData, "carrierName") || null,
      carrierDoc: str(formData, "carrierDoc") || null,
      vehiclePlate: str(formData, "vehiclePlate").toUpperCase() || null,
      workers: str(formData, "workers") || null,
      description: str(formData, "description") || null,
      artUrl: str(formData, "artUrl") || null,
      termAccepted: bool(formData, "termAccepted"),
      deadlineAt: str(formData, "deadlineAt") || null,
    }]);
  await logAudit({ session, condoId, action: "criar", entity: "mudanca_obra", entityId: row.id, summary: `${row.kind} em ${row.scheduledDate}` });
  revalidatePath("/painel/mudancas");
}

export async function decideMoveRequestAction(formData: FormData) {
  const { session, condoId } = await requireRole(ALL_STAFF);
  const id = num(formData, "id");
  const status = str(formData, "status", "aprovada");
  const [row] = await apiOperation("lib.actions.admin.040", [id]);
  if (!row || row.condoId !== condoId) return;
  await apiOperation("lib.actions.admin.041", [{ status, reviewedById: session.user.id, reviewNotes: str(formData, "reviewNotes") || null }, id]);
  if (row.requestedById) {
    await notify(condoId, [row.requestedById], `Solicitação ${status}`, `Sua solicitação de ${row.kind} foi ${status}.`, "/painel/mudancas");
  }
  await logAudit({ session, condoId, action: "decidir", entity: "mudanca_obra", entityId: id, summary: `Solicitação ${status}`, critical: true });
  revalidatePath("/painel/mudancas");
}

/* --------------------------------------------- IMPLANTAÇÃO / SUPORTE ---- */

export async function updateOnboardingAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const step = num(formData, "step", 1);
  const done = bool(formData, "done");
  await apiOperation("lib.actions.admin.042", [{ onboardingStep: step, onboardingDone: done }, condoId]);
  await logAudit({ session, condoId, action: "implantacao", entity: "condominio", entityId: condoId, summary: `Etapa ${step}${done ? " · publicado" : ""}` });
  revalidatePath("/painel/implantacao");
}

export async function saveCondoSettingsAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const [before] = await apiOperation("lib.actions.admin.043", [condoId]);
  const values = {
    name: str(formData, "name", before?.name ?? ""),
    cnpj: str(formData, "cnpj") || null,
    address: str(formData, "address") || null,
    city: str(formData, "city") || null,
    state: str(formData, "state") || null,
    publicPage: bool(formData, "publicPage"),
  };
  await apiOperation("lib.actions.admin.044", [values, condoId]);
  await logAudit({
    session, condoId, action: "atualizar", entity: "condominio", entityId: condoId,
    summary: "Atualizou dados do condomínio", before: before ? { name: before.name, city: before.city } : null, after: values, critical: true,
  });
  revalidatePath("/painel/implantacao");
  revalidatePath("/painel/configuracoes");
  revalidatePath("/painel");
}

export async function createSupportTicketAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const subject = str(formData, "subject");
  if (!subject) return;
  const resolvedCondoId = condoId > 0 ? condoId : null;
  const [row] = await apiOperation("lib.actions.admin.045", [{
      condoId: resolvedCondoId,
      userId: session.user.id,
      subject,
      body: str(formData, "body"),
      category: str(formData, "category", "duvida"),
      priority: str(formData, "priority", "normal"),
    }]);
  await logAudit({ session, condoId: resolvedCondoId, action: "criar", entity: "suporte", entityId: row.id, summary: subject });
  revalidatePath("/painel/ajuda");
}

export async function answerSupportTicketAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin"]);
  const id = num(formData, "id");
  const resolvedCondoId = condoId > 0 ? condoId : null;
  await apiOperation("lib.actions.admin.046", [{ answer: str(formData, "answer"), status: "respondido" }, id]);
  await logAudit({ session, condoId: resolvedCondoId, action: "responder", entity: "suporte", entityId: id, summary: "Suporte respondeu chamado", origin: "suporte" });
  revalidatePath("/painel/ajuda");
}

export async function rateSupportAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const resolvedCondoId = condoId > 0 ? condoId : null;
  await apiOperation("lib.actions.admin.047", [{ satisfaction: num(formData, "satisfaction", 5), status: "encerrado" }, id]);
  await logAudit({ session, condoId: resolvedCondoId, action: "avaliar", entity: "suporte", entityId: id, summary: "Pesquisa de satisfação respondida" });
  revalidatePath("/painel/ajuda");
}

export async function seedDemoCondoAction() {
  const { session } = await requireRole(["superadmin"]);
  const [row] = await apiOperation("lib.actions.admin.048", []);
  const [condo] = await apiOperation("lib.actions.admin.049", [{
      name: `Condomínio Demonstração ${Number(row?.n ?? 0) + 1}`,
      slug: `demo-${Date.now().toString(36)}`,
      plan: "basico",
      onboardingStep: 1,
      onboardingDone: false,
    }]);
  await logAudit({ session, condoId: condo.id, action: "criar", entity: "condominio", entityId: condo.id, summary: `Criou ${condo.name}`, critical: true });
  revalidatePath("/painel/adocao");
}

export async function createCondominiumAction(formData: FormData): Promise<{ success: boolean; condoId?: number; error?: string }> {
  const { session } = await requireRole(["superadmin"]);
  const name = str(formData, "name");
  if (!name) return { success: false, error: "Nome do condomínio é obrigatório." };

  const cnpj = str(formData, "cnpj") || null;
  const plan = str(formData, "plan", "pro");
  const address = str(formData, "address") || null;
  const city = str(formData, "city", "São Paulo");
  const state = str(formData, "state", "SP");
  const initialBlocks = num(formData, "initialBlocks", 0);
  const unitsPerBlock = num(formData, "unitsPerBlock", 0);
  const sindicoName = str(formData, "sindicoName");
  const sindicoEmail = str(formData, "sindicoEmail")?.toLowerCase().trim();

  // Generate clean slug
  const baseSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45) || "condo";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Insert Condominium
  const [condo] = await apiOperation("lib.actions.admin.050", [{
      name,
      slug,
      cnpj,
      address,
      city,
      state,
      plan,
      brandColor: "#1355FF",
      onboardingStep: 4,
      onboardingDone: true,
      publicPage: true,
    }]);

  // 2. Auto-generate Blocks and Units if specified
  if (initialBlocks > 0) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let b = 0; b < Math.min(initialBlocks, 26); b++) {
      const blockLetter = letters[b];
      const [block] = await apiOperation("lib.actions.admin.051", [{
          condoId: condo.id,
          name: `Bloco ${blockLetter}`,
          floors: Math.max(1, Math.ceil(unitsPerBlock / 4)),
        }]);

      if (unitsPerBlock > 0) {
        const unitsToInsert = [];
        for (let u = 1; u <= Math.min(unitsPerBlock, 50); u++) {
          const floor = Math.floor((u - 1) / 4) + 1;
          const pos = ((u - 1) % 4) + 1;
          const unitNumber = `${floor}${pos < 10 ? "0" : ""}${pos}`;
          unitsToInsert.push({
            condoId: condo.id,
            blockId: block.id,
            number: unitNumber,
            floor,
            kind: "apartamento",
            status: "vaga",
          });
        }
        if (unitsToInsert.length > 0) {
          await apiOperation("lib.actions.admin.052", [unitsToInsert]);
        }
      }
    }
  }

  // 3. Assign Initial Síndico if provided
  if (sindicoEmail && sindicoName) {
    let [existingUser] = await apiOperation("lib.actions.admin.053", [sindicoEmail]);
    let userId = existingUser?.id;

    if (!existingUser) {
      const tempPass = `zc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const [newUser] = await apiOperation("lib.actions.admin.054", [{
          name: sindicoName,
          email: sindicoEmail,
          passwordHash: hashPassword(tempPass),
          status: "ativo",
        }]);
      userId = newUser.id;
    }

    // Check if membership already exists
    const [existingMembership] = await apiOperation("lib.actions.admin.055", [userId, condo.id]);

    if (existingMembership) {
      await apiOperation("lib.actions.admin.056", [{ role: "sindico", status: "ativo" }, existingMembership.id]);
    } else {
      await apiOperation("lib.actions.admin.057", [{
        condoId: condo.id,
        userId: userId!,
        role: "sindico",
        status: "ativo",
      }]);
    }
  }

  // 4. Audit Log
  await logAudit({
    session,
    condoId: condo.id,
    action: "criar",
    entity: "condominio",
    entityId: condo.id,
    summary: `Cadastrou condomínio ${condo.name} (${slug}) com ${initialBlocks} blocos`,
    critical: true,
  });

  revalidatePath("/painel/admin");
  revalidatePath("/painel/admin/condominios");

  return { success: true, condoId: condo.id };
}

/* --------------------------------------------------- GESTÃO DE USUÁRIOS & CONVITES */

export async function inviteUserAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase().trim();
  const role = str(formData, "role", "morador");
  const unitId = num(formData, "unitId") || null;
  const phone = str(formData, "phone") || null;

  if (!name || !email) {
    return { success: false, error: "Nome e e-mail são obrigatórios." };
  }

  // 1. Check if user already exists
  let [existingUser] = await apiOperation("lib.actions.admin.058", [email]);
  let userId = existingUser?.id;

  if (!existingUser) {
    // Generate secure temporary random password hash (user will use invite/reset link)
    const tempPassword = `zc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const [created] = await apiOperation("lib.actions.admin.059", [{
        name,
        email,
        phone,
        passwordHash: hashPassword(tempPassword),
        status: "ativo",
      }]);
    userId = created.id;
  }

  // 2. Check if membership already exists in this condo
  const [existingMembership] = await apiOperation("lib.actions.admin.060", [userId, condoId]);

  if (existingMembership) {
    await apiOperation("lib.actions.admin.061", [{
        role: role as any,
        unitId,
        status: "ativo",
      }, existingMembership.id]);
  } else {
    await apiOperation("lib.actions.admin.062", [{
      condoId,
      userId: userId!,
      role: role as any,
      unitId,
      status: "ativo",
    }]);
  }

  await logAudit({
    session,
    condoId,
    action: "convidar_usuario",
    entity: "usuario",
    entityId: userId,
    summary: `Convidou ${name} (${email}) como ${role}${unitId ? ` para unidade #${unitId}` : ""}`,
    critical: true,
  });

  revalidatePath("/painel/moradores");
  revalidatePath("/painel/admin");
  return { success: true };
}

/* ------------------------------------------- CRIAR ORDEM A PARTIR DE OCORRÊNCIA */

export async function createWorkOrderFromOccurrenceAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico", "zelador"]);
  const occurrenceId = num(formData, "occurrenceId");
  const [occ] = await apiOperation("lib.actions.admin.063", [occurrenceId, condoId]);
  if (!occ) return { success: false, error: "Ocorrência não encontrada." };

  const [orderCount] = await apiOperation("lib.actions.admin.064", [condoId]);
  const scheduledFor = str(formData, "scheduledFor") || isoDate(addDays(3));
  const technician = str(formData, "technician") || "Equipe de Manutenção";
  const vendorId = num(formData, "vendorId") || null;
  const costCents = cents(str(formData, "cost") || "0");

  const [order] = await apiOperation("lib.actions.admin.065", [{
      condoId,
      kind: "corretiva",
      title: str(formData, "title", `OS: ${occ.title}`),
      description: `${occ.description}\n\n[Origem: Ocorrência ${occ.code}] - Local: ${occ.exactLocation ?? "Área Comum"}`,
      scheduledFor,
      status: "programada",
      vendorId,
      technician,
      costCents,
    }]);

  // Update occurrence status to em_execucao and append note
  const stamp = new Date().toLocaleString("pt-BR");
  const note = `${occ.actionsTaken ?? ""}\n[${stamp}] Ordem de serviço #${order.id} criada por ${session.user.name}`.trim();
  await apiOperation("lib.actions.admin.066", [{
      status: "em_execucao",
      actionsTaken: note,
    }, occ.id]);

  await logAudit({
    session,
    condoId,
    action: "criar_ordem_de_ocorrencia",
    entity: "ordem_manutencao",
    entityId: order.id,
    summary: `Criou OS #${order.id} a partir da ocorrência ${occ.code}`,
    critical: true,
  });

  revalidatePath("/painel/ocorrencias");
  revalidatePath("/painel/ordens");
  revalidatePath("/painel/manutencao");
  revalidatePath("/painel");
  return { success: true, orderId: order.id };
}
