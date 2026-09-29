"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

export type ShellCondo = { id: number; name: string };

import type { NavGroup, NavItem } from "@/lib/navigation";

type SearchResultItem = {
  title: string;
  subtitle: string;
  category: "Ocorrências" | "Reservas" | "Prestadores";
  href: string;
};

const MOCK_SEARCHABLE_ITEMS: SearchResultItem[] = [
  { title: "Lâmpada corredor Torre A", subtitle: "OC-00001 · Elétrica · Aberto", category: "Ocorrências", href: "/painel/ocorrencias" },
  { title: "Vazamento subsolo -1", subtitle: "OC-00004 · Hidráulica · Em execução", category: "Ocorrências", href: "/painel/ocorrencias" },
  { title: "Ruído excessivo salão", subtitle: "OC-00002 · Convivência · Aberto", category: "Ocorrências", href: "/painel/ocorrencias" },
  { title: "Salão de Festas", subtitle: "Capacidade: 80 pessoas · R$ 200", category: "Reservas", href: "/painel/reservas" },
  { title: "Churrasqueira Gourmet", subtitle: "Capacidade: 20 pessoas · R$ 80", category: "Reservas", href: "/painel/reservas" },
  { title: "Espaço Gourmet", subtitle: "Capacidade: 40 pessoas · R$ 150", category: "Reservas", href: "/painel/reservas" },
  { title: "Carlos Eduardo Silva", subtitle: "Volt & Luz Soluções Elétricas · 4.9 estrelas", category: "Prestadores", href: "/painel/servicos" },
  { title: "AquaFix Manutenções", subtitle: "Engenharia Hidráulica · 4.8 estrelas", category: "Prestadores", href: "/painel/servicos" },
  { title: "Roberto Marcenaria", subtitle: "Arte em Madeira · 5.0 estrelas", category: "Prestadores", href: "/painel/servicos" },
];

type NotificationItem = {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
  icon: IconName;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: "Nova ocorrência registrada",
    description: "OC-00001: Lâmpada queimada Torre A",
    time: "Há 15 min",
    read: false,
    href: "/painel/ocorrencias",
    icon: "clipboard",
  },
  {
    id: 2,
    title: "Reserva confirmada",
    description: "Salão de Festas agendado para amanhã às 18h",
    time: "Há 1 hora",
    read: false,
    href: "/painel/reservas",
    icon: "calendar",
  },
  {
    id: 3,
    title: "Encomenda na portaria",
    description: "Pacote recebido da Amazon (Código #9842)",
    time: "Há 3 horas",
    read: false,
    href: "/painel/encomendas",
    icon: "package",
  },
  {
    id: 4,
    title: "Edital de Assembleia",
    description: "Convocação para Assembleia Geral Ordinária",
    time: "Ontem",
    read: true,
    href: "/painel/assembleias",
    icon: "scale",
  },
];

