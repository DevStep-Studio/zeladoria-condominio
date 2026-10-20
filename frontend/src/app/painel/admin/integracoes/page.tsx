import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { getIntegrationsSummary, getRecentApiLogs } from "@/lib/services/integrations/usage-tracker";
import { IntegracoesClient } from "./integracoes-client";

export const metadata: Metadata = {
  title: "Monitoramento de APIs e Integrações | Zeladoria Condomínio",
  description: "Acompanhamento de consumo, cotas dos planos gratuitos, telemetria e testes de APIs reais.",
};

export const dynamic = "force-dynamic";

export default async function AdminIntegracoesPage() {
  await requireSession();

  const statusList = getIntegrationsSummary();
  const recentLogs = getRecentApiLogs();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho e Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/painel" className="hover:text-[#1355FF] transition-colors">
              Painel
            </Link>
            <span>/</span>
            <Link href="/painel/admin" className="hover:text-[#1355FF] transition-colors">
              Administração
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">APIs e Integrações</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#1355FF]">
              <Icon name="settings" size={20} />
            </span>
            <span>Integrações de APIs Gratuitas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Controle de consumo, limites de cotas diárias, telemetria e integridade dos serviços externos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/painel/admin"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Icon name="arrow-left" size={14} />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo Dinâmico com Monitoramento e Testes */}
      <IntegracoesClient initialStatusList={statusList} initialLogs={recentLogs} />
    </div>
  );
}
