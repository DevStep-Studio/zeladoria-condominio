"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { toggleProviderOnlineAction } from "@/lib/actions/prestador";
import { logoutAction } from "@/lib/actions/session";

export function ProviderShell({
  session,
  vendor,
  children,
}: {
  session: any;
  vendor: any;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOnline = () => {
    startTransition(async () => {
      await toggleProviderOnlineAction();
    });
  };

  // Agrupamento da Sidebar Desktop (Prompt Itens 50 e 51)
  const desktopSidebarGroups: Array<{
    title: string;
    items: Array<{ href: string; label: string; icon: IconName }>;
  }> = [
    {
      title: "INÍCIO",
      items: [{ href: "/prestador", label: "Início", icon: "grid" }],
    },
    {
      title: "TRABALHO",
      items: [
        { href: "/prestador/chamados?tab=novos", label: "Oportunidades", icon: "zap" },
        { href: "/prestador/chamados?tab=contratados", label: "Atendimentos", icon: "clipboard" },
        { href: "/prestador/chamados?tab=orcamentos_enviados", label: "Orçamentos", icon: "file-text" },
        { href: "/prestador/agenda", label: "Agenda", icon: "calendar" },
      ],
    },
    {
      title: "MEU NEGÓCIO",
      items: [
        { href: "/prestador/perfil", label: "Perfil profissional", icon: "user" },
        { href: "/prestador/servicos", label: "Serviços", icon: "wrench" },
        { href: "/prestador/portfolio", label: "Portfólio", icon: "camera" },
        { href: "/prestador/disponibilidade", label: "Disponibilidade", icon: "clock" },
        { href: "/prestador/destaque", label: "Destaque & Planos", icon: "sparkles" },
      ],
    },
    {
      title: "FINANCEIRO",
      items: [{ href: "/prestador/ganhos", label: "Ganhos & Repasses", icon: "wallet" }],
    },
    {
      title: "CONTA",
      items: [
        { href: "/prestador/avaliacoes", label: "Avaliações", icon: "star" },
        { href: "/prestador/documentos", label: "Documentos & KYC", icon: "shield" },
        { href: "/prestador/configuracoes", label: "Configurações", icon: "settings" },
        { href: "/prestador/ajuda", label: "Ajuda", icon: "help" },
      ],
    },
  ];

  // Mobile Bottom Navigation — 5 Itens com Oportunidades no CENTRO em destaque absoluto (Prompt Itens 32 e 33)
  const mobileNav = [
    { href: "/prestador", label: "Início", icon: "grid" as const, isCenter: false },
    { href: "/prestador/chamados?tab=contratados", label: "Atendimentos", icon: "clipboard" as const, isCenter: false },
    { href: "/prestador/chamados?tab=novos", label: "Oportunidades", icon: "zap" as const, isCenter: true },
    { href: "/prestador/ganhos", label: "Financeiro", icon: "wallet" as const, isCenter: false },
    { href: "/prestador/perfil", label: "Perfil", icon: "user" as const, isCenter: false },
  ];

  const isOnline = vendor?.isOnline ?? true;
  const userName = vendor?.name || session?.user?.name || "Prestador";
  const userInitial = (userName.slice(0, 1) || "P").toUpperCase();
  const categoryLabel = vendor?.category || "Serviços";

  return (
    <div data-brand="tiao" className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-[#0F172A] selection:bg-[#FB6B01] selection:text-white">
      {/* DESKTOP SIDEBAR (Prompt Itens 50 e 51) */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/90 z-30 shadow-2xs">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link
            href="/prestador"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            title="Tião Parceiros · Painel do Profissional"
          >
            <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200/80 p-1 flex items-center justify-center shadow-xs">
              <img
                src="/brands/tiao/mascot-black.png"
                alt="Tião Parceiros"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-[#0F172A] tracking-tight">Tião Parceiros</span>
                <span className="text-[10px] font-bold text-[#FB6B01] bg-orange-50 border border-orange-200/60 px-1.5 py-0.2 rounded-full">Pro</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Painel do Profissional</p>
            </div>
          </Link>
        </div>

        {/* Categorized Nav Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-none">
          {desktopSidebarGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </span>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const basePath = item.href.split("?")[0];
                  const isGroupActive =
                    pathname === basePath ||
                    (basePath !== "/prestador" && pathname.startsWith(basePath));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                        isGroupActive
                          ? "bg-orange-50 text-[#FB6B01] font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      <Icon
                        name={item.icon}
                        size={15}
                        strokeWidth={isGroupActive ? 2.2 : 1.8}
                        className={isGroupActive ? "text-[#FB6B01]" : "text-slate-400"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Preview vitrine + User Switcher */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-2 bg-slate-50/50">
          {vendor?.slug && (
            <Link
              href={`/servicos/${vendor.slug}`}
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-orange-200/70 bg-white hover:bg-orange-50/60 text-[#FB6B01] text-xs font-bold transition-colors shadow-2xs"
            >
              <Icon name="external-link" size={13} />
              <span>Ver perfil como cliente</span>
            </Link>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-1">
              Usar como:
            </span>
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100">
              <Link
                href="/painel"
                className="text-center py-1 rounded-md text-[11px] font-bold text-slate-600 hover:text-[#1355FF] transition-all"
              >
                Morador
              </Link>
              <Link
                href="/prestador"
                className="text-center py-1 rounded-md text-[11px] font-bold bg-[#FB6B01] text-white shadow-2xs transition-all"
              >
                Tião Parceiros
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 shadow-2xs lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Mobile Logo Tião Parceiros */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <Link
                href="/prestador"
                className="inline-flex items-center gap-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-xl bg-orange-50 border border-orange-200 p-0.5 flex items-center justify-center shadow-xs">
                  <img
                    src="/brands/tiao/mascot-black.png"
                    alt="Tião Parceiros"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="font-black text-sm text-[#0F172A] tracking-tight">Tião Parceiros</span>
              </Link>
            </div>

            {/* Disponibilidade Toggle Verde (Prompt Item 47: Verde #10B981, nunca laranja) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer select-none ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title="Clique para alternar sua disponibilidade para novos chamados"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOnline ? "bg-[#10B981] animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span className="hidden sm:inline">
                  {isOnline ? "Disponível para novos serviços" : "Indisponível no momento"}
                </span>
                <span className="sm:hidden">
                  {isOnline ? "Disponível" : "Indisponível"}
                </span>
              </button>
            </div>

            {/* Right: Quick actions + User menu */}
            <div className="flex items-center gap-2.5 shrink-0">
              {vendor?.slug && (
                <Link
                  href={`/servicos/${vendor.slug}`}
                  target="_blank"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  <Icon name="external-link" size={12} />
                  <span>Ver vitrine</span>
                </Link>
              )}

              {/* User Profile Pill & Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  aria-label="Menu do Usuário"
                >
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#FB6B01] text-xs font-black border border-orange-200">
                    {userInitial}
                    <span
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${
                        isOnline ? "bg-[#10B981]" : "bg-slate-400"
                      }`}
                    />
                  </span>
                  <div className="text-left hidden sm:block max-w-[110px] truncate">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize truncate leading-tight">
                      {categoryLabel}
                    </p>
                  </div>
                  <Icon name="chevron-down" size={12} className="text-slate-400" />
                </button>

                {/* Profile Popover Menu */}
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                    {/* User Header */}
                    <div className="p-2 pb-2.5 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{session?.user?.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded-md bg-orange-50 text-[#FB6B01] text-[10px] font-bold capitalize">
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Menu Options */}
                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/prestador/perfil"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="user" size={14} className="text-slate-400" />
                        <span>Meu Perfil</span>
                      </Link>

                      <Link
                        href="/prestador/ganhos"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="wallet" size={14} className="text-slate-400" />
                        <span>Ganhos & Repasses</span>
                      </Link>

                      <Link
                        href="/prestador/documentos"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="shield" size={14} className="text-slate-400" />
                        <span>Documentos & KYC</span>
                      </Link>

                      <Link
                        href="/prestador/configuracoes"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="settings" size={14} className="text-slate-400" />
                        <span>Configurações</span>
                      </Link>

                      {/* Troca de Contexto: Tião Parceiros vs Morador (Prompt Item 54) */}
                      <div className="pt-1.5 pb-0.5 border-t border-slate-100 my-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-1">
                          Usar como:
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100">
                          <Link
                            href="/painel"
                            onClick={() => setProfileOpen(false)}
                            className="text-center py-1 rounded-md text-[11px] font-bold text-slate-600 hover:text-[#1355FF] transition-all"
                          >
                            Morador
                          </Link>
                          <Link
                            href="/prestador"
                            onClick={() => setProfileOpen(false)}
                            className="text-center py-1 rounded-md text-[11px] font-bold bg-[#FB6B01] text-white shadow-2xs transition-all"
                          >
                            Tião Parceiros
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                        >
                          <Icon name="logout" size={14} className="text-rose-500" />
                          <span>Sair da conta</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12 lg:pl-64">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Apenas 5 itens, Oportunidades no centro com destaque laranja - Prompt Itens 32 e 33) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center shadow-lg pb-[max(env(safe-area-inset-bottom),0.4rem)]">
        {mobileNav.map((item) => {
          const basePath = item.href.split("?")[0];
          const isActive =
            pathname === basePath ||
            (basePath !== "/prestador" && pathname.startsWith(basePath));

          if (item.isCenter) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group cursor-pointer"
                title="Central de Oportunidades"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all active:scale-95 ${
                    isActive
                      ? "bg-[#FB6B01] text-white ring-4 ring-orange-200"
                      : "bg-[#FB6B01] text-white hover:bg-[#E05F00] ring-3 ring-white"
                  }`}
                >
                  <Icon name="zap" size={21} strokeWidth={2.4} />
                </div>
                <span className="mt-0.5 text-[10px] font-black text-[#FB6B01] tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? "text-[#FB6B01]" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon name={item.icon} size={17} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
