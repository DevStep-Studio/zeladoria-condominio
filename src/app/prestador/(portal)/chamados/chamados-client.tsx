"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { updateServiceProgressAction } from "@/lib/actions/prestador";
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
        ["a_caminho", "chegou", "em_atendimento", "executado_prestador", "PROVIDER_COMPLETED"].includes(
          r.status
        )
      ) {
        tab = "em_andamento";
      } else if (
        r.vendorId === vendor.id &&
        ["aceito", "SERVICO_PAGO_LIBERADO", "orcamento_aprovado", "aguardando_pagamento_servico"].includes(
          r.status
        )
      ) {
        tab = "contratados";
      } else if (myQuote && myQuote.status === "pendente") {
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
            className="h-9 w-full rounded-xl border border-slate-200/80 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#0055D4] text-white shadow-2xs"
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
                    <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 font-mono">
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
                {req.myQuote && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#0055D4] block">
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
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg shrink-0 ${
                        req.myQuote.status === "aceito"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.myQuote.status === "recusado"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {req.myQuote.status === "aceito"
                        ? "Orçamento Aceito!"
                        : req.myQuote.status === "recusado"
                        ? "Não Selecionado"
                        : "Aguardando Resposta"}
                    </span>
                  </div>
                )}

                {/* Ações / CTA Dominante por Estado */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                  {/* Aba Novos: CTA Dominante [ Enviar orçamento ] */}
                  {req.tabCategory === "novos" && (
                    <button
                      type="button"
                      onClick={() => setProposalModalReq(req)}
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="send" size={14} />
                      <span>Enviar Orçamento</span>
                    </button>
                  )}

                  {/* Aba Orçamentos Enviados */}
                  {req.tabCategory === "orcamentos_enviados" && (
                    <div className="flex items-center gap-2">
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
                    </div>
                  )}

                  {/* Aba Contratados */}
                  {req.tabCategory === "contratados" && (
                    <button
                      type="button"
                      onClick={() => handleAdvance(req.id, "a_caminho")}
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
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
                          className="px-5 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
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

                      {(req.status === "executado_prestador" || req.status === "PROVIDER_COMPLETED") && (
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
    </div>
  );
}
