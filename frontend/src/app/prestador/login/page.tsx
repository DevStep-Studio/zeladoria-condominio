import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { ProviderLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acesso do Prestador · Tião Parceiros",
  description: "Encontre novos clientes e gerencie seus serviços de condomínio no Tião Parceiros.",
};

export default async function PrestadorLoginPage() {

  const session = await getSession();
  if (session && (session.vendorId || session.user.isSuperAdmin)) {
    redirect("/prestador");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header Tião Parceiros (Prompt Item 25) */}
        <div className="flex justify-center items-center">
          <Link href="/prestador" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FB6B01] p-2 shadow-sm border border-[#E05F00]">
              <img
                src="/brands/tiao/mascot-white.png"
                alt="Tião Parceiros"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>
        </div>

        <h2 className="mt-5 text-center text-2xl font-black tracking-tight text-[#0F172A]">
          Bem-vindo ao Tião Parceiros
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Encontre oportunidades e gerencie seus atendimentos.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-xs border border-slate-200 sm:rounded-2xl sm:px-10 space-y-6">
          <ProviderLoginForm />

          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Ainda não é parceiro credenciado?
            </p>
            <Link
              href="/prestador/cadastro"
              className="inline-flex items-center justify-center w-full rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 py-2.5 text-xs font-bold text-[#FB6B01] transition-colors cursor-pointer"
            >
              Cadastrar como prestador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
