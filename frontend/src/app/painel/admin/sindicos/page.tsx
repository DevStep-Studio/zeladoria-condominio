import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { dateTimeBR } from "@/lib/utils";
import { InternalPageHeader, InternalPageLayout, InternalStatusBadge } from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Síndicos · Admin da Plataforma",
  description: "Síndicos e gestores responsáveis pelos condomínios cadastrados.",
};

export default async function AdminSindicosPage() {
  await requireSession();

  const sindicosList = await domainRequest<any[]>("/painel/admin/sindicos");

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="shield"
        title="Síndicos e Gestores"
        subtitle="Acompanhamento dos administradores locais responsáveis por cada condomínio."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "Síndicos" },
        ]}
        badge={<InternalStatusBadge label={`${sindicosList.length} gestores`} tone="blue" />}
      />

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(8,26,55,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] border-b border-[#E2E8F0] text-[#526079] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Síndico</th>
                <th className="py-3 px-4">Condomínio Vinculado</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Vínculo Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#101828]">
              {sindicosList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#526079]">
                    Nenhum síndico cadastrado no momento.
                  </td>
                </tr>
              ) : (
                sindicosList.map((s, idx) => (
                  <tr key={`${s.id}-${idx}`} className="hover:bg-[#F5F8FC] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#101828]">{s.name}</p>
                      <p className="text-[11px] text-[#526079]">{s.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#101828]">{s.condoName}</p>
                      <p className="text-[10px] text-[#64748B] font-mono">/{s.condoSlug}</p>
                    </td>
                    <td className="py-3 px-4 text-[#526079]">
                      {s.phone || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <InternalStatusBadge label={s.status || "ativo"} tone="green" />
                    </td>
                    <td className="py-3 px-4 text-[#526079] text-[11px]">
                      {dateTimeBR(s.assignedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </InternalPageLayout>
  );
}
