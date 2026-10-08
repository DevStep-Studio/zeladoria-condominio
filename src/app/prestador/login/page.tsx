import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { ProviderLoginForm, type ProviderDemo } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acesso do Prestador · Zeladoria Serviços",
  description: "Encontre novos clientes e gerencie seus serviços de condomínio.",
};

const DEMOS: ProviderDemo[] = [
  {
    email: "carlos@eletrica.com.br",
    name: "Carlos Eletricista",
    category: "Volt & Luz Soluções",
    role: "Prestador",
  },
  {
    email: "admin@portariamais.com.br",
    name: "Super Administrador",
    category: "Gestor Multi-Condomínio",
    role: "Super Admin",
  },
];

export default async function PrestadorLoginPage() {
  await ensureSeed();
  const session = await getSession();
  if (session && (session.vendorId || session.user.isSuperAdmin)) {
    redirect("/prestador");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <BrandLogo size="lg" variant="default" />
          </Link>
        </div>

        <h2 className="mt-6 text-center text-2xl font-black tracking-tight text-[#0F172A]">
          Área do Profissional
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Encontre novos clientes e gerencie seus serviços em tempo real.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-xs border border-slate-200 sm:rounded-2xl sm:px-10 space-y-6">
          <ProviderLoginForm demos={DEMOS} />

          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Ainda não é parceiro credenciado?
            </p>
            <Link
              href="/prestador/cadastro"
              className="inline-flex items-center justify-center w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              Cadastrar como prestador
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Voltar para o login de Moradores e Condomínios
          </Link>
        </div>
      </div>
    </div>
  );
}
