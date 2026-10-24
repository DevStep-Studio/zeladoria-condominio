import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {

  const session = await getSession();
  if (session) redirect(session.role === "prestador" ? "/prestador" : "/painel");

  return (
    <main className="w-full min-h-screen lg:h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans antialiased selection:bg-[#1355FF] selection:text-white">
      {/* LEFT COLUMN: Clean Form taking full height, not centered in a floating box */}
      <section className="flex-1 w-full lg:w-[48%] xl:w-[45%] h-full flex flex-col justify-between px-4 sm:px-10 lg:px-12 xl:px-16 py-6 sm:py-8 overflow-y-auto">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none"
            aria-label="Zeladoria Condomínio"
          >
            <BrandLogo variant="default" size="lg" />
          </Link>
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
          <LoginForm />
        </div>

        {/* SaaS Footer */}
        <footer className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>© 2026 Zeladoria Cidades</span>
          <div className="flex items-center gap-3">
            <Link href="/termos" className="hover:text-[#1355FF] transition-colors">
              Termos
            </Link>
            <span>·</span>
            <Link href="/privacidade" className="hover:text-[#1355FF] transition-colors">
              Privacidade
            </Link>
          </div>
        </footer>
      </section>

      {/* RIGHT COLUMN: Condominium Visual with Blue Brand Treatment and Centered Logo */}
      <section className="hidden lg:flex lg:w-[52%] xl:w-[55%] h-full p-3 sm:p-4 lg:p-5 xl:p-6 shrink-0 select-none">
        <div className="relative w-full h-full rounded-2xl lg:rounded-3xl xl:rounded-[32px] overflow-hidden shadow-sm group bg-[#1355FF]">
          {/* Photographic Image of the Condominium with Blue Brand Overlay and Centered Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/condominio-login-azul.png"
            alt="Zeladoria Condomínio"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </div>
      </section>
    </main>
  );
}
