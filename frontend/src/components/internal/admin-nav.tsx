"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

type AdminNavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
};

const ADMIN_NAV_GROUPS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Plataforma",
    items: [
      { href: "/painel/admin", label: "Visão Geral", icon: "grid", exact: true },
      { href: "/painel/admin/condominios", label: "Condomínios", icon: "building" },
      { href: "/painel/admin/usuarios", label: "Usuários", icon: "users" },
      { href: "/painel/admin/sindicos", label: "Síndicos", icon: "shield" },
      { href: "/painel/admin/administradores", label: "Administradores", icon: "lock" },
      { href: "/painel/admin/permissoes", label: "Permissões & RBAC", icon: "lock" },
    ],
  },
  {
    title: "Tião & Financeiro",
    items: [
      { href: "/painel/admin/prestadores", label: "Prestadores", icon: "briefcase" },
      { href: "/painel/admin/marketplace", label: "Marketplace", icon: "sparkles", exact: true },
      { href: "/painel/admin/marketplace/taxas", label: "Taxas & Comissões", icon: "trending" },
      { href: "/painel/admin/marketplace/destaques", label: "Destaques", icon: "star" },
      { href: "/painel/admin/zeladoria-pay", label: "Zeladoria Pay", icon: "wallet" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/painel/admin/integracoes", label: "Integrações", icon: "layers" },
      { href: "/painel/sistema/avisos-erros", label: "Avisos & Erros", icon: "alert-triangle" },
      { href: "/painel/adocao", label: "Adoção SaaS", icon: "chart" },
    ],
  },
];

function isRouteActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/painel/admin";

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* Mobile / Tablet compact navigation strip */}
      <nav
        aria-label="Navegação administrativa"
        className="mb-5 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_2px_10px_rgba(8,26,55,0.03)] lg:hidden [scrollbar-width:thin]"
      >
        {ADMIN_NAV_GROUPS.flatMap((group) => group.items).map((item) => {
          const active = isRouteActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                active
                  ? "bg-[#1455FF] text-white shadow-xs"
                  : "text-[#526079] hover:bg-[#EAF1FF] hover:text-[#1455FF]"
              }`}
            >
              <Icon name={item.icon} size={13} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
        {/* Desktop Admin Sidebar */}
        <aside className="hidden lg:block sticky top-20 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_12px_rgba(8,26,55,0.04)] space-y-5">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#081A37] px-3.5 py-3 text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1455FF] text-white">
              <Icon name="shield" size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold tracking-tight truncate">Superadmin SaaS</p>
              <p className="text-[10px] font-medium text-blue-200 truncate">Governança Global</p>
            </div>
          </div>

          <nav aria-label="Menu de administração da plataforma" className="space-y-4">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#526079]">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isRouteActive(pathname, item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? "bg-[#EAF1FF] text-[#1455FF] font-bold"
                            : "text-[#526079] hover:bg-[#F5F8FC] hover:text-[#101828]"
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          size={15}
                          className={active ? "text-[#1455FF]" : "text-[#64748B]"}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
