import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administradores da Plataforma · Admin Zeladoria",
  description: "Equipe com privilégios de superadministrador do ecossistema.",
};

export default async function AdminAdministradoresPage() {
  await requireSession();

  const adminsList = await domainRequest<any[]>("/painel/admin/administradores");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Administradores</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Administradores da Plataforma
          </h1>
          <p className="text-xs text-slate-500">
            Usuários com acesso total e governança do produto Zeladoria.
          </p>
        </div>
      </div>

      <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Nível de Acesso</th>
                <th className="py-3 px-4">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adminsList.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{a.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID #{a.id}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {a.email}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {a.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                      Superadmin Total
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {a.lastLoginAt ? dateTimeBR(a.lastLoginAt) : "Nunca acessou"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
