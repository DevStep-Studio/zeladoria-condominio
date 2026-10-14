"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { adminUpdateMarketplaceSettingsAction } from "@/lib/actions/zeladoria-pay";

export function AdminTaxasClient({
  condoId,
  settings,
  recentOrders = [],
}: {
  condoId: number;
  settings: {
    commissionPercent: number;
    slotHoldMinutes: number;
    inspectionFeeMaxCents: number;
    disputeWindowHours: number;
    autoReleaseHours: number;
  };
  recentOrders?: any[];
}) {
  const [commission, setCommission] = useState(settings.commissionPercent);
  const [holdMinutes, setHoldMinutes] = useState(settings.slotHoldMinutes);
  const [maxInspectionVal, setMaxInspectionVal] = useState((settings.inspectionFeeMaxCents / 100).toFixed(2));
  const [disputeHours, setDisputeHours] = useState(settings.disputeWindowHours);
  const [autoReleaseHours, setAutoReleaseHours] = useState(settings.autoReleaseHours);
  const [feePayer, setFeePayer] = useState<"PROVIDER" | "PLATFORM" | "SHARED">((settings as any).processingFeePayer || "PROVIDER");
  const [visitCommission, setVisitCommission] = useState((settings as any).visitCommissionPercent || 0);

  // Estados do Simulador Financeiro (Cláusula 28-29)
  const [simServiceVal, setSimServiceVal] = useState(1000);
  const [simCommissionPercent, setSimCommissionPercent] = useState(10);
  const [simPspFeePercent, setSimPspFeePercent] = useState(3.5);
  const [simFeePayer, setSimFeePayer] = useState<"PROVIDER" | "PLATFORM" | "SHARED">("PROVIDER");

  const simPlatformFee = (simServiceVal * simCommissionPercent) / 100;
  const simPspFee = (simServiceVal * simPspFeePercent) / 100;
  const simNetVendor = simFeePayer === "PROVIDER" 
    ? simServiceVal - simPlatformFee - simPspFee
    : simFeePayer === "SHARED"
    ? simServiceVal - simPlatformFee - (simPspFee / 2)
    : simServiceVal - simPlatformFee;

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalVolumeCents = recentOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((acc, o) => acc + (o.amountGrossCents || 0), 0);

  const totalFeesCents = recentOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((acc, o) => acc + (o.platformFeeCents || 0), 0);

  const totalPayoutsCents = recentOrders
    .filter((o) => o.status === "released" || o.status === "paid")
    .reduce((acc, o) => acc + (o.netVendorCents || 0), 0);

  const handleSave = (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#0055D4] text-white flex items-center justify-center font-black">
              <Icon name="shield" size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Zeladoria Pay · Taxas & Split
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestão da comissão de intermediação, prazos de reserva e mediação de serviços no condomínio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/painel/admin/marketplace/destaques"
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Gestão de Destaques
          </Link>
          <Link
            href="/painel/servicos"
            className="px-3.5 py-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-xs font-bold text-white transition-colors shadow-xs"
          >
            Ver Marketplace
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Volume Transacionado</span>
          <div className="text-2xl font-black text-slate-900">
            R$ {(totalVolumeCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">{recentOrders.length} ordens de pagamento no condomínio</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Comissão da Plataforma</span>
          <div className="text-2xl font-black text-[#0055D4]">
            R$ {(totalFeesCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Taxa configurável ({commission}%)</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Repasses Concluídos</span>
          <div className="text-2xl font-black text-emerald-700">
            R$ {(totalPayoutsCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Split liquidado via Asaas PSP</p>
        </div>
      </div>

      {/* Form de Configurações */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-900">Configurações Financeiras do Marketplace</h2>
          <p className="text-xs text-slate-500">
            Ajuste a taxa de comissão e as regras operacionais da Zeladoria Protege. Não há taxa fixa hardcoded.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Icon name="check-circle" size={16} />
            <span>Configurações salvas com sucesso no banco de dados!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <Icon name="alert" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Comissão % */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Comissão da Plataforma (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={commission}
                  onChange={(e) => setCommission(parseInt(e.target.value) || 0)}
                  required
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-500">Ex: 10% (cobrada sobre o valor do serviço)</p>
            </div>

            {/* Tempo de Hold da Vistoria */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Reserva de Horário (Minutos)</label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={holdMinutes}
                  onChange={(e) => setHoldMinutes(parseInt(e.target.value) || 10)}
                  required
                  className="w-full h-9 px-3 pr-12 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">min</span>
              </div>
              <p className="text-[10px] text-slate-500">Tempo de hold temporário no checkout de vistoria (padrão: 10 min)</p>
            </div>

            {/* Teto de Vistoria */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Teto para Vistoria Técnica (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="1000"
                  value={maxInspectionVal}
                  onChange={(e) => setMaxInspectionVal(e.target.value)}
                  required
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
              </div>
              <p className="text-[10px] text-slate-500">Limite de segurança para cobrança de visita diagnóstica</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Janela de Contestação */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Janela de Contestação do Morador (Horas)</label>
              <div className="relative">
                <input
                  type="number"
                  min="12"
                  max="168"
                  value={disputeHours}
                  onChange={(e) => setDisputeHours(parseInt(e.target.value) || 48)}
                  required
                  className="w-full h-9 px-3 pr-12 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">horas</span>
              </div>
              <p className="text-[10px] text-slate-500">Prazo após conclusão para o morador contestar com Zeladoria Protege</p>
            </div>

            {/* Liberação Automática */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Liberação Automática de Repasse (Horas)</label>
              <div className="relative">
                <input
                  type="number"
                  min="24"
                  max="240"
                  value={autoReleaseHours}
                  onChange={(e) => setAutoReleaseHours(parseInt(e.target.value) || 72)}
                  required
                  className="w-full h-9 px-3 pr-12 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">horas</span>
              </div>
              <p className="text-[10px] text-slate-500">Liberação preventiva caso o morador não confirme nem conteste</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Comissão Vistoria */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Comissão da Vistoria Técnica (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={visitCommission}
                  onChange={(e) => setVisitCommission(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-sm outline-none focus:border-[#0055D4]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-500">Taxa sobre vistorias pagas (padrão: 0% / isento)</p>
            </div>

            {/* Pagador da Taxa do PSP */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="font-bold text-slate-800 block">Responsável pelas Taxas do PSP</label>
              <select
                value={feePayer}
                onChange={(e) => setFeePayer(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs outline-none focus:border-[#0055D4]"
              >
                <option value="PROVIDER">Descontar do Prestador (Padrão)</option>
                <option value="PLATFORM">Absorvido pela Zeladoria</option>
                <option value="SHARED">Compartilhado (50% / 50%)</option>
              </select>
              <p className="text-[10px] text-slate-500">Cláusula 27: definição do responsável pelo custo financeiro</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white font-bold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Icon name="check" size={14} />
              <span>{isPending ? "Salvando..." : "Salvar Configurações Financeiras"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SIMULADOR FINANCEIRO ADMIN (CLÁUSULAS 28 E 29) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Icon name="wallet" size={15} />
            </span>
            <h2 className="text-sm font-black text-slate-900">Simulador Financeiro de Contratação (Zeladoria Pay)</h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cláusulas 28 e 29</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Valor do Serviço (R$)</label>
            <input
              type="number"
              step="10"
              min="50"
              value={simServiceVal}
              onChange={(e) => setSimServiceVal(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Comissão Zeladoria (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={simCommissionPercent}
              onChange={(e) => setSimCommissionPercent(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Taxa Estimada PSP (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={simPspFeePercent}
              onChange={(e) => setSimPspFeePercent(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pagador da Taxa</label>
            <select
              value={simFeePayer}
              onChange={(e) => setSimFeePayer(e.target.value as any)}
              className="w-full h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            >
              <option value="PROVIDER">Prestador</option>
              <option value="PLATFORM">Zeladoria</option>
              <option value="SHARED">Compartilhado</option>
            </select>
          </div>
        </div>

        {/* Resultados da Simulação */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span className="text-slate-500 block text-[11px]">Cliente Paga:</span>
            <span className="text-base font-black text-slate-900">R$ {simServiceVal.toFixed(2)}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-blue-700 block text-[11px]">Comissão Zeladoria ({simCommissionPercent}%):</span>
            <span className="text-base font-black text-[#0055D4]">R$ {simPlatformFee.toFixed(2)}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
            <span className="text-amber-700 block text-[11px]">Taxa do PSP ({simPspFeePercent}%):</span>
            <span className="text-base font-black text-amber-800">R$ {simPspFee.toFixed(2)}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
            <span className="text-emerald-700 block text-[11px]">Líquido Prestador:</span>
            <span className="text-base font-black text-emerald-800">R$ {simNetVendor.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          * Valores simulados para apoio de tomada de decisão. O cálculo real de liquidação e split é processado pelo parceiro financeiro (PSP) contratado.
        </p>
      </div>

      {/* Tabela de Ordens Recentes */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Últimas Ordens de Pagamento no Condomínio ({recentOrders.length})
        </h2>

        {recentOrders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            Nenhuma ordem de pagamento registrada ainda neste condomínio.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Código / Finalidade</th>
                  <th className="p-3.5">Prestador</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Bruto</th>
                  <th className="p-3.5 text-right">Comissão</th>
                  <th className="p-3.5 text-right">Líquido Prestador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <span className="font-bold text-[#0055D4] block">{o.code}</span>
                      <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        o.purpose === "vistoria" ? "bg-blue-50 text-[#0055D4]" : "bg-purple-50 text-purple-700"
                      }`}>
                        {o.purpose === "vistoria" ? "Vistoria" : "Serviço"}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">{o.vendorName || "Prestador"}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        o.status === "released" || o.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : o.status === "retained"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : o.status === "in_dispute"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-800">
                      R$ {((o.amountGrossCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-slate-500">
                      R$ {((o.platformFeeCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700">
                      R$ {((o.netVendorCents || 0) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
