"use server";
import { apiOperation, domainRequest } from "@/lib/api/server";

import { revalidatePath } from "next/cache";

import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { bool, dateTimeBR, maybeDate, num, pickupCode, sequence, str, token } from "@/lib/utils";
import { GATE } from "@/lib/rbac";

async function unitResidents(condoId: number, unitId: number | null) {
  if (!unitId) return [];
  const rows = await apiOperation("lib.actions.portaria.001", [condoId, unitId]);
  return rows.map((r) => r.userId);
}

async function nextCode(table: "occurrence", condoId: number) {
  const [row] = await apiOperation("lib.actions.portaria.002", [condoId]);
  return sequence(table === "occurrence" ? "OC" : "XX", Number(row?.n ?? 0) + 1);
}

/* ------------------------------------------------------------ VISITANTES */

export async function saveVisitorAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const values = {
    condoId,
    name: str(formData, "name"),
    document: str(formData, "document") || null,
    docType: str(formData, "docType", "RG"),
    phone: str(formData, "phone") || null,
    kind: str(formData, "kind", "visitante"),
    company: str(formData, "company") || null,
    vehiclePlate: str(formData, "vehiclePlate").toUpperCase() || null,
    recurring: bool(formData, "recurring"),
    notes: str(formData, "notes") || null,
  };
  if (!values.name) return;
  if (id) {
    await apiOperation("lib.actions.portaria.003", [values, id, condoId]);
  } else {
    await apiOperation("lib.actions.portaria.004", [values]);
  }
  await logAudit({
    session,
    condoId,
    action: id ? "atualizar" : "criar",
    entity: "visitante",
    entityId: id || null,
    summary: `${id ? "Atualizou" : "Cadastrou"} ${values.name}`,
    after: values,
  });
  revalidatePath("/painel/visitantes");
}

export async function toggleBlockVisitorAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico", "porteiro", "zelador"]);
  const id = num(formData, "id");
  const [visitor] = await apiOperation("lib.actions.portaria.005", [id]);
  if (!visitor || visitor.condoId !== condoId) return;
  const blocked = !visitor.blocked;
  await apiOperation("lib.actions.portaria.006", [{ blocked, blockReason: blocked ? str(formData, "reason", "Bloqueio de segurança") : null }, id]);
  await logAudit({
    session,
    condoId,
    action: blocked ? "bloquear" : "desbloquear",
    entity: "visitante",
    entityId: id,
    summary: `${blocked ? "Bloqueou" : "Liberou"} ${visitor.name}`,
    before: { blocked: visitor.blocked },
    after: { blocked },
    critical: true,
  });
  revalidatePath("/painel/visitantes");
}

export async function createVisitAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  let visitorId = num(formData, "visitorId");
  const name = str(formData, "name");

  if (!visitorId && name) {
    const [created] = await apiOperation("lib.actions.portaria.007", [{
        condoId,
        name,
        document: str(formData, "document") || null,
        docType: str(formData, "docType", "RG"),
        phone: str(formData, "phone") || null,
        kind: str(formData, "kind", "visitante"),
        company: str(formData, "company") || null,
        vehiclePlate: str(formData, "vehiclePlate").toUpperCase() || null,
        recurring: bool(formData, "recurring"),
      }]);
    visitorId = created.id;
  }
  if (!visitorId) return;

  const [visitor] = await apiOperation("lib.actions.portaria.008", [visitorId]);
  if (!visitor || visitor.condoId !== condoId) return;

  const isResident = session.role === "morador";
  const unitId = isResident ? session.unitId : num(formData, "unitId") || session.unitId;
  const validFrom = maybeDate(formData, "validFrom") ?? new Date();
  const validUntil = maybeDate(formData, "validUntil") ?? new Date(Date.now() + 86400000);
  const autoAuthorize = isResident || session.role === "sindico" || session.role === "superadmin";

  const [visit] = await apiOperation("lib.actions.portaria.009", [{
      condoId,
      visitorId,
      unitId: unitId ?? null,
      hostUserId: isResident ? session.user.id : num(formData, "hostUserId") || null,
      purpose: str(formData, "purpose") || null,
      status: visitor.blocked ? "negado" : autoAuthorize ? "autorizado" : "aguardando",
      deniedReason: visitor.blocked ? "Visitante consta na lista de bloqueio do condomínio." : null,
      qrToken: token(16),
      validFrom,
      validUntil,
      authorizedById: autoAuthorize && !visitor.blocked ? session.user.id : null,
      authorizedAt: autoAuthorize && !visitor.blocked ? new Date() : null,
      vehiclePlate: str(formData, "visitPlate").toUpperCase() || visitor.vehiclePlate,
      notes: str(formData, "notes") || null,
      createdById: session.user.id,
    }]);

  if (!autoAuthorize && unitId) {
    await notify(
      condoId,
      await unitResidents(condoId, unitId),
      "Autorização de visitante pendente",
      `${visitor.name} aguarda sua autorização na portaria.`,
      "/painel/visitantes",
    );
  }
  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "visita",
    entityId: visit.id,
    summary: `Convite para ${visitor.name}${visitor.blocked ? " (negado por bloqueio)" : ""}`,
    after: { visitorId, unitId, status: visit.status },
  });
  revalidatePath("/painel/visitantes");
  revalidatePath("/painel/portaria");
}

