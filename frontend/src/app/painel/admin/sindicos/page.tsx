import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Síndicos · Admin da Plataforma",
  description: "Síndicos e gestores responsáveis pelos condomínios cadastrados.",
};

export default async function AdminSindicosPage() {
  await requireSession();

  const sindicosList = await domainRequest<any[]>("/painel/admin/sindicos");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Síndicos</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Síndicos e Gestores
          </h1>
          <p className="text-xs text-slate-500">
            Acompanhamento dos administradores locais responsáveis por cada condomínio.
          </p>
        </div>
      </div>

      <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Síndico</th>
                <th className="py-3 px-4">Condomínio Vinculado</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Vínculo Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sindicosList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum síndico cadastrado no momento.
                  </td>
                </tr>
              ) : (
                sindicosList.map((s, idx) => (
                  <tr key={`${s.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{s.condoName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">/{s.condoSlug}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.phone || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] capitalize">
                        {s.status || "ativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {dateTimeBR(s.assignedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
