"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import {
  adminCreatePromotionPlanAction,
  adminTogglePromotionPlanAction,
  cancelPromotionCampaignAction,
} from "@/lib/actions/prestador";

interface PlanItem {
  id: number;
  name: string;
  type: string;
  durationDays: number;
  priceCents: number;
  badge?: string;
  active: boolean;
  description?: string;
}

interface CampaignItem {
  id: number;
  vendorId: number;
  type: string;
  categoryId?: string | null;
  region?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  status: string;
  amountCents: number;
  paymentStatus: string;
  impressions: number;
  clicks: number;
  vendorName?: string | null;
  vendorCategory?: string | null;
}

export function AdminDestaquesClient({
  plans = [],
  campaigns = [],
}: {
  plans: PlanItem[];
  campaigns: CampaignItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Novo Plano
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState("categoria");
  const [planDays, setPlanDays] = useState(7);
  const [planPrice, setPlanPrice] = useState("29.90");
  const [planDesc, setPlanDesc] = useState("");

  const totalRevenueCents = useMemo(() => {
    return campaigns.reduce((acc, c) => acc + (c.amountCents || 0), 0);
  }, [campaigns]);

  const activeCount = useMemo(() => {
    return campaigns.filter(
      (c) => c.status === "ACTIVE" && new Date(c.endsAt).getTime() >= Date.now()
    ).length;
  }, [campaigns]);

  const totalImpressions = useMemo(() => {
    return campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  }, [campaigns]);

  const handleTogglePlan = (planId: number) => {
    startTransition(async () => {
      await adminTogglePromotionPlanAction(planId);
      setSuccessMsg("Status do plano atualizado.");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  const handleCancelCampaign = (promoId: number) => {
    if (!confirm("Deseja cancelar esta campanha? Ela deixará de ser exibida no marketplace imediatamente.")) return;
    startTransition(async () => {
      await cancelPromotionCampaignAction(promoId);
      setSuccessMsg("Campanha cancelada com sucesso.");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const priceCents = Math.round(parseFloat(planPrice.replace(",", ".")) * 100);
      const res = await adminCreatePromotionPlanAction({
        name: planName,
        type: planType,
        durationDays: planDays,
        priceCents,
        description: planDesc,
      });

      if (res.success) {
        setIsNewPlanModalOpen(false);
        setPlanName("");
        setPlanDesc("");
        setSuccessMsg("Novo plano criado com sucesso!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon="sparkles"
        title="Marketplace · Destaques & Publicidade"
        description="Gestão de planos de visibilidade interna, campanhas ativas e faturamento publicitário."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/painel/servicos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors"
            >
              <Icon name="arrow-left" size={13} />
              <span>Ver Marketplace</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsNewPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-xs"
            >
              <Icon name="plus" size={13} />
              <span>Novo Plano</span>
            </button>
          </div>
        }
      />

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Cartões de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Receita Acumulada</span>
          <div className="text-2xl font-black text-emerald-700">
            R$ {(totalRevenueCents / 100).toFixed(2).replace(".", ",")}
          </div>
          <span className="text-xs text-slate-500">Planos contratados no condomínio</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Campanhas Ativas</span>
          <div className="text-2xl font-black text-[#0055D4]">{activeCount}</div>
          <span className="text-xs text-slate-500">Prestadores com destaque no ar</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Impressões Totais</span>
          <div className="text-2xl font-black text-[#0F172A]">{totalImpressions}</div>
          <span className="text-xs text-slate-500">Exibições nos blocos patrocinados</span>
        </div>
      </div>

      {/* Planos Cadastrados */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#0F172A]">
            Planos de Publicidade Configuráveis
          </h2>
          <span className="text-xs text-slate-400">{plans.length} planos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                p.active
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-[#0F172A]">{p.name}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      p.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {p.active ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{p.description}</p>
                <div className="mt-2 text-sm font-black text-slate-900">
                  R$ {(p.priceCents / 100).toFixed(2).replace(".", ",")}
                  <span className="text-[11px] text-slate-400 font-normal"> / {p.durationDays} dias</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleTogglePlan(p.id)}
                  disabled={isPending}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                    p.active
                      ? "text-slate-600 border-slate-200 hover:bg-slate-100"
                      : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {p.active ? "Desativar plano" : "Reativar plano"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campanhas em Execução */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#0F172A]">
            Todas as Campanhas de Destaque
          </h2>
          <span className="text-xs text-slate-400">{campaigns.length} registradas</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhuma campanha contratada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Prestador</th>
                  <th className="py-2.5 px-3">Especialidade</th>
                  <th className="py-2.5 px-3">Tipo / Região</th>
                  <th className="py-2.5 px-3">Vigência</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Métricas</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const isExpired = new Date(c.endsAt).getTime() < Date.now();
                  const displayStatus = isExpired ? "EXPIRED" : c.status;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.vendorName || `Prestador #${c.vendorId}`}
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-600">
                        {c.categoryId || c.vendorCategory || "Geral"}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {c.type === "categoria" ? "Categoria" : "Condomínio"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(c.startsAt).toLocaleDateString("pt-BR")} até{" "}
                        {new Date(c.endsAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            displayStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : displayStatus === "EXPIRED"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {c.impressions} views · {c.clicks} clicks
                      </td>
                      <td className="py-3 px-3 text-right">
                        {displayStatus === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => handleCancelCampaign(c.id)}
                            disabled={isPending}
                            className="text-[11px] font-bold text-red-600 hover:underline"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Novo Plano */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Novo Plano de Destaque</h3>
              <button
                type="button"
                onClick={() => setIsNewPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex.: Destaque Quinzenal na Categoria"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Duração (dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={planDays}
                    onChange={(e) => setPlanDays(parseInt(e.target.value, 10) || 7)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="text"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    placeholder="29,90"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tipo de Destaque
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                >
                  <option value="categoria">Por Especialidade / Categoria</option>
                  <option value="regiao">Local / Condomínio</option>
                  <option value="home">Página Principal de Serviços</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="Ex.: Posição garantida nos blocos patrocinados da categoria."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold bg-[#0055D4] hover:bg-[#0047BA] text-white rounded-xl shadow-xs"
                >
                  Criar plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
