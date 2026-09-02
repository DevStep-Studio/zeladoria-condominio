import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agendaEvents,
  amenities,
  announcements,
  assemblies,
  blocks,
  condominiums,
  memberships,
  notifications,
  occurrences,
  parcels,
  reservations,
  tickets,
  units,
  users,
  visits,
} from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { dateBR, dateTimeBR, isoDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const { session, condo, condoId } = await requireCondo();
  const role = session.role;
  const today = isoDate();

  // Distinct dashboard data rendering per role

  /* =========================================================================
     1. ADMIN DASHBOARD DATA
  ========================================================================= */
  if (role === "superadmin") {
    const [condosCount] = await db.select({ n: count() }).from(condominiums);
    const [usersCount] = await db.select({ n: count() }).from(users);
    const [sindicosCount] = await db
      .select({ n: count() })
      .from(memberships)
      .where(eq(memberships.role, "sindico"));
    const [moradoresCount] = await db
      .select({ n: count() })
      .from(memberships)
      .where(eq(memberships.role, "morador"));
    const [pendingResCount] = await db
      .select({ n: count() })
      .from(reservations)
      .where(eq(reservations.status, "pendente"));
    const [openOccCount] = await db
      .select({ n: count() })
      .from(occurrences)
      .where(ne(occurrences.status, "resolvida"));
    const [scheduledAssembliesCount] = await db
      .select({ n: count() })
      .from(assemblies)
      .where(ne(assemblies.status, "encerrada"));

    const recentCondos = await db
      .select()
      .from(condominiums)
      .orderBy(desc(condominiums.createdAt))
      .limit(4);

    const recentOccurrencesList = await db
      .select({
        id: occurrences.id,
        code: occurrences.code,
        title: occurrences.title,
        severity: occurrences.severity,
        status: occurrences.status,
        createdAt: occurrences.createdAt,
        condoName: condominiums.name,
      })
      .from(occurrences)
      .leftJoin(condominiums, eq(condominiums.id, occurrences.condoId))
      .orderBy(desc(occurrences.createdAt))
      .limit(5);

    return (
      <div className="space-y-8">
        {/* Header greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-[#0D9488] mb-2">
              <span className="flex h-2 w-2 rounded-full bg-[#0D9488] animate-pulse" />
              SISTEMA GLOBAL · SUPER ADMINISTRADOR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">
              Olá, {session.user.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Visão consolidada de todos os condomínios, usuários e módulos da plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/painel/agenda" className="btn-ghost btn-sm">
              <Icon name="calendar" size={15} />
              Ver Agenda
            </Link>
            <Link href="/painel/portaria" className="btn-primary btn-sm">
              <Icon name="shield" size={15} />
              Acessar Portaria
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-[#0D9488]">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Condomínios Ativos</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{condosCount?.n ?? 0}</span>
              <Icon name="building" size={20} className="text-[#0D9488]" />
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">Gerenciados no SaaS</p>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Usuários Ativos</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{usersCount?.n ?? 0}</span>
              <Icon name="users" size={20} className="text-emerald-500" />
            </div>
            <p className="text-[11px] text-[var(--color-muted)] font-semibold mt-1">{moradoresCount?.n ?? 0} moradores cadastrados</p>
          </div>

          <div className="card p-5 border-l-4 border-l-amber-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Ocorrências Abertas</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{openOccCount?.n ?? 0}</span>
              <Icon name="book" size={20} className="text-amber-500" />
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Requerem atendimento</p>
          </div>

          <div className="card p-5 border-l-4 border-l-blue-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Reservas Pendentes</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{pendingResCount?.n ?? 0}</span>
              <Icon name="calendar" size={20} className="text-blue-500" />
            </div>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Aguardando aprovação</p>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Occurrences */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="book" size={18} className="text-[#0D9488]" />
                Ocorrências Recentes do Sistema
              </h2>
              <Link href="/painel/ocorrencias" className="text-xs font-bold text-[#0D9488] hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-line)]">
              {recentOccurrencesList.map((occ) => (
                <div key={occ.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0D9488]">{occ.code}</span>
                      <span className="text-xs text-[var(--color-muted)]">· {occ.condoName}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)] truncate mt-0.5">{occ.title}</p>
                    <p className="text-xs text-[var(--color-subtle)]">{occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}</p>
                  </div>
                  <span className={`chip shrink-0 ${
                    occ.severity === "urgente" ? "bg-red-50 text-red-700 border-red-200" :
                    occ.severity === "alta" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {occ.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Condos & Shortcuts */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="building" size={18} className="text-[#0D9488]" />
                Condomínios Registrados
              </h2>
              <span className="text-xs font-semibold text-[var(--color-muted)]">{sindicosCount?.n ?? 0} Síndicos</span>
            </div>
            <div className="space-y-3">
              {recentCondos.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-line)]">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{c.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{c.city} - {c.state} · Plano {c.plan.toUpperCase()}</p>
                  </div>
                  <span className="chip bg-teal-50 text-[#0D9488] border-teal-200">Ativo</span>
                </div>
              ))}
            </div>

            {/* Quick action grid */}
            <div className="pt-3 border-t border-[var(--color-line)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Atalhos Globais</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link href="/painel/agenda" className="p-3 rounded-[10px] bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-[var(--color-line)] text-center transition-colors">
                  <Icon name="calendar" size={18} className="mx-auto text-[#0D9488] mb-1" />
                  <span className="text-xs font-bold text-[var(--color-ink)] block">Agenda</span>
                </Link>
                <Link href="/painel/servicos" className="p-3 rounded-[10px] bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-[var(--color-line)] text-center transition-colors">
                  <Icon name="wrench" size={18} className="mx-auto text-[#0D9488] mb-1" />
                  <span className="text-xs font-bold text-[var(--color-ink)] block">Serviços</span>
                </Link>
                <Link href="/painel/reservas" className="p-3 rounded-[10px] bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-[var(--color-line)] text-center transition-colors">
                  <Icon name="building" size={18} className="mx-auto text-[#0D9488] mb-1" />
                  <span className="text-xs font-bold text-[var(--color-ink)] block">Reservas</span>
                </Link>
                <Link href="/painel/assembleias" className="p-3 rounded-[10px] bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-[var(--color-line)] text-center transition-colors">
                  <Icon name="scale" size={18} className="mx-auto text-[#0D9488] mb-1" />
                  <span className="text-xs font-bold text-[var(--color-ink)] block">Assembleias</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. SÍNDICO DASHBOARD DATA
  ========================================================================= */
  if (role === "sindico" || role === "conselho" || role === "zelador") {
    const [openOccCount] = await db
      .select({ n: count() })
      .from(occurrences)
      .where(and(eq(occurrences.condoId, condoId), ne(occurrences.status, "resolvida")));

    const [todayReservationsCount] = await db
      .select({ n: count() })
      .from(reservations)
      .where(and(eq(reservations.condoId, condoId), eq(reservations.date, today), eq(reservations.status, "aprovada")));

    const [pendingServicesCount] = await db
      .select({ n: count() })
      .from(tickets)
      .where(and(eq(tickets.condoId, condoId), ne(tickets.status, "concluido"), ne(tickets.status, "cancelado")));

    const [waitingVisitorsCount] = await db
      .select({ n: count() })
      .from(visits)
      .where(and(eq(visits.condoId, condoId), eq(visits.status, "aguardando")));

    const upcomingAssembly = await db
      .select()
      .from(assemblies)
      .where(and(eq(assemblies.condoId, condoId), ne(assemblies.status, "encerrada")))
      .orderBy(asc(assemblies.firstCallAt))
      .limit(1);

    const todayReservations = await db
      .select({
        id: reservations.id,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        guests: reservations.guests,
        status: reservations.status,
        amenityName: amenities.name,
        unitNumber: units.number,
        userName: users.name,
      })
      .from(reservations)
      .leftJoin(amenities, eq(amenities.id, reservations.amenityId))
      .leftJoin(units, eq(units.id, reservations.unitId))
      .leftJoin(users, eq(users.id, reservations.userId))
      .where(and(eq(reservations.condoId, condoId), eq(reservations.date, today)))
      .orderBy(asc(reservations.startTime))
      .limit(5);

    const recentOccurrences = await db
      .select({
        id: occurrences.id,
        code: occurrences.code,
        title: occurrences.title,
        category: occurrences.category,
        severity: occurrences.severity,
        status: occurrences.status,
        createdAt: occurrences.createdAt,
        unitNumber: units.number,
      })
      .from(occurrences)
      .leftJoin(units, eq(units.id, occurrences.unitId))
      .where(eq(occurrences.condoId, condoId))
      .orderBy(desc(occurrences.createdAt))
      .limit(5);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-[#0D9488] mb-2">
              <span className="flex h-2 w-2 rounded-full bg-[#0D9488] animate-pulse" />
              PAINEL DA SÍNDICA · {condo?.name}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">
              Olá, {session.user.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {condo?.address ? `${condo.address} - ` : ""}{condo?.city}/{condo?.state}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/painel/agenda" className="btn-ghost btn-sm">
              <Icon name="calendar" size={15} />
              Agenda
            </Link>
            <Link href="/painel/ocorrencias" className="btn-primary btn-sm">
              <Icon name="plus" size={15} />
              Ocorrências
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-amber-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Ocorrências Abertas</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{openOccCount?.n ?? 0}</span>
              <Icon name="book" size={20} className="text-amber-500" />
            </div>
            <Link href="/painel/ocorrencias" className="text-[11px] text-amber-600 font-semibold mt-1 inline-block hover:underline">
              Responder chamados →
            </Link>
          </div>

          <div className="card p-5 border-l-4 border-l-[#0D9488]">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Reservas de Hoje</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{todayReservationsCount?.n ?? 0}</span>
              <Icon name="calendar" size={20} className="text-[#0D9488]" />
            </div>
            <Link href="/painel/reservas" className="text-[11px] text-teal-600 font-semibold mt-1 inline-block hover:underline">
              Ver agendamentos →
            </Link>
          </div>

          <div className="card p-5 border-l-4 border-l-blue-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Serviços Pendentes</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{pendingServicesCount?.n ?? 0}</span>
              <Icon name="wrench" size={20} className="text-blue-500" />
            </div>
            <Link href="/painel/servicos" className="text-[11px] text-blue-600 font-semibold mt-1 inline-block hover:underline">
              Despachar ordens →
            </Link>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Visitantes no Dia</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">{waitingVisitorsCount?.n ?? 0}</span>
              <Icon name="shield" size={20} className="text-emerald-500" />
            </div>
            <Link href="/painel/portaria" className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block hover:underline">
              Acompanhar portaria →
            </Link>
          </div>
        </div>

        {/* Assembly Banner if exists */}
        {upcomingAssembly[0] ? (
          <div className="rounded-[16px] border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#0D9488] text-white shrink-0">
                <Icon name="scale" size={22} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Próxima Assembleia Convocada</p>
                <h3 className="text-base font-bold text-[var(--color-ink)]">{upcomingAssembly[0].title}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {dateTimeBR(upcomingAssembly[0].firstCallAt)} · {upcomingAssembly[0].location || "Online"}
                </p>
              </div>
            </div>
            <Link href="/painel/assembleias" className="btn-primary btn-sm shrink-0">
              Ver Pautas e Quórum
            </Link>
          </div>
        ) : null}

        {/* 2 Column Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Bookings */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="calendar" size={18} className="text-[#0D9488]" />
                Reservas do Dia ({todayReservations.length})
              </h2>
              <Link href="/painel/reservas" className="text-xs font-bold text-[#0D9488] hover:underline">
                Gerenciar áreas →
              </Link>
            </div>
            {todayReservations.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-muted)]">
                Nenhuma reserva agendada para hoje.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {todayReservations.map((res) => (
                  <div key={res.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">{res.amenityName}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {res.startTime} às {res.endTime} · Unidade {res.unitNumber ?? "Geral"} ({res.userName})
                      </p>
                    </div>
                    <span className="chip bg-teal-50 text-[#0D9488] border-teal-200">
                      {res.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Occurrences */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="book" size={18} className="text-amber-500" />
                Ocorrências Recentes
              </h2>
              <Link href="/painel/ocorrencias" className="text-xs font-bold text-[#0D9488] hover:underline">
                Painel completo →
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-line)]">
              {recentOccurrences.map((occ) => (
                <div key={occ.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                      <span className="font-mono text-xs text-[#0D9488] mr-1">{occ.code}</span>
                      {occ.title}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {occ.unitNumber ? `Unidade ${occ.unitNumber} · ` : ""}{occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${
                    occ.status === "resolvida" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    occ.status === "em_execucao" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {occ.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. MORADOR DASHBOARD DATA
  ========================================================================= */
  const unitId = session.unitId;

  const [myPendingParcels] = await db
    .select({ n: count() })
    .from(parcels)
    .where(and(eq(parcels.condoId, condoId), eq(parcels.status, "pendente"), unitId ? eq(parcels.unitId, unitId) : undefined));

  const [myOpenTickets] = await db
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.condoId, condoId), eq(tickets.openedById, session.user.id), ne(tickets.status, "concluido"), ne(tickets.status, "cancelado")));

  const myReservations = await db
    .select({
      id: reservations.id,
      date: reservations.date,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
      qrToken: reservations.qrToken,
      amenityName: amenities.name,
    })
    .from(reservations)
    .leftJoin(amenities, eq(amenities.id, reservations.amenityId))
    .where(and(eq(reservations.condoId, condoId), eq(reservations.userId, session.user.id), gte(reservations.date, today)))
    .orderBy(asc(reservations.date))
    .limit(3);

  const myOccurrences = await db
    .select()
    .from(occurrences)
    .where(and(eq(occurrences.condoId, condoId), eq(occurrences.reportedById, session.user.id)))
    .orderBy(desc(occurrences.createdAt))
    .limit(3);

  const upcomingEvents = await db
    .select()
    .from(agendaEvents)
    .where(and(eq(agendaEvents.condoId, condoId), gte(agendaEvents.date, today)))
    .orderBy(asc(agendaEvents.date))
    .limit(3);

  const activeVisits = await db
    .select({
      id: visits.id,
      visitorName: users.name,
      validUntil: visits.validUntil,
      status: visits.status,
      purpose: visits.purpose,
    })
    .from(visits)
    .leftJoin(users, eq(users.id, visits.visitorId))
    .where(and(eq(visits.condoId, condoId), eq(visits.hostUserId, session.user.id), gte(visits.validUntil, new Date())))
    .limit(3);

  return (
    <div className="space-y-8">
      {/* Resident Identification Hero */}
      <div className="rounded-[18px] border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-emerald-50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-bold text-[#0D9488] mb-3 shadow-2xs">
              <Icon name="home" size={14} />
              {condo?.name ?? "Condomínio"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)]">
              Olá, {session.user.name}!
            </h1>
            <p className="text-sm font-semibold text-[var(--color-muted)] mt-1">
              Unidade cadastrada: <span className="text-[#0D9488] font-bold">Apto {session.memberships.find(m => m.condoId === condoId)?.unitLabel ?? "302"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/painel/reservas" className="btn-primary btn-sm">
              <Icon name="calendar" size={15} />
              Fazer Reserva
            </Link>
            <Link href="/painel/ocorrencias" className="btn-ghost btn-sm">
              <Icon name="plus" size={15} />
              Abrir Ocorrência
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link href="/painel/ocorrencias" className="card p-4 hover:border-teal-300 hover:shadow-md transition-all group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-teal-50 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white transition-colors mb-3">
            <Icon name="book" size={20} />
          </div>
          <p className="text-sm font-bold text-[var(--color-ink)]">Ocorrências</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{myOpenTickets?.n ?? 0} ativas</p>
        </Link>

        <Link href="/painel/reservas" className="card p-4 hover:border-teal-300 hover:shadow-md transition-all group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-50 text-[#059669] group-hover:bg-[#059669] group-hover:text-white transition-colors mb-3">
            <Icon name="calendar" size={20} />
          </div>
          <p className="text-sm font-bold text-[var(--color-ink)]">Reservas</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{myReservations.length} agendadas</p>
        </Link>

        <Link href="/painel/servicos" className="card p-4 hover:border-teal-300 hover:shadow-md transition-all group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
            <Icon name="wrench" size={20} />
          </div>
          <p className="text-sm font-bold text-[var(--color-ink)]">Serviços</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">Solicitar e avaliar</p>
        </Link>

        <Link href="/painel/portaria" className="card p-4 hover:border-teal-300 hover:shadow-md transition-all group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors mb-3">
            <Icon name="shield" size={20} />
          </div>
          <p className="text-sm font-bold text-[var(--color-ink)]">Portaria & Acesso</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{myPendingParcels?.n ?? 0} encomendas</p>
        </Link>
      </div>

      {/* 2 Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Reservations */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
              <Icon name="calendar" size={18} className="text-[#0D9488]" />
              Minhas Próximas Reservas
            </h2>
            <Link href="/painel/reservas" className="text-xs font-bold text-[#0D9488] hover:underline">
              Ver todas →
            </Link>
          </div>
          {myReservations.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--color-muted)]">
              Você não tem reservas futuras agendadas.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {myReservations.map((res) => (
                <div key={res.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{res.amenityName}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {dateBR(res.date)} · {res.startTime} às {res.endTime}
                    </p>
                  </div>
                  <span className={`chip ${
                    res.status === "aprovada" ? "bg-teal-50 text-[#0D9488] border-teal-200" :
                    res.status === "pendente" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {res.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Occurrences */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
              <Icon name="book" size={18} className="text-amber-500" />
              Minhas Ocorrências Recentes
            </h2>
            <Link href="/painel/ocorrencias" className="text-xs font-bold text-[#0D9488] hover:underline">
              Histórico →
            </Link>
          </div>
          {myOccurrences.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--color-muted)]">
              Nenhuma ocorrência registrada por você.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {myOccurrences.map((occ) => (
                <div key={occ.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                      <span className="font-mono text-xs text-[#0D9488] mr-1">{occ.code}</span>
                      {occ.title}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${
                    occ.status === "resolvida" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    occ.status === "em_execucao" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {occ.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
