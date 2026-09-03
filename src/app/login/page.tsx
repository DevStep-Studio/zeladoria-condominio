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
    <main className="min-h-screen bg-white text-[var(--color-ink)] lg:h-screen lg:overflow-hidden">
      <section className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[45%_55%] xl:grid-cols-[42%_58%]">
        {/* Left Column: Login Form matching reference */}
        <div className="flex min-h-screen flex-col justify-between px-6 py-6 sm:px-10 lg:h-screen lg:min-h-0 lg:px-14 xl:px-20 z-10 bg-white">
          {/* Top Logo */}
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size="md" />
            </Link>
          </header>

          {/* Form Center Content */}
          <div className="my-auto py-6 w-full max-w-[420px] mx-auto">
            <div className="mb-6">
              <h1 className="text-[32px] font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-[36px]">
                Bem-vindo de volta
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">
                Entre na sua conta para acessar seus lançamentos e relatórios.
              </p>
            </div>

            <LoginForm demos={DEMOS} />
          </div>

          {/* Footer matching reference */}
          <footer className="flex items-center justify-between text-xs text-[var(--color-subtle)] font-medium pt-4 border-t border-[var(--color-line)] lg:border-t-0">
            <p>© 2026 Zeladoria Condomínio</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[var(--color-ink)] transition-colors">Privacidade</a>
              <a href="#" className="hover:text-[var(--color-ink)] transition-colors">Termos</a>
            </div>
          </footer>
        </div>

        {/* Right Column: Full Background Image Login.png covering 100% of the right side */}
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#0070F3] text-white lg:flex lg:flex-col lg:justify-between p-8 xl:p-12">
          {/* Full Cover Background Image */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Login.png"
              alt="Zeladoria Condomínio Background"
              className="h-full w-full object-cover object-center"
            />
            {/* Solid Dark Overlay for logo & headline readability (sem gradiente) */}
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          </div>

          {/* Top Right White Logo */}
          <div className="relative z-10 flex justify-end">
            <div className="rounded-xl bg-black/25 px-3.5 py-2 backdrop-blur-md border border-white/20 shadow-lg">
              <BrandLogo variant="white" size="md" />
            </div>
          </div>

          {/* Bottom Right Slogan matching reference typography */}
          <div className="relative z-10 flex justify-end text-right">
            <h2 className="text-[44px] font-black leading-[1.05] tracking-tight text-white xl:text-[56px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] max-w-lg">
              Organize <br />
              <span className="text-[#FAB800]">seu condomínio</span>
            </h2>
          </div>
        </aside>
      </section>
    </main>
  );
}
