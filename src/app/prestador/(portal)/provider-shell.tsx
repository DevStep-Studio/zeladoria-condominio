"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
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

  const handleToggleOnline = () => {
    startTransition(async () => {
      await toggleProviderOnlineAction();
    });
  };

  const navItems = [
    { href: "/prestador", label: "Início", icon: "grid" as const },
    { href: "/prestador/chamados", label: "Chamados", icon: "clipboard" as const },
    { href: "/prestador/perfil", label: "Meu Perfil", icon: "user" as const },
    { href: "/prestador/servicos", label: "Serviços", icon: "wrench" as const },
    { href: "/prestador/portfolio", label: "Portfólio", icon: "camera" as const },
    { href: "/prestador/disponibilidade", label: "Disponibilidade", icon: "clock" as const },
    { href: "/prestador/avaliacoes", label: "Avaliações", icon: "star" as const },
    { href: "/prestador/destaque", label: "Destaque / Plano", icon: "sparkles" as const },
    { href: "/prestador/configuracoes", label: "Configurações", icon: "settings" as const },
  ];

  // Mobile bottom-nav subset (5 itens essenciais)
  const mobileNav = [
    { href: "/prestador", label: "Início", icon: "grid" as const },
    { href: "/prestador/chamados", label: "Chamados", icon: "clipboard" as const },
    { href: "/prestador/perfil", label: "Perfil", icon: "user" as const },
    { href: "/prestador/avaliacoes", label: "Avaliações", icon: "star" as const },
    { href: "/prestador/configuracoes", label: "Ajustes", icon: "settings" as const },
  ];

  const isOnline = vendor?.isOnline ?? true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-[#0F172A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand & Provider identity */}
            <div className="flex items-center gap-4">
              <Link href="/prestador" className="transition-opacity hover:opacity-90">
                <BrandLogo size="sm" variant="default" />
              </Link>

              {/* Online / Offline status badge & toggle */}
              <button
                type="button"
                onClick={handleToggleOnline}
                disabled={isPending}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title="Clique para alternar entre Online e Offline"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span>{isOnline ? "Online para chamados" : "Offline / Ocupado"}</span>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-50 text-[#0055D4]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon name={item.icon} size={14} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Provider Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-[#0F172A] leading-tight">
                  {vendor?.name || session.user.name}
                </span>
                <span className="block text-[10px] text-slate-400 capitalize">
                  {vendor?.category || "Prestador Parceiro"}
                </span>
              </div>

              <Link
                href="/painel"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Acessar painel do condomínio"
              >
                <Icon name="grid" size={15} />
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <Icon name="arrow-right" size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? "text-[#0055D4]" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
