import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { dateTimeBR, money } from "@/lib/utils";
import {
  INTERNAL_BTN_NAVY_CLS,
  INTERNAL_BTN_PRIMARY_CLS,
  INTERNAL_BTN_SECONDARY_CLS,
  InternalPageHeader,
  InternalPageLayout,
  InternalSectionCard,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard da Plataforma · Admin Zeladoria",
  description: "Visão executiva do ecossistema Zeladoria: GMV, receita, condomínios, prestadores e indicadores de saúde.",
};

export default async function AdminDashboardPage() {
  const session = await requireSession();

  const {
    totalCondos = 0,
    totalUsers = 0,
    totalVendors = 0,
    totalTickets = 0,
    totalContracts = 0,
    financialStats,
    pendingOrdersCount = 0,
    openDisputesCount = 0,
    recentLogs = [],
  } = await domainRequest<{
    totalCondos: number;
    totalUsers: number;
    totalVendors: number;
    totalTickets: number;
    totalContracts: number;
    financialStats: { totalGmvCents?: number; totalFeeCents?: number } | null;
    pendingOrdersCount: number;
    openDisputesCount: number;
    recentLogs: any[];
  }>("/painel/admin");

  const gmvValue = money(financialStats?.totalGmvCents ?? 0);
  const revenueValue = money(financialStats?.totalFeeCents ?? 0);

  const kpis = [
    { label: "Condomínios Ativos", value: totalCondos, icon: "building" as IconName, href: "/painel/admin/condominios" },
    { label: "Usuários Cadastrados", value: totalUsers, icon: "users" as IconName, href: "/painel/admin/usuarios" },
    { label: "Prestadores Parceiros", value: totalVendors, icon: "briefcase" as IconName, href: "/painel/admin/prestadores" },
    { label: "Chamados na Fila", value: totalTickets, icon: "clipboard" as IconName, href: "/painel/chamados" },
    { label: "Contratações Realizadas", value: totalContracts, icon: "sparkles" as IconName, href: "/painel/admin/zeladoria-pay?tab=contratos" },
    { label: "GMV Processado", value: gmvValue, icon: "wallet" as IconName, href: "/painel/admin/zeladoria-pay" },
    { label: "Receita Zeladoria", value: revenueValue, icon: "chart" as IconName, href: "/painel/admin/marketplace/taxas" },
    { label: "Contestações Abertas", value: openDisputesCount, icon: "alert" as IconName, href: "/painel/admin/zeladoria-pay?tab=contestacoes", alert: openDisputesCount > 0 },
  ];

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="shield"
        title="Dashboard da Plataforma"
        subtitle="Métricas de negócio, receita, operação do marketplace e governança multi-condomínio."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Administração" },
        ]}
        badge={<InternalStatusBadge label="Ecossistema Zeladoria" tone="blue" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/painel/admin/integracoes" className={INTERNAL_BTN_SECONDARY_CLS}>
              <Icon name="settings" size={14} className="text-[#1455FF]" />
              <span>APIs & Integrações</span>
            </Link>
            <Link href="/painel/admin/zeladoria-pay" className={INTERNAL_BTN_PRIMARY_CLS}>
              <Icon name="wallet" size={14} />
              <span>Zeladoria Pay</span>
            </Link>
            <Link href="/painel/admin/marketplace" className={INTERNAL_BTN_NAVY_CLS}>
              <Icon name="briefcase" size={14} />
              <span>Marketplace</span>
            </Link>
          </div>
        }
      />

      {/* Grid de KPIs da Plataforma */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border transition-all shadow-[0_2px_10px_rgba(8,26,55,0.03)] hover:border-[#1455FF]/40 hover:shadow-[0_6px_18px_rgba(20,85,255,0.08)] ${
              kpi.alert ? "border-amber-300 bg-amber-50/30" : "border-[#E2E8F0]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526079] truncate">
                {kpi.label}
              </span>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                kpi.alert
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#EAF1FF] text-[#1455FF] group-hover:bg-[#1455FF] group-hover:text-white"
              }`}>
                <Icon name={kpi.icon} size={16} />
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="text-xl sm:text-2xl font-extrabold text-[#101828] tracking-tight tabular-nums">
                {kpi.value}
              </p>
              <Icon name="arrow-up-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Seção Operacional e Auditoria Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Módulos de Gestão Rápida */}
        <div className="lg:col-span-1">
          <InternalSectionCard
            title="Gestão Estratégica"
            subtitle="Acesso direto aos controles da plataforma"
          >
            <div className="space-y-2.5">
              <Link
                href="/painel/admin/condominios"
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#1455FF]">
                    <Icon name="building" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#101828] truncate">Condomínios</p>
                    <p className="text-[11px] text-[#526079] truncate">Planos, limites e novos cadastros</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
              </Link>

              <Link
                href="/painel/admin/marketplace"
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/70 text-amber-700">
                    <Icon name="sparkles" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#101828] truncate">Marketplace de Serviços</p>
                    <p className="text-[11px] text-[#526079] truncate">Aprovações, categorias e destaques</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
              </Link>

              <Link
                href="/painel/admin/zeladoria-pay"
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700">
                    <Icon name="wallet" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#101828] truncate">Zeladoria Pay & Split</p>
                    <p className="text-[11px] text-[#526079] truncate">Comissões, repasses e contestações</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
              </Link>

              <Link
                href="/painel/admin/permissoes"
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#081A37]">
                    <Icon name="key" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#101828] truncate">Permissões & RBAC</p>
                    <p className="text-[11px] text-[#526079] truncate">Matriz de acesso por papel</p>
                  </div>
                </div>
                <Icon name="chevron-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
              </Link>
            </div>
          </InternalSectionCard>
        </div>

        {/* Trilha de Auditoria Recente */}
        <div className="lg:col-span-2">
          <InternalSectionCard
            title="Auditoria em Tempo Real"
            subtitle="Últimos eventos críticos registrados no sistema"
            actions={
              <Link
                href="/painel/auditoria"
                className="text-xs font-bold text-[#1455FF] hover:underline flex items-center gap-1"
              >
                <span>Ver todos os logs</span>
                <Icon name="chevron-right" size={13} />
              </Link>
            }
          >
            <div className="divide-y divide-[#E2E8F0] -mx-5 -mb-5">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#526079]">
                  Nenhum log registrado recentemente.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#F5F8FC] transition-colors">
                    <span className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      log.critical
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-[#EAF1FF] text-[#1455FF]"
                    }`}>
                      <Icon name={log.critical ? "alert" : "activity"} size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#101828] leading-snug">
                        {log.summary || log.action}
                      </p>
                      <p className="text-[11px] text-[#526079] mt-0.5 truncate">
                        {log.userName ? `Usuário: ${log.userName} · ` : ""}
                        Entidade: {log.entity} #{log.entityId ?? "N/A"}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                      {dateTimeBR(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </InternalSectionCard>
        </div>
      </div>
    </InternalPageLayout>
  );
}