export async function decideVisitAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const decision = str(formData, "decision");
  const [visit] = await apiOperation("lib.actions.portaria.010", [id]);
  if (!visit || visit.condoId !== condoId) return;
  const isHost = visit.hostUserId === session.user.id || (session.unitId && visit.unitId === session.unitId);
  if (!isHost && !["superadmin", "sindico", "porteiro", "zelador"].includes(session.role)) return;

  const status = decision === "autorizar" ? "autorizado" : "negado";
  await apiOperation("lib.actions.portaria.011", [{
      status,
      authorizedById: session.user.id,
      authorizedAt: new Date(),
      deniedReason: decision === "autorizar" ? null : str(formData, "reason", "Não autorizado pelo morador"),
    }, id]);
  await logAudit({
    session,
    condoId,
    action: decision === "autorizar" ? "autorizar" : "negar",
    entity: "visita",
    entityId: id,
    summary: `Visita ${status} por ${session.user.name}`,
    before: { status: visit.status },
    after: { status },
    critical: true,
  });
  revalidatePath("/painel/visitantes");
  revalidatePath("/painel/portaria");
}

export async function gateMoveAction(formData: FormData) {
  const { session, condoId } = await requireRole(GATE);
  const id = num(formData, "id");
  const move = str(formData, "move");
  const [visit] = await apiOperation("lib.actions.portaria.012", [id]);
  if (!visit || visit.condoId !== condoId) return;
  const [visitor] = await apiOperation("lib.actions.portaria.013", [visit.visitorId]);

  if (move === "entrada") {
    if (visit.status !== "autorizado") return;
    await apiOperation("lib.actions.portaria.014", [{ status: "dentro", checkinAt: new Date(), checkinById: session.user.id }, id]);
    await notify(
      condoId,
      await unitResidents(condoId, visit.unitId),
      "Visitante entrou no condomínio",
      `${visitor?.name ?? "Visitante"} teve a entrada registrada pela portaria.`,
      "/painel/visitantes",
    );
  } else {
    await apiOperation("lib.actions.portaria.015", [{ status: "finalizado", checkoutAt: new Date(), checkoutById: session.user.id }, id]);
  }
  await logAudit({
    session,
    condoId,
    action: move === "entrada" ? "checkin" : "checkout",
    entity: "visita",
    entityId: id,
    summary: `${move === "entrada" ? "Entrada" : "Saída"} de ${visitor?.name ?? "visitante"}`,
    critical: true,
    origin: "portaria",
  });
  revalidatePath("/painel/visitantes");
  revalidatePath("/painel/portaria");
}

/* ------------------------------------------------------------ ENCOMENDAS */

export async function registerParcelAction(formData: FormData): Promise<any> {
  const { session, condoId } = await requireRole(GATE);
  const unitId = num(formData, "unitId");
  if (!unitId) {
    return { success: false, error: "Selecione a unidade de destino da encomenda." };
  }

  const [unit] = await apiOperation("lib.actions.portaria.018", [unitId]);
  if (!unit || unit.condoId !== condoId) {
    return { success: false, error: "A unidade selecionada não pertence a este condomínio." };
  }

  const [row] = await apiOperation("lib.actions.portaria.016", [condoId]);
  const code = sequence("ENC", Number(row?.n ?? 0) + 1);
  const kind = str(formData, "kind", "encomenda");
  const carrier = str(formData, "carrier") || null;
  const trackingCode = str(formData, "trackingCode") || null;
  const description = str(formData, "description") || null;
  const photoUrl = str(formData, "photoUrl") || null;
  const shelf = str(formData, "shelf") || null;
  const codePin = pickupCode();

  const [parcel] = await apiOperation("lib.actions.portaria.017", [{
    condoId,
    unitId,
    code,
    kind,
    carrier,
    trackingCode,
    description,
    photoUrl,
    shelf,
    pickupCode: codePin,
    receivedById: session.user.id,
  }]);

  await notify(
    condoId,
    await unitResidents(condoId, unitId),
    "Nova encomenda na portaria",
    `${parcel.carrier ?? "Encomenda"} recebida. Código de retirada: ${parcel.pickupCode}. Local: ${parcel.shelf ?? "portaria"}.`,
    "/painel/encomendas",
  );
  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "encomenda",
    entityId: parcel.id,
    summary: `Registrou ${parcel.code} para unidade ${unit?.number ?? unitId}`,
    origin: "portaria",
  });
  revalidatePath("/painel/encomendas");
  revalidatePath("/painel/portaria");
  return { success: true, message: `Encomenda ${parcel.code} registrada com sucesso!`, parcel };
}

