import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { dateTimeBR } from "@/lib/utils";
import { InternalPageHeader, InternalPageLayout, InternalStatusBadge } from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administradores da Plataforma · Admin Zeladoria",
  description: "Equipe com privilégios de superadministrador do ecossistema.",
};

export default async function AdminAdministradoresPage() {
  await requireSession();

  const adminsList = await domainRequest<any[]>("/painel/admin/administradores");

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="lock"
        title="Administradores da Plataforma"
        subtitle="Usuários com acesso total e governança do produto Zeladoria."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "Administradores" },
        ]}
        badge={<InternalStatusBadge label={`${adminsList.length} superadmins`} tone="blue" />}
      />

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(8,26,55,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] border-b border-[#E2E8F0] text-[#526079] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Nível de Acesso</th>
                <th className="py-3 px-4">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#101828]">
              {adminsList.map((a) => (
                <tr key={a.id} className="hover:bg-[#F5F8FC] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#101828]">{a.name}</p>
                    <p className="text-[10px] text-[#64748B] font-mono">ID #{a.id}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#526079]">
                    {a.email}
                  </td>
                  <td className="py-3 px-4 text-[#526079]">
                    {a.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <InternalStatusBadge label="Superadmin Total" tone="blue" />
                  </td>
                  <td className="py-3 px-4 text-[#526079] text-[11px]">
                    {a.lastLoginAt ? dateTimeBR(a.lastLoginAt) : "Nunca acessou"}
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
