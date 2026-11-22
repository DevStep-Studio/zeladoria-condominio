import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { dateTimeBR } from "@/lib/utils";
import { InternalPageHeader, InternalPageLayout, InternalStatusBadge } from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Usuários · Admin da Plataforma",
  description: "Controle de usuários cadastrados no ecossistema Zeladoria.",
};

export default async function AdminUsuariosPage() {
  await requireSession();

  const userList = await domainRequest<any[]>("/painel/admin/usuarios");

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="users"
        title="Usuários da Plataforma"
        subtitle="Base central de cadastros, privilégios e histórico de acessos."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "Usuários" },
        ]}
        badge={<InternalStatusBadge label={`${userList.length} contas`} tone="blue" />}
      />

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(8,26,55,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nome & Contato</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Privilégio</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID #{u.id}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {u.email}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {u.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {u.isSuperAdmin ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                        Admin Plataforma
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                        Usuário Padrão
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                      u.status === "ativo"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}>
                      {u.status || "ativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.lastLoginAt ? dateTimeBR(u.lastLoginAt) : "Nunca acessou"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InternalPageLayout>
  );
}
