"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  adminUpdateMarketplaceSettingsAction,
  adminResolveDisputeAction,
} from "@/lib/actions/zeladoria-pay";

export type ZeladoriaPayTabKey =
  | "overview"
  | "payments"
  | "inspections"
  | "payouts"
  | "commissions"
  | "refunds"
  | "disputes"
  | "recipients"
  | "settings"
  | "simulator";

export function normalizeTab(tabParam?: string | null): ZeladoriaPayTabKey {
  if (!tabParam) return "overview";
  const t = tabParam.toLowerCase().trim();
  if (["visao-geral", "visao_geral", "overview"].includes(t)) return "overview";
  if (["pagamentos", "payments", "ordens"].includes(t)) return "payments";
  if (["vistorias", "vistorias-pagas", "inspections"].includes(t)) return "inspections";
  if (["repasses", "split", "payouts"].includes(t)) return "payouts";
  if (["comissoes", "comissao", "commissions", "taxas"].includes(t)) return "commissions";
  if (["reembolsos", "reembolso", "refunds", "estornos"].includes(t)) return "refunds";
  if (["contestacoes", "contestacao", "disputes", "disputas"].includes(t)) return "disputes";
  if (["prestadores", "prestadores-financeiros", "onboarding", "recipients", "contas"].includes(t)) return "recipients";
  if (["configuracoes", "settings", "flags", "regras"].includes(t)) return "settings";
  if (["simulador", "simulator"].includes(t)) return "simulator";
  return "overview";
}

