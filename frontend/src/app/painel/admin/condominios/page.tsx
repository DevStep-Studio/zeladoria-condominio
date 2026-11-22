import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { dateTimeBR } from "@/lib/utils";
import { InternalPageHeader, InternalPageLayout, InternalStatusBadge } from "@/components/internal/internal-ui";

import { CreateCondoModal } from "./create-condo-modal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Condomínios · Admin da Plataforma",
  description: "Controle de condomínios ativos, planos contratados e unidades.",
};

export default async function AdminCondominiosPage() {
  await requireSession();

  const { condosList, unitCounts } = await domainRequest<{
    condosList: any[];
    unitCounts: { condoId: number; totalUnits: number }[];
  }>("/painel/admin/condominios");

  const unitsMap = new Map(unitCounts.map((u) => [u.condoId, u.totalUnits]));

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="building"
        title="Condomínios na Plataforma"
        subtitle="Gerenciamento global de empreendimentos atendidos pelo Zeladoria."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "Condomínios" },
        ]}
        badge={<InternalStatusBadge label={`${condosList.length} ativos`} tone="blue" />}
        actions={<CreateCondoModal />}
      />

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(8,26,55,0.03)] overflow-hidden">
        {/* Mobile Cards (< md) */}
        <div className="md:hidden space-y-3 p-4">
          {condosList.map((c) => {
            const totalU = unitsMap.get(c.id) ?? 0;
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">/{c.slug}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#1455FF] font-bold text-[10px] capitalize">
                    {c.plan || "Padrão"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                  <span>{c.city ? `${c.city} - ${c.state || "SP"}` : "São Paulo - SP"}</span>
                  <span>·</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                    {totalU} un.
                  </span>
                </div>
                {c.cnpj && (
                  <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    CNPJ: {c.cnpj}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Condomínio</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">CNPJ</th>
                <th className="py-3 px-4">Unidades</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {condosList.map((c) => {
                const totalU = unitsMap.get(c.id) ?? 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">/{c.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      {c.city ? `${c.city} - ${c.state || "SP"}` : "São Paulo - SP"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {c.cnpj || "Não informado"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {totalU} un.
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#1455FF] font-bold text-[10px] capitalize">
                        {c.plan || "Padrão"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {dateTimeBR(c.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </InternalPageLayout>
  );
}
