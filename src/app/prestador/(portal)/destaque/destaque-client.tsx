"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  cancelPromotionCampaignAction,
  createPromotionCampaignAction,
} from "@/lib/actions/prestador";

interface PlanItem {
  id: number;
  name: string;
  type: string;
  durationDays: number;
  priceCents: number;
  badge?: string;
  description?: string;
}

interface PromotionItem {
  id: number;
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
}

export function DestaqueClient({
  vendor,
  plans = [],
  promotions = [],
}: {
  vendor: any;
  plans: PlanItem[];
  promotions: PromotionItem[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleHirePlan = (planId: number) => {
    setSelectedPlanId(planId);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createPromotionCampaignAction({
        planId,
        categoryId: vendor.category,
        region: vendor.serviceArea || "Geral",
      });

      if (res.success) {
        setSuccessMsg("Campanha de destaque ativada com sucesso! Seu perfil aparecerá no topo da sua categoria.");
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.error || "Erro ao ativar plano de destaque.");
      }
      setSelectedPlanId(null);
    });
  };

  const handleCancelCampaign = (promoId: number) => {
    if (!confirm("Deseja realmente cancelar esta campanha?")) return;
    startTransition(async () => {
      const res = await cancelPromotionCampaignAction(promoId);
      if (res.success) {
        setSuccessMsg("Campanha cancelada.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Destaque & Publicidade Interna
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Conquiste maior visibilidade com anúncios patrocinados transparentes, mantendo a integridade da sua reputação.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="alert-triangle" size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Regra Máxima e Ética */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-[#0055D4]">
          <Icon name="shield" size={18} />
          <h2 className="text-xs sm:text-sm font-bold">
            Transparência Máxima com os Moradores
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Os destaques pagos aparecem identificados de forma clara como <strong>PATROCINADO</strong> em posições de topo relevantes à sua especialidade (<strong>{vendor.category.toUpperCase()}</strong>). O pagamento <strong>NUNCA altera sua nota média</strong> nem concede artificialmente medalhas orgânicas de #1, garantindo a confiança da comunidade.
        </p>
      </div>

      {/* Planos Disponíveis */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#0F172A]">
          Planos Disponíveis para o seu Perfil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#0055D4] transition-all"
            >
              <div className="space-y-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0055D4] border border-blue-200">
                  {plan.type === "categoria" ? "Destaque por Especialidade" : "Destaque Local"}
                </span>

                <h3 className="text-base font-bold text-[#0F172A]">{plan.name}</h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {plan.description || "Maior exposição do seu perfil nos blocos patrocinados."}
                </p>

                <div className="pt-2">
                  <span className="text-2xl font-black text-[#0F172A]">
                    R$ {(plan.priceCents / 100).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / {plan.durationDays} dias</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleHirePlan(plan.id)}
                disabled={isPending && selectedPlanId === plan.id}
                className="w-full py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending && selectedPlanId === plan.id ? "Ativando..." : "Contratar Destaque"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Campanhas Ativas e Histórico */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">
              Suas Campanhas de Destaque
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe a vigência e o desempenho de visualizações e cliques
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {promotions.length} registradas
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="sparkles" size={18} />
            </div>
            <p className="text-xs font-bold text-slate-700">Nenhuma campanha contratada</p>
            <p className="text-[11px] text-slate-400">
              Escolha um dos planos acima para impulsionar seu alcance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((promo) => {
              const isExpired = new Date(promo.endsAt).getTime() < Date.now();
              const displayStatus = isExpired ? "EXPIRED" : promo.status;

              return (
                <div
                  key={promo.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        Campanha #{promo.id} · Categoria {promo.categoryId || vendor.category}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          displayStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : displayStatus === "EXPIRED"
                            ? "bg-slate-100 text-slate-500"
                            : displayStatus === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400">
                      Vigência: {new Date(promo.startsAt).toLocaleDateString("pt-BR")} até{" "}
                      {new Date(promo.endsAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Analytics reais (Seção 58 do prompt) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Visualizações Patrocinadas
                      </span>
                      <strong className="text-sm text-slate-800">
                        {promo.impressions || 0}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Cliques no Perfil
                      </span>
                      <strong className="text-sm text-slate-800">{promo.clicks || 0}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Investimento
                      </span>
                      <strong className="text-sm text-slate-800">
                        R$ {((promo.amountCents || 0) / 100).toFixed(2).replace(".", ",")}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-end">
                      {displayStatus === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleCancelCampaign(promo.id)}
                          disabled={isPending}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Cancelar campanha
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