export function ZeladoriaPayAdminClient({
  condoId,
  settings,
  orders = [],
  disputes = [],
  payouts = [],
  recipients = [],
  paidInspections = [],
  initialTab,
}: {
  condoId: number;
  settings: any;
  orders: any[];
  disputes: any[];
  payouts: any[];
  recipients: any[];
  paidInspections: any[];
  initialTab?: string;
}) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || initialTab;
  const currentTab = normalizeTab(tabFromUrl);
  const [activeTab, setActiveTab] = useState<ZeladoriaPayTabKey>(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Form states para configurações
  const [commission, setCommission] = useState(settings.commissionPercent);
  const [visitCommission, setVisitCommission] = useState(settings.visitCommissionPercent || 0);
  const [holdMinutes, setHoldMinutes] = useState(settings.slotHoldMinutes || 10);
  const [maxInspectionVal, setMaxInspectionVal] = useState(((settings.inspectionFeeMaxCents || 15000) / 100).toFixed(2));
  const [disputeHours, setDisputeHours] = useState(settings.disputeWindowHours || 48);
  const [autoReleaseHours, setAutoReleaseHours] = useState(settings.autoReleaseHours || 72);
  const [feePayer, setFeePayer] = useState(settings.processingFeePayer || "PROVIDER");

  // Feature Flags
  const [paymentsEnabled, setPaymentsEnabled] = useState(settings.paymentsEnabled ?? true);
  const [paidVisitsEnabled, setPaidVisitsEnabled] = useState(settings.paidVisitsEnabled ?? true);
  const [pixEnabled, setPixEnabled] = useState(settings.pixEnabled ?? true);
  const [cardEnabled, setCardEnabled] = useState(settings.cardEnabled ?? true);
  const [installmentsEnabled, setInstallmentsEnabled] = useState(settings.installmentsEnabled ?? false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(settings.payoutsEnabled ?? true);
  const [zeladoriaProtegeEnabled, setZeladoriaProtegeEnabled] = useState(settings.zeladoriaProtegeEnabled ?? true);

  // Estados do Simulador
  const [simServiceVal, setSimServiceVal] = useState(1000);
  const [simCommissionPercent, setSimCommissionPercent] = useState(10);
  const [simPspFeePercent, setSimPspFeePercent] = useState(3.5);
  const [simFeePayer, setSimFeePayer] = useState<"PROVIDER" | "PLATFORM" | "SHARED">("PROVIDER");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Métricas Consolidadas (Cláusula 56)
  const approvedOrders = orders.filter(
    (o) => o.status === "paid" || o.status === "retained" || o.status === "released"
  );

  const totalGMVCents = approvedOrders.reduce((acc, o) => acc + (o.amountGrossCents || 0), 0);
  const totalRevenueZeladoriaCents = approvedOrders.reduce((acc, o) => acc + (o.platformFeeCents || 0), 0);
  const totalPayoutsReleasedCents = approvedOrders
    .filter((o) => o.status === "released")
    .reduce((acc, o) => acc + (o.netVendorCents || 0), 0);
  const totalRefundedCents = orders
    .filter((o) => o.status === "refunded")
    .reduce((acc, o) => acc + (o.amountGrossCents || 0), 0);

  // Listas especializadas para Comissões e Reembolsos
  const commissionOrders = orders.filter(
    (o) => (o.platformFeeCents || 0) > 0 || ["paid", "retained", "released"].includes(o.status)
  );

  const refundedOrders = orders.filter(
    (o) => o.status === "refunded" || o.status === "estornado" || (o.refundedAmountCents && o.refundedAmountCents > 0)
  );

  const totalCommissionsCents = commissionOrders.reduce(
    (acc, o) => acc + (o.platformFeeCents || 0),
    0
  );

  const totalCommissionsGrossCents = commissionOrders.reduce(
    (acc, o) => acc + (o.amountGrossCents || 0),
    0
  );

  const totalRefundedSumCents = refundedOrders.reduce(
    (acc, o) => acc + (o.refundedAmountCents || o.amountGrossCents || 0),
    0
  );

  const navTabs = [
    { id: "overview", label: "Visão Geral", href: "/painel/admin/zeladoria-pay" },
    { id: "payments", label: `Pagamentos (${orders.length})`, href: "/painel/admin/zeladoria-pay?tab=pagamentos" },
    { id: "inspections", label: `Vistorias Pagas (${paidInspections.length})`, href: "/painel/admin/zeladoria-pay?tab=vistorias" },
    { id: "payouts", label: `Repasses / Split (${payouts.length})`, href: "/painel/admin/zeladoria-pay?tab=repasses" },
    { id: "commissions", label: `Comissões (${commissionOrders.length})`, href: "/painel/admin/zeladoria-pay?tab=comissoes" },
    { id: "refunds", label: `Reembolsos (${refundedOrders.length})`, href: "/painel/admin/zeladoria-pay?tab=reembolsos" },
    { id: "disputes", label: `Contestações (${disputes.filter((d) => d.status === "aberta").length})`, href: "/painel/admin/zeladoria-pay?tab=contestacoes" },
    { id: "recipients", label: `Prestadores Financeiros (${recipients.length})`, href: "/painel/admin/zeladoria-pay?tab=prestadores" },
    { id: "settings", label: "Configurações & Flags", href: "/painel/admin/zeladoria-pay?tab=configuracoes" },
    { id: "simulator", label: "Simulador Financeiro", href: "/painel/admin/zeladoria-pay?tab=simulador" },
  ];

  // Cálculos do simulador
  const simPlatformFee = (simServiceVal * simCommissionPercent) / 100;
  const simPspFee = (simServiceVal * simPspFeePercent) / 100;
  const simNetVendor =
    simFeePayer === "PROVIDER"
      ? simServiceVal - simPlatformFee - simPspFee
      : simFeePayer === "SHARED"
      ? simServiceVal - simPlatformFee - simPspFee / 2
      : simServiceVal - simPlatformFee;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSavedSuccess(false);

    startTransition(async () => {
      const maxCents = Math.round(parseFloat(maxInspectionVal || "0") * 100);
      const res = await adminUpdateMarketplaceSettingsAction({
        commissionPercent: Number(commission),
        slotHoldMinutes: Number(holdMinutes),
        inspectionFeeMaxCents: maxCents,
        disputeWindowHours: Number(disputeHours),
        autoReleaseHours: Number(autoReleaseHours),
      });

      if (res?.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMsg(res?.error || "Erro ao salvar configurações.");
      }
    });
  };

  const handleResolveDispute = (
    disputeId: number,
    action: "release_payout" | "refund_customer" | "rework"
  ) => {
    const actionLabel =
      action === "release_payout"
        ? "liberar o repasse ao prestador"
        : action === "refund_customer"
        ? "reembolsar integralmente o morador"
        : "solicitar retrabalho em garantia";

    if (!confirm(`Confirma a mediação para ${actionLabel}?`)) return;

    startTransition(async () => {
      const res = await adminResolveDisputeAction({ disputeId, action });
      if (res?.success) {
        alert("Contestação mediada e resolvida com sucesso!");
        window.location.reload();
      } else {
        alert(('error' in res ? res.error : undefined) || "Erro ao mediar contestação.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-[#1355FF] text-white flex items-center justify-center font-black shadow-xs">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Zeladoria Pay
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestão financeira completa de serviços, split, taxas, repasses e contestação.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/painel/servicos"
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
          >
            ← Painel de Chamados
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold text-slate-600">
        {navTabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                isActive ? "bg-[#1355FF] text-white shadow-xs" : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* TAB 1: VISÃO GERAL (DASHBOARD REAL - Cláusula 56) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Cards de Métricas Reais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Volume Transacionado (GMV)
              </span>
              <div className="text-2xl font-black text-slate-900">
                R$ {(totalGMVCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {approvedOrders.length} pagamentos aprovados
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-[#1355FF] uppercase tracking-wider block">
                Receita da Zeladoria (Comissão)
              </span>
              <div className="text-2xl font-black text-[#1355FF]">
                R$ {(totalRevenueZeladoriaCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Retenção média de {settings.commissionPercent}% sobre os serviços
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Repasses aos Prestadores
              </span>
              <div className="text-2xl font-black text-emerald-700">
                R$ {(totalPayoutsReleasedCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Split liquidado após confirmação dos moradores
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Contestações / Reembolsos
              </span>
              <div className="text-2xl font-black text-rose-700">
                R$ {(totalRefundedCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {disputes.filter((d) => d.status === "aberta").length} disputas aguardando resolução
              </p>
            </div>
          </div>

          {/* Destaque Zeladoria Protege */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-[#1355FF] text-white flex items-center justify-center font-black shrink-0">
                <Icon name="shield" size={20} />
              </span>
              <div>
                <strong className="text-sm font-black block">Proteção Zeladoria Protege Ativa</strong>
                <p className="text-blue-700 mt-0.5">
                  Os pagamentos permanecem sob retenção e são liberados aos profissionais apenas após o morador confirmar "Tudo Certo!".
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="px-4 py-2 rounded-xl bg-white border border-blue-200 text-[#1355FF] font-black hover:bg-blue-100/50 cursor-pointer text-xs shrink-0"
            >
              Ajustar Regras
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PAGAMENTOS */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900">Histórico de Ordens Financeiras</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">Código</th>
                    <th className="py-2.5">Finalidade</th>
                    <th className="py-2.5">Prestador</th>
                    <th className="py-2.5">Bruto</th>
                    <th className="py-2.5">Comissão</th>
                    <th className="py-2.5">Líquido Prestador</th>
                    <th className="py-2.5">Método</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Nenhum pagamento registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{o.code}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              o.purpose === "vistoria"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {o.purpose === "vistoria" ? "Vistoria Técnica" : "Serviço Principal"}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium">{o.vendorName || "Prestador"}</td>
                        <td className="py-2.5 font-bold text-slate-900">
                          R$ {((o.amountGrossCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          R$ {((o.platformFeeCents || 0) / 100).toFixed(2)} ({o.commissionPercent}%)
                        </td>
                        <td className="py-2.5 font-bold text-emerald-700">
                          R$ {((o.netVendorCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-bold">{o.billingType}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === "released" || o.status === "paid"
                                ? "bg-emerald-100 text-emerald-900"
                                : o.status === "retained"
                                ? "bg-blue-100 text-blue-900"
                                : o.status === "in_dispute"
                                ? "bg-rose-100 text-rose-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISTORIAS PAGAS */}
      {activeTab === "inspections" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900">Vistorias Técnicas Remuneradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">ID Chamado</th>
                    <th className="py-2.5">Valor da Vistoria</th>
                    <th className="py-2.5">Abater do Serviço</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Data Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paidInspections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Nenhuma vistoria técnica paga registrada.
                      </td>
                    </tr>
                  ) : (
                    paidInspections.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-bold text-slate-900">#{i.requestId}</td>
                        <td className="py-2.5 font-bold text-slate-900">
                          R$ {((i.priceCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5">
                          {i.discountOnService ? (
                            <span className="text-emerald-700 font-bold">Sim (Abatido)</span>
                          ) : (
                            <span className="text-slate-400">Não</span>
                          )}
                        </td>
                        <td className="py-2.5 font-bold">{i.status}</td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(i.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPASSES / PAYOUTS */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900">Repasses aos Profissionais (Payouts)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">ID Payout</th>
                    <th className="py-2.5">Prestador ID</th>
                    <th className="py-2.5">Valor Bruto</th>
                    <th className="py-2.5">Comissão Retida</th>
                    <th className="py-2.5">Líquido a Transferir</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Data Liberação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Nenhum repasse registrado no banco.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-bold text-slate-900">#{p.id}</td>
                        <td className="py-2.5 font-medium">#{p.vendorId}</td>
                        <td className="py-2.5">R$ {((p.grossAmountCents || 0) / 100).toFixed(2)}</td>
                        <td className="py-2.5 text-slate-500">
                          R$ {((p.platformFeeCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-700">
                          R$ {((p.netAmountCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              p.status === "PAID"
                                ? "bg-emerald-100 text-emerald-900"
                                : p.status === "BLOCKED_DISPUTE"
                                ? "bg-rose-100 text-rose-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "Aguardando confirmação"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: COMISSÕES */}
      {activeTab === "commissions" && (
        <div className="space-y-6">
          {/* Header e KPIs de Comissões */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-blue-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-[#1355FF] uppercase tracking-wider block">
                Receita Total de Comissões
              </span>
              <div className="text-2xl font-black text-[#1355FF]">
                R$ {(totalCommissionsCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Retenções efetivadas pela plataforma
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Volume Intermediado (GMV)
              </span>
              <div className="text-2xl font-black text-slate-900">
                R$ {(totalCommissionsGrossCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Base bruta transacionada
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Alíquota Configurada
              </span>
              <div className="text-2xl font-black text-slate-900">
                {settings.commissionPercent}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Retenção padrão sobre contratos
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Transações Comissionadas
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {commissionOrders.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {commissionOrders.length === 1 ? "1 pedido comissionado" : `${commissionOrders.length} pedidos comissionados`}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Extrato de Comissões e Retenções
                </h2>
                <p className="text-xs text-slate-500">
                  Transações com cobrança de taxa de intermediação para a Zeladoria Condomínio.
                </p>
              </div>
              <Link
                href="/painel/admin/zeladoria-pay?tab=configuracoes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs w-fit"
              >
                <Icon name="settings" size={13} />
                <span>Ajustar Taxa ({settings.commissionPercent}%)</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">Código</th>
                    <th className="py-2.5">Finalidade</th>
                    <th className="py-2.5">Prestador</th>
                    <th className="py-2.5">GMV Bruto</th>
                    <th className="py-2.5">Alíquota</th>
                    <th className="py-2.5">Comissão Zeladoria</th>
                    <th className="py-2.5">Líquido Prestador</th>
                    <th className="py-2.5">Método</th>
                    <th className="py-2.5">Status Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Icon name="chart" size={18} />
                          </span>
                          <span className="font-medium">Nenhuma comissão retida até o momento.</span>
                          <span className="text-[11px] text-slate-400">
                            As comissões aparecem automaticamente quando serviços ou vistorias são pagos.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    commissionOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{o.code}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              o.purpose === "vistoria"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {o.purpose === "vistoria" ? "Vistoria Técnica" : "Serviço Principal"}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium">{o.vendorName || "Prestador"}</td>
                        <td className="py-2.5 font-bold text-slate-900">
                          R$ {((o.amountGrossCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-mono text-slate-500">
                          {o.commissionPercent ?? settings.commissionPercent}%
                        </td>
                        <td className="py-2.5 font-black text-[#1355FF]">
                          R$ {((o.platformFeeCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-700">
                          R$ {((o.netVendorCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 font-bold">{o.billingType}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === "released" || o.status === "paid"
                                ? "bg-emerald-100 text-emerald-900"
                                : o.status === "retained"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {o.status === "released" ? "Liquidada" : o.status === "retained" ? "Retida (Protege)" : o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REEMBOLSOS */}
      {activeTab === "refunds" && (
        <div className="space-y-6">
          {/* Header e KPIs de Reembolsos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Total Estornado / Devolvido
              </span>
              <div className="text-2xl font-black text-rose-700">
                R$ {(totalRefundedSumCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Valores estornados a condôminos
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transações Estornadas
              </span>
              <div className="text-2xl font-black text-slate-900">
                {refundedOrders.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {refundedOrders.length === 1 ? "1 caso de estorno" : `${refundedOrders.length} casos de estorno`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Contestações Resolvidas
              </span>
              <div className="text-2xl font-black text-slate-900">
                {disputes.filter((d) => d.status === "resolvida").length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Mediações concluídas com sucesso
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-[#1355FF] uppercase tracking-wider block">
                Cobertura Zeladoria Protege
              </span>
              <div className="text-2xl font-black text-[#1355FF]">
                100%
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Garantia contra serviços não executados
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Histórico de Estornos & Devoluções
                </h2>
                <p className="text-xs text-slate-500">
                  Cancelamentos e reembolsos processados via Pix ou estorno no cartão de crédito.
                </p>
              </div>
              <Link
                href="/painel/admin/zeladoria-pay?tab=contestacoes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs w-fit"
              >
                <Icon name="alert" size={13} />
                <span>Ver Contestações ({disputes.filter((d) => d.status === "aberta").length})</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">Código</th>
                    <th className="py-2.5">Finalidade</th>
                    <th className="py-2.5">Prestador</th>
                    <th className="py-2.5">Valor Estornado</th>
                    <th className="py-2.5">Motivo / Origem</th>
                    <th className="py-2.5">Método</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Data Estorno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Icon name="x-circle" size={18} />
                          </span>
                          <span className="font-medium">Nenhum reembolso ou estorno registrado no momento.</span>
                          <span className="text-[11px] text-slate-400">
                            Os pagamentos permanecem sob retenção do Zeladoria Protege e são estornados em caso de cancelamento.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    refundedOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{o.code}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800">
                            {o.purpose === "vistoria" ? "Vistoria" : "Serviço"}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium">{o.vendorName || "Prestador"}</td>
                        <td className="py-2.5 font-bold text-rose-700">
                          R$ {((o.amountGrossCents || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {o.refundReason || "Cancelamento / Mediação"}
                        </td>
                        <td className="py-2.5 font-bold">{o.billingType}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                            Estornado
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500 font-mono">
                          {o.refundedAt ? new Date(o.refundedAt).toLocaleDateString("pt-BR") : "Concluído"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONTESTAÇÕES / DISPUTAS */}
      {activeTab === "disputes" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900">Mediação de Chamados em Contestação</h2>
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nenhuma contestação aberta no condomínio.
                </div>
              ) : (
                disputes.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900">Disputa #{d.id} — Chamado #{d.requestId}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold text-[10px]">
                          {d.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">Motivo: {d.reason}</strong>
                      <p className="text-slate-700 mt-1">{d.description}</p>
                    </div>
                    <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-rose-800 font-medium">
                      <span>Repasse bloqueado preventivamente sob Zeladoria Protege</span>
                      <div className="flex items-center gap-2">
                        {d.status === "aberta" ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleResolveDispute(d.id, "release_payout")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow-xs transition-colors"
                            >
                              Liberar Repasse
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleResolveDispute(d.id, "refund_customer")}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer shadow-xs transition-colors"
                            >
                              Reembolsar Morador
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleResolveDispute(d.id, "rework")}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] cursor-pointer transition-colors"
                            >
                              Retrabalho
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                            Resolvida
                          </span>
                        )}
                        <Link href={`/painel/servicos`} className="font-bold underline text-rose-900 ml-1">
                          Ver Chamado
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRESTADORES FINANCEIROS (KYC / RECEBEDORES) */}
      {activeTab === "recipients" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-slate-900">Contas Financeiras Vinculadas (Subcontas PSP)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2.5">Prestador</th>
                    <th className="py-2.5">Tipo</th>
                    <th className="py-2.5">Provedor PSP</th>
                    <th className="py-2.5">Chave Pix / Identificador</th>
                    <th className="py-2.5">Status KYC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Nenhum prestador configurado com conta financeira.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-bold text-slate-900">
                          {r.vendorCompany || r.vendorName || `Prestador #${r.vendorId}`}
                        </td>
                        <td className="py-2.5">{r.accountType}</td>
                        <td className="py-2.5 font-bold text-[#1355FF]">{r.pspProvider}</td>
                        <td className="py-2.5 font-mono">{r.pixKey || r.pspAccountId}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "active" || r.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CONFIGURAÇÕES & FEATURE FLAGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900">Configuração de Taxas e Prazos</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Comissão do Serviço (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Comissão da Vistoria (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={visitCommission}
                  onChange={(e) => setVisitCommission(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teto Máximo de Vistoria (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxInspectionVal}
                  onChange={(e) => setMaxInspectionVal(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reserva Temporária do Slot (Minutos)</label>
                <input
                  type="number"
                  value={holdMinutes}
                  onChange={(e) => setHoldMinutes(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prazo de Contestação do Morador (Horas)</label>
                <input
                  type="number"
                  value={disputeHours}
                  onChange={(e) => setDisputeHours(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Liberação Preventiva Sem Contestação (Horas)</label>
                <input
                  type="number"
                  value={autoReleaseHours}
                  onChange={(e) => setAutoReleaseHours(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Feature Flags (Cláusula 68) */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Feature Flags de Liberação Gradual
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentsEnabled}
                    onChange={(e) => setPaymentsEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Pagamentos Online Habilitados</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paidVisitsEnabled}
                    onChange={(e) => setPaidVisitsEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Vistorias Pagas Habilitadas</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixEnabled}
                    onChange={(e) => setPixEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Pix Habilitado</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cardEnabled}
                    onChange={(e) => setCardEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Cartão de Crédito Habilitado</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zeladoriaProtegeEnabled}
                    onChange={(e) => setZeladoriaProtegeEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Zeladoria Protege Ativo</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payoutsEnabled}
                    onChange={(e) => setPayoutsEnabled(e.target.checked)}
                    className="rounded text-[#1355FF]"
                  />
                  <span>Repasses (Payouts) Habilitados</span>
                </label>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                ✓ Configurações e taxas atualizadas com sucesso!
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-[#1355FF] hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                {isPending ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 8: SIMULADOR FINANCEIRO (Cláusula 57) */}
      {activeTab === "simulator" && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">Simulador Financeiro de Contratação</h2>
            <p className="text-xs text-slate-500 font-medium">
              * VALORES SIMULADOS. Esta ferramenta serve para projetar splits e custos antes de configurar taxas oficiais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Valor do Serviço (R$)</label>
              <input
                type="number"
                value={simServiceVal}
                onChange={(e) => setSimServiceVal(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Comissão Zeladoria (%)</label>
              <input
                type="number"
                value={simCommissionPercent}
                onChange={(e) => setSimCommissionPercent(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Taxa Estimada PSP (%)</label>
              <input
                type="number"
                step="0.1"
                value={simPspFeePercent}
                onChange={(e) => setSimPspFeePercent(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Quem paga a taxa PSP?</label>
              <select
                value={simFeePayer}
                onChange={(e) => setSimFeePayer(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="PROVIDER">Prestador (Padrão)</option>
                <option value="PLATFORM">Plataforma (Zeladoria)</option>
                <option value="SHARED">Compartilhado (50/50)</option>
              </select>
            </div>
          </div>

          {/* Resultado da Simulação */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Cliente Paga</span>
              <strong className="text-base text-slate-900 font-black">
                R$ {simServiceVal.toFixed(2)}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Comissão Zeladoria</span>
              <strong className="text-base text-[#1355FF] font-black">
                R$ {simPlatformFee.toFixed(2)}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Taxa PSP</span>
              <strong className="text-base text-slate-700 font-black">
                R$ {simPspFee.toFixed(2)}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Prestador Recebe (Líquido)</span>
              <strong className="text-base text-emerald-700 font-black">
                R$ {simNetVendor.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
