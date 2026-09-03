"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

export type ShellCondo = { id: number; name: string };

type NavGroupItem = {
  label: string;
  href: string;
  icon: IconName;
};

type NavGroup = {
  id: string;
  title: string;
  items: NavGroupItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "gestao",
    title: "GESTÃO",
    items: [
      { label: "Assembleias", href: "/painel/assembleias", icon: "scale" },
      { label: "Sugestões", href: "/painel/sugestoes", icon: "megaphone" },
      { label: "Documentos", href: "/painel/documentos", icon: "folder" },
      { label: "Comunicados", href: "/painel/comunicados", icon: "mail" },
    ],
  },
  {
    id: "manutencao",
    title: "MANUTENÇÃO",
    items: [
      { label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard" },
      { label: "Ordens", href: "/painel/ordens", icon: "wrench" },
      { label: "Preventiva", href: "/painel/manutencao", icon: "shield" },
    ],
  },
  {
    id: "comunidade",
    title: "COMUNIDADE",
    items: [
      { label: "Reservas", href: "/painel/reservas", icon: "calendar" },
      { label: "Encomendas", href: "/painel/encomendas", icon: "package" },
      { label: "Visitantes", href: "/painel/visitantes", icon: "users" },
    ],
  },
  {
    id: "servicos",
    title: "SERVIÇOS",
    items: [
      { label: "Prestadores", href: "/painel/servicos", icon: "briefcase" },
      { label: "Solicitar orçamento", href: "/painel/servicos?solicitar=true", icon: "sparkles" },
    ],
  },
];

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
  { title: "Carlos Eduardo Silva", subtitle: "Volt & Luz Soluções Elétricas · 4.9 ★", category: "Prestadores", href: "/painel/servicos" },
  { title: "AquaFix Manutenções", subtitle: "Engenharia Hidráulica · 4.8 ★", category: "Prestadores", href: "/painel/servicos" },
  { title: "Roberto Marcenaria", subtitle: "Arte em Madeira · 5.0 ★", category: "Prestadores", href: "/painel/servicos" },
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
  condos,
  activeCondoId,
  userName,
  roleLabel,
  unitLabel,
  condoName,
  unread: initialUnread,
  switchAction,
  logout,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nav?: any;
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
  const router = useRouter();

  // Desktop sidebar collapse with persistent state in localStorage
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zc-sidebar-collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("zc-sidebar-collapsed", String(next));
    } catch {}
  };

  // Accordion open/close state for sidebar groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    gestao: true,
    manutencao: true,
    comunidade: true,
    servicos: true,
  });

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
    <div className="flex h-full flex-col bg-white select-none">
      {/* Brand Header */}
      <div className={`flex h-14 items-center justify-between border-b border-slate-100 px-4 ${collapsed ? "justify-center px-2" : ""}`}>
        <Link href="/painel" className="flex items-center gap-2">
          <BrandLogo size={collapsed ? "sm" : "md"} showText={!collapsed} />
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {/* Início / Dashboard */}
        <div>
          <Link
            href="/painel"
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs transition-colors ${
              pathname === "/painel"
                ? "relative font-bold text-[#0070F3] bg-blue-50/40 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#0070F3] before:rounded-r"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Início" : undefined}
          >
            <Icon name="grid" size={16} className={pathname === "/painel" ? "text-[#0070F3]" : "text-slate-400 group-hover:text-slate-600"} />
            {!collapsed && <span className={pathname === "/painel" ? "font-bold text-[#0070F3]" : "font-medium text-slate-700"}>Início</span>}

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+8px)] z-50 hidden whitespace-nowrap rounded-[6px] border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-lg group-hover:block">
                Início
              </span>
            )}
          </Link>
        </div>

        {/* Collapsible Accordion Groups */}
        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? true;
          const hasActiveChild = group.items.some((item) => isRouteActive(item.href));

          return (
            <div key={group.id} className="space-y-0.5">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <span className={hasActiveChild ? "text-[#0070F3]" : ""}>{group.title}</span>
                  <Icon
                    name="chevron-down"
                    size={11}
                    className={`transition-transform duration-150 ${isExpanded ? "" : "-rotate-90"}`}
                  />
                </button>
              ) : (
                <div className="my-1 border-t border-slate-100" />
              )}

              {(isExpanded || collapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isRouteActive(item.href);

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-[8px] px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? "relative font-bold text-[#0070F3] bg-blue-50/40 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#0070F3] before:rounded-r"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          name={item.icon}
                          size={15}
                          className={active ? "text-[#0070F3]" : "text-slate-400 group-hover:text-slate-600"}
                        />
                        {!collapsed && <span className={active ? "font-bold text-[#0070F3]" : "font-medium text-slate-700 truncate"}>{item.label}</span>}

                        {collapsed && (
                          <span className="pointer-events-none absolute left-[calc(100%+8px)] z-50 hidden whitespace-nowrap rounded-[6px] border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-lg group-hover:block">
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

      {/* Simplified User Profile Footer */}
      <div className="border-t border-slate-100 p-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`w-full flex items-center gap-2.5 rounded-[8px] p-1.5 text-left hover:bg-slate-50 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0070F3] text-white text-xs font-bold">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#0F172A]">{userName}</p>
                <p className="truncate text-[10px] text-slate-400 font-medium">
                  {roleLabel} {unitLabel ? `· Unid. ${unitLabel}` : ""}
                </p>
              </div>
            )}
            {!collapsed && (
              <Icon name="more" size={14} className="text-slate-400" />
            )}
          </button>

          {/* Profile Popup Menu */}
          {profileMenuOpen && (
            <div className="menu-surface absolute bottom-full left-0 z-50 mb-1 w-52 shadow-xl animate-in fade-in-50 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-[#0F172A] truncate">{userName}</p>
                <p className="text-[10px] text-slate-400">{roleLabel}</p>
              </div>
              <div className="p-1 space-y-0.5">
                <Link
                  href="/painel/perfil"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Icon name="user" size={13} className="text-[#0070F3]" />
                  <span>Meu Perfil</span>
                </Link>
                <Link
                  href="/painel/perfil"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Icon name="settings" size={13} className="text-slate-400" />
                  <span>Configurações</span>
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Icon name="logout" size={13} />
                    <span>Sair da conta</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="mt-1 pt-1 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ${
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
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/60 bg-white transition-[width] duration-200 lg:block ${
          collapsed ? "w-[64px]" : "w-[240px]"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[270px] bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column Wrapper */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[64px]" : "lg:pl-[240px]"
        }`}
      >
        {/* Global Minimalist Header without duplicate logo on desktop */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/60 bg-white/98 backdrop-blur-md px-4 sm:px-6">
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
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 text-xs font-bold text-[#0F172A] transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-[#FAB800]" />
                <span className="truncate max-w-[170px] sm:max-w-[240px]">
                  {condoName || "Residencial Parque das Águas"}
                </span>
                <Icon name="chevron-down" size={11} className="text-slate-400" />
              </button>

              {condoDropdownOpen && (
                <div className="menu-surface absolute left-0 z-50 mt-1 w-64 shadow-lg animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Selecione o Condomínio
                  </div>
                  <div className="py-1">
                    {condos.map((c) => (
                      <form key={c.id} action={switchAction}>
                        <input type="hidden" name="condoId" value={c.id} />
                        <button
                          type="submit"
                          onClick={() => setCondoDropdownOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-blue-50 transition-colors ${
                            c.id === activeCondoId ? "font-bold text-[#0070F3] bg-blue-50/50" : "text-slate-700"
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {c.id === activeCondoId && <Icon name="check" size={13} className="text-[#0070F3]" />}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Functional Global Search with grouped autocomplete dropdown */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-sm mx-4">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ocorrência, reserva ou prestador..."
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-full border border-slate-200 bg-slate-50 pl-8.5 pr-4 text-xs text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#0070F3] focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all"
            />

            {/* Search Autocomplete Results Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="menu-surface absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto shadow-xl">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="p-1 space-y-2">
                    {Object.entries(groupedSearchResults).map(([cat, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-0.5">
                          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 rounded">
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
                              <p className="text-xs font-bold text-[#0F172A]">{item.title}</p>
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notifications Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notificações"
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-[8px] text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
                aria-label="Abrir notificações"
              >
                <Icon name="bell" size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#FAB800]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="menu-surface absolute right-0 z-50 mt-1 w-80 shadow-xl animate-in fade-in-50 duration-100">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#0F172A]">Notificações</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-black text-[#FAB800]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-[#0070F3] hover:underline"
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
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                            !notif.read ? "bg-[#0070F3] text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon name={notif.icon} size={13} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0F172A] leading-tight">
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
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0070F3] shrink-0 mt-1" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link
              href="/painel/perfil"
              title="Meu Perfil"
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-blue-100 transition-all"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-white text-xs font-bold">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            </Link>
          </div>
        </header>

        {/* Content Body: Max width 1440px to 1600px, avoiding unbounded stretching on ultra-wide screens */}
        <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12 max-w-[1440px] mx-auto">
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation (5 Core Actions) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white/98 backdrop-blur-md px-1 py-1 lg:hidden shadow-lg select-none">
          {[
            { href: "/painel", label: "Início", icon: "grid" as IconName },
            { href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard" as IconName },
            { href: "/painel/reservas", label: "Reservas", icon: "calendar" as IconName },
            { href: "/painel/servicos", label: "Serviços", icon: "briefcase" as IconName },
            { href: "/painel/perfil", label: "Perfil", icon: "user" as IconName },
          ].map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[46px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[8px] text-[10px] font-bold transition-colors ${
                  active ? "text-[#0070F3]" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon name={item.icon} size={18} />
                  {active && (
                    <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#FAB800]" />
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
