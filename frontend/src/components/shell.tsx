"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";
import { EmergencySos } from "@/components/emergency-sos";
import type { Role } from "@/lib/auth";

export type ShellCondo = { id: number; name: string };

import type { NavGroup, NavItem } from "@/lib/navigation";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notificacoes";

export type SearchResultItem = {
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon?: IconName;
};

type NotificationItem = {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
  icon: IconName;
};

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

  // Show all available options by default as requested in UI/UX reform
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((group) => {
      initial[group.id] = true;
    });
    return initial;
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
  const [isSwitchingCondo, startSwitchTransition] = useTransition();
  const [switchingCondoId, setSwitchingCondoId] = useState<number | null>(null);

  const topItemHref = role === "prestador" ? "/prestador" : role === "superadmin" ? "/painel/admin" : "/painel";
  const topItemLabel = role === "superadmin" ? "Dashboard" : role === "sindico" ? "Visão Geral" : "Início";
  const isTopActive = pathname === topItemHref;

  // Horizontal top navigation items inspired by the reference image
  const topNavItems = useMemo(() => {
    if (role === "prestador") {
      return [
        { id: "inicio", label: "Início", href: "/prestador", icon: "grid" as IconName },
        { id: "oportunidades", label: "Oportunidades", href: "/prestador/chamados?tab=oportunidades", icon: "search" as IconName },
        { id: "atendimentos", label: "Atendimentos", href: "/prestador/chamados?tab=atendimentos", icon: "clipboard" as IconName },
        { id: "agenda", label: "Agenda", href: "/prestador/agenda", icon: "calendar" as IconName },
        { id: "ganhos", label: "Ganhos", href: "/prestador/ganhos", icon: "wallet" as IconName },
      ];
    }
    if (role === "porteiro" || role === "zelador") {
      return [
        { id: "inicio", label: "Início", href: "/painel", icon: "grid" as IconName },
        { id: "visitantes", label: "Visitantes", href: "/painel/visitantes", icon: "users" as IconName },
        { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package" as IconName },
        { id: "turnos", label: "Passagem de Turno", href: "/painel/turnos", icon: "refresh" as IconName },
        { id: "portaria", label: "Livro de Portaria", href: "/painel/portaria", icon: "book" as IconName },
      ];
    }
    if (role === "superadmin") {
      return [
        { id: "inicio", label: "Início", href: "/painel/admin", icon: "grid" as IconName },
        { id: "marketplace", label: "Marketplace", href: "/painel/admin/marketplace", icon: "briefcase" as IconName },
        { id: "zeladoria-pay", label: "Zeladoria Pay", href: "/painel/admin/zeladoria-pay", icon: "wallet" as IconName },
        { id: "condominios", label: "Condomínios", href: "/painel/admin/condominios", icon: "building" as IconName },
        { id: "sistema", label: "Avisos & Incidentes", href: "/painel/sistema/avisos-erros", icon: "alert-triangle" as IconName },
      ];
    }
    if (role === "sindico" || role === "conselho") {
      return [
        { id: "inicio", label: "Início", href: "/painel", icon: "grid" as IconName },
        { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard" as IconName },
        { id: "reservas", label: "Reservas", href: "/painel/reservas", icon: "calendar" as IconName },
        { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail" as IconName },
        { id: "servicos", label: "Serviços", href: "/painel/servicos", icon: "briefcase" as IconName },
        { id: "moradores", label: "Moradores", href: "/painel/moradores", icon: "users" as IconName },
        { id: "financeiro", label: "Financeiro", href: "/painel/financeiro", icon: "wallet" as IconName },
      ];
    }
    // Padrão Morador (fiel à referência visual)
    return [
      { id: "inicio", label: "Início", href: "/painel", icon: "grid" as IconName },
      { id: "registrar", label: "Registrar ocorrência", href: "/painel/ocorrencias?nova=1", icon: "plus" as IconName },
      { id: "acompanhar", label: "Acompanhar", href: "/painel/ocorrencias", icon: "clipboard" as IconName },
      { id: "servicos", label: "Serviços", href: "/painel/servicos", icon: "grid" as IconName },
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail" as IconName },
      { id: "transparencia", label: "Transparência", href: "/painel/documentos", icon: "info" as IconName },
    ];
  }, [role]);

  const searchPlaceholder =
    role === "prestador"
      ? "Buscar oportunidades e chamados..."
      : role === "superadmin"
      ? "Buscar condomínios, usuários ou transações..."
      : role === "sindico"
      ? "Buscar ocorrência, morador ou ordem de serviço..."
      : "Buscar no Zeladoria...";

  const condoRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  const handleCondoSwitch = (targetCondoId: number) => {
    if (targetCondoId === activeCondoId) {
      setCondoDropdownOpen(false);
      setProfileMenuOpen(false);
      return;
    }
    setSwitchingCondoId(targetCondoId);
    startSwitchTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("condoId", String(targetCondoId));
        await switchAction(formData);
      } catch (err) {
        console.error("Erro ao alternar condomínio:", err);
      } finally {
        setCondoDropdownOpen(false);
        setProfileMenuOpen(false);
        setSwitchingCondoId(null);
      }
    });
  };

  // Global Search state with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchMobileOpen, setSearchMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Scroll lock when mobile drawer is open + Escape key handler
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mobileOpen]);

  // Close mobile drawer and search overlay on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchMobileOpen(false);
  }, [pathname]);

  // Notifications dropdown state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnread || 0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener for Global Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) {
          searchInput.focus();
          setSearchFocused(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsReadAction().catch(() => {});
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    markNotificationReadAction(id).catch(() => {});
  };

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (condoRef.current && !condoRef.current.contains(target)) {
        setCondoDropdownOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dinâmico: catálogo de busca baseado em permissões, rotas ativas e ações rápidas
  const dynamicSearchableItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Ações rápidas por perfil
    if (role === "morador") {
      items.push(
        { title: "Registrar Ocorrência", subtitle: "Abrir chamado com foto e descrição", category: "Ações Rápidas", href: "/painel/ocorrencias", icon: "clipboard" },
        { title: "Reservar Área Comum", subtitle: "Churrasqueira, salão de festas ou quadra", category: "Ações Rápidas", href: "/painel/reservas", icon: "calendar" },
        { title: "Liberar Visitante", subtitle: "Gerar convite e QR Code de entrada", category: "Ações Rápidas", href: "/painel/visitantes", icon: "users" },
        { title: "Contratar Profissional", subtitle: "Buscar eletricistas, encanadores e reparos", category: "Ações Rápidas", href: "/painel/servicos", icon: "briefcase" },
        { title: "Consultar Encomendas", subtitle: "Ver pacotes disponíveis na portaria", category: "Ações Rápidas", href: "/painel/encomendas", icon: "package" },
      );
    } else if (role === "sindico") {
      items.push(
        { title: "Novo Comunicado", subtitle: "Disparar aviso para todo o condomínio", category: "Ações Rápidas", href: "/painel/comunicados", icon: "mail" },
        { title: "Convidar Morador", subtitle: "Cadastrar novos moradores ou proprietários", category: "Ações Rápidas", href: "/painel/moradores", icon: "users" },
        { title: "Nova Ordem de Serviço", subtitle: "Programar manutenção preventiva ou corretiva", category: "Ações Rápidas", href: "/painel/ordens", icon: "wrench" },
        { title: "Financeiro & Prestação de Contas", subtitle: "Receitas, despesas e fundo de reserva", category: "Ações Rápidas", href: "/painel/financeiro", icon: "wallet" },
        { title: "Avisos e Erros do Sistema", subtitle: "Monitoramento de telemetria e incidentes", category: "Ações Rápidas", href: "/painel/sistema/avisos-erros", icon: "alert-triangle" },
      );
    } else if (role === "porteiro" || role === "zelador") {
      items.push(
        { title: "Registrar Entrada de Visitante", subtitle: "Check-in na portaria", category: "Ações Rápidas", href: "/painel/visitantes", icon: "users" },
        { title: "Receber Encomenda", subtitle: "Registrar pacote e notificar unidade", category: "Ações Rápidas", href: "/painel/encomendas", icon: "package" },
        { title: "Passagem de Turno", subtitle: "Registrar ocorrências do plantão", category: "Ações Rápidas", href: "/painel/turnos", icon: "refresh" },
        { title: "Livro Digital", subtitle: "Consultar ocorrências da portaria", category: "Ações Rápidas", href: "/painel/portaria", icon: "book" },
      );
    } else if (role === "superadmin") {
      items.push(
        { title: "Painel do Marketplace", subtitle: "Serviços, categorias e prestadores", category: "Ações Rápidas", href: "/painel/admin/marketplace", icon: "briefcase" },
        { title: "Zeladoria Pay & Repasses", subtitle: "Split Asaas, escrow e conciliação", category: "Ações Rápidas", href: "/painel/admin/zeladoria-pay", icon: "wallet" },
        { title: "Condomínios Cadastrados", subtitle: "Gerenciar unidades e parametrização", category: "Ações Rápidas", href: "/painel/admin/condominios", icon: "building" },
        { title: "Moderação de Prestadores", subtitle: "Aprovação KYC e documentos", category: "Ações Rápidas", href: "/painel/admin/prestadores", icon: "shield" },
      );
    }

    // 2. Módulos e páginas autorizadas a partir de navigationGroups
    for (const group of navigationGroups) {
      if (group.href) {
        items.push({
          title: group.title,
          subtitle: `Módulo ${group.title}`,
          category: "Módulos & Navegação",
          href: group.href,
          icon: group.icon,
        });
      }
      for (const navItem of group.items) {
        items.push({
          title: navItem.label,
          subtitle: `${group.title} · ${navItem.label}`,
          category: "Módulos & Navegação",
          href: navItem.href,
          icon: navItem.icon,
        });
      }
    }

    return items;
  }, [role, navigationGroups]);

  // Filtered search results grouped
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return dynamicSearchableItems.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, dynamicSearchableItems]);

  const groupedSearchResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    searchResults.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [searchResults]);

  const searchParams = useSearchParams();

  const isRouteActive = (href: string) => {
    if (href === "/painel") return pathname === "/painel";
    const [targetPath, targetQuery] = href.split("?");
    if (targetQuery) {
      if (pathname !== targetPath) return false;
      const targetParams = new URLSearchParams(targetQuery);
      for (const [k, v] of targetParams.entries()) {
        const actual = searchParams.get(k);
        if (k === "tab") {
          const norm = (t?: string | null) => {
            if (!t) return "";
            if (t === "onboarding" || t === "recipients") return "prestadores";
            if (t === "taxas" || t === "commissions") return "comissoes";
            if (t === "payments") return "pagamentos";
            if (t === "inspections") return "vistorias";
            if (t === "payouts" || t === "split") return "repasses";
            if (t === "refunds" || t === "estornos") return "reembolsos";
            if (t === "disputes") return "contestacoes";
            if (t === "settings") return "configuracoes";
            if (t === "simulator") return "simulador";
            return t;
          };
          if (norm(actual) !== norm(v)) return false;
        } else if (actual !== v) {
          return false;
        }
      }
      return true;
    }
    if (targetPath === "/painel/servicos" && pathname === "/painel/servicos") {
      return !searchParams.get("tab") && !searchParams.get("aba");
    }
    if (targetPath === "/painel/admin/zeladoria-pay" && pathname === "/painel/admin/zeladoria-pay") {
      return searchParams.get("tab") !== "contratos";
    }
    return pathname.startsWith(targetPath);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white text-slate-800 select-none relative">
      {/* Brand Header with Dark Navy accent */}
      <div className="flex items-center justify-between h-14 px-4 bg-[#071A38] text-white border-b border-white/10">
        <Link
          href="/painel"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 group min-w-0"
          title="Zeladoria Condomínio"
        >
          <BrandLogo size="md" variant="white" showText={true} />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar menu"
          aria-label="Fechar menu"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Dashboard / Início (Primary Top Item) */}
        <div>
          <Link
            href={topItemHref}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors duration-150 ${
              isTopActive
                ? "bg-[#EAF1FF] text-[#1455FF] font-bold"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
            }`}
            title={topItemLabel}
          >
            <Icon
              name="grid"
              size={16}
              strokeWidth={isTopActive ? 2 : 1.75}
              className={isTopActive ? "text-[#1455FF]" : "text-slate-400 group-hover:text-slate-600"}
            />
            <span className="truncate flex-1">{topItemLabel}</span>
          </Link>
        </div>

        {/* Navigation Groups (Filtered by Permissions) */}
        {navigationGroups.map((group) => {
          if (group.href) {
            const active = isRouteActive(group.href);

            return (
              <div key={group.id} className="pt-1.5">
                <Link
                  href={group.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors duration-150 ${
                    active
                      ? "bg-[#EAF1FF] text-[#1455FF] font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`}
                  title={group.title}
                >
                  <Icon
                    name={group.icon ?? "briefcase"}
                    size={16}
                    strokeWidth={active ? 2 : 1.75}
                    className={active ? "text-[#1455FF]" : "text-slate-400 group-hover:text-slate-600"}
                  />
                  <span className="truncate flex-1">{group.title}</span>
                </Link>
              </div>
            );
          }

          const isExpanded = expandedGroups[group.id] ?? true;
          const hasActiveChild = group.items.some((item) => isRouteActive(item.href));
          const isTiaoGroup = group.id === "servicos" || group.title.toLowerCase().includes("tião");

          if (isTiaoGroup) {
            const isTiaoActive =
              pathname.startsWith("/painel/servicos") ||
              pathname.startsWith("/painel/chamados") ||
              pathname.startsWith("/prestador");

            return (
              <div key={group.id} className="pt-2.5 pb-1">
                <Link
                  href="/painel/servicos"
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-all duration-150 shadow-xs cursor-pointer ${
                    isTiaoActive
                      ? "bg-[#1455FF] ring-2 ring-[#1455FF]/40 shadow-md"
                      : "bg-[#1455FF] hover:bg-[#0048E8] hover:shadow-md"
                  }`}
                  title="Tião Zelador · Encontrar profissional, contratações e favoritos"
                >
                  <img
                    src="/brands/tiao/mascot-white.png"
                    alt="Tião Zelador"
                    className="h-6 w-6 shrink-0 object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="font-black text-[13px] tracking-tight text-white truncate">
                      Tião Zelador
                    </span>
                    <Icon
                      name="arrow-right"
                      size={13}
                      className="text-white/80 transition-transform group-hover:translate-x-0.5 shrink-0"
                    />
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <div key={group.id} className="pt-2.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className={hasActiveChild ? "text-[#1455FF] font-extrabold" : ""}>
                    {group.title}
                  </span>
                </span>
                <Icon
                  name="chevron-down"
                  size={11}
                  className={`text-slate-400 transition-transform duration-150 ${isExpanded ? "" : "-rotate-90"}`}
                />
              </button>

              {isExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isRouteActive(item.href);

                    return (
                      <Link
                        key={item.id || item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150 ${
                          active
                            ? "bg-[#EAF1FF] text-[#1455FF] font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                        }`}
                        title={item.label}
                      >
                        <Icon
                          name={item.icon}
                          size={15}
                          strokeWidth={active ? 2 : 1.75}
                          className={
                            active
                              ? "text-[#1455FF]"
                              : "text-slate-400 group-hover:text-slate-600"
                          }
                        />
                        <span className="truncate flex-1">{item.label}</span>

                        {/* Real dynamic notification badge */}
                        {item.badge && item.badge > 0 ? (
                          <span
                            className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold ${
                              active
                                ? "bg-blue-100 text-[#1455FF]"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
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
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div ref={profileContainerRef} className="relative">
          <div className="flex items-center gap-2.5 p-1.5">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-[#1455FF] text-xs font-black border border-[#1455FF]/20 shadow-xs">
              {userName.slice(0, 1).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{userName}</p>
              <p className="truncate text-[10px] text-slate-500 font-medium">
                {roleLabel} {unitLabel ? `· Unid. ${unitLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/painel/perfil"
              onClick={() => setMobileOpen(false)}
              className="text-xs font-bold text-[#1455FF] hover:underline flex items-center gap-1"
            >
              <Icon name="user" size={13} />
              <span>Meu perfil</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="logout" size={13} />
                <span>Sair</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col selection:bg-blue-100 selection:text-[#1455FF]">
      {/* Top Navbar: Horizontal Dark Navy (#071A38) inspirado na referência visual */}
      <header className="sticky top-0 z-40 w-full bg-[#071A38] text-white border-b border-white/10 shadow-[0_2px_12px_rgba(7,26,56,0.18)] select-none">
        <div className="w-full max-w-[1480px] mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Menu / Drawer + Logo Branca + Seletor de Condomínio */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Menu completo de serviços"
              aria-label="Abrir menu"
            >
              <Icon name="menu" size={20} />
            </button>

            <Link
              href={topItemHref}
              className="flex items-center gap-2 group min-w-0 shrink-0"
              title="Zeladoria Condomínio"
            >
              <BrandLogo size="md" variant="white" showText={true} />
            </Link>

            {/* Condo Selector Dropdown (apenas para usuários vinculados a condomínio) */}
            {role !== "prestador" && role !== "superadmin" && (
              <div ref={condoRef} className="relative min-w-0 hidden md:block">
                <button
                  type="button"
                  onClick={() => condos.length > 1 && setCondoDropdownOpen(!condoDropdownOpen)}
                  disabled={isSwitchingCondo}
                  className={`group flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90 transition-colors ${
                    condos.length > 1 ? "cursor-pointer" : "cursor-default"
                  }`}
                  title={condos.length > 1 ? "Trocar condomínio" : condoName}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#1455FF] text-white shrink-0">
                    {isSwitchingCondo ? (
                      <Icon name="refresh" size={10} className="animate-spin text-white" />
                    ) : (
                      <Icon name="building" size={10} strokeWidth={2} />
                    )}
                  </span>
                  <span className="truncate max-w-[120px] xl:max-w-[180px]">
                    {condoName || "Residencial Parque das Águas"}
                  </span>
                  {condos.length > 1 && (
                    <Icon
                      name="chevron-down"
                      size={10}
                      className={`text-white/60 group-hover:text-white transition-transform shrink-0 ${
                        condoDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {condoDropdownOpen && (
                  <div className="absolute left-0 z-50 mt-1.5 w-64 shadow-2xl rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 animate-in fade-in-50 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Selecione o Condomínio
                    </div>
                    <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto">
                      {condos.map((c) => {
                        const isActive = c.id === activeCondoId;
                        const isSwitchingThis = isSwitchingCondo && switchingCondoId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={isSwitchingCondo}
                            onClick={() => handleCondoSwitch(c.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                              isActive
                                ? "font-bold text-[#1455FF] bg-blue-50"
                                : "text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                            {isSwitchingThis ? (
                              <Icon name="refresh" size={13} className="animate-spin text-[#1455FF]" />
                            ) : isActive ? (
                              <Icon name="check" size={13} className="text-[#1455FF]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Centro: Links de Navegação Horizontal (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {topNavItems.map((item) => {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    active
                      ? "bg-white/15 text-white border border-white/20 shadow-xs"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon name={item.icon} size={15} className={active ? "text-white" : "text-white/70"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Lado Direito: Busca + Notificações + Botão "Meu perfil" */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Global Search Trigger (Desktop) */}
            <div ref={searchRef} className="relative hidden xl:block w-44">
              <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                id="global-search-input"
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 pl-8 pr-9 text-xs text-white placeholder:text-white/50 outline-none focus:border-white/30 focus:bg-white/20 transition-all"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="text-[9px] font-mono font-bold text-white/60 bg-white/10 border border-white/20 px-1 py-0.5 rounded">⌘K</kbd>
              </span>

              {/* Search dropdown desktop */}
              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 max-h-80 overflow-y-auto shadow-2xl rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhum resultado para &quot;{searchQuery}&quot;
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
                                className="block p-2 rounded-lg hover:bg-blue-50/70 transition-colors"
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

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setSearchMobileOpen(true)}
              title="Buscar no sistema"
              className="flex xl:hidden h-8.5 w-8.5 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors cursor-pointer"
              aria-label="Abrir busca"
            >
              <Icon name="search" size={15} />
            </button>

            {/* Notifications Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notificações"
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors cursor-pointer"
                aria-label="Abrir notificações"
              >
                <Icon name="bell" size={15} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#1455FF] ring-2 ring-[#071A38]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 shadow-2xl rounded-xl border border-slate-200 bg-white overflow-hidden text-slate-800">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">Notificações</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-[#1455FF]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-[#1455FF] hover:underline cursor-pointer"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                        <Icon name="bell" size={20} className="mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">Nenhuma notificação recente</p>
                        <p className="text-[11px] text-slate-400">Você está em dia com todos os avisos.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
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
                              !notif.read ? "bg-[#1455FF] text-white" : "bg-slate-100 text-slate-500"
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
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1455FF] shrink-0 mt-1" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/60 text-center">
                    <Link
                      href="/painel/notificacoes"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-[#1455FF] hover:underline block py-1"
                    >
                      Ver todas as notificações →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO "MEU PERFIL" — FIEL À REFERÊNCIA VISUAL */}
            <div ref={profileContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#071A38] px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Abrir opções de perfil"
              >
                <Icon name="user" size={14} className="text-[#071A38]" />
                <span className="hidden sm:inline">Meu perfil</span>
              </button>

              {/* Profile Popup Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl animate-in fade-in-50 duration-100">
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
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1455FF] transition-colors"
                    >
                      <Icon name="user" size={14} className="text-[#1455FF]" />
                      <span>Meu Perfil</span>
                    </Link>

                    {condos.length > 1 && (
                      <div className="px-3 py-1.5 border-t border-b border-slate-100 my-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Trocar Condomínio
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {condos.map((c) => {
                            const isActive = c.id === activeCondoId;
                            const isSwitchingThis = isSwitchingCondo && switchingCondoId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                disabled={isSwitchingCondo}
                                onClick={() => handleCondoSwitch(c.id)}
                                className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between gap-1.5 cursor-pointer ${
                                  isActive
                                    ? "bg-blue-50 font-bold text-[#1455FF]"
                                    : "text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                }`}
                              >
                                <span className="truncate flex-1 text-[11px] leading-snug">{c.name}</span>
                                {isSwitchingThis ? (
                                  <Icon name="refresh" size={12} className="animate-spin text-[#1455FF] shrink-0" />
                                ) : isActive ? (
                                  <Icon name="check" size={12} className="text-[#1455FF] shrink-0" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Troca de Contexto: Morador vs Tião Parceiros */}
                    <div className="px-3 py-1.5 border-t border-slate-100 my-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Usar como:
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100">
                        <Link
                          href="/painel"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`text-center py-1 rounded-md text-[11px] font-bold transition-all ${
                            role !== "prestador"
                              ? "bg-white text-[#1455FF] shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Morador
                        </Link>
                        <Link
                          href="/prestador"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`text-center py-1 rounded-md text-[11px] font-bold transition-all ${
                            role === "prestador"
                              ? "bg-[#1455FF] text-white shadow-2xs"
                              : "text-slate-600 hover:text-[#1455FF]"
                          }`}
                        >
                          Tião Parceiros
                        </Link>
                      </div>
                    </div>

                    {(role === "sindico" || role === "superadmin") && (
                      <Link
                        href="/painel/configuracoes"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1455FF] transition-colors"
                      >
                        <Icon name="settings" size={14} className="text-slate-500" />
                        <span>Configurações</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-slate-100" />
                    <form action={logout}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Icon name="logout" size={14} />
                        <span>Sair da conta</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Full-width Search Bar Overlay */}
        {searchMobileOpen && (
          <div className="absolute inset-0 z-50 flex items-center bg-[#071A38] px-3 sm:px-6 shadow-md animate-in fade-in duration-150">
            <div className="relative flex-1 flex items-center">
              <Icon name="search" size={15} className="absolute left-3 text-white/50" />
              <input
                type="text"
                autoFocus
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-8 text-xs text-white placeholder:text-white/50 outline-none focus:bg-white/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-white/60 hover:text-white p-1"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchMobileOpen(false);
                setSearchQuery("");
              }}
              className="ml-2 text-xs font-semibold text-white/80 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer shrink-0"
            >
              Cancelar
            </button>
          </div>
        )}
      </header>

      {/* Drawer com Menu Completo e Navegação por Grupos */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] sm:w-[320px] bg-white shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-200 flex flex-col z-50">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Body */}
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-[1480px] mx-auto min-w-0">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      {(() => {
        const isTiaoRoute =
          pathname?.startsWith("/painel/servicos") ||
          pathname?.startsWith("/painel/chamados") ||
          pathname?.startsWith("/prestador");

        return (
          <nav
            className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around px-1 py-1 lg:hidden bg-[#071A38] border-t border-white/10 text-white shadow-[0_-4px_16px_rgba(7,26,56,0.25)] select-none pb-[max(env(safe-area-inset-bottom),0.35rem)]"
          >
            {(mobileNav && mobileNav.length > 0
              ? mobileNav
              : [
                  { id: "inicio", href: "/painel", label: "Início", icon: "grid" as IconName },
                  { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard" as IconName },
                  { id: "reservas", href: "/painel/reservas", label: "Reservas", icon: "calendar" as IconName },
                  { id: "servicos", href: "/painel/servicos", label: "Tião", icon: "tiao" as IconName },
                  { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" as IconName },
                ]
            ).map((item) => {
              const isDrawerOpener = item.id === "mais" || item.href === "#drawer";
              const active = !isDrawerOpener && isRouteActive(item.href);

              if (isDrawerOpener) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon name={item.icon} size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                    active ? "text-white font-bold" : "text-white/70 hover:text-white"
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      name={item.icon}
                      size={17}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={active ? "text-[#1455FF]" : ""}
                    />
                    {active && (
                      <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#1455FF]" />
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        );
      })()}

      {/* Botão Flutuante de SOS e Central de Emergência 24h */}
      <EmergencySos condoName={condoName} />
    </div>
  );
}
