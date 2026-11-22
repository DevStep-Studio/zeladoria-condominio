import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { getIntegrationsSummary, getRecentApiLogs } from "@/lib/services/integrations/usage-tracker";
import {
  INTERNAL_BTN_SECONDARY_CLS,
  InternalPageHeader,
  InternalPageLayout,
} from "@/components/internal/internal-ui";
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
    <InternalPageLayout>
      <InternalPageHeader
        icon="settings"
        title="Integrações de APIs Gratuitas"
        subtitle="Controle de consumo, limites de cotas diárias, telemetria e integridade dos serviços externos."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração", href: "/painel/admin" },
          { label: "APIs e Integrações" },
        ]}
        actions={
          <Link href="/painel/admin" className={INTERNAL_BTN_SECONDARY_CLS}>
            <Icon name="arrow-left" size={14} />
            <span>Voltar ao Painel</span>
          </Link>
        }
      />

      {/* Conteúdo Dinâmico com Monitoramento e Testes */}
      <IntegracoesClient initialStatusList={statusList} initialLogs={recentLogs} />
    </InternalPageLayout>
  );
}
