import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vendors, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Prestadores · Admin da Plataforma",
  description: "Profissionais e empresas parceiras cadastradas no Marketplace Zeladoria.",
};

export default async function AdminPrestadoresPage() {
  await requireSession();

  const vendorsList = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      companyName: vendors.companyName,
      category: vendors.category,
      rating: vendors.rating,
      active: vendors.active,
      isOnline: vendors.isOnline,
      phone: vendors.phone,
      email: vendors.email,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .orderBy(desc(vendors.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Prestadores</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Prestadores de Serviços
          </h1>
          <p className="text-xs text-slate-500">
            Catálogo profissional de prestadores habilitados no ecossistema Zeladoria.
          </p>
        </div>

        <Link
          href="/painel/admin/marketplace"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#0055D4] text-white text-xs font-bold hover:bg-[#0043A8] transition-colors"
        >
          <Icon name="sparkles" size={14} />
          <span>Marketplace & Aprovações</span>
        </Link>
      </div>

      <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Profissional / Empresa</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Disponibilidade</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vendorsList.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-[11px] text-slate-500">{v.companyName || "Profissional Autônomo"}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#0055D4] font-bold text-[10px] capitalize">
                      {v.category || "Geral"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <Icon name="star" size={12} className="fill-amber-400 text-amber-500" />
                      {v.rating ? Number(v.rating).toFixed(1) : "5.0"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    <p>{v.phone || "—"}</p>
                    <p className="text-[10px] text-slate-400">{v.email || ""}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      v.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${v.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {v.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      v.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {v.active ? "Habilitado" : "Inativo"}
                    </span>
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
