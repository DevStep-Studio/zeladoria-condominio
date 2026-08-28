import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  amenities,
  announcements,
  assemblies,
  assemblyMinutes,
  blocks,
  notifications,
  parcels,
  reservations,
  tickets,
  units,
  users,
  visits,
} from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { CondoMap } from "@/components/condo-map";
import { CondoServices } from "@/components/condo-services";
import { RecentOccurrences, type OccurrenceItem } from "@/components/recent-occurrences";
import { CondoAssistant } from "@/components/condo-assistant";
import { dateBR, dateTimeBR, isoDate, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const { session, condo, condoId } = await requireCondo();
  const isResident = session.role === "morador";
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(session.role);
  const today = isoDate();
  const unitId = session.unitId;

  // Query occurrences / tickets
  const ticketScope = isResident ? eq(tickets.openedById, session.user.id) : undefined;
  const recentTicketRows = await db
    .select({
      id: tickets.id,
      code: tickets.code,
      title: tickets.title,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      unitNumber: units.number,
      blockName: blocks.name,
      userName: users.name,
    })
    .from(tickets)
    .leftJoin(units, eq(units.id, tickets.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, tickets.openedById))
    .where(and(eq(tickets.condoId, condoId), ticketScope))
    .orderBy(desc(tickets.createdAt))
    .limit(10);

  const formattedOccurrences: OccurrenceItem[] = recentTicketRows.map((t) => {
    let stat: OccurrenceItem["status"] = "aberto";
    if (t.status === "concluido") stat = "concluido";
    else if (t.status === "em_andamento") stat = "em_andamento";
    else if (t.status === "pendente") stat = "pendente";

    let prio: OccurrenceItem["priority"] = "media";
    if (t.priority === "urgente") prio = "urgente";
    else if (t.priority === "alta") prio = "alta";
    else if (t.priority === "baixa") prio = "baixa";

    const dateStr = t.createdAt ? dateTimeBR(t.createdAt) : "Hoje";
    const loc = t.unitNumber
      ? `${t.blockName ? `${t.blockName} · ` : ""}Unidade ${t.unitNumber}`
      : "Área comum";

    return {
      id: t.id,
      protocol: t.code || `OCO-${t.id}`,
      title: t.title,
      category: t.category,
      unit: loc,
      reporter: t.userName ?? "Morador",
      status: stat,
      priority: prio,
      createdAt: dateStr,
    };
  });

  // Query operational metrics
  const [openTicketsCount] = await db
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.condoId, condoId), ne(tickets.status, "concluido"), ticketScope));

  const [pendingParcels] = await db
    .select({ n: count() })
    .from(parcels)
    .where(
      and(
        eq(parcels.condoId, condoId),
        eq(parcels.status, "pendente"),
        isResident && unitId ? eq(parcels.unitId, unitId) : undefined
      )
    );

  const [inside] = await db
    .select({ n: count() })
    .from(visits)
    .where(and(eq(visits.condoId, condoId), eq(visits.status, "dentro")));

  const reservationScope = isResident ? eq(reservations.userId, session.user.id) : undefined;
  const reservationRows = await db
    .select({
      id: reservations.id,
      date: reservations.date,
      start: reservations.startTime,
      end: reservations.endTime,
      status: reservations.status,
      amenity: amenities.name,
      fee: amenities.feeCents,
    })
    .from(reservations)
    .innerJoin(amenities, eq(amenities.id, reservations.amenityId))
    .where(and(eq(reservations.condoId, condoId), gte(reservations.date, today), reservationScope))
    .orderBy(asc(reservations.date), asc(reservations.startTime))
    .limit(5);

  const todayAgenda = reservationRows.filter((item) => item.date === today);

  const [pinnedAnnouncement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.condoId, condoId))
    .orderBy(desc(announcements.pinned), desc(announcements.priority), desc(announcements.publishedAt))
    .limit(1);

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Registrar Ocorrência matching reference layout */}
      <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-[var(--color-line)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:px-7 sm:py-5.5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669] shadow-xs">
            <Icon name="plus" size={22} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)] sm:text-xl">
              Registrar ocorrência
            </h2>
            <p className="text-xs text-[var(--color-muted)] font-medium sm:text-sm">
              Comunique problemas, manutenções ou emergências do condomínio.
            </p>
          </div>
        </div>

        <Link
          href="/painel/chamados"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-95 shrink-0"
        >
          <span>Abrir solicitação</span>
          <Icon name="arrow-right" size={16} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Main 2-Column Layout matching Reference Image */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[48%_52%] xl:grid-cols-[46%_54%]">
        {/* Left Column: Condo Map + Operational Metrics */}
        <div className="space-y-6">
          {/* Interactive Map with Point of Departure and SOS button */}
          <CondoMap condoName={condo.name} address="Portaria Principal & Áreas Comuns" />

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Chamados
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-blue-50 text-[#0070F3]">
                  <Icon name="wrench" size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tabular-nums text-[var(--color-ink)]">
                {openTicketsCount?.n ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--color-muted)]">em aberto</p>
            </div>

            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Reservas
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-amber-50 text-[#F59E0B]">
                  <Icon name="calendar" size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tabular-nums text-[var(--color-ink)]">
                {todayAgenda.length}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--color-muted)]">agendadas hoje</p>
            </div>

            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Encomendas
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-purple-50 text-[#8B5CF6]">
                  <Icon name="package" size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tabular-nums text-[var(--color-ink)]">
                {pendingParcels?.n ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--color-muted)]">na portaria</p>
            </div>

            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Presentes
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-emerald-50 text-[#10B981]">
                  <Icon name="user-check" size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tabular-nums text-[var(--color-ink)]">
                {inside?.n ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--color-muted)]">no condomínio</p>
            </div>
          </div>

          {/* Pinned announcement if any */}
          {pinnedAnnouncement ? (
            <div className="rounded-[16px] border border-[#BFDBFE] bg-[#EFF6FF] p-4.5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0070F3] text-white">
                  <Icon name="megaphone" size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="chip bg-blue-100 text-[#0070F3] text-[10px] font-bold">
                      COMUNICADO OFICIAL
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-[var(--color-ink)]">
                    {pinnedAnnouncement.title}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                    {pinnedAnnouncement.body}
                  </p>
                  <Link
                    href="/painel/comunicados"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0070F3] hover:underline"
                  >
                    <span>Ler comunicado completo</span>
                    <Icon name="arrow-right" size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Serviços do Condomínio (6 Cards) + Ocorrências Recentes */}
        <div className="space-y-6">
          {/* 6 Quick Modules Grid matching reference */}
          <CondoServices />

          {/* Ocorrências Recentes Filter & Table List */}
          <div className="rounded-[20px] border border-[var(--color-line)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <RecentOccurrences initialOccurrences={formattedOccurrences} />
          </div>
        </div>
      </div>

      {/* Floating Virtual Assistant Bot matching reference */}
      <CondoAssistant />
    </div>
  );
}
