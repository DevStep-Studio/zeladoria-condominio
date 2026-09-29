"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  acceptServiceRequestAction,
  sendQuoteAction,
  updateServiceProgressAction,
} from "@/lib/actions/prestador";

export function ProviderDashboardClient({
  vendor,
  requests = [],
  quotes = [],
  reviews = [],
}: {
  vendor: any;
  requests: any[];
  quotes: any[];
  reviews: any[];
}) {
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState<any | null>(null);
  const [laborVal, setLaborVal] = useState("200");
  const [materialsVal, setMaterialsVal] = useState("50");
  const [quoteDesc, setQuoteDesc] = useState("Mão de obra especializada com garantia.");
  const [quoteDays, setQuoteDays] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Metrics
  const newRequests = requests.filter(
    (r) => r.status === "solicitado" || r.status === "buscando_prestador"
  );
  const inProgressRequests = requests.filter((r) =>
    ["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento"].includes(r.status)
  );
  const completedRequests = requests.filter((r) => r.status === "concluido");

  const totalEarningsCents = inProgressRequests.reduce(
    (acc, r) => acc + (r.finalAmountCents || r.estimatedAmountCents || 0),
    0
  );

  const handleAccept = (requestId: number) => {
    startTransition(async () => {
      await acceptServiceRequestAction(requestId);
    });
  };

  const handleAdvance = (
    requestId: number,
    nextStatus: "a_caminho" | "chegou" | "em_atendimento" | "concluido"
  ) => {
    startTransition(async () => {
      await updateServiceProgressAction(requestId, nextStatus);
    });
  };

  const handleSendQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteRequest) return;

    startTransition(async () => {
      const laborCents = Math.round(parseFloat(laborVal || "0") * 100);
      const materialsCents = Math.round(parseFloat(materialsVal || "0") * 100);
      const totalCents = laborCents + materialsCents;

      await sendQuoteAction({
        requestId: selectedQuoteRequest.id,
        laborCents,
        materialsCents,
        totalCents,
        description: quoteDesc,
        estimatedDays: quoteDays,
      });

      setSelectedQuoteRequest(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Greeting Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Olá, {vendor.name.split(" ")[0]}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold ${
                vendor.isOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-[2px] ${
                  vendor.isOnline ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {vendor.isOnline ? "Disponível para novos chamados" : "Offline / Indisponível"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {vendor.companyName} · {vendor.category.toUpperCase()} · Raio de atendimento: {vendor.serviceRadiusKm} km
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/prestador/perfil"
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Editar Vitrine / Loja
          </Link>
          <Link
            href="/prestador/chamados"
            className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            Ver todos os chamados
          </Link>
        </div>
      </div>

      {/* 2. Today's Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Novas Oportunidades</span>
            <Icon name="bell" size={14} className="text-[#0055D4]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{newRequests.length}</div>
          <div className="text-[11px] text-slate-500">Aguardando seu aceite</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Em Andamento</span>
            <Icon name="wrench" size={14} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{inProgressRequests.length}</div>
          <div className="text-[11px] text-slate-500">Serviços ativos hoje</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Ganhos Previstos</span>
            <Icon name="dollar" size={14} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            R$ {(totalEarningsCents / 100).toFixed(0)}
          </div>
          <div className="text-[11px] text-slate-500">De serviços em execução</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Reputação</span>
            <Icon name="star" size={14} className="text-[#FFD000] fill-[#FFD000]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] flex items-center gap-1">
            <span>{vendor.rating ? `${vendor.rating}.0` : "5.0"}</span>
            <Icon name="star" size={14} className="text-[#FFD000] fill-[#FFD000]" />
          </div>
          <div className="text-[11px] text-slate-500">{completedRequests.length} serviços finalizados</div>
        </div>
      </div>

      {/* 3. Novas Oportunidades & Chamados Recebidos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
              Novos Chamados Disponíveis
            </h2>
            {newRequests.length > 0 && (
              <span className="rounded-full bg-[#0055D4] text-white px-2 py-0.5 text-[10px] font-black">
                {newRequests.length} novos
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Tempo de resposta médio: {vendor.responseTimeMinutes || 15} min</span>
        </div>

        {newRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="bell" size={18} />
            </div>
            <h3 className="text-xs font-bold text-[#0F172A]">Nenhum novo chamado no momento</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Mantenha o status <strong>Online</strong> para receber notificações imediatas quando moradores solicitarem serviços de {vendor.category}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {newRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs space-y-3 hover:border-[#0055D4] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-blue-50 text-[#0055D4] font-black text-[10px] px-1.5 py-0.5">
                        {req.code}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          req.urgency === "agora" || req.urgency === "urgente"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {req.urgency === "agora" ? "Precisa para Agora" : `Urgência: ${req.urgency}`}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A] mt-1">{req.title}</h3>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                    {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {req.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>
                    <span className="text-slate-400">Localização:</span>{" "}
                    <strong>Condomínio (Região)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Previsão:</span>{" "}
                    <strong>{req.scheduledDate || "Imediato"}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  {req.mode === "quote" ? (
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteRequest(req)}
                      className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="dollar" size={13} />
                      <span>Enviar Orçamento</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      disabled={isPending}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="check-circle" size={13} />
                      <span>Aceitar Chamado</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Serviços em Andamento e Despacho */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
          Serviços em Execução e Despacho
        </h2>

        {inProgressRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            Nenhum serviço em andamento no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-md">
                        {req.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F172A]">{req.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cliente: <strong>{req.customerName}</strong> · Local: <strong>{req.location}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        req.status === "em_atendimento"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                          : req.status === "a_caminho"
                          ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* State Machine Action Controls for Provider */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-slate-600">
                    Valor previsto:{" "}
                    <strong className="text-[#0F172A]">
                      R$ {((req.finalAmountCents || req.estimatedAmountCents || 0) / 100).toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === "aceito" && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(req.id, "a_caminho")}
                        className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon name="navigation" size={13} />
                        <span>A caminho</span>
                      </button>
                    )}

                    {req.status === "a_caminho" && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(req.id, "chegou")}
                        className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon name="map-pin" size={13} />
                        <span>Cheguei ao local</span>
                      </button>
                    )}

                    {req.status === "chegou" && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(req.id, "em_atendimento")}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon name="wrench" size={13} />
                        <span>Iniciar Atendimento</span>
                      </button>
                    )}

                    {req.status === "em_atendimento" && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(req.id, "concluido")}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon name="check-circle" size={13} />
                        <span>Finalizar Serviço</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Modal: Enviar Orçamento Formal */}
      {selectedQuoteRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedQuoteRequest(null)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0055D4]">
                  Proposta Formal
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Enviar Orçamento #{selectedQuoteRequest.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteRequest(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSendQuoteSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mão de Obra (R$) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={laborVal}
                  onChange={(e) => setLaborVal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Materiais / Peças Previstas (R$)
                </label>
                <input
                  type="number"
                  value={materialsVal}
                  onChange={(e) => setMaterialsVal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Total da Proposta:</span>
                <span className="font-black text-[#0055D4] text-sm">
                  R$ {(parseFloat(laborVal || "0") + parseFloat(materialsVal || "0")).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prazo de Execução (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição e Condições da Proposta
                </label>
                <textarea
                  rows={3}
                  value={quoteDesc}
                  onChange={(e) => setQuoteDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isPending ? "Enviando..." : "Enviar Proposta ao Morador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
