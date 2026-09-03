import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { amenities, announcements, condominiums, occurrences, parcels, reservations, tickets, units, vendors } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { timeAgoBR } from "@/lib/utils";
import {
  DashboardClient,
  type AttentionItem,
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

  // 5. Query recommended vendors
  const dbVendors = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.condoId, condoId), eq(vendors.active, true)))
    .limit(3);

  const recommendedVendors: DashboardVendor[] = dbVendors.length > 0
    ? dbVendors.map((v) => ({
        id: v.id,
        name: v.name,
        company: v.category || "Prestador",
        category: v.category || "Geral",
        rating: 4.9,
        reviewsCount: 38,
        verified: true,
      }))
    : [
        {
          id: 1,
          name: "Carlos Eduardo Silva",
          company: "Volt & Luz Soluções Elétricas",
          category: "Elétrica",
          rating: 4.9,
          reviewsCount: 42,
          verified: true,
        },
        {
          id: 2,
          name: "AquaFix Manutenções",
          company: "AquaFix Engenharia Hidráulica",
          category: "Hidráulica",
          rating: 4.8,
          reviewsCount: 35,
          verified: true,
        },
        {
          id: 3,
          name: "Diego Pinturas",
          company: "Color Master",
          category: "Pintura",
          rating: 5.0,
          reviewsCount: 29,
          verified: true,
        },
      ];

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
    />
  );
}