export async function lookupParcelForDeliveryAction(codeOrPin: string) {
  const { session, condoId } = await requireRole(GATE);
  const clean = codeOrPin.trim();
  if (!clean) return { success: false, error: "Informe o código de 6 dígitos ou o código da encomenda (ENC-...)." };

  // Parse se formato QR "ENC:ENC-00001:837587"
  let targetCode = clean;
  let targetPin = clean;
  if (clean.startsWith("ENC:")) {
    const parts = clean.split(":");
    if (parts.length >= 3) {
      targetCode = parts[1];
      targetPin = parts[2];
    }
  }

  const { rows } = await domainRequest<{ rows: any[] }>("/painel/encomendas", { query: { condoId, role: session.role } });
  const found = rows.find(
    (p) =>
      p.code.toLowerCase() === targetCode.toLowerCase() ||
      p.pickupCode === targetPin ||
      (p.tracking && p.tracking.toLowerCase() === clean.toLowerCase())
  );

  if (!found) {
    return { success: false, error: "Nenhuma encomenda encontrada com o código informado neste condomínio." };
  }

  return { success: true, parcel: found };
}

export async function deliverParcelAction(formData: FormData): Promise<any> {
  const { session, condoId } = await requireRole(GATE);
  let id = num(formData, "id");
  let parcel: any = null;

  if (id) {
    const [p] = await apiOperation("lib.actions.portaria.019", [id]);
    parcel = p;
  } else {
    // Busca por pickupCode informado diretamente
    const codeOrPin = str(formData, "pickupCode");
    if (codeOrPin) {
      const lookup = await lookupParcelForDeliveryAction(codeOrPin);
      if (lookup.success && lookup.parcel) {
        parcel = lookup.parcel;
        id = parcel.id;
      }
    }
  }

  if (!parcel || parcel.condoId !== condoId) {
    return { success: false, error: "Encomenda não encontrada no condomínio atual." };
  }

  // Prevenção de concorrência e entrega duplicada
  if (parcel.status !== "pendente") {
    return {
      success: false,
      error: `Esta encomenda já foi entregue anteriormente em ${dateTimeBR(parcel.pickedUpAt)} para ${parcel.pickedUpBy ?? "morador"}.`,
    };
  }

  const informed = str(formData, "pickupCode");
  if (informed && informed !== parcel.pickupCode && !informed.includes(parcel.pickupCode)) {
    await logAudit({
      session,
      condoId,
      action: "codigo_invalido",
      entity: "encomenda",
      entityId: id,
      summary: `Código de retirada inválido informado para ${parcel.code}`,
      critical: true,
      origin: "portaria",
    });
    return {
      success: false,
      error: "Código de retirada incorreto. Verifique o código de 6 dígitos ou o QR Code apresentado pelo morador.",
    };
  }

  const pickedUpBy = str(formData, "pickedUpBy", "Morador");
  const pickedUpDocument = str(formData, "pickedUpDocument") || null;
  const signature = str(formData, "signature") || pickedUpBy || null;
  const notes = str(formData, "notes") || parcel.notes;

  await apiOperation("lib.actions.portaria.020", [{
    status: "entregue",
    pickedUpAt: new Date(),
    pickedUpBy,
    pickedUpDocument,
    signature,
    notes,
  }, id]);

  await notify(
    condoId,
    await unitResidents(condoId, parcel.unitId),
    "Encomenda retirada",
    `${parcel.code} foi retirada por ${pickedUpBy}.`,
    "/painel/encomendas",
  );
  await logAudit({
    session,
    condoId,
    action: "entregar",
    entity: "encomenda",
    entityId: id,
    summary: `Entregou ${parcel.code} para ${pickedUpBy} (Doc: ${pickedUpDocument ?? "Não informado"})`,
    critical: true,
    origin: "portaria",
  });
  revalidatePath("/painel/encomendas");
  revalidatePath("/painel/portaria");
  return { success: true, message: `Retirada da encomenda ${parcel.code} confirmada com sucesso!` };
}

/* --------------------------------------------------------------- TURNOS */

