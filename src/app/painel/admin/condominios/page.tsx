import Link from "next/link";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { condominiums, units, memberships } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Condomínios · Admin da Plataforma",
  description: "Controle de condomínios ativos, planos contratados e unidades.",
};

export default async function AdminCondominiosPage() {
  await requireSession();

  const condosList = await db
    .select({
      id: condominiums.id,
      name: condominiums.name,
      slug: condominiums.slug,
      cnpj: condominiums.cnpj,
      city: condominiums.city,
      state: condominiums.state,
      plan: condominiums.plan,
      createdAt: condominiums.createdAt,
    })
    .from(condominiums)
    .orderBy(asc(condominiums.name));

  // Contagem de unidades por condomínio
  const unitCounts = await db
    .select({
      condoId: units.condoId,
      totalUnits: count(),
    })
    .from(units)
    .groupBy(units.condoId);

  const unitsMap = new Map(unitCounts.map((u) => [u.condoId, u.totalUnits]));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Condomínios</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Condomínios na Plataforma
          </h1>
          <p className="text-xs text-slate-500">
            Gerenciamento global de empreendimentos atendidos pelo Zeladoria.
          </p>
        </div>
      </div>

      <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#1355FF] font-bold text-[10px] capitalize">
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
    </div>
  );
}
