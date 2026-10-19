import { ApiError, backendRequest } from "@/lib/api/server";
import type { DomainModels } from "@/lib/api/models";

import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { dateBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MuralPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {

  const { c } = await searchParams;
  const currentDate = new Date().toLocaleDateString("pt-BR");
  let data: { condo: DomainModels["condominiums"]; news: DomainModels["announcements"][]; agenda: { amenity: string; date: string; start: string; end: string }[] };
  try {
    data = await backendRequest(`/mural${c ? `?c=${encodeURIComponent(c)}` : ""}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return <main>Condomínio não encontrado.</main>;
    throw error;
  }
  const { condo, news, agenda } = data;

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
