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
    <main className="min-h-screen bg-[#F5F8FC] text-[#101828] p-5 sm:p-8 lg:p-10">
      <meta httpEquiv="refresh" content="120" />
      <header className="rounded-2xl border border-[#E2E8F0] bg-[#081A37] text-white px-6 py-5 shadow-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="lg" variant="white" />
          <div className="border-l border-white/15 pl-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{condo.name}</h1>
            <p className="text-xs sm:text-sm text-white/75 font-medium mt-0.5">
              {condo.address} · {condo.city}/{condo.state}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl sm:text-4xl font-black tabular-nums text-white">{currentDate}</p>
          <p className="text-xs text-[#93C5FD] font-semibold mt-0.5">
            Mural Digital · Atualização automática a cada 2 minutos
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#526079]">
              Avisos do Condomínio
            </h2>
            <span className="rounded-full bg-[#EAF1FF] text-[#1455FF] px-3 py-0.5 text-xs font-bold">
              {news.length} {news.length === 1 ? "publicação" : "publicações"}
            </span>
          </div>
          {news.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-[#526079]">
              Nenhum aviso publicado no momento.
            </div>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white p-6 shadow-[0_2px_10px_rgba(7,26,56,0.04)] ${
                  item.priority === "alta"
                    ? "border-rose-300 ring-2 ring-rose-500/10"
                    : item.pinned
                    ? "border-[#1455FF]/35 bg-[#EAF1FF]/25"
                    : "border-[#E2E8F0]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[#EAF1FF] text-[#1455FF] px-2.5 py-0.5 uppercase tracking-wide">
                    {item.category}
                  </span>
                  {item.priority === "alta" ? (
                    <span className="rounded-full bg-[#FDECEC] text-[#D92D20] px-2.5 py-0.5 uppercase tracking-wide">
                      Alta prioridade
                    </span>
                  ) : null}
                  {item.pinned ? (
                    <span className="rounded-full bg-[#081A37] text-white px-2.5 py-0.5 uppercase tracking-wide">
                      Fixado
                    </span>
                  ) : null}
                  <span className="text-[#526079] font-medium ml-auto">{dateBR(item.publishedAt)}</span>
                </div>
                <h3 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight text-[#101828]">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm sm:text-base text-[#526079] leading-relaxed">
                  {item.body}
                </p>
              </article>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#526079]">
            Agenda dos espaços
          </h2>
          {agenda.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center text-sm text-[#526079]">
              Sem reservas para hoje.
            </div>
          ) : (
            agenda.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(7,26,56,0.03)]"
              >
                <p className="text-base sm:text-lg font-extrabold text-[#101828]">{item.amenity}</p>
                <p className="text-sm font-bold text-[#1455FF] mt-1">
                  {dateBR(item.date)} · {item.start}–{item.end}
                </p>
              </div>
            ))
          )}
          <div className="flex items-start gap-3 rounded-2xl border border-[#1455FF]/20 bg-[#EAF1FF] p-4 text-xs sm:text-sm font-semibold text-[#081A37] leading-relaxed">
            <Icon name="package" size={18} className="shrink-0 text-[#1455FF] mt-0.5" />
            <span>
              Encomendas são retiradas com o código recebido. Visitantes e prestadores devem apresentar documento na portaria.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
