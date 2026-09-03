import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { amenities, condominiums, occurrences, parcels, reservations, tickets, units, vendors } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
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

  // 2. Query counts for "Precisa da sua atenção"
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

  const [pendingTicketsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(
      and(
        eq(tickets.condoId, condoId),
        inArray(tickets.status, ["solicitado", "em_analise"])
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

  const [pendingParcelsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(parcels)
    .where(
      and(
        eq(parcels.condoId, condoId),
        inArray(parcels.status, ["aguardando_retirada", "recebida"])
      )
    );

  const attentionItems: AttentionItem[] = [
    {
      id: "occurrences",
      count: openOccCount?.count ?? 0,
      label: "ocorrências abertas",
      sublabel: "Acompanhe o andamento",
      href: "/painel/ocorrencias",
      icon: "clipboard",
      urgent: (openOccCount?.count ?? 0) > 3,
    },
    {
      id: "tickets",
      count: pendingTicketsCount?.count ?? 0,
      label: "solicitações pendentes",
      sublabel: "Aguardando análise da equipe",
      href: "/painel/servicos",
      icon: "wrench",
      urgent: false,
    },
    {
      id: "reservations",
      count: pendingReservationsCount?.count ?? 0,
      label: "reservas aguardando",
      sublabel: "Aguardando confirmação",
      href: "/painel/reservas",
      icon: "calendar",
      urgent: false,
    },
    {
      id: "parcels",
      count: pendingParcelsCount?.count ?? 0,
      label: "encomendas na portaria",
      sublabel: "Disponíveis para retirada",
      href: "/painel/encomendas",
      icon: "package",
      urgent: false,
    },
  ];

  // 3. Query executing service tickets count
  const [executingOrdersCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(
      and(
        eq(tickets.condoId, condoId),
        eq(tickets.status, "em_execucao")
      )
    );

  // 4. Query recent occurrences
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
    .where(eq(occurrences.condoId, condoId))
    .orderBy(desc(occurrences.createdAt))
    .limit(4);

  const formattedOccurrences: DashboardOccurrence[] = recentOccRows.map((occ) => {
    let statusLabel = "Recebida";
    if (occ.status === "em_andamento" || occ.status === "em_execucao") statusLabel = "Em execução";
    else if (occ.status === "resolvida" || occ.status === "concluido") statusLabel = "Concluída";
    else if (occ.status === "pendente") statusLabel = "Pendente";

    // Simple relative time
    let timeAgo = "Hoje";
    if (occ.createdAt) {
      const diffHours = Math.round((Date.now() - new Date(occ.createdAt).getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) timeAgo = "Há 15 min";
      else if (diffHours < 24) timeAgo = `Há ${diffHours}h`;
      else timeAgo = `Há ${Math.round(diffHours / 24)}d`;
    }

    return {
      id: occ.id,
      code: occ.code,
      title: occ.title,
      location: occ.exactLocation || (occ.unitNumber ? `Unidade ${occ.unitNumber}` : "Área Comum"),
      category: occ.category,
      severity: occ.severity,
      status: statusLabel,
      timeAgo,
    };
  });

  // 5. Query upcoming reservations
  const todayStr = new Date().toISOString().split("T")[0];
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
    .where(
      and(
        eq(reservations.condoId, condoId),
        gte(reservations.date, todayStr)
      )
    )
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

  // 6. Query recommended vendors
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
      condoName={condoName}
      condoAddress={condoAddress}
      attentionItems={attentionItems}
      stats={{
        openOccurrences: openOccCount?.count ?? 0,
        executingOrders: executingOrdersCount?.count ?? 0,
        slaPercent: 100,
        monthlyExpenses: "R$ 0",
      }}
      recentActivities={formattedOccurrences}
      upcomingReservations={formattedReservations}
      recommendedVendors={recommendedVendors}
    />
  );
}
