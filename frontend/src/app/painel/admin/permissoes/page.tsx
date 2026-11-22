import { requireSession } from "@/lib/auth";
import { ROLE_PERMISSIONS_MAP, type Permission } from "@/lib/permissions";
import { ROLE_LABEL, type Role } from "@/lib/rbac";
import { InternalPageHeader, InternalPageLayout, InternalStatusBadge } from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Matriz de Permissões · Admin Zeladoria",
  description: "Auditoria e governança dos privilégios de acesso por papel.",
};

const MAIN_ROLES: Role[] = ["morador", "sindico", "prestador", "superadmin", "porteiro", "zelador", "conselho"];

export default async function AdminPermissoesPage() {
  await requireSession();

  const allPermissions: Permission[] = [
    "dashboard.view",
    "occurrence.view_own",
    "occurrence.view_all",
    "occurrence.create",
    "service_order.view",
    "service_order.manage",
    "maintenance.view",
    "reservation.view_own",
    "reservation.view_all",
    "reservation.create",
    "visitor.view_own",
    "visitor.view_all",
    "package.view_own",
    "package.view_all",
    "announcement.view",
    "announcement.manage",
    "assembly.view",
    "document.view",
    "provider.view",
    "provider.calls.view",
    "provider.quote.create",
    "provider.earnings.view",
    "user.manage",
    "financial.view",
    "audit.view",
    "condominium.settings.manage",
    "platform.admin",
  ];

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="lock"
        title="Matriz de Permissões (RBAC)"
        subtitle="Mapeamento canônico das permissões de segurança ativas por perfil no Zeladoria."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "Permissões" },
        ]}
        badge={<InternalStatusBadge label={`${allPermissions.length} permissões`} tone="blue" />}
      />

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(8,26,55,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Permissão</th>
                {MAIN_ROLES.map((r) => (
                  <th key={r} className="py-3 px-3 text-center">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allPermissions.map((perm) => (
                <tr key={perm} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-800">
                    {perm}
                  </td>
                  {MAIN_ROLES.map((r) => {
                    const hasPerm = r === "superadmin" || ROLE_PERMISSIONS_MAP[r]?.has(perm);
                    return (
                      <td key={r} className="py-2.5 px-3 text-center">
                        {hasPerm ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InternalPageLayout>
  );
}
