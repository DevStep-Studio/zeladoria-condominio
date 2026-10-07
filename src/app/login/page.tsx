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
    <main className="min-h-screen w-full bg-[#0B1120] flex items-center justify-center p-3 sm:p-6 lg:p-8 xl:p-12 text-[#0F172A] selection:bg-[#0055D4] selection:text-white">
      {/* Central Floating Container: 80-88% width, 75-85vh approx on desktop */}
      <div className="w-full max-w-[1240px] min-h-[580px] lg:h-[84vh] lg:max-h-[820px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden grid grid-cols-1 lg:grid-cols-[58%_42%] border border-slate-800/20">
        
        {/* Left Visual Panel (~58% on desktop) */}
        <section className="relative bg-[#0055D4] text-white p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between overflow-hidden">
          {/* Subtle architectural vector geometry & tonal depth */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-90"
            aria-hidden="true"
          >
            {/* Soft tonal depth */}
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#0047BA] opacity-60 blur-2xl" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#003B99] opacity-75 blur-2xl" />

            {/* Geometric architectural SVG linework */}
            <svg
              className="absolute inset-0 w-full h-full stroke-white/10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 700 700"
              fill="none"
            >
              <circle cx="350" cy="350" r="280" strokeWidth="1" strokeDasharray="5 5" />
              <circle cx="350" cy="350" r="190" strokeWidth="1" />
              <circle cx="350" cy="350" r="95" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="70" y1="350" x2="630" y2="350" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="350" y1="70" x2="350" y2="630" strokeWidth="1" strokeOpacity="0.5" />
              <rect x="250" y="250" width="200" height="200" rx="16" strokeWidth="1" strokeOpacity="0.25" />
            </svg>
          </div>

          {/* Top: Official White Logo */}
          <header className="relative z-10 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD000] rounded-lg"
              aria-label="Ir para página inicial do Zeladoria Cidades"
            >
              <BrandLogo variant="white" size="xl" />
            </Link>

            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/95 font-medium backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000]" />
              <span>Zeladoria Cidades</span>
            </div>
          </header>

          {/* Bottom Content Hierarchy */}
          <div className="relative z-10 mt-6 sm:mt-8 lg:mt-auto pt-4 lg:pt-6">
            {/* Eyebrow element */}
            <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1 rounded-full bg-[#0047BA]/90 border border-white/15 text-[11px] sm:text-xs font-semibold tracking-wide text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000]" />
              <span>Tudo do seu condomínio em um só lugar</span>
            </div>

            {/* Main Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] font-extrabold tracking-tight text-white leading-[1.14]">
              Seu condomínio, <br />
              <span className="text-white">mais simples.</span>
            </h2>

            {/* Subtitle */}
            <p className="mt-2.5 text-xs sm:text-sm lg:text-[15px] text-blue-100/90 font-normal leading-relaxed max-w-lg">
              Gestão, serviços e convivência conectados em uma única plataforma.
            </p>

            {/* 3 Horizontal Cards (visible on tablet and desktop, hidden on compact mobile) */}
            <div className="mt-6 hidden sm:grid sm:grid-cols-3 gap-3 w-full">
              {/* CARD 1 — Ativo / Destacado */}
              <div className="bg-white text-slate-900 rounded-xl p-3.5 shadow-sm border border-white flex flex-col justify-between transition-transform duration-150">
                <div className="w-6 h-6 rounded-full bg-[#0055D4] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#FFD000] shrink-0">
                  1
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    Acesse seu condomínio
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                    Entre com sua conta.
                  </p>
                </div>
              </div>

              {/* CARD 2 — Secundário */}
              <div className="bg-[#0047BA]/80 text-white rounded-xl p-3.5 border border-white/15 flex flex-col justify-between backdrop-blur-xs">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  2
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xs font-bold text-white leading-snug">
                    Acompanhe tudo
                  </h3>
                  <p className="mt-0.5 text-[11px] text-blue-100/80 leading-normal">
                    Reservas, ocorrências e avisos.
                  </p>
                </div>
              </div>

              {/* CARD 3 — Secundário */}
              <div className="bg-[#0047BA]/80 text-white rounded-xl p-3.5 border border-white/15 flex flex-col justify-between backdrop-blur-xs">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  3
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xs font-bold text-white leading-snug">
                    Resolva com facilidade
                  </h3>
                  <p className="mt-0.5 text-[11px] text-blue-100/80 leading-normal">
                    Serviços e gestão em um só lugar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Area (~42% on desktop) */}
        <section className="bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 h-full overflow-y-auto">
          {/* Centered Form (65-75% width of right column) */}
          <div className="w-full max-w-[360px] sm:max-w-[380px] mx-auto my-auto py-2 sm:py-4">
            <div className="mb-6">
              <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight text-[#0F172A]">
                Bem-vindo de volta
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-normal leading-relaxed">
                Entre na sua conta para acessar o Zeladoria Cidades.
              </p>
            </div>

            <LoginForm demos={DEMOS} />
          </div>

          {/* SaaS Footer */}
          <footer className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed max-w-sm mx-auto">
              Ao continuar, você concorda com nossos{" "}
              <a
                href="#"
                className="text-slate-600 hover:text-[#0055D4] underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0055D4]"
              >
                Termos de Uso
              </a>{" "}
              e{" "}
              <a
                href="#"
                className="text-slate-600 hover:text-[#0055D4] underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0055D4]"
              >
                Política de Privacidade
              </a>
              .
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
