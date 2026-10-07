"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  acceptServiceRequestAction,
  rejectServiceRequestAction,
  sendQuoteAction,
  toggleProviderAvailableNowAction,
  updateServiceProgressAction,
} from "@/lib/actions/prestador";
import { calculateProfileCompleteness } from "@/lib/services/provider-profile";

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
  const [laborVal, setLaborVal] = useState("180");
  const [materialsVal, setMaterialsVal] = useState("40");
  const [quoteDesc, setQuoteDesc] = useState("Mão de obra com garantia de serviço.");
  const [quoteDays, setQuoteDays] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Completude do Perfil centralizada
  const completeness = calculateProfileCompleteness(vendor);

  // Filtros de métricas essenciais
  const newRequests = requests.filter(
    (r) => r.status === "solicitado" || r.status === "buscando_prestador"
  );
  const inProgressRequests = requests.filter((r) =>
    ["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento"].includes(r.status)
  );

  const isAvailable = vendor?.availableNow ?? true;

  const handleToggleAvailable = () => {
    startTransition(async () => {
      await toggleProviderAvailableNowAction();
    });
  };

  const handleAccept = (requestId: number) => {
    startTransition(async () => {
      await acceptServiceRequestAction(requestId);
    });
  };

  const handleReject = (requestId: number) => {
    startTransition(async () => {
      await rejectServiceRequestAction(requestId);
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

  const firstName = (vendor?.name || "Prestador").split(" ")[0];
  const displayRating = vendor?.rating ? (vendor.rating / 10).toFixed(1) : "4.9";

  return (
    <div className="space-y-6">
      {/* 1. Header Simples com Botão "Disponível agora" ON / OFF */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Olá, {firstName}
            </h1>

            {/* Toggle Estou Disponível Agora ON / OFF */}
            <button
              type="button"
              onClick={handleToggleAvailable}
              disabled={isPending}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
              title="Clique para alternar disponibilidade imediata no marketplace"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>Disponível agora:</span>
              <span className="font-extrabold uppercase">{isAvailable ? "ON" : "OFF"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1">
            {vendor.companyName || vendor.name} · Especialidade:{" "}
            <span className="capitalize">{vendor.category}</span> · Atende até {vendor.serviceRadiusKm || 15} km
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/prestador/chamados"
            className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-colors shadow-xs"
          >
            Ver chamados
          </Link>
          <Link
            href="/prestador/perfil"
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors"
          >
            Editar perfil
          </Link>
        </div>
      </div>

      {/* 2. 4 Cards de Métricas Essenciais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Novos Chamados */}
        <Link
          href="/prestador/chamados"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 hover:border-[#0055D4] transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Novos Chamados</span>
            <Icon name="bell" size={14} className="text-[#0055D4]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{newRequests.length}</div>
          <div className="text-[11px] text-slate-500">Aguardando aceite</div>
        </Link>

        {/* Em Andamento */}
        <Link
          href="/prestador/chamados"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 hover:border-amber-400 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Em Andamento</span>
            <Icon name="wrench" size={14} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#0F172A]">{inProgressRequests.length}</div>
          <div className="text-[11px] text-slate-500">Atendimentos ativos</div>
        </Link>

        {/* Avaliação */}
        <Link
          href="/prestador/avaliacoes"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 hover:border-yellow-400 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Avaliação</span>
            <Icon name="star" size={14} className="text-[#FFD000]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] flex items-center gap-1">
            <span>{displayRating}</span>
            <span className="text-sm text-yellow-500">★</span>
          </div>
          <div className="text-[11px] text-slate-500">{reviews.length} avaliações</div>
        </Link>

        {/* Completude do Perfil */}
        <Link
          href="/prestador/perfil"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 hover:border-emerald-400 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Perfil</span>
            <span className="text-xs font-bold text-emerald-600">{completeness.percentage}%</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {completeness.percentage}%
          </div>
          <div className="text-[11px] text-slate-500">
            {completeness.percentage === 100 ? "Perfil completo" : "Completo"}
          </div>
        </Link>
      </div>

      {/* 3. Banner Informativo se Perfil Incompleto */}
      {completeness.percentage < 100 && completeness.missingItems.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0055D4] text-white shrink-0">
              <Icon name="sparkles" size={16} />
            </span>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                Complete seu perfil para aumentar a confiança dos moradores
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Perfis com fotos de trabalhos reais, serviços detalhados e documentação transmitem maior credibilidade.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {completeness.missingItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.actionUrl}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold text-[#0055D4] hover:bg-blue-100/50 transition-colors shadow-2xs"
                  >
                    <span>+</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Chamados Recentes com Privacidade Gated */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
              Chamados Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Oportunidades e atendimentos no seu condomínio de atuação
            </p>
          </div>
          <Link
            href="/prestador/chamados"
            className="text-xs font-bold text-[#0055D4] hover:underline"
          >
            Ver todos ({requests.length})
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="clipboard" size={18} />
            </div>
            <p className="text-xs font-bold text-slate-700">Nenhum chamado no momento</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Mantenha o status &ldquo;Disponível agora&rdquo; ativado para receber notificações assim que um morador solicitar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((req) => {
              const isAccepted = [
                "aceito",
                "a_caminho",
                "chegou",
                "em_atendimento",
                "orcamento_aprovado",
                "concluido",
              ].includes(req.status);

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                        {req.code}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                        {req.title}
                      </h3>
                      <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                        {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        req.status === "concluido"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "em_atendimento"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : req.status === "aceito"
                          ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {req.description}
                  </p>

                  {/* Informações de Localização e Cliente com Privacidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Cliente:</span>{" "}
                      <strong className="text-slate-800">
                        {isAccepted ? req.customerName : "Morador do condomínio"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Localização:</span>{" "}
                      <strong className="text-slate-800">
                        {isAccepted ? req.location : "Condomínio (Unidade liberada após aceite)"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Contato:</span>{" "}
                      {isAccepted && req.customerPhone ? (
                        <a
                          href={`tel:${req.customerPhone}`}
                          className="font-bold text-[#0055D4] hover:underline"
                        >
                          {req.customerPhone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">🔒 Oculto até aceite</span>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas: ACEITAR / RECUSAR antes do aceite, ou Avançar após */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      Data: {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                    </span>

                    <div className="flex items-center gap-2">
                      {(req.status === "solicitado" || req.status === "buscando_prestador") && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            disabled={isPending}
                            className="px-4 py-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                          >
                            Aceitar chamado
                          </button>
                        </>
                      )}

                      {req.status === "aceito" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "a_caminho")}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          Estou a caminho
                        </button>
                      )}

                      {req.status === "a_caminho" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "chegou")}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          Cheguei ao local
                        </button>
                      )}

                      {req.status === "chegou" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "em_atendimento")}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          Iniciar serviço
                        </button>
                      )}

                      {req.status === "em_atendimento" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "concluido")}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          Concluir serviço
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

      {/* Modal de Envio de Orçamento */}
      {selectedQuoteRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Enviar Proposta de Orçamento
              </h3>
              <button
                type="button"
                onClick={() => setSelectedQuoteRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSendQuoteSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mão de Obra (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={laborVal}
                  onChange={(e) => setLaborVal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Materiais (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={materialsVal}
                  onChange={(e) => setMaterialsVal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Previsão (Dias)
                </label>
                <input
                  type="number"
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3]"
                  min={1}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Observações / Escopo
                </label>
                <textarea
                  rows={3}
                  value={quoteDesc}
                  onChange={(e) => setQuoteDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteRequest(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold bg-[#0055D4] text-white rounded-xl hover:bg-[#0047BA] shadow-xs"
                >
                  Enviar orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
