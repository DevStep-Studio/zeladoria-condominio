"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";
import type { NavItem } from "@/lib/rbac";

export type ShellNav = { primary: NavItem[]; more: NavItem[] };
export type ShellCondo = { id: number; name: string };

function isActive(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItemLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-[#F0FDFA] text-[#0D9488] shadow-xs font-bold border-l-2 border-[#0D9488]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      <Icon
        name={item.icon}
        size={19}
        className={`shrink-0 transition-colors ${active ? "text-[#0D9488]" : "text-[var(--color-muted)] group-hover:text-[var(--color-ink)]"}`}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-[8px] border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-[0_8px_24px_rgba(15,23,42,0.12)] group-hover:block">
          {item.label}
        </span>
      ) : null}
    </Link>
  );
}

export function Shell({
  nav,
  condos,
  activeCondoId,
  userName,
  roleLabel,
  unitLabel,
  condoName,
  unread,
  switchAction,
  logout,
  children,
}: {
  nav: ShellNav;
  condos: ShellCondo[];
  activeCondoId: number;
  userName: string;
  roleLabel: string;
  unitLabel: string | null;
  condoName: string;
  unread: number;
  switchAction: (formData: FormData) => void;
  logout: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("zc-nav") === "collapsed";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pageTitle = useMemo(() => {
    const all = [...nav.primary, ...nav.more];
    const match = all.find((i) => isActive(pathname, i.href));
    return match?.label ?? "Painel";
  }, [pathname, nav]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("zc-nav", next ? "collapsed" : "expanded");
    } catch {}
  };

  const isSuperOrSindico = ["superadmin", "sindico", "administrador"].some((r) =>
    roleLabel.toLowerCase().includes(r)
  );

  const SidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={`flex min-h-12 items-center gap-3 px-1 ${collapsed ? "justify-center" : ""}`}>
        <Link href="/painel" className="flex items-center gap-2">
          <BrandLogo size={collapsed ? "sm" : "md"} showText={!collapsed} />
        </Link>
      </div>

      {/* Condo switcher */}
      {!collapsed ? (
        <form action={switchAction} className="mt-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Condomínio Ativo
          </label>
          <select
            name="condoId"
            defaultValue={activeCondoId}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="input min-h-10 py-1 text-xs font-medium"
            aria-label="Selecionar condomínio"
          >
            {condos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </form>
      ) : null}

      {/* Nav with 8 Core Modules */}
      <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">
        {!collapsed ? (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-subtle)]">
            Módulos do Sistema
          </p>
        ) : null}
        <div className="space-y-1">
          {nav.primary.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </div>

        {nav.more.length > 0 ? (
          <div className="pt-3">
            {!collapsed ? (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-subtle)]">
                Recursos Extras
              </p>
            ) : (
              <div className="my-2 border-t border-[var(--color-line)]" />
            )}
            <div className="space-y-1">
              {nav.more.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {/* User profile card & Logout */}
      <div className={`border-t border-[var(--color-line)] pt-3.5 ${collapsed ? "space-y-2" : "space-y-2.5"}`}>
        {!collapsed ? (
          <Link
            href="/painel/perfil"
            className="flex items-center gap-2.5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2.5 hover:bg-teal-50/50 hover:border-teal-200 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-xs font-bold text-white shadow-xs">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[var(--color-ink)]">{userName}</p>
              <p className="truncate text-[11px] text-[var(--color-muted)] font-medium">
                {roleLabel} {unitLabel ? `· Unid. ${unitLabel}` : ""}
              </p>
            </div>
          </Link>
        ) : null}

        <form action={logout}>
          <button
            type="submit"
            className={`flex min-h-10 w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Sair da conta" : undefined}
          >
            <Icon name="logout" size={15} />
            {!collapsed ? "Sair da conta" : null}
          </button>
        </form>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!mobileOpen ? (
        <button
          type="button"
          onClick={toggleCollapse}
          className={`mt-2 hidden min-h-10 items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)] lg:flex ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Icon name="panel" size={15} className={collapsed ? "rotate-180" : ""} />
          {!collapsed ? "Recolher menu" : null}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--color-line)] bg-white p-4 transition-[width] duration-200 lg:block ${
          collapsed ? "w-[84px]" : "w-[264px]"
        }`}
      >
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-xs" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[292px] overflow-y-auto border-r border-[var(--color-line)] bg-white p-4">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mb-2 ml-auto flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              aria-label="Fechar menu"
            >
              <Icon name="x" size={18} />
            </button>
            {SidebarInner}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className={`flex min-h-screen flex-col lg:pl-[264px] ${collapsed ? "lg:pl-[84px]" : ""}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-4 border-b border-[var(--color-line)] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] lg:hidden shrink-0"
              aria-label="Abrir menu"
            >
              <Icon name="menu" size={20} />
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden shrink-0">
              <BrandLogo size="sm" showText={true} />
            </div>

            {/* Condo pill indicator */}
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs shrink-0">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Icon name="shield" size={11} />
              </span>
              <span className="truncate max-w-[200px]">{condoName || "Condomínio"}</span>
            </div>

            {/* Global Search */}
            <div className="relative hidden md:block flex-1 max-w-md">
              <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-subtle)]" />
              <input
                type="text"
                placeholder="Buscar ocorrência, morador, reserva..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] pl-9 pr-4 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          {/* Right Header Navigation Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick module links */}
            <Link
              href="/painel/agenda"
              title="Agenda Condominial"
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[#0D9488] transition-colors"
            >
              <Icon name="calendar" size={18} />
            </Link>

            <Link
              href="/painel/portaria"
              title="Portaria e Acesso"
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[#0D9488] transition-colors"
            >
              <Icon name="shield" size={18} />
            </Link>

            {/* Notifications */}
            <Link
              href="/painel/notificacoes"
              title="Central de Notificações"
              className="relative flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[#0D9488] transition-colors"
            >
              <Icon name="bell" size={18} />
              {unread > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0D9488] px-1 text-[10px] font-black text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>

            <div className="h-5 w-px bg-[var(--color-line)] mx-1 hidden sm:block" />

            {/* Profile Dropdown */}
            <details className="relative">
              <summary
                className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-[#F0FDFA] border border-[#99F6E4] text-xs font-bold text-[#0D9488] hover:shadow-xs transition-shadow"
                aria-label="Perfil"
              >
                {userName.slice(0, 1).toUpperCase()}
              </summary>
              <div className="menu-surface absolute right-0 z-50 mt-2 w-64 shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
                <div className="border-b border-[var(--color-line)] px-4 py-3 bg-[var(--color-surface-muted)]">
                  <p className="truncate text-sm font-bold text-[var(--color-ink)]">{userName}</p>
                  <p className="truncate text-xs text-[var(--color-muted)] font-medium">
                    {roleLabel} {unitLabel ? `· Unidade ${unitLabel}` : ""}
                  </p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/painel/perfil"
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Icon name="user" size={15} className="text-[#0D9488]" /> Meu Perfil
                  </Link>
                  <Link
                    href="/painel/notificacoes"
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Icon name="bell" size={15} className="text-[#0D9488]" /> Notificações
                  </Link>
                  <Link
                    href="/painel/agenda"
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Icon name="calendar" size={15} className="text-[#059669]" /> Agenda do Condomínio
                  </Link>
                  <div className="border-t border-[var(--color-line)] my-1" />
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      <Icon name="logout" size={15} /> Sair da plataforma
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>

        {/* Mobile bottom nav: 5 Core Modules */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-[var(--color-line)] bg-white/95 backdrop-blur-md px-2 py-1.5 lg:hidden shadow-lg">
          {[
            { href: "/painel", label: "Início", icon: "grid" as IconName },
            { href: "/painel/ocorrencias", label: "Ocorrências", icon: "book" as IconName },
            { href: "/painel/reservas", label: "Reservas", icon: "building" as IconName },
            { href: "/painel/servicos", label: "Serviços", icon: "wrench" as IconName },
            { href: "/painel/perfil", label: "Perfil", icon: "user" as IconName },
          ].map((navItem) => {
            const active = isActive(pathname, navItem.href);
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] text-[10px] font-bold transition-all ${
                  active ? "text-[#0D9488]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Icon name={navItem.icon} size={20} />
                <span>{navItem.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
