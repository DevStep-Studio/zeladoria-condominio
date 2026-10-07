import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
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
    <main className="w-full min-h-screen lg:h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans antialiased selection:bg-[#0055D4] selection:text-white">
      {/* LEFT COLUMN: Clean Form taking full height, not centered in a floating box */}
      <section className="flex-1 w-full lg:w-[48%] xl:w-[45%] h-full flex flex-col justify-between px-6 sm:px-10 lg:px-12 xl:px-16 py-6 sm:py-8 overflow-y-auto">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none"
            aria-label="Zeladoria Condomínio"
          >
            <BrandLogo variant="default" size="md" />
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[11px] font-semibold border border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Plataforma 24h</span>
          </span>
        </div>

        {/* Form Content Area */}
        <div className="max-w-[400px] w-full mx-auto my-auto py-6 sm:py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-[36px] font-black text-[#0F172A] tracking-tight leading-[1.12]">
              Acesse seu <br />
              condomínio
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal">
              Controle de acessos, portaria e zeladoria
            </p>
          </div>

          {/* Interactive Form Component */}
          <LoginForm demos={DEMOS} />
        </div>

        {/* SaaS Footer */}
        <footer className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>© 2026 Zeladoria Cidades</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-[#0055D4] transition-colors">
              Termos
            </a>
            <span>·</span>
            <a href="#" className="hover:text-[#0055D4] transition-colors">
              Privacidade
            </a>
          </div>
        </footer>
      </section>

      {/* RIGHT COLUMN: Luxury Condominium Visual with Padding and Rounded Corners */}
      <section className="hidden lg:flex lg:w-[52%] xl:w-[55%] h-full p-3 sm:p-4 lg:p-5 xl:p-6 shrink-0 select-none">
        <div className="relative w-full h-full rounded-2xl lg:rounded-3xl xl:rounded-[32px] overflow-hidden shadow-sm group">
          {/* Photographic Image of the Condominium */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/condominio-login.jpg"
            alt="Fachada e área de lazer do Residencial Jardim Atlântico"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />

          {/* Subtle natural ambient overlay */}
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />

          {/* FLOATING MARKER 1: Top-Left (Condominium Name & City) */}
          <div className="absolute top-8 left-6 sm:left-8 z-20 flex flex-col items-start gap-1 group/m1 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/65 backdrop-blur-md text-white border border-white/20 shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shrink-0">
                <Icon name="building" size={16} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Condomínio</p>
                <h3 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight">
                  Residencial Jardim Atlântico
                </h3>
              </div>
            </div>
            {/* Pin line and pulse dot */}
            <div className="ml-7 flex flex-col items-center">
              <div className="w-[1.5px] h-7 bg-white/80" />
              <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-md ring-2 ring-[#0055D4]" />
              </div>
            </div>
          </div>

          {/* FLOATING MARKER 2: Middle-Right (Portaria & Zeladoria 24h) */}
          <div className="absolute top-[44%] right-6 sm:right-8 z-20 flex flex-col items-end gap-1 group/m2 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/65 backdrop-blur-md text-white border border-white/20 shadow-xl max-w-[260px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/30 text-emerald-300 shrink-0">
                <Icon name="shield" size={17} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Portaria & Zeladoria</p>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Acessos, encomendas e serviços 100% monitorados
                </p>
              </div>
            </div>
            {/* Pin line and pulse dot */}
            <div className="mr-8 flex flex-col items-center">
              <div className="w-[1.5px] h-8 bg-white/80" />
              <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-md ring-2 ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* FLOATING MARKER 3: Bottom Pathway (Acesso Seguro & Facial) */}
          <div className="absolute bottom-8 left-[30%] sm:left-[35%] z-20 flex flex-col items-center gap-1 group/m3 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <div className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-md ring-2 ring-[#0055D4]" />
            </div>
            <div className="w-[1.5px] h-6 bg-white/80" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs shadow-xl border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Acesso Seguro Moradores</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
