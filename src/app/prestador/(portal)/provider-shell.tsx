"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
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

  // 5 Abas Principais (Sem poluição visual)
  const primaryNavItems: Array<{ href: string; label: string; icon: IconName }> = [
    { href: "/prestador", label: "Início", icon: "grid" },
    { href: "/prestador/chamados", label: "Chamados", icon: "clipboard" },
    { href: "/prestador/servicos", label: "Serviços", icon: "wrench" },
    { href: "/prestador/portfolio", label: "Portfólio", icon: "camera" },
    { href: "/prestador/avaliacoes", label: "Avaliações", icon: "star" },
  ];

  // Abas Secundárias (Agrupadas no menu "Mais")
  const secondaryNavItems: Array<{ href: string; label: string; icon: IconName; desc: string }> = [
    { href: "/prestador/agenda", label: "Minha Agenda", icon: "calendar", desc: "Compromissos e horários agendados" },
    { href: "/prestador/disponibilidade", label: "Disponibilidade", icon: "clock", desc: "Configurar horários de atendimento" },
    { href: "/prestador/destaque", label: "Destaque / Planos", icon: "sparkles", desc: "Planos e visibilidade no condomínio" },
    { href: "/prestador/ganhos", label: "Ganhos & Finanças", icon: "wallet", desc: "Histórico de faturamento e extrato" },
  ];

  // Mobile Bottom Navigation (5 itens essenciais)
  const mobileNav = [
    { href: "/prestador", label: "Início", icon: "grid" as const },
    { href: "/prestador/chamados", label: "Chamados", icon: "clipboard" as const },
    { href: "/prestador/servicos", label: "Serviços", icon: "wrench" as const },
    { href: "/prestador/avaliacoes", label: "Avaliações", icon: "star" as const },
    { href: "/prestador/perfil", label: "Perfil", icon: "user" as const },
  ];

  const isOnline = vendor?.isOnline ?? true;
  const isMoreActive = secondaryNavItems.some((item) => pathname.startsWith(item.href));
  const userName = vendor?.name || session?.user?.name || "Prestador";
  const userInitial = (userName.slice(0, 1) || "P").toUpperCase();
  const categoryLabel = vendor?.category || "Serviços";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-[#0F172A] selection:bg-[#0055D4] selection:text-white">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* LEFT: Logo + Badge + Status Switch */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/prestador"
                className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none"
                title="Zeladoria Condomínio · Área do Prestador"
              >
                <BrandLogo size="sm" variant="default" />
              </Link>

              <span className="hidden sm:block h-4 w-[1px] bg-slate-200" />

              {/* Status Online / Offline Badge Button */}
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[8px] text-xs font-semibold border transition-colors cursor-pointer select-none ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80"
                }`}
                title="Clique para alternar seu status de atendimento"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span className="hidden xs:inline">
                  {isOnline ? "Online para chamados" : "Offline"}
                </span>
              </button>
            </div>

            {/* CENTER: Clean Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs transition-colors duration-150 ${
                      isActive
                        ? "bg-[#0055D4] text-white font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      size={14}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={isActive ? "text-white" : "text-slate-400"}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* "Mais" Dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                    isMoreActive
                      ? "bg-[#0055D4] text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon
                    name="more"
                    size={14}
                    className={isMoreActive ? "text-white" : "text-slate-400"}
                  />
                  <span>Mais</span>
                  <Icon
                    name="chevron-down"
                    size={12}
                    className={`transition-transform duration-150 ${moreMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreMenuOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 w-64 rounded-[12px] border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                    {secondaryNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`flex items-start gap-2.5 p-2 rounded-[8px] text-xs transition-colors ${
                            isActive
                              ? "bg-blue-50 text-[#0055D4] font-bold"
                              : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <span className={`p-1.5 rounded-[6px] shrink-0 ${isActive ? "bg-[#0055D4] text-white" : "bg-slate-100 text-slate-500"}`}>
                            <Icon name={item.icon} size={14} />
                          </span>
                          <div>
                            <p className="leading-tight">{item.label}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            {/* RIGHT: Switch to Condo + User Popover */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Painel do Condomínio Shortcut */}
              <Link
                href="/painel"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
                title="Ir para o Painel Geral do Condomínio"
              >
                <Icon name="grid" size={13} className="text-[#0055D4]" />
                <span className="hidden md:inline">Painel Condomínio</span>
              </Link>

              {/* User Profile Pill & Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  aria-label="Menu do Usuário"
                >
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0055D4] text-xs font-black border border-blue-200/60">
                    {userInitial}
                    <span
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${
                        isOnline ? "bg-emerald-500" : "bg-slate-400"
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
                  <div className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-[14px] border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                    {/* User Header */}
                    <div className="p-2 pb-2.5 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{session?.user?.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#0055D4] text-[10px] font-bold capitalize">
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Menu Options */}
                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/prestador/perfil"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="user" size={14} className="text-slate-400" />
                        <span>Meu Perfil</span>
                      </Link>

                      <Link
                        href="/prestador/configuracoes"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon name="settings" size={14} className="text-slate-400" />
                        <span>Configurações</span>
                      </Link>

                      <Link
                        href="/painel"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs font-semibold text-[#0055D4] hover:bg-blue-50 transition-colors"
                      >
                        <Icon name="grid" size={14} className="text-[#0055D4]" />
                        <span>Painel do Condomínio</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Fixed at bottom on small screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-[8px] text-[10px] font-bold transition-colors ${
                isActive ? "text-[#0055D4]" : "text-slate-400 hover:text-slate-700"
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
