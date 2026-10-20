"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  acceptServiceRequestAction,
  rejectServiceRequestAction,
  updateServiceProgressAction,
} from "@/lib/actions/prestador";
import {
  providerCreateContractAddendumAction,
  providerFinalizeServiceAction,
  providerRecordEvidenceAction,
  sendDigitalProposalAction,
} from "@/lib/actions/zeladoria-pay";
import {
  ProviderAddendumModal,
  ProviderDigitalProposalModal,
  ProviderEvidenceModal,
  ProviderFinalizeModal,
} from "@/components/marketplace/zeladoria-pay-modals";

export function ProviderChamadosClient({
  vendor,
  requests = [],
  quotes = [],
}: {
  vendor: any;
  requests: any[];
  quotes?: any[];
}) {
  const [activeTab, setActiveTab] = useState<
    "novos" | "orcamentos_enviados" | "contratados" | "em_andamento" | "concluidos"
  >("novos");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modais do Zeladoria Pay & Marketplace
  const [detailsModalReq, setDetailsModalReq] = useState<any>(null);
  const [proposalModalReq, setProposalModalReq] = useState<any>(null);
  const [evidenceModalReq, setEvidenceModalReq] = useState<any>(null);
  const [addendumModalReq, setAddendumModalReq] = useState<any>(null);
  const [finalizeModalReq, setFinalizeModalReq] = useState<any>(null);

  // Mapeia orçamentos enviados por este prestador por requestId
  const quotesByRequestId = useMemo(() => {
    const map = new Map<number, any>();
    for (const q of quotes) {
      if (!map.has(q.requestId) || (q.version && q.version > (map.get(q.requestId)?.version || 0))) {
        map.set(q.requestId, q);
      }
    }
    return map;
  }, [quotes]);

  const categorizedRequests = useMemo(() => {
    return requests.map((r) => {
      const myQuote = quotesByRequestId.get(r.id);
      let tab: "novos" | "orcamentos_enviados" | "contratados" | "em_andamento" | "concluidos" = "novos";

      if (r.status === "concluido") {
        tab = "concluidos";
      } else if (
        [
          "a_caminho",
          "chegou",
          "em_atendimento",
          "correcao_solicitada",
          "prestador_concluiu",
          "conclusao_solicitada",
          "prestador_finalizou",
          "servico_finalizado_prestador",
          "executado_prestador",
          "PROVIDER_COMPLETED",
        ].includes(r.status)
      ) {
        tab = "em_andamento";
      } else if (
        r.vendorId === vendor.id &&
        ["aceito", "SERVICO_PAGO_LIBERADO", "orcamento_aprovado", "aguardando_pagamento_servico"].includes(
          r.status
        )
      ) {
        tab = "contratados";
      } else if (myQuote && (myQuote.status === "pendente" || myQuote.status === "expirado")) {
        tab = "orcamentos_enviados";
      } else {
        tab = "novos";
      }

      return {
        ...r,
        myQuote,
        tabCategory: tab,
      };
    });
  }, [requests, quotesByRequestId, vendor.id]);

  const filteredRequests = useMemo(() => {
    return categorizedRequests.filter((r) => {
      if (r.tabCategory !== activeTab) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.category && r.category.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [categorizedRequests, activeTab, search]);

  const counts = useMemo(() => {
    const res = {
      novos: 0,
      orcamentos_enviados: 0,
      contratados: 0,
      em_andamento: 0,
      concluidos: 0,
    };
    for (const r of categorizedRequests) {
      const cat = r.tabCategory as keyof typeof res;
      if (res[cat] !== undefined) {
        res[cat]++;
      }
    }
    return res;
  }, [categorizedRequests]);

  const handleAdvance = (
    requestId: number,
    nextStatus: "a_caminho" | "chegou" | "em_atendimento" | "concluido"
  ) => {
    startTransition(async () => {
      await updateServiceProgressAction(requestId, nextStatus);
    });
  };

  const handleAccept = (requestId: number) => {
    startTransition(async () => {
      const res = await acceptServiceRequestAction(requestId);
      if (res.success) {
        setDetailsModalReq(null);
      }
    });
  };

  const handleReject = (requestId: number, reason?: string) => {
    startTransition(async () => {
      const res = await rejectServiceRequestAction(requestId, reason);
      if (res.success) {
        setDetailsModalReq(null);
      }
    });
  };

  const tabs = [
    { id: "novos", label: "Novos", count: counts.novos },
    { id: "orcamentos_enviados", label: "Orçamentos enviados", count: counts.orcamentos_enviados },
    { id: "contratados", label: "Contratados", count: counts.contratados },
    { id: "em_andamento", label: "Em andamento", count: counts.em_andamento },
    { id: "concluidos", label: "Concluídos", count: counts.concluidos },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Chamados & Serviços
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Olá, {vendor.name}. Veja chamados compatíveis na sua categoria, envie orçamentos e acompanhe suas execuções.
          </p>
        </div>

        {/* Busca */}
        <div className="relative w-full sm:w-64">
          <Icon
            name="search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chamado..."
            className="h-9 w-full rounded-xl border border-slate-200/80 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-[#1355FF] shadow-2xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer snap-start ${
                isActive
                  ? "bg-[#1355FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-black rounded-full px-2 py-0.5 ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de Chamados */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-2xs">
          <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icon name="clipboard" size={18} />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Nenhum chamado nesta aba</h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {activeTab === "novos"
              ? "Novos chamados correspondentes à sua especialidade aparecerão aqui em tempo real."
              : "Assim que houver atualizações nos chamados eles serão exibidos aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => {
            const isHiredOrActive = ["contratados", "em_andamento", "concluidos"].includes(
              req.tabCategory
            );

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors"
              >
                {/* Header do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#1355FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 font-mono">
                      {req.code}
                    </span>
                    <span className="rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-1">
                      {req.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        req.urgency === "agora"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : req.urgency === "hoje"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {req.urgency === "agora"
                        ? "Urgente / Agora"
                        : req.urgency === "hoje"
                        ? "Precisa Hoje"
                        : "Agendamento Flexível"}
                    </span>
                  </div>
                </div>

                {/* Localização & Privacidade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Local</span>
                    <strong className="text-slate-800">
                      {req.condoName || "Condomínio Residencial"}
                    </strong>
                    {isHiredOrActive ? (
                      <span className="text-[11px] text-slate-500 block font-medium">
                        {req.location}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block italic">
                        (Unidade liberada após contratação)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Cliente</span>
                    {isHiredOrActive ? (
                      <div>
                        <strong className="text-slate-800 block">{req.customerName}</strong>
                        <span className="text-[11px] text-slate-500">{req.customerPhone || "Contato no app"}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">Morador Verificado</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Data de Abertura</span>
                    <strong className="text-slate-800">
                      {new Date(req.createdAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(req.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                </div>

                {/* Descrição do Problema */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    O que está acontecendo:
                  </span>
                  <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Fotos Anexadas pelo Morador */}
                {req.attachments && req.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Fotos do local ({req.attachments.length}):
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {req.attachments.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-16 w-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 group relative"
                        >
                          <img
                            src={url}
                            alt="Foto do chamado"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meu Orçamento Enviado (se houver) */}
                {req.myQuote && (() => {
                  const isExpired = req.myQuote.status === "expirado" || (req.myQuote.expiresAt ? new Date(req.myQuote.expiresAt).getTime() < Date.now() : false);
                  const hoursLeft = req.myQuote.expiresAt
                    ? Math.max(0, Math.ceil((new Date(req.myQuote.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
                    : null;

                  return (
                    <div
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isExpired
                          ? "bg-rose-50/70 border-rose-200 text-rose-950"
                          : "bg-blue-50/70 border-blue-200/80 text-slate-800"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#1355FF] block">
                          Seu Orçamento Enviado:
                        </span>
                        <strong className="text-slate-900 text-sm">
                          R$ {(req.myQuote.totalCents / 100).toFixed(2)}
                        </strong>{" "}
                        <span className="text-slate-500">
                          (Líquido a receber: R$ {((req.myQuote.totalCents * 0.9) / 100).toFixed(2)})
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &quot;{req.myQuote.description}&quot; · Disponibilidade: {req.myQuote.availableAt || "A combinar"}
                        </p>
                        {req.myQuote.status === "pendente" && !isExpired && hoursLeft !== null && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded inline-block mt-1">
                            Expira em: {hoursLeft}h
                          </span>
                        )}
                        {req.myQuote.status === "pendente" && !isExpired && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Cliente ainda não respondeu
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg shrink-0 ${
                          req.myQuote.status === "aceito"
                            ? "bg-emerald-100 text-emerald-800"
                            : isExpired
                            ? "bg-rose-100 text-rose-800"
                            : req.myQuote.status === "recusado"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {req.myQuote.status === "aceito"
                          ? "Orçamento Aceito!"
                          : isExpired
                          ? "Expirado"
                          : req.myQuote.status === "recusado"
                          ? "Não Selecionado"
                          : "Aguardando Resposta"}
                      </span>
                    </div>
                  );
                })()}

                {/* Ações / CTA Dominante por Estado */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                  {/* Aba Novos: CTA Dominante [ Aceitar Trabalho ] ou [ Enviar Orçamento ] */}
                  {req.tabCategory === "novos" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailsModalReq(req)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon name="eye" size={13} />
                        <span>Ver Detalhes</span>
                      </button>

                      {req.priceFromCents || req.amountCents ? (
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          disabled={isPending}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Icon name="check-circle" size={14} />
                          <span>Aceitar Trabalho (R$ {(((req.amountCents || req.priceFromCents)) / 100).toFixed(2)})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProposalModalReq(req)}
                          disabled={isPending}
                          className="px-5 py-2 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon name="send" size={14} />
                          <span>Enviar Orçamento</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Aba Orçamentos Enviados */}
                  {req.tabCategory === "orcamentos_enviados" && (
                    <div className="flex items-center gap-2">
                      {req.myQuote && (req.myQuote.status === "expirado" || (req.myQuote.expiresAt && new Date(req.myQuote.expiresAt).getTime() < Date.now())) ? (
                        <>
                          <span className="text-xs text-rose-600 font-bold">
                            Orçamento expirado
                          </span>
                          <button
                            type="button"
                            onClick={() => setProposalModalReq(req)}
                            disabled={isPending}
                            className="px-3.5 py-1.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Enviar novo orçamento
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500 font-medium">
                            Aguardando escolha do morador
                          </span>
                          <button
                            type="button"
                            onClick={() => setProposalModalReq(req)}
                            disabled={isPending}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            Editar / Reenviar Orçamento
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Aba Contratados */}
                  {req.tabCategory === "contratados" && (
                    <button
                      type="button"
                      onClick={() => handleAdvance(req.id, "a_caminho")}
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <Icon name="navigation" size={14} />
                      <span>A caminho</span>
                    </button>
                  )}

                  {/* Aba Em Andamento */}
                  {req.tabCategory === "em_andamento" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.status === "a_caminho" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "chegou")}
                          disabled={isPending}
                          className="px-5 py-2.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon name="map-pin" size={14} />
                          <span>Cheguei ao condomínio</span>
                        </button>
                      )}

                      {req.status === "chegou" && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(req.id, "em_atendimento")}
                          disabled={isPending}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon name="wrench" size={14} />
                          <span>Iniciar Atendimento</span>
                        </button>
                      )}

                      {req.status === "em_atendimento" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEvidenceModalReq(req)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Icon name="camera" size={13} />
                            <span>Fotos Antes/Depois</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAddendumModalReq(req)}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Icon name="plus" size={13} />
                            <span>Solicitar Adicional</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFinalizeModalReq(req)}
                            disabled={isPending}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Icon name="check-circle" size={14} />
                            <span>Finalizar Serviço</span>
                          </button>
                        </>
                      )}

                      {["prestador_concluiu", "conclusao_solicitada", "prestador_finalizou", "servico_finalizado_prestador", "executado_prestador", "PROVIDER_COMPLETED"].includes(req.status) && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1.5">
                          <Icon name="clock" size={13} />
                          <span>Finalizado por você. Aguardando confirmação do morador.</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Aba Concluídos */}
                  {req.tabCategory === "concluidos" && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <Icon name="check-circle" size={14} />
                      <span>Serviço Concluído & Repasse Elegível</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Enviar Orçamento (5 campos simples) */}
      <ProviderDigitalProposalModal
        isOpen={!!proposalModalReq}
        onClose={() => setProposalModalReq(null)}
        request={proposalModalReq}
        isPending={isPending}
        onSubmit={(data) => {
          if (!proposalModalReq) return;
          startTransition(async () => {
            await sendDigitalProposalAction({
              requestId: proposalModalReq.id,
              ...data,
            });
            setProposalModalReq(null);
          });
        }}
      />

      {/* MODAL 2: Evidências Técnicas (Antes, Durante, Depois) */}
      <ProviderEvidenceModal
        isOpen={!!evidenceModalReq}
        onClose={() => setEvidenceModalReq(null)}
        requestId={evidenceModalReq?.id || 0}
        isPending={isPending}
        onSubmit={(data) => {
          if (!evidenceModalReq) return;
          startTransition(async () => {
            await providerRecordEvidenceAction({
              requestId: evidenceModalReq.id,
              ...data,
            });
            setEvidenceModalReq(null);
          });
        }}
      />

      {/* MODAL 3: Solicitar Custo Adicional (Aditivo) */}
      <ProviderAddendumModal
        isOpen={!!addendumModalReq}
        onClose={() => setAddendumModalReq(null)}
        request={addendumModalReq}
        isPending={isPending}
        onSubmit={(data) => {
          if (!addendumModalReq) return;
          startTransition(async () => {
            await providerCreateContractAddendumAction({
              requestId: addendumModalReq.id,
              quoteId: addendumModalReq.myQuote?.id || 0,
              ...data,
            });
            setAddendumModalReq(null);
          });
        }}
      />

      {/* MODAL 4: Finalizar Serviço (PROVIDER_COMPLETED) */}
      <ProviderFinalizeModal
        isOpen={!!finalizeModalReq}
        onClose={() => setFinalizeModalReq(null)}
        request={finalizeModalReq}
        isPending={isPending}
        onSubmit={(data) => {
          if (!finalizeModalReq) return;
          startTransition(async () => {
            await providerFinalizeServiceAction({
              requestId: finalizeModalReq.id,
              ...data,
            });
            setFinalizeModalReq(null);
          });
        }}
      />

      {/* MODAL 5: Detalhes Completos da Oportunidade */}
      <OpportunityDetailModal
        isOpen={!!detailsModalReq}
        onClose={() => setDetailsModalReq(null)}
        request={detailsModalReq}
        isPending={isPending}
        onAccept={handleAccept}
        onOpenProposal={(req) => {
          setDetailsModalReq(null);
          setProposalModalReq(req);
        }}
        onReject={handleReject}
      />
    </div>
  );
}

function OpportunityDetailModal({
  isOpen,
  onClose,
  request,
  onAccept,
  onOpenProposal,
  onReject,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onAccept?: (requestId: number) => void;
  onOpenProposal?: (request: any) => void;
  onReject?: (requestId: number) => void;
  isPending: boolean;
}) {
  if (!isOpen || !request) return null;

  const hasFixedPrice = Boolean(request.amountCents || request.priceFromCents);
  const priceFormatted = hasFixedPrice
    ? ((request.amountCents || request.priceFromCents) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-black text-[#1355FF] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60 font-mono">
                {request.code}
              </span>
              <span className="rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-0.5">
                {request.category}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                  request.urgency === "agora"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : request.urgency === "hoje"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {request.urgency === "agora"
                  ? "Urgente"
                  : request.urgency === "hoje"
                  ? "Para Hoje"
                  : "Flexível"}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{request.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Condomínio</p>
            <p className="font-bold text-slate-800">{request.condoName || "Condomínio Residencial"}</p>
            <p className="text-[11px] text-slate-500 italic mt-0.5">
              Unidade e dados de contato liberados após o aceite.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Remuneração do Serviço</p>
            {hasFixedPrice ? (
              <p className="text-base font-black text-emerald-700">{priceFormatted}</p>
            ) : (
              <p className="font-bold text-slate-700">A definir via Orçamento</p>
            )}
            <p className="text-[10px] text-slate-500 mt-0.5">
              Custódia garantida pelo Zeladoria Protege
            </p>
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Descrição do Problema / Escopo:
          </label>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
            {request.description}
          </div>
        </div>

        {/* Fotos Anexadas */}
        {request.attachments && request.attachments.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fotos enviadas pelo morador ({request.attachments.length}):
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {request.attachments.map((url: string, idx: number) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-20 w-20 rounded-xl border border-slate-200 overflow-hidden shrink-0 group relative bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Anexo ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Garantias & Proteções */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Icon name="shield" size={14} className="text-[#1355FF]" />
            <span>Garantias da Zeladoria</span>
          </p>
          <ul className="text-[11px] text-blue-800 list-disc list-inside space-y-0.5">
            <li>Pagamento retido em custódia até a conclusão e aprovação pelo cliente.</li>
            <li>Garantia legal de 90 dias com cobertura do Zeladoria Protege.</li>
            <li>Suporte e mediação de ouvidoria em caso de divergências de escopo.</li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {onReject && (
            <button
              type="button"
              onClick={() => onReject(request.id)}
              disabled={isPending}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
            >
              Dispensar oportunidade
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>

            {hasFixedPrice && onAccept ? (
              <button
                type="button"
                onClick={() => onAccept(request.id)}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Icon name="check-circle" size={15} />
                <span>Aceitar Trabalho ({priceFormatted})</span>
              </button>
            ) : onOpenProposal ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProposal(request);
                }}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="send" size={14} />
                <span>Enviar Orçamento</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
