import Link from "next/link";
import { Icon } from "@/components/icon";
import { OnboardingWizard } from "./onboarding-wizard";
import { db } from "@/db";
import { condominiums } from "@/db/schema";

export const metadata = {
  title: "Cadastro de Prestador · Zeladoria Serviços",
  description: "Cadastre-se como prestador parceiro e atenda condomínios da sua região.",
};

export default async function PrestadorCadastroPage() {
  const condos = await db
    .select({ id: condominiums.id, name: condominiums.name, city: condominiums.city })
    .from(condominiums);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0055D4] text-white shadow-xs">
              <Icon name="briefcase" size={18} />
            </span>
            <div>
              <span className="text-base font-black text-[#0F172A] tracking-tight">
                Zeladoria <span className="text-[#0055D4]">Prestadores</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Onboarding de Credenciamento Profissional
              </p>
            </div>
          </div>

          <Link
            href="/prestador/login"
            className="text-xs font-bold text-[#0055D4] hover:underline"
          >
            Já é parceiro? Entrar
          </Link>
        </div>

        {/* Wizard Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs">
          <OnboardingWizard condos={condos} />
        </div>

        {/* Help footer */}
        <div className="text-center text-xs text-slate-400">
          Dúvidas sobre o credenciamento? Entre em contato pelo e-mail suporte@zeladoriacondominio.com.br
        </div>
      </div>
    </div>
  );
}