export async function openShiftAction(formData: FormData) {
  const { session, condoId } = await requireRole(GATE);
  const checklistKeys = ["radios", "chaves", "cameras", "extintores", "interfone"];
  const checklist: Record<string, boolean> = {};
  for (const key of checklistKeys) checklist[key] = bool(formData, key);
  const [shift] = await apiOperation("lib.actions.portaria.021", [{ condoId, userId: session.user.id, period: str(formData, "period", "manha"), checklist }]);
  await logAudit({
    session,
    condoId,
    action: "abrir_turno",
    entity: "turno",
    entityId: shift.id,
    summary: `Abriu turno ${shift.period}`,
    origin: "portaria",
    critical: true,
  });
  revalidatePath("/painel/turnos");
  revalidatePath("/painel/portaria");
}

export async function closeShiftAction(formData: FormData) {
  const { session, condoId } = await requireRole(GATE);
  const id = num(formData, "id");
  const [shift] = await apiOperation("lib.actions.portaria.022", [id]);
  if (!shift || shift.condoId !== condoId || shift.status !== "aberto") return;
  await apiOperation("lib.actions.portaria.023", [{
      status: "encerrado",
      endedAt: new Date(),
      handoverToId: num(formData, "handoverToId") || null,
      handoverNotes: str(formData, "handoverNotes"),
      pendingItems: str(formData, "pendingItems") || null,
    }, id]);
  const nextUser = num(formData, "handoverToId");
  if (nextUser) {
    await notify(condoId, [nextUser], "Passagem de turno registrada", str(formData, "handoverNotes", "Sem observações."), "/painel/turnos");
  }
  await logAudit({
    session,
    condoId,
    action: "encerrar_turno",
    entity: "turno",
    entityId: id,
    summary: `Encerrou turno ${shift.period} com passagem de serviço`,
    origin: "portaria",
    critical: true,
  });
  revalidatePath("/painel/turnos");
  revalidatePath("/painel/portaria");
}

/* ---------------------------------------------------------- OCORRÊNCIAS */

export async function createOccurrenceAction(formData: FormData) {
  const { session, condoId } = await requireRole([...GATE, "conselho"]);
  const [openShift] = await apiOperation("lib.actions.portaria.024", [condoId]);

  const [occurrence] = await apiOperation("lib.actions.portaria.025", [{
      condoId,
      shiftId: openShift?.id ?? null,
      code: await nextCode("occurrence", condoId),
      visibility: str(formData, "visibility", "publica"),
      category: str(formData, "category", "seguranca"),
      severity: str(formData, "severity", "baixa"),
      title: str(formData, "title"),
      description: str(formData, "description"),
      actionsTaken: str(formData, "actionsTaken") || null,
      occurredAt: maybeDate(formData, "occurredAt") ?? new Date(),
      reportedById: session.user.id,
      unitId: num(formData, "unitId") || null,
      attachments: str(formData, "attachments") ? str(formData, "attachments").split(",").map((s) => s.trim()) : [],
    }]);

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "ocorrencia",
    entityId: occurrence.id,
    summary: `Registrou ${occurrence.code} (${occurrence.visibility}) - ${occurrence.title}`,
    after: { severity: occurrence.severity, category: occurrence.category },
    critical: true,
    origin: "portaria",
  });
  revalidatePath("/painel/livro");
  revalidatePath("/painel/portaria");
}

export async function ackOccurrenceAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico", "conselho"]);
  const id = num(formData, "id");
  await apiOperation("lib.actions.portaria.026", [{ ackById: session.user.id, ackAt: new Date() }, id, condoId]);
  await logAudit({
    session,
    condoId,
    action: "ciencia",
    entity: "ocorrencia",
    entityId: id,
    summary: `Deu ciência na ocorrência #${id}`,
    critical: true,
  });
  revalidatePath("/painel/livro");
}

export async function addOccurrenceFollowUpAction(formData: FormData) {
  const { session, condoId } = await requireRole([...GATE, "conselho"]);
  const id = num(formData, "id");
  const [occurrence] = await apiOperation("lib.actions.portaria.027", [id]);
  if (!occurrence || occurrence.condoId !== condoId) return;
  const addition = str(formData, "addition");
  if (!addition) return;
  const stamp = new Date().toLocaleString("pt-BR");
  const merged = `${occurrence.actionsTaken ?? ""}\n[${stamp} · ${session.user.name}] ${addition}`.trim();
  await apiOperation("lib.actions.portaria.028", [{ actionsTaken: merged }, id]);
  await logAudit({
    session,
    condoId,
    action: "complementar",
    entity: "ocorrencia",
    entityId: id,
    summary: `Complementou ações da ocorrência ${occurrence.code}`,
    before: { actionsTaken: occurrence.actionsTaken },
    after: { actionsTaken: merged },
    critical: true,
  });
  revalidatePath("/painel/livro");
}
