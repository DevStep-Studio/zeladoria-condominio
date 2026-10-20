import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { dateTimeBR, money } from "@/lib/utils";

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
    <div className="space-y-6">
      {/* Header do Dashboard da Plataforma */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#1355FF] text-[11px] font-bold mb-1">
            <Icon name="shield" size={13} />
            <span>Ecossistema Zeladoria</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard da Plataforma
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de negócio, receita, operação do marketplace e governança multi-condomínio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/painel/admin/zeladoria-pay"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-2xs"
          >
            <Icon name="wallet" size={14} />
            <span>Zeladoria Pay</span>
          </Link>
          <Link
            href="/painel/admin/marketplace"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Icon name="briefcase" size={14} />
            <span>Marketplace</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs da Plataforma */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`p-4 rounded-[12px] bg-white border transition-all hover:border-slate-300 shadow-2xs group ${
              kpi.alert ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                {kpi.label}
              </span>
              <span className="p-1.5 rounded-[6px] bg-slate-50 group-hover:bg-blue-50 group-hover:text-[#1355FF] transition-colors">
                <Icon name={kpi.icon} size={15} />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {kpi.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Seção Operacional e Auditoria Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Módulos de Gestão Rápida */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Gestão Estratégica
          </h2>
          <div className="space-y-2">
            <Link
              href="/painel/admin/condominios"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-[8px] bg-blue-50 text-[#1355FF]">
                  <Icon name="building" size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Condomínios</p>
                  <p className="text-[11px] text-slate-500">Planos, limites e novos cadastros</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-slate-700" />
            </Link>

            <Link
              href="/painel/admin/marketplace"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-[8px] bg-amber-50 text-amber-700">
                  <Icon name="sparkles" size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Marketplace de Serviços</p>
                  <p className="text-[11px] text-slate-500">Aprovações, categorias e destaques</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-slate-700" />
            </Link>

            <Link
              href="/painel/admin/zeladoria-pay"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-[8px] bg-emerald-50 text-emerald-700">
                  <Icon name="wallet" size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Zeladoria Pay & Split</p>
                  <p className="text-[11px] text-slate-500">Comissões, repasses e contestações</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-slate-700" />
            </Link>

            <Link
              href="/painel/admin/permissoes"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-[8px] bg-purple-50 text-purple-700">
                  <Icon name="key" size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Permissões & RBAC</p>
                  <p className="text-[11px] text-slate-500">Matriz de acesso por papel</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-slate-700" />
            </Link>
          </div>
        </div>

        {/* Trilha de Auditoria Recente */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Auditoria em Tempo Real
            </h2>
            <Link
              href="/painel/auditoria"
              className="text-[11px] font-bold text-[#1355FF] hover:underline"
            >
              Ver todos os logs
            </Link>
          </div>

          <div className="rounded-[12px] bg-white border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum log registrado recentemente.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <span className={`p-1.5 rounded-[6px] shrink-0 mt-0.5 ${
                    log.critical ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Icon name={log.critical ? "alert" : "activity"} size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {log.summary || log.action}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {log.userName ? `Usuário: ${log.userName} · ` : ""}
                      Entidade: {log.entity} #{log.entityId ?? "N/A"}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {dateTimeBR(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
