import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

const DEMOS = [
  { email: "sindico@portariamais.com.br", label: "Síndica", desc: "Acesso administrativo completo" },
  { email: "portaria@portariamais.com.br", label: "Portaria", desc: "Visitantes, encomendas e turnos" },
  { email: "morador@portariamais.com.br", label: "Morador", desc: "Apto 302 · Bloco A" },
  { email: "admin@portariamais.com.br", label: "Super admin", desc: "Multi-condomínio e adoção" },
];

export default async function LoginPage() {
  await ensureSeed();
  const session = await getSession();
  if (session) redirect("/painel");

  return (
    <main className="w-full min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[58%_42%] xl:grid-cols-[60%_40%] bg-white text-[#0F172A] selection:bg-[#0055D4] selection:text-white">
      {/* Left Visual Panel: 100% full screen height, edge-to-edge */}
      <section className="relative bg-[#0055D4] text-white p-8 sm:p-12 lg:p-14 xl:p-16 flex flex-col justify-between overflow-hidden">
        {/* Subtle architectural vector geometry & tonal depth */}
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Soft tonal depth */}
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#0047BA] opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#003B99] opacity-75 blur-3xl" />

          {/* Geometric architectural SVG linework */}
          <svg
            className="absolute inset-0 w-full h-full stroke-white/10"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 900 900"
            fill="none"
          >
            <circle cx="450" cy="450" r="380" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="450" cy="450" r="260" strokeWidth="1" />
            <circle cx="450" cy="450" r="130" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="80" y1="450" x2="820" y2="450" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="450" y1="80" x2="450" y2="820" strokeWidth="1" strokeOpacity="0.4" />
            <rect x="320" y="320" width="260" height="260" rx="20" strokeWidth="1" strokeOpacity="0.25" />
          </svg>
        </div>

        {/* Top Header: Official Logo + Product Badge */}
        <header className="relative z-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD000] rounded-lg"
            aria-label="Ir para página inicial do Zeladoria Cidades"
          >
            <BrandLogo variant="white" size="xl" />
          </Link>

          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/95 font-medium backdrop-blur-xs shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000] animate-pulse" />
            <span>Zeladoria Cidades</span>
          </div>
        </header>

        {/* Bottom Content Hierarchy */}
        <div className="relative z-10 mt-10 lg:mt-auto pt-6">
          {/* Eyebrow element */}
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/12 border border-white/20 text-xs font-semibold tracking-wide text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000]" />
            <span>Tudo do seu condomínio em um só lugar</span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-extrabold tracking-tight text-white leading-[1.12]">
            Seu condomínio, <br />
            <span className="text-white">mais simples.</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-sm sm:text-[15px] lg:text-base text-blue-100/90 font-normal leading-relaxed max-w-xl">
            Gestão, serviços e convivência conectados em uma única plataforma moderna e inteligente.
          </p>

          {/* 3 Horizontal Cards (visible on tablet and desktop, hidden on compact mobile) */}
          <div className="mt-8 hidden sm:grid sm:grid-cols-3 gap-3.5 w-full">
            {/* CARD 1 — Ativo / Destacado */}
            <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-md border border-white flex flex-col justify-between transition-transform duration-150">
              <div className="w-7 h-7 rounded-full bg-[#0055D4] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#FFD000] shrink-0">
                1
              </div>
              <div className="mt-3">
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                  Acesse seu condomínio
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                  Entre com sua conta para gerenciar seu espaço.
                </p>
              </div>
            </div>

            {/* CARD 2 — Secundário */}
            <div className="bg-white/10 hover:bg-white/15 text-white rounded-2xl p-4 border border-white/15 flex flex-col justify-between backdrop-blur-xs transition-colors">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div className="mt-3">
                <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  Acompanhe tudo
                </h3>
                <p className="mt-1 text-[11px] text-blue-100/85 leading-normal">
                  Reservas, ocorrências e comunicados.
                </p>
              </div>
            </div>

            {/* CARD 3 — Secundário */}
            <div className="bg-white/10 hover:bg-white/15 text-white rounded-2xl p-4 border border-white/15 flex flex-col justify-between backdrop-blur-xs transition-colors">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div className="mt-3">
                <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  Resolva com facilidade
                </h3>
                <p className="mt-1 text-[11px] text-blue-100/85 leading-normal">
                  Serviços e gestão em um só lugar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Form Area: 100% full screen height, edge-to-edge */}
      <section className="bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 h-full overflow-y-auto">
        {/* Top Header: Security Indicator */}
        <header className="flex items-center justify-between text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ambiente Seguro SSL</span>
          </div>

          <Link
            href="/prestador/login"
            className="text-[12px] font-semibold text-[#0055D4] hover:text-[#0047BA] hover:underline transition-colors"
          >
            Área do Prestador →
          </Link>
        </header>

        {/* Centered Form Area */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-[30px] sm:text-[34px] font-extrabold leading-tight tracking-tight text-[#0F172A]">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-normal leading-relaxed">
              Entre na sua conta para acessar o Zeladoria Cidades.
            </p>
          </div>

          <LoginForm demos={DEMOS} />
        </div>

        {/* SaaS Footer */}
        <footer className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-normal">
          <p>© 2026 Zeladoria Cidades</p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="hover:text-[#0055D4] transition-colors focus:outline-none focus-visible:underline"
            >
              Termos de Uso
            </a>
            <span className="text-slate-300 select-none">·</span>
            <a
              href="#"
              className="hover:text-[#0055D4] transition-colors focus:outline-none focus-visible:underline"
            >
              Política de Privacidade
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
