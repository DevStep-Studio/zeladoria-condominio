import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { amenities, announcements, condominiums, reservations } from "@/db/schema";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { dateBR, isoDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MuralPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await ensureSeed();
  const { c } = await searchParams;
  const currentDate = new Date().toLocaleDateString("pt-BR");
  const [condo] = c
    ? await db.select().from(condominiums).where(eq(condominiums.slug, c)).limit(1)
    : await db.select().from(condominiums).orderBy(asc(condominiums.id)).limit(1);

  if (!condo) {
    return <main className="flex min-h-screen items-center justify-center text-[var(--color-muted)]">Condomínio não encontrado.</main>;
  }

  const news = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.condoId, condo.id), eq(announcements.showOnTv, true)))
    .orderBy(desc(announcements.pinned), desc(announcements.publishedAt))
    .limit(5);

  const agenda = await db
    .select({ date: reservations.date, start: reservations.startTime, end: reservations.endTime, amenity: amenities.name, status: reservations.status })
    .from(reservations)
    .innerJoin(amenities, eq(amenities.id, reservations.amenityId))
    .where(and(eq(reservations.condoId, condo.id), gte(reservations.date, isoDate()), eq(reservations.status, "aprovada")))
    .orderBy(asc(reservations.date))
    .limit(6);

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] p-6 text-[var(--color-ink)] sm:p-8">
      <meta httpEquiv="refresh" content="120" />
      <header className="flex items-center justify-between border-b border-[var(--color-line)] pb-6">
        <div className="flex items-center gap-4">
          <BrandLogo size="lg" />
          <div className="border-l border-[var(--color-line)] pl-4">
            <h1 className="text-3xl font-black tracking-tight">{condo.name}</h1>
            <p className="text-sm text-[var(--color-muted)] font-medium">{condo.address} · {condo.city}/{condo.state}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black tabular-nums text-[#0070F3]">{currentDate}</p>
          <p className="text-xs text-[var(--color-muted)] font-medium">Mural Digital · Atualização em tempo real</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-muted)]">Avisos do Condomínio</h2>
          {news.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-muted)]">
              Nenhum aviso publicado no momento.
            </div>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                className={`rounded-[16px] border bg-white p-6 shadow-xs ${
                  item.priority === "alta" ? "border-amber-300 bg-amber-50/40" : "border-[var(--color-line)]"
                }`}
              >
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  <span className="chip bg-blue-50 text-[#0070F3]">{item.category}</span>
                  <span>{dateBR(item.publishedAt)}</span>
                  {item.pinned ? <span className="chip bg-[#FEF3C7] text-[#B45309]">fixado</span> : null}
                </div>
                <h3 className="mt-2.5 text-2xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-base text-[var(--color-muted)] leading-relaxed">{item.body}</p>
              </article>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-muted)]">Agenda dos espaços</h2>
          {agenda.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-6 text-center text-sm text-[var(--color-muted)]">
              Sem reservas para hoje.
            </div>
          ) : (
            agenda.map((item, index) => (
              <div key={index} className="rounded-[14px] border border-[var(--color-line)] bg-white p-4 shadow-xs">
                <p className="text-lg font-bold text-[var(--color-ink)]">{item.amenity}</p>
                <p className="text-sm font-semibold text-[#0070F3]">
                  {dateBR(item.date)} · {item.start}–{item.end}
                </p>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 rounded-[16px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-xs font-semibold text-[#0070F3] leading-relaxed">
            <Icon name="package" size={16} className="shrink-0" />
            <span>Encomendas são retiradas com o código recebido. Visitantes e prestadores devem apresentar documento na portaria.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