export function Shell({
  navigationGroups = [],
  mobileNav = [],
  condos,
  activeCondoId,
  userName,
  roleLabel,
  role,
  unitLabel,
  condoName,
  unread: initialUnread,
  switchAction,
  logout,
  children,
}: {
  nav?: any;
  navigationGroups?: NavGroup[];
  mobileNav?: NavItem[];
  condos: ShellCondo[];
  activeCondoId: number;
  userName: string;
  roleLabel: string;
  role?: string;
  unitLabel: string | null;
  unreadCount?: number;
  condoName: string;
  unread: number;
  switchAction: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop sidebar collapse with persistent state in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("zc-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("zc-sidebar-collapsed", String(next));
    } catch {}
  };

  // Accordion open/close state: only open group of active page by default
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((group) => {
      initial[group.id] = group.items.some((item) =>
        item.href === "/painel" ? pathname === "/painel" : pathname.startsWith(item.href)
      );
    });
    return initial;
  });

  useEffect(() => {
    navigationGroups.forEach((group) => {
      const isCurrent = group.items.some((item) =>
        item.href === "/painel" ? pathname === "/painel" : pathname.startsWith(item.href)
      );
      if (isCurrent) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, navigationGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [condoDropdownOpen, setCondoDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Global Search state with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? ({ ...n, read: true }) : n)));
  };

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered search results grouped
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOCK_SEARCHABLE_ITEMS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedSearchResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {
      Ocorrências: [],
      Reservas: [],
      Prestadores: [],
    };
    searchResults.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [searchResults]);

  const isRouteActive = (href: string) => {
    if (href === "/painel") return pathname === "/painel";
    return pathname.startsWith(href);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white text-slate-800 select-none overflow-hidden relative">
      {/* Brand Header */}
      <div className={`flex items-center px-4 h-14 border-b border-slate-200/80 ${collapsed ? "justify-center px-2" : "justify-between"}`}>
        <Link href="/painel" className="flex items-center gap-2 group min-w-0" title="Zeladoria Condomínio">
          {!collapsed ? (
            <BrandLogo size="sm" variant="default" showText={true} />
          ) : (
            <BrandLogo size="sm" variant="icon-only" showText={false} />
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Recolher menu lateral"
          >
            <Icon name="panel" size={14} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Dashboard / Início (Primary Top Item) */}
        <div>
          <Link
            href="/painel"
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs transition-all duration-150 ${
              pathname === "/painel"
                ? "bg-[#0055D4] text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
            } ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "Início" : undefined}
          >
            <Icon
              name="grid"
              size={16}
              strokeWidth={pathname === "/painel" ? 2.2 : 1.8}
              className={pathname === "/painel" ? "text-white" : "text-slate-400 group-hover:text-slate-700"}
            />
            {!collapsed && <span className="truncate flex-1">Início</span>}
            {!collapsed && pathname === "/painel" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD000]" />
            )}

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-md border border-slate-200 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block">
                Início
              </span>
            )}
          </Link>
        </div>

        {/* Collapsible Accordion Groups (Filtered by Permissions) */}
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? false;
          const hasActiveChild = group.items.some((item) => isRouteActive(item.href));

          return (
            <div key={group.id} className="pt-2">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={hasActiveChild ? "text-[#0055D4]" : ""}>{group.title}</span>
                  </span>
                  <Icon
                    name="chevron-down"
                    size={11}
                    className={`text-slate-400 transition-transform duration-150 ${isExpanded ? "" : "-rotate-90"}`}
                  />
                </button>
              ) : (
                <div className="my-1.5 border-t border-slate-100" />
              )}

              {(isExpanded || collapsed) && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isRouteActive(item.href);

                    return (
                      <Link
                        key={item.id || item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs transition-all duration-150 ${
                          active
                            ? "bg-[#0055D4] text-white font-semibold shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          name={item.icon}
                          size={16}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={active ? "text-white" : "text-slate-400 group-hover:text-slate-700"}
                        />
                        {!collapsed && <span className="truncate flex-1">{item.label}</span>}

                        {/* Real dynamic notification badge */}
                        {!collapsed && item.badge && item.badge > 0 ? (
                          <span
                            className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                              active ? "bg-white text-[#0055D4]" : "bg-[#FFD000] text-[#12162A]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}

                        {!collapsed && active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FFD000]" />
                        )}

                        {collapsed && (
                          <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-md border border-slate-200 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section: User Profile Footer */}
      <div className="p-2.5 pt-2 space-y-1 border-t border-slate-200/80 bg-white">
        {/* User Profile Bar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`w-full flex items-center gap-2 rounded-[8px] p-1.5 text-left hover:bg-slate-100/80 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0055D4] text-xs font-extrabold border border-blue-200/60 shadow-2xs">
              {userName.slice(0, 1).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{userName}</p>
                <p className="truncate text-[10px] text-slate-500 font-medium">
                  {roleLabel} {unitLabel ? `· Unid. ${unitLabel}` : ""}
                </p>
              </div>
            )}
            {!collapsed && <Icon name="more" size={14} className="text-slate-400" />}
          </button>

          {/* Profile Popup Menu */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-60 rounded-[12px] border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl animate-in fade-in-50 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-500">
                  {roleLabel} {unitLabel ? `· Unidade ${unitLabel}` : ""}
                </p>
              </div>
              <div className="py-1 space-y-0.5">
                <Link
                  href="/painel/perfil"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0055D4] transition-colors"
                >
                  <Icon name="user" size={14} className="text-[#0055D4]" />
                  <span>Meu Perfil</span>
                </Link>

                {condos.length > 1 && (
                  <div className="px-3 py-1.5 border-t border-b border-slate-100 my-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Trocar Condomínio
                    </span>
                    <div className="mt-1 space-y-1">
                      {condos.map((c) => (
                        <form key={c.id} action={switchAction}>
                          <input type="hidden" name="condoId" value={c.id} />
                          <button
                            type="submit"
                            className={`w-full text-left rounded-[6px] px-2 py-1 text-xs transition-colors flex items-center justify-between ${
                              c.id === activeCondoId
                                ? "bg-blue-50 font-bold text-[#0055D4]"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                            {c.id === activeCondoId && (
                              <Icon name="check" size={12} className="text-[#0055D4]" />
                            )}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                )}

                {(role === "sindico" || role === "superadmin") && (
                  <Link
                    href="/painel/configuracoes"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0055D4] transition-colors"
                  >
                    <Icon name="settings" size={14} className="text-slate-500" />
                    <span>Configurações</span>
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Icon name="logout" size={14} />
                    <span>Sair da conta</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="mt-0.5 flex justify-end">
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden lg:flex h-6.5 w-6.5 items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ${
              collapsed ? "w-full" : ""
            }`}
            title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            <Icon name="panel" size={13} className={collapsed ? "rotate-180" : ""} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar with clean full-height style */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/90 bg-white transition-[width] duration-200 lg:block ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-white shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-200">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column Wrapper */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"
        }`}
      >
        {/* Global Minimalist Header - Executivo, Compacto e Integrado */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          {/* Left section: Hamburger (mobile only) + Mobile Logo + Condo Switcher */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-[8px] text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <Icon name="menu" size={18} />
            </button>

            {/* Mobile logo only */}
            <div className="lg:hidden">
              <BrandLogo size="sm" showText={false} />
            </div>

            {/* Condo Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCondoDropdownOpen(!condoDropdownOpen)}
                className="group flex items-center gap-2 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-300"
              >
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-[4px] bg-blue-50 text-[#0055D4]">
                  <Icon name="building" size={12} strokeWidth={2} />
                </span>
                <span className="truncate max-w-[170px] sm:max-w-[240px]">
                  {condoName || "Residencial Parque das Águas"}
                </span>
                <Icon name="chevron-down" size={11} className="text-slate-400 group-hover:text-slate-600 transition-transform" />
              </button>

              {condoDropdownOpen && (
                <div className="menu-surface absolute left-0 z-50 mt-1.5 w-64 shadow-xl rounded-[10px] border border-slate-200 p-1.5">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selecione o Condomínio
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {condos.map((c) => (
                      <form key={c.id} action={switchAction}>
                        <input type="hidden" name="condoId" value={c.id} />
                        <button
                          type="submit"
                          onClick={() => setCondoDropdownOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs text-left transition-colors ${
                            c.id === activeCondoId ? "font-bold text-[#0055D4] bg-blue-50" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {c.id === activeCondoId && <Icon name="check" size={13} className="text-[#0055D4]" />}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Functional Global Search with command-bar style */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-6">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ocorrência, reserva ou prestador..."
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-slate-200 bg-slate-50/70 hover:bg-white pl-9 pr-12 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0055D4] focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <kbd className="text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-[4px] shadow-2xs">⌘K</kbd>
            </span>

            {/* Search Autocomplete Results Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="menu-surface absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto shadow-xl rounded-[10px] border border-slate-200 p-1.5">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(groupedSearchResults).map(([cat, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-0.5">
                          <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-[4px]">
                            {cat}
                          </div>
                          {items.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              onClick={() => {
                                setSearchFocused(false);
                                setSearchQuery("");
                              }}
                              className="block p-2 rounded-[6px] hover:bg-blue-50/70 transition-colors"
                            >
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Notifications Dropdown + User Avatar */}
          <div className="flex items-center gap-2">
            {/* Notifications Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notificações"
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-[8px] bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
                aria-label="Abrir notificações"
              >
                <Icon name="bell" size={15} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#FFD000] ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="menu-surface absolute right-0 z-50 mt-1.5 w-80 shadow-xl rounded-[10px] border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">Notificações</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-[#0055D4] hover:underline"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.href}
                        onClick={() => {
                          markAsRead(notif.id);
                          setNotificationsOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-3 text-left transition-colors hover:bg-slate-50 ${
                          !notif.read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <span
                          className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[6px] text-xs ${
                            !notif.read ? "bg-[#0055D4] text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon name={notif.icon} size={13} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {notif.description}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {notif.time}
                          </span>
                        </div>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4] shrink-0 mt-1" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar with Online Status */}
            <Link
              href="/painel/perfil"
              title="Meu Perfil"
              className="relative flex items-center justify-center rounded-[8px] p-0.5 hover:ring-2 hover:ring-blue-100 transition-all group"
            >
              <span className="flex h-8.5 w-8.5 items-center justify-center rounded-[8px] bg-[#0055D4] text-white text-xs font-bold shadow-2xs group-hover:bg-[#0043A8] transition-colors">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
            </Link>
          </div>
        </header>

        {/* Content Body: Max width 1440px to 1600px, avoiding unbounded stretching on ultra-wide screens */}
        <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12 max-w-[1440px] mx-auto">
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation (Configured by Role) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-[#0055D4] px-1 py-1 lg:hidden shadow-lg select-none text-white">
          {(mobileNav && mobileNav.length > 0
            ? mobileNav
            : [
                { id: "inicio", href: "/painel", label: "Início", icon: "grid" as IconName },
                { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard" as IconName },
                { id: "reservas", href: "/painel/reservas", label: "Reservas", icon: "calendar" as IconName },
                { id: "servicos", href: "/painel/servicos", label: "Serviços", icon: "briefcase" as IconName },
                { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" as IconName },
              ]
          ).map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[6px] text-[10px] font-semibold transition-colors ${
                  active ? "text-[#FFD000]" : "text-blue-100/80 hover:text-white"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon name={item.icon} size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {active && (
                    <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#FFD000]" />
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
