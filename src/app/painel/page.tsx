import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { amenities, announcements, assemblies, condominiums, occurrences, parcels, reservations, tickets, units } from "@/db/schema";
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
} from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";
  const activeMembership = session.memberships.find((m) => m.condoId === condoId);
  const residentUnitId = activeMembership?.unitId ?? session.unitId;

  // 1. Get condo details
  const [condoRow] = await db
    .select()
    .from(condominiums)
    .where(eq(condominiums.id, condoId))
    .limit(1);

  const condoName = condoRow?.name ?? "Residencial Parque das Águas";
  const condoAddress = condoRow
    ? `${condoRow.address ?? "Av. Brasil, 1000"} - ${condoRow.city ?? "São Paulo"} - ${condoRow.state ?? "SP"}`
    : "Av. Brasil, 1000 - São Paulo - SP";

  // 2. Query role-specific attention and summary counts
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

  if (isResident) {
    // Morador View: Personal queries only
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
          gte(reservations.date, new Date().toISOString().split("T")[0])
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
              inArray(parcels.status, ["aguardando_retirada", "recebida"])
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
      {
        id: "my_occurrences",
        count: myOpenOccCount?.count ?? 0,
        label: "minhas ocorrências em aberto",
        detail: "Acompanhe o andamento e reparo",
        href: "/painel/ocorrencias",
        urgent: false,
      },
      {
        id: "my_parcels",
        count: myParcelsCount?.count ?? 0,
        label: "encomendas na portaria",
        detail: "Prontas para retirada",
        href: "/painel/encomendas",
        urgent: (myParcelsCount?.count ?? 0) > 0,
      },
      {
        id: "my_reservations",
        count: myPendingResCount?.count ?? 0,
        label: "minhas reservas ativas",
        detail: "Espaços agendados",
        href: "/painel/reservas",
        urgent: false,
      },
      {
        id: "announcements",
        count: annCount?.count ?? 0,
        label: "comunicados recentes",
        detail: "Informes do condomínio",
        href: "/painel/comunicados",
        urgent: false,
      },
    ];
  } else {
    // Síndico / Gestão View: Full operational metrics
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
          eq(occurrences.severity, "alta"),
          ne(occurrences.status, "resolvida"),
          ne(occurrences.status, "concluido"),
          ne(occurrences.status, "cancelada")
        )
      );

    const [pendingReservationsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservations)
      .where(
        and(
          eq(reservations.condoId, condoId),
          eq(reservations.status, "pendente")
        )
      );

    const [pendingTicketsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(
        and(
          eq(tickets.condoId, condoId),
          inArray(tickets.status, ["solicitado", "em_analise"])
        )
      );

    const [executingOrdersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(
        and(
          eq(tickets.condoId, condoId),
          eq(tickets.status, "em_execucao")
        )
      );

    stats = {
      openOccurrences: openOccCount?.count ?? 0,
      executingOrders: executingOrdersCount?.count ?? 0,
      slaPercent: 100,
      monthlyExpenses: "R$ 0",
    };

    attentionItems = [
      {
        id: "occurrences",
        count: openOccCount?.count ?? 0,
        label: "ocorrências abertas",
        detail: (highPriorityOccCount?.count ?? 0) > 0 ? `${highPriorityOccCount?.count} de prioridade alta` : "Acompanhe o andamento",
        href: "/painel/ocorrencias",
        urgent: (highPriorityOccCount?.count ?? 0) > 0,
      },
      {
        id: "reservations",
        count: pendingReservationsCount?.count ?? 0,
        label: "reservas aguardando confirmação",
        detail: "Aguardando aprovação",
        href: "/painel/reservas",
        urgent: false,
      },
      {
        id: "tickets",
        count: pendingTicketsCount?.count ?? 0,
        label: "solicitações pendentes",
        detail: "Aguardando análise da equipe",
        href: "/painel/servicos",
        urgent: false,
      },
    ];
  }

  // 3. Query recent occurrences (scoped for morador vs global for sindico)
  const occConditions = [eq(occurrences.condoId, condoId)];
  if (isResident) {
    occConditions.push(eq(occurrences.reportedById, session.user.id));
  }

  const recentOccRows = await db
    .select({
      id: occurrences.id,
      code: occurrences.code,
      title: occurrences.title,
      category: occurrences.category,
      severity: occurrences.severity,
      status: occurrences.status,
      exactLocation: occurrences.exactLocation,
      createdAt: occurrences.createdAt,
      unitNumber: units.number,
    })
    .from(occurrences)
    .leftJoin(units, eq(units.id, occurrences.unitId))
    .where(and(...occConditions))
    .orderBy(desc(occurrences.createdAt))
    .limit(4);

  const formattedOccurrences: DashboardOccurrence[] = recentOccRows.map((occ) => {
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

  // 4. Query upcoming reservations (scoped for morador vs global for sindico)
  const todayStr = new Date().toISOString().split("T")[0];
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

  // 5. Prestadores recomendados — dados reais (rating, avaliações e verificação vêm do cadastro e dos chamados)
  const marketplaceProviders = await getMarketplaceProviders(condoId);
  const recommendedVendors: DashboardVendor[] = [...marketplaceProviders]
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

  // 6. Avisos do condomínio: próximas assembleias + comunicados recentes
  const now = new Date();

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
    />
  );
}
