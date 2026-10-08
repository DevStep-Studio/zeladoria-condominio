"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  acceptServiceRequestAction,
  updateServiceProgressAction,
} from "@/lib/actions/prestador";

export function ProviderChamadosClient({
  vendor,
  requests = [],
}: {
  vendor: any;
  requests: any[];
}) {
  const [activeTab, setActiveTab] = useState<
    "todos" | "novos" | "aceitos" | "em_andamento" | "concluidos" | "cancelados"
  >("todos");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      if (activeTab === "novos") {
        if (r.status !== "solicitado" && r.status !== "buscando_prestador") return false;
      } else if (activeTab === "aceitos") {
        if (r.status !== "aceito" && r.status !== "orcamento_aprovado") return false;
      } else if (activeTab === "em_andamento") {
        if (!["a_caminho", "chegou", "em_atendimento"].includes(r.status)) return false;
      } else if (activeTab === "concluidos") {
        if (r.status !== "concluido") return false;
      } else if (activeTab === "cancelados") {
        if (r.status !== "cancelado" && r.status !== "em_disputa") return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [requests, activeTab, search]);

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
      await acceptServiceRequestAction(requestId);
    });
  };

  const tabs = [
    { id: "todos", label: "Todos", count: requests.length },
    {
      id: "novos",
      label: "Novos",
      count: requests.filter((r) => r.status === "solicitado" || r.status === "buscando_prestador").length,
    },
    {
      id: "aceitos",
      label: "Aceitos",
      count: requests.filter((r) => r.status === "aceito" || r.status === "orcamento_aprovado").length,
    },
    {
      id: "em_andamento",
      label: "Em Andamento",
      count: requests.filter((r) => ["a_caminho", "chegou", "em_atendimento"].includes(r.status)).length,
    },
    {
      id: "concluidos",
      label: "Concluídos",
      count: requests.filter((r) => r.status === "concluido").length,
    },
    {
      id: "cancelados",
      label: "Cancelados",
      count: requests.filter((r) => r.status === "cancelado" || r.status === "em_disputa").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Gerenciador de Chamados
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Controle o ciclo completo de cada atendimento, desde o aceite até a conclusão.
          </p>
        </div>

        {/* Search */}
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
            placeholder="Buscar por código, cliente..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#0055D4] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icon name="clipboard" size={18} />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A]">Nenhum chamado encontrado nesta aba</h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Novos chamados correspondentes à sua especialidade aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-md">
                    {req.code}
                  </span>
                  <h3 className="text-sm font-bold text-[#0F172A]">{req.title}</h3>
                  <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                    {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      req.status === "concluido"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : req.status === "em_atendimento"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                        : req.status === "a_caminho"
                        ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                        : req.status === "cancelado"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Cliente:</span>{" "}
                  <strong className="text-slate-800">{req.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Localização:</span>{" "}
                  <strong className="text-slate-800">{req.location}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Data/Horário:</span>{" "}
                  <strong className="text-slate-800">
                    {req.scheduledDate || new Date(req.createdAt).toLocaleDateString("pt-BR")}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {req.description}
              </p>

              {/* Progress & Dispatch Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-700">
                  {req.finalAmountCents ? (
                    <span>Valor final: R$ {(req.finalAmountCents / 100).toFixed(2)}</span>
                  ) : req.estimatedAmountCents ? (
                    <span>Orçamento estimado: R$ {(req.estimatedAmountCents / 100).toFixed(2)}</span>
                  ) : (
                    <span className="text-slate-400 font-normal">Valor a definir</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(req.status === "solicitado" || req.status === "buscando_prestador") && (
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      disabled={isPending}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="check-circle" size={13} />
                      <span>Aceitar Chamado</span>
                    </button>
                  )}

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
                      <span>Cheguei ao condomínio</span>
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
  );
}
