import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requirePermission } from "@/lib/auth";
import { Card, EmptyState, StatCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { addDays, isoDate, money } from "@/lib/utils";
import {
  INTERNAL_BTN_PRIMARY_CLS,
  InternalPageHeader,
  InternalPageLayout,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const { condoId } = await requirePermission("report.view");
  const today = isoDate();
  const expiringUntil = isoDate(addDays(45));

  const { tx, overdue, lateMaint, expiring } = await domainRequest<{
    tx: any[];
    overdue: { n: number; total: number };
    lateMaint: { n: number };
    expiring: { n: number };
  }>("/painel/relatorios", { query: { condoId, today, expiringUntil } });
  const income = tx.filter((t) => t.kind === "receita").reduce((a, t) => a + t.amount, 0);
  const expense = tx.filter((t) => t.kind === "despesa").reduce((a, t) => a + t.amount, 0);

  const hubs: { href: string; title: string; desc: string; icon: IconName; export?: string }[] = [
    { href: "/painel/relatorios/eficiencia", title: "Eficiência Operacional", desc: "TMA, satisfação (CSAT), taxa de resolução e SLA de prestadores.", icon: "star" },
    { href: "/painel/financeiro", title: "Prestação de contas", desc: "Receitas, despesas, orçado x realizado e inadimplência.", icon: "wallet", export: "financeiro" },
    { href: "/painel/manutencao", title: "Manutenção", desc: "Equipamentos, planos preventivos, custos e falhas.", icon: "wrench" },
    { href: "/painel/fornecedores", title: "Contratos", desc: "Vigências, reajustes e vencimentos.", icon: "briefcase", export: "contratos" },
    { href: "/painel/auditoria", title: "Auditoria", desc: "Trilha completa de ações e acessos.", icon: "lock", export: "auditoria" },
  ];

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="chart"
        title="Relatórios"
        subtitle="Indicadores consolidados e exportações para prestação de contas e gestão."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Relatórios" },
        ]}
        actions={
          <a href="/api/export/financeiro" download className={INTERNAL_BTN_PRIMARY_CLS}>
            <Icon name="download" size={15} />
            <span>Exportar contas</span>
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Receitas" value={money(income)} icon="wallet" href="/painel/financeiro" tone="yellow" />
        <StatCard label="Despesas" value={money(expense)} icon="wallet" href="/painel/financeiro" tone="blue" />
        <StatCard label="Inadimplência" value={money(overdue.total)} icon="alert" hint={`${overdue.n} cobranças vencidas`} tone="blue" />
        <StatCard label="Contratos a vencer" value={expiring.n} icon="briefcase" hint="próximos 45 dias" tone="blue" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hubs.map((h) => (
          <Card key={h.href} className="hover:border-[#1455FF]/35 transition-colors">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                <Icon name={h.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#101828]">{h.title}</p>
                <p className="mt-0.5 text-xs text-[#526079]">{h.desc}</p>
                <div className="mt-3 flex items-center gap-4">
                  <Link href={h.href} className="text-xs font-bold text-[#1455FF] hover:underline">Abrir módulo</Link>
                  {h.export ? (
                    <a href={`/api/export/${h.export}`} download className="inline-flex items-center gap-1 text-xs font-bold text-[#526079] hover:text-[#1455FF]">
                      <Icon name="download" size={13} />
                      <span>CSV</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <EmptyState
          title="Exportações adicionais"
          description="Moradores, visitantes, encomendas e ocorrências podem ser exportados em CSV nas respectivas páginas."
          icon="download"
        />
      </div>
    </InternalPageLayout>
  );
}
