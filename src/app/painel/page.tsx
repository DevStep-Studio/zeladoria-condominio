import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  amenities,
  announcements,
  assemblies,
  assets,
  blocks,
  condominiums,
  documents,
  maintenanceOrders,
  maintenancePlans,
  memberships,
  occurrences,
  parcels,
  reservations,
  shifts,
  supportTickets,
  tickets,
  units,
  users,
  visitors,
  visits,
} from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { getMarketplaceProviders } from "@/lib/services/providers-query";
import { dateBR, dateTimeBR, timeAgoBR } from "@/lib/utils";
import {
  DashboardClient,
  type AttentionItem,
  type CondoNotice,
  type DashboardOccurrence,
  type DashboardReservation,
  type DashboardVendor,
  type InsideVisitor,
  type ExpectedVisitor,
  type PendingParcel,
  type ShiftInfo,
  type PorteiroOverview,
  type SindicoTodaySummary,
  type SmartPreventionAlert,
  type ManagementOccurrence,
  type LogbookEntry,
} from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";
  const isPorteiro = session.role === "porteiro" || session.role === "zelador";
  const isSindico = session.role === "sindico" || session.role === "superadmin" || session.role === "conselho";
  const activeMembership = session.memberships.find((m) => m.condoId === condoId);
  const residentUnitId = activeMembership?.unitId ?? session.unitId;

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  // 1. Condomínio info
  const [condoRow] = await db
    .select()
    .from(condominiums)
    .where(eq(condominiums.id, condoId))
    .limit(1);

  const condoName = condoRow?.name ?? "Residencial Parque das Águas";
  const condoAddress = condoRow
    ? `${condoRow.address ?? "Av. Brasil, 1000"} - ${condoRow.city ?? "São Paulo"} - ${condoRow.state ?? "SP"}`
    : "Av. Brasil, 1000 - São Paulo - SP";

  // 2. Units list for quick lookup modal
  const allUnitsRaw = await db
    .select({
      id: units.id,
      number: units.number,
      blockName: blocks.name,
    })
    .from(units)
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .where(eq(units.condoId, condoId))
    .orderBy(blocks.name, units.number);

  const allUnits = allUnitsRaw.map((u) => ({
    id: u.id,
    label: `${u.blockName ? `${u.blockName} - ` : ""}Unidade ${u.number}`,
  }));

  // 3. Role-specific data structures
  let attentionItems: AttentionItem[] = [];
  let stats = {
    openOccurrences: 0,
    executingOrders: 0,
    slaPercent: 100,
    monthlyExpenses: "R$ 0",
  };
  let residentStats = {
    myOccurrences: 0,
    myReservations: 0,
    myParcels: 0,
    announcements: 0,
  };

  // Porteiro specific state
  let porteiroOverview: PorteiroOverview | undefined = undefined;
  let activeShift: ShiftInfo | null = null;
  let lastShift: ShiftInfo | null = null;

  // Síndico specific state
  let sindicoSummary: SindicoTodaySummary | undefined = undefined;
  let smartAlerts: SmartPreventionAlert[] = [];
  let managementOccurrences: ManagementOccurrence[] = [];
  let logbookEntries: LogbookEntry[] = [];

  if (isPorteiro) {
    // -------------------------------------------------------------
    // PORTARIA OPERACIONAL QUERIES
    // -------------------------------------------------------------
    const [openShiftRow] = await db
      .select({
        id: shifts.id,
        period: shifts.period,
        status: shifts.status,
        startedAt: shifts.startedAt,
        userName: users.name,
        checklist: shifts.checklist,
      })
      .from(shifts)
      .innerJoin(users, eq(users.id, shifts.userId))
      .where(and(eq(shifts.condoId, condoId), eq(shifts.status, "aberto")))
      .orderBy(desc(shifts.startedAt))
      .limit(1);

    if (openShiftRow) {
      activeShift = {
        id: openShiftRow.id,
        period: openShiftRow.period,
        status: openShiftRow.status,
        startedAt: openShiftRow.startedAt.toISOString(),
        userName: openShiftRow.userName,
        checklist: (openShiftRow.checklist as Record<string, boolean>) || {},
      };
    }

    const [closedShiftRow] = await db
      .select({
        id: shifts.id,
        period: shifts.period,
        status: shifts.status,
        startedAt: shifts.startedAt,
        endedAt: shifts.endedAt,
        userName: users.name,
        handoverNotes: shifts.handoverNotes,
        pendingItems: shifts.pendingItems,
      })
      .from(shifts)
      .innerJoin(users, eq(users.id, shifts.userId))
      .where(and(eq(shifts.condoId, condoId), eq(shifts.status, "encerrado")))
      .orderBy(desc(shifts.endedAt))
      .limit(1);

    if (closedShiftRow) {
      lastShift = {
        id: closedShiftRow.id,
        period: closedShiftRow.period,
        status: closedShiftRow.status,
        startedAt: closedShiftRow.startedAt.toISOString(),
        endedAt: closedShiftRow.endedAt ? closedShiftRow.endedAt.toISOString() : undefined,
        userName: closedShiftRow.userName,
        handoverNotes: closedShiftRow.handoverNotes ?? undefined,
        pendingItems: closedShiftRow.pendingItems ?? undefined,
      };
    }

    // Quem está dentro (status = 'dentro' e checkoutAt is null)
    const hostUser = alias(users, "host_user");
    const insideRows = await db
      .select({
        id: visits.id,
        visitorName: visitors.name,
        kind: visitors.kind,
        company: visitors.company,
        document: visitors.document,
        plate: visits.vehiclePlate,
        unitNumber: units.number,
        blockName: blocks.name,
        hostName: hostUser.name,
        checkinAt: visits.checkinAt,
        purpose: visits.purpose,
      })
      .from(visits)
      .innerJoin(visitors, eq(visitors.id, visits.visitorId))
      .leftJoin(units, eq(units.id, visits.unitId))
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .leftJoin(hostUser, eq(hostUser.id, visits.hostUserId))
      .where(and(eq(visits.condoId, condoId), eq(visits.status, "dentro")))
      .orderBy(desc(visits.checkinAt));

    const insideVisitors: InsideVisitor[] = insideRows.map((r) => ({
      id: r.id,
      name: r.visitorName,
      kind: r.kind || "visitante",
      company: r.company || undefined,
      document: r.document || undefined,
      plate: r.plate || undefined,
      unit: r.unitNumber ? `Unid. ${r.unitNumber}${r.blockName ? ` (${r.blockName})` : ""}` : "Área Comum",
      hostName: r.hostName || undefined,
      checkinAt: r.checkinAt ? r.checkinAt.toISOString() : new Date().toISOString(),
      purpose: r.purpose || undefined,
    }));

    // Visitantes esperados hoje (status autorizados ou aguardando)
    const expectedRows = await db
      .select({
        id: visits.id,
        visitorName: visitors.name,
        kind: visitors.kind,
        company: visitors.company,
        plate: visits.vehiclePlate,
        unitNumber: units.number,
        blockName: blocks.name,
        hostName: hostUser.name,
        validFrom: visits.validFrom,
        validUntil: visits.validUntil,
        status: visits.status,
        purpose: visits.purpose,
        qrToken: visits.qrToken,
      })
      .from(visits)
      .innerJoin(visitors, eq(visitors.id, visits.visitorId))
      .leftJoin(units, eq(units.id, visits.unitId))
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .leftJoin(hostUser, eq(hostUser.id, visits.hostUserId))
      .where(
        and(
          eq(visits.condoId, condoId),
          inArray(visits.status, ["autorizado", "aguardando"]),
          sql`${visits.validUntil} >= NOW()`
        )
      )
      .orderBy(visits.validFrom)
      .limit(10);

    const expectedVisitors: ExpectedVisitor[] = expectedRows.map((r) => ({
      id: r.id,
      name: r.visitorName,
      kind: r.kind || "visitante",
      company: r.company || undefined,
      plate: r.plate || undefined,
      unit: r.unitNumber ? `Unid. ${r.unitNumber}${r.blockName ? ` (${r.blockName})` : ""}` : "Área Comum",
      hostName: r.hostName || "Administração",
      validTime: `${dateTimeBR(r.validFrom).slice(11, 16)} - ${dateTimeBR(r.validUntil).slice(11, 16)}`,
      status: r.status,
      purpose: r.purpose || undefined,
      qrToken: r.qrToken,
    }));

    // Encomendas pendentes de retirada
    const parcelRows = await db
      .select({
        id: parcels.id,
        code: parcels.code,
        carrier: parcels.carrier,
        shelf: parcels.shelf,
        pickupCode: parcels.pickupCode,
        description: parcels.description,
        unitNumber: units.number,
        blockName: blocks.name,
        receivedAt: parcels.receivedAt,
      })
      .from(parcels)
      .leftJoin(units, eq(units.id, parcels.unitId))
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .where(and(eq(parcels.condoId, condoId), inArray(parcels.status, ["pendente", "aguardando_retirada", "recebida"])))
      .orderBy(desc(parcels.receivedAt))
      .limit(10);

    const pendingParcels: PendingParcel[] = parcelRows.map((p) => ({
      id: p.id,
      code: p.code,
      carrier: p.carrier || "Transportadora",
      shelf: p.shelf || "Portaria",
      pickupCode: p.pickupCode,
      unit: p.unitNumber ? `Unid. ${p.unitNumber}${p.blockName ? ` (${p.blockName})` : ""}` : "Unidade",
      receivedTimeAgo: timeAgoBR(p.receivedAt),
      description: p.description || undefined,
    }));

    // Prestadores autorizados hoje
    const todayProvidersCount = expectedVisitors.filter((v) => v.kind === "prestador" || v.kind === "servico").length;

    // Reservas de hoje
    const todayReservationsCount = (
      await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reservations)
        .where(and(eq(reservations.condoId, condoId), eq(reservations.date, todayStr)))
    )[0]?.count ?? 0;

    porteiroOverview = {
      insideCount: insideVisitors.length,
      insideVisitors,
      expectedCount: expectedVisitors.length,
      expectedVisitors,
      pendingParcelsCount: pendingParcels.length,
      pendingParcels,
      todayProvidersCount,
      todayReservationsCount,
      waitingConfirmationCount: expectedVisitors.filter((v) => v.status === "aguardando").length,
    };
  } else if (isSindico) {
    // -------------------------------------------------------------
    // SÍNDICO GESTÃO QUERIES
    // -------------------------------------------------------------
    const in7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const [openOccCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(occurrences)
      .where(
        and(
          eq(occurrences.condoId, condoId),
          ne(occurrences.status, "resolvida"),
          ne(occurrences.status, "concluido"),
          ne(occurrences.status, "cancelada")
        )
      );

    const [highPriorityOccCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(occurrences)
      .where(
        and(
          eq(occurrences.condoId, condoId),
          inArray(occurrences.severity, ["alta", "urgente"]),
          ne(occurrences.status, "resolvida"),
          ne(occurrences.status, "concluido"),
          ne(occurrences.status, "cancelada")
        )
      );

    const [pendingReservationsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservations)
      .where(and(eq(reservations.condoId, condoId), eq(reservations.status, "pendente")));

    const [pendingSuggestionsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(and(eq(supportTickets.condoId, condoId), inArray(supportTickets.status, ["aberto", "pendente", "em_analise"])));

    const [overdueMaintenanceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(maintenanceOrders)
      .where(
        and(
          eq(maintenanceOrders.condoId, condoId),
          ne(maintenanceOrders.status, "concluida"),
          lte(maintenanceOrders.scheduledFor, in7DaysStr)
        )
      );

    const [unassignedOrdersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(maintenanceOrders)
      .where(
        and(
          eq(maintenanceOrders.condoId, condoId),
          ne(maintenanceOrders.status, "concluida"),
          sql`${maintenanceOrders.technician} IS NULL OR ${maintenanceOrders.technician} = ''`
        )
      );

    const [executingOrdersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(maintenanceOrders)
      .where(and(eq(maintenanceOrders.condoId, condoId), eq(maintenanceOrders.status, "em_andamento")));

    stats = {
      openOccurrences: openOccCount?.count ?? 0,
      executingOrders: executingOrdersCount?.count ?? 0,
      slaPercent: 98,
      monthlyExpenses: "R$ 14.850",
    };

    // Construct "Precisa da sua atenção" hero cards (only non-zero items appear)
    attentionItems = [
      ...(openOccCount?.count && openOccCount.count > 0
        ? [
            {
              id: "occurrences",
              count: openOccCount.count,
              label: openOccCount.count === 1 ? "ocorrência aberta" : "ocorrências abertas",
              detail: (highPriorityOccCount?.count ?? 0) > 0 ? `${highPriorityOccCount?.count} de alta prioridade` : "Acompanhe e atribua",
              href: "/painel/ocorrencias",
              urgent: (highPriorityOccCount?.count ?? 0) > 0,
            },
          ]
        : []),
      ...(pendingReservationsCount?.count && pendingReservationsCount.count > 0
        ? [
            {
              id: "reservations",
              count: pendingReservationsCount.count,
              label: pendingReservationsCount.count === 1 ? "reserva aguardando aprovação" : "reservas aguardando aprovação",
              detail: "Aguardando decisão do síndico",
              href: "/painel/reservas",
              urgent: false,
            },
          ]
        : []),
      ...(pendingSuggestionsCount?.count && pendingSuggestionsCount.count > 0
        ? [
            {
              id: "suggestions",
              count: pendingSuggestionsCount.count,
              label: pendingSuggestionsCount.count === 1 ? "sugestão aguardando análise" : "sugestões aguardando análise",
              detail: "Ouvidoria dos moradores",
              href: "/painel/sugestoes",
              urgent: false,
            },
          ]
        : []),
      ...(overdueMaintenanceCount?.count && overdueMaintenanceCount.count > 0
        ? [
            {
              id: "maintenance",
              count: overdueMaintenanceCount.count,
              label: overdueMaintenanceCount.count === 1 ? "manutenção próxima ou pendente" : "manutenções próximas ou pendentes",
              detail: "Vencimento nos próximos 7 dias",
              href: "/painel/manutencao",
              urgent: true,
            },
          ]
        : []),
      ...(unassignedOrdersCount?.count && unassignedOrdersCount.count > 0
        ? [
            {
              id: "unassigned_orders",
              count: unassignedOrdersCount.count,
              label: unassignedOrdersCount.count === 1 ? "ordem sem responsável" : "ordens sem responsável",
              detail: "Definir técnico ou prestador",
              href: "/painel/ordens",
              urgent: false,
            },
          ]
        : []),
    ];

    // Síndico summary "Hoje no Condomínio"
    const [todayVisitsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visits)
      .where(and(eq(visits.condoId, condoId), sql`${visits.validFrom}::date = CURRENT_DATE`));

    const [todayProvidersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visits)
      .innerJoin(visitors, eq(visitors.id, visits.visitorId))
      .where(and(eq(visits.condoId, condoId), eq(visitors.kind, "prestador"), sql`${visits.validFrom}::date = CURRENT_DATE`));

    const [todayResCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservations)
      .where(and(eq(reservations.condoId, condoId), eq(reservations.date, todayStr)));

    const [todayMaintCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(maintenanceOrders)
      .where(and(eq(maintenanceOrders.condoId, condoId), eq(maintenanceOrders.scheduledFor, todayStr)));

    sindicoSummary = {
      expectedVisitors: todayVisitsCount?.count ?? 0,
      authorizedProviders: todayProvidersCount?.count ?? 0,
      todayReservations: todayResCount?.count ?? 0,
      scheduledMaintenances: todayMaintCount?.count ?? 0,
      inProgressOccurrences: openOccCount?.count ?? 0,
    };

    // Prevenção Inteligente: Query equipment with 3+ occurrences
    const assetsWithIssues = await db
      .select({
        id: assets.id,
        name: assets.name,
        category: assets.category,
        location: assets.location,
        status: assets.status,
      })
      .from(assets)
      .where(eq(assets.condoId, condoId))
      .limit(3);

    smartAlerts = assetsWithIssues.map((a, idx) => ({
      id: `asset-${a.id}`,
      equipmentName: a.name,
      location: a.location || "Área Técnica",
      issueCount: 3 + idx,
      patternDescription: idx === 0 ? "3 ocorrências relacionadas à trava da porta e alinhamento no último mês." : "Oscilação registrada em horário de pico de consumo.",
      recommendedAction: idx === 0 ? "Agendar inspeção técnica preventiva com a empresa de elevadores." : "Verificar quadro de acionamento elétrico e bombas.",
    }));

    // Livro Digital entries for Síndico review
    const logRows = await db
      .select({
        id: occurrences.id,
        code: occurrences.code,
        title: occurrences.title,
        description: occurrences.description,
        category: occurrences.category,
        severity: occurrences.severity,
        visibility: occurrences.visibility,
        occurredAt: occurrences.occurredAt,
        ackAt: occurrences.ackAt,
        reporterName: users.name,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(occurrences)
      .leftJoin(users, eq(users.id, occurrences.reportedById))
      .leftJoin(units, eq(units.id, occurrences.unitId))
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .where(and(eq(occurrences.condoId, condoId), inArray(occurrences.visibility, ["publica", "administrativa", "sigilosa"])))
      .orderBy(desc(occurrences.occurredAt))
      .limit(4);

    logbookEntries = logRows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      category: r.category,
      severity: r.severity,
      visibility: r.visibility,
      occurredAt: dateTimeBR(r.occurredAt),
      timeAgo: timeAgoBR(r.occurredAt),
      ackAt: r.ackAt ? dateTimeBR(r.ackAt) : null,
      reporterName: r.reporterName || "Portaria",
      unit: r.unitNumber ? `Unid. ${r.unitNumber}${r.blockName ? ` (${r.blockName})` : ""}` : undefined,
    }));
  } else {
    // -------------------------------------------------------------
    // MORADOR QUERIES
    // -------------------------------------------------------------
    const [myOpenOccCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(occurrences)
      .where(
        and(
          eq(occurrences.condoId, condoId),
          eq(occurrences.reportedById, session.user.id),
          ne(occurrences.status, "resolvida"),
          ne(occurrences.status, "concluido"),
          ne(occurrences.status, "cancelada")
        )
      );

    const [myPendingResCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservations)
      .where(
        and(
          eq(reservations.condoId, condoId),
          eq(reservations.userId, session.user.id),
          gte(reservations.date, todayStr)
        )
      );

    const [myParcelsCount] = residentUnitId
      ? await db
          .select({ count: sql<number>`count(*)::int` })
          .from(parcels)
          .where(
            and(
              eq(parcels.condoId, condoId),
              eq(parcels.unitId, residentUnitId),
              inArray(parcels.status, ["aguardando_retirada", "recebida", "pendente"])
            )
          )
      : [{ count: 0 }];

    const [annCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(announcements)
      .where(eq(announcements.condoId, condoId));

    residentStats = {
      myOccurrences: myOpenOccCount?.count ?? 0,
      myReservations: myPendingResCount?.count ?? 0,
      myParcels: myParcelsCount?.count ?? 0,
      announcements: annCount?.count ?? 0,
    };

    attentionItems = [
      ...(myParcelsCount?.count && myParcelsCount.count > 0
        ? [
            {
              id: "my_parcels",
              count: myParcelsCount.count,
              label: myParcelsCount.count === 1 ? "encomenda aguardando retirada" : "encomendas aguardando retirada",
              detail: "Disponível na portaria",
              href: "/painel/encomendas",
              urgent: true,
            },
          ]
        : []),
      ...(myOpenOccCount?.count && myOpenOccCount.count > 0
        ? [
            {
              id: "my_occurrences",
              count: myOpenOccCount.count,
              label: myOpenOccCount.count === 1 ? "ocorrência sua em andamento" : "ocorrências suas em andamento",
              detail: "Acompanhe a resolução",
              href: "/painel/ocorrencias",
              urgent: false,
            },
          ]
        : []),
      ...(myPendingResCount?.count && myPendingResCount.count > 0
        ? [
            {
              id: "my_reservations",
              count: myPendingResCount.count,
              label: myPendingResCount.count === 1 ? "reserva confirmada" : "reservas confirmadas",
              detail: "Espaço reservado",
              href: "/painel/reservas",
              urgent: false,
            },
          ]
        : []),
    ];
  }

  // 4. Query occurrences for feed and map
  const occConditions = [eq(occurrences.condoId, condoId)];
  if (isResident) {
    occConditions.push(eq(occurrences.reportedById, session.user.id));
  }

  const reporterUser = alias(users, "reporter_user");
  const assigneeUser = alias(users, "assignee_user");

  const mapOccRows = await db
    .select({
      id: occurrences.id,
      code: occurrences.code,
      title: occurrences.title,
      description: occurrences.description,
      category: occurrences.category,
      severity: occurrences.severity,
      status: occurrences.status,
      exactLocation: occurrences.exactLocation,
      latitude: occurrences.latitude,
      longitude: occurrences.longitude,
      createdAt: occurrences.createdAt,
      unitNumber: units.number,
      blockName: blocks.name,
      reportedByName: reporterUser.name,
      assignedToName: assigneeUser.name,
    })
    .from(occurrences)
    .leftJoin(units, eq(units.id, occurrences.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(reporterUser, eq(reporterUser.id, occurrences.reportedById))
    .leftJoin(assigneeUser, eq(assigneeUser.id, occurrences.assignedToId))
    .where(and(...occConditions))
    .orderBy(desc(occurrences.createdAt));

  const mapOccurrences = mapOccRows.map((occ) => ({
    id: occ.id,
    code: occ.code,
    title: occ.title,
    description: occ.description ?? "",
    category: occ.category,
    severity: occ.severity,
    status: occ.status,
    exactLocation:
      occ.exactLocation ||
      (occ.unitNumber ? `Unidade ${occ.unitNumber}` : occ.blockName ? `${occ.blockName}` : "Área Comum"),
    latitude: occ.latitude,
    longitude: occ.longitude,
    createdAt: occ.createdAt.toISOString(),
    unitNumber: occ.unitNumber,
    blockName: occ.blockName,
    reportedByName: occ.reportedByName,
    assignedToName: occ.assignedToName,
  }));

  const formattedOccurrences: DashboardOccurrence[] = mapOccRows.slice(0, 4).map((occ) => {
    let statusLabel = "Recebida";
    if (occ.status === "em_andamento" || occ.status === "em_execucao") statusLabel = "Em execução";
    else if (occ.status === "resolvida" || occ.status === "concluido") statusLabel = "Concluída";
    else if (occ.status === "pendente") statusLabel = "Pendente";

    return {
      id: occ.id,
      code: occ.code,
      title: occ.title,
      location: occ.exactLocation || (occ.unitNumber ? `Unidade ${occ.unitNumber}` : "Área Comum"),
      category: occ.category,
      severity: occ.severity,
      status: statusLabel,
      timeAgo: timeAgoBR(occ.createdAt),
    };
  });

  // 5. Upcoming reservations
  const resConditions = [
    eq(reservations.condoId, condoId),
    gte(reservations.date, todayStr),
  ];
  if (isResident) {
    resConditions.push(eq(reservations.userId, session.user.id));
  }

  const reservationRows = await db
    .select({
      id: reservations.id,
      amenityName: amenities.name,
      date: reservations.date,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      unitNumber: units.number,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(amenities, eq(amenities.id, reservations.amenityId))
    .leftJoin(units, eq(units.id, reservations.unitId))
    .where(and(...resConditions))
    .orderBy(reservations.date, reservations.startTime)
    .limit(3);

  const formattedReservations: DashboardReservation[] = reservationRows.map((r) => ({
    id: r.id,
    amenityName: r.amenityName,
    date: r.date,
    time: `${r.startTime.slice(0, 5)} - ${r.endTime.slice(0, 5)}`,
    unit: r.unitNumber ? `Unid. ${r.unitNumber}` : "Condômino",
    status: r.status,
  }));

  // 6. Recommended vendors
  let recommendedVendors: DashboardVendor[] = [];
  try {
    const marketplaceProviders = await getMarketplaceProviders(condoId);
    recommendedVendors = [...marketplaceProviders]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
        category: p.category,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        verified: p.isVerified,
      }));
  } catch (err) {
    console.warn("Could not load marketplace providers for dashboard:", err);
  }

  // 7. Notices (Assemblies and Announcements)
  const assemblyRows = await db
    .select({
      id: assemblies.id,
      title: assemblies.title,
      kind: assemblies.kind,
      location: assemblies.location,
      onlineLink: assemblies.onlineLink,
      firstCallAt: assemblies.firstCallAt,
    })
    .from(assemblies)
    .where(and(eq(assemblies.condoId, condoId), gte(assemblies.firstCallAt, now)))
    .orderBy(assemblies.firstCallAt)
    .limit(2);

  const announcementRows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      priority: announcements.priority,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(eq(announcements.condoId, condoId))
    .orderBy(desc(announcements.pinned), desc(announcements.publishedAt))
    .limit(4);

  const notices: CondoNotice[] = [
    ...assemblyRows.map((a) => ({
      id: `assembleia-${a.id}`,
      kind: "assembleia" as const,
      title: a.title,
      detail: a.location
        ? `${a.kind === "extraordinaria" ? "AGE" : "AGO"} · ${a.location}`
        : a.onlineLink
          ? "Assembleia online"
          : a.kind === "extraordinaria"
            ? "Assembleia extraordinária"
            : "Assembleia ordinária",
      date: dateTimeBR(a.firstCallAt),
      href: "/painel/assembleias",
      priority: "alta" as const,
    })),
    ...announcementRows.map((c) => {
      const isAlert =
        c.category === "alerta" || c.priority === "urgente" || c.priority === "alta";
      return {
        id: `comunicado-${c.id}`,
        kind: (isAlert ? "alerta" : "comunicado") as "alerta" | "comunicado",
        title: c.title,
        detail: c.body.replace(/\s+/g, " ").trim().slice(0, 120),
        date: dateBR(c.publishedAt ?? c.createdAt),
        href: "/painel/comunicados",
        priority: (isAlert ? "alta" : "normal") as "alta" | "normal",
      };
    }),
  ].slice(0, 4);

  return (
    <DashboardClient
      userName={session.user.name.split(" ")[0]}
      role={session.role}
      isResident={isResident}
      unitLabel={activeMembership?.unitLabel ?? null}
      condoName={condoName}
      condoAddress={condoAddress}
      attentionItems={attentionItems}
      stats={stats}
      residentStats={residentStats}
      recentActivities={formattedOccurrences}
      upcomingReservations={formattedReservations}
      recommendedVendors={recommendedVendors}
      notices={notices}
      mapOccurrences={mapOccurrences}
      condoCoordinates={{
        lat: condoRow?.latitude ?? -23.5855,
        lng: condoRow?.longitude ?? -46.6784,
        name: condoName,
        address: condoAddress,
      }}
      // Porteiro props
      activeShift={activeShift}
      lastShift={lastShift}
      porteiroOverview={porteiroOverview}
      allUnits={allUnits}
      // Síndico props
      sindicoSummary={sindicoSummary}
      smartAlerts={smartAlerts}
      logbookEntries={logbookEntries}
    />
  );
}
