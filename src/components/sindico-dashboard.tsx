"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { CondoMap, type CondoMapOccurrence, type CondoCoordinates } from "@/components/condo-map";
import { ackOccurrenceAction } from "@/lib/actions/portaria";
import { createWorkOrderFromOccurrenceAction } from "@/lib/actions/admin";

export type SindicoTodaySummary = {
  expectedVisitors: number;
  authorizedProviders: number;
  todayReservations: number;
  scheduledMaintenances: number;
  inProgressOccurrences: number;
};

export type SmartPreventionAlert = {
  id: string;
  equipmentName: string;
  location: string;
  issueCount: number;
  patternDescription: string;
  recommendedAction: string;
};

export type LogbookEntry = {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  visibility: string;
  occurredAt: string;
  timeAgo: string;
  ackAt: string | null;
  reporterName: string;
  unit?: string;
};

export type ManagementOccurrence = {
  id: number;
  code: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  status: string;
  exactLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  unitNumber?: string | null;
  blockName?: string | null;
  reportedByName?: string | null;
  assignedToName?: string | null;
};

export type AttentionItem = {
  id: string;
  count: number;
  label: string;
  detail?: string;
  href: string;
  urgent?: boolean;
};

export type DashboardOccurrence = {
  id: number;
  code: string;
  title: string;
  location: string;
  category: string;
  severity: string;
  status: string;
  timeAgo: string;
};

export function SindicoDashboard({
  userName,
  condoName,
  attentionItems,
  todaySummary,
  smartAlerts,
  logbookEntries,
  recentActivities,
  mapOccurrences,
  condoCoordinates,
}: {
  userName: string;
  condoName: string;
  attentionItems: AttentionItem[];
  todaySummary: SindicoTodaySummary;
  smartAlerts: SmartPreventionAlert[];
  logbookEntries: LogbookEntry[];
  recentActivities: DashboardOccurrence[];
  mapOccurrences: CondoMapOccurrence[];
  condoCoordinates?: CondoCoordinates;
}) {
  const [selectedOccurrenceForOS, setSelectedOccurrenceForOS] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAck = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await ackOccurrenceAction(formData);
      setFeedback({ type: "success", msg: "Ciência registrada no livro digital da portaria!" });
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleCreateOS = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWorkOrderFromOccurrenceAction(formData);
      setFeedback({ type: "success", msg: "Ordem de serviço criada e vinculada à ocorrência!" });
      setSelectedOccurrenceForOS(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={feedback.type === "success" ? "check" : "alert-triangle"} size={18} />
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {/* 1. Header Greeting */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 bg-[#0055D4] text-white text-xs font-black rounded-lg uppercase tracking-wider">
              Gestão Condominial
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {condoName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Olá, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Veja o que precisa da sua atenção e decisão hoje.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/painel/relatorios"
            className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Icon name="chart" size={16} />
            Relatórios & Auditoria
          </Link>
          <Link
            href="/painel/configuracoes"
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <Icon name="settings" size={16} />
            Configurações
          </Link>
        </div>
      </div>

      {/* 2. Hero Section: PRECISA DA SUA ATENÇÃO */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" size={18} className="text-amber-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Precisa da sua Atenção
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Priorize aprovações e decisões críticas</span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
            <Icon name="check" size={28} className="mx-auto text-emerald-600 mb-2" />
            <p className="text-base font-black">Tudo em dia!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Nenhuma ocorrência crítica, reserva pendente ou manutenção atrasada no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                  item.urgent
                    ? "bg-red-50/60 border-red-200 hover:border-red-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-2xl font-black ${item.urgent ? "text-red-600" : "text-slate-900"}`}>
                    {item.count}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
                    <Icon name="chevron-right" size={18} />
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-bold text-slate-900 leading-snug">{item.label}</p>
                  {item.detail && <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. Ações Rápidas do Síndico */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Icon name="sparkles" size={16} className="text-[#0055D4]" />
          Ações Rápidas de Gestão
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/painel/comunicados"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-start gap-2"
          >
            <span className="p-2 bg-blue-100 text-[#0055D4] rounded-lg">
              <Icon name="mail" size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Criar Comunicado</p>
              <p className="text-[11px] text-slate-500">Enviar aviso geral</p>
            </div>
          </Link>

          <Link
            href="/painel/ordens"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-start gap-2"
          >
            <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Icon name="wrench" size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Ordem de Serviço</p>
              <p className="text-[11px] text-slate-500">Reparo ou equipe</p>
            </div>
          </Link>

          <Link
            href="/painel/manutencao"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-start gap-2"
          >
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Cadastrar Manutenção</p>
              <p className="text-[11px] text-slate-500">Plano preventivo</p>
            </div>
          </Link>

          <Link
            href="/painel/servicos"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-start gap-2"
          >
            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Icon name="briefcase" size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Contratar Prestador</p>
              <p className="text-[11px] text-slate-500">Marketplace parceiro</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Resumo Compacto: HOJE NO CONDOMÍNIO */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="calendar" size={18} className="text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider">Hoje no Condomínio</h2>
          </div>
          <span className="text-xs text-slate-400">Resumo da rotina em andamento</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-black text-amber-400">{todaySummary.expectedVisitors}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">Visitantes previstos</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-black text-blue-400">{todaySummary.authorizedProviders}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">Prestadores autorizados</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-black text-emerald-400">{todaySummary.todayReservations}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">Reservas hoje</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-black text-purple-400">{todaySummary.scheduledMaintenances}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">Manutenções agendadas</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-black text-red-400">{todaySummary.inProgressOccurrences}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">Ocorrências abertas</p>
          </div>
        </div>
      </div>

      {/* 5. Prevenção Inteligente & Alertas de Ativos */}
      {smartAlerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="shield" size={18} className="text-amber-600" />
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                Prevenção Inteligente & Ativos Críticos
              </h2>
            </div>
            <span className="text-xs text-amber-800 font-medium">Diagnóstico proativo baseado em histórico</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartAlerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-slate-900 text-sm">{alert.equipmentName}</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                      {alert.location}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{alert.patternDescription}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">{alert.recommendedAction}</span>
                  <Link
                    href="/painel/manutencao"
                    className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Livro Digital da Portaria & Ocorrências em Andamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Livro Digital */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="book" size={18} className="text-[#0055D4]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Livro Digital da Portaria
              </h3>
            </div>
            <Link href="/painel/livro" className="text-xs font-bold text-[#0055D4] hover:underline">
              Ver todos
            </Link>
          </div>

          {logbookEntries.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Nenhum registro no livro digital recentemente.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {logbookEntries.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-700">{log.code}</span>
                      <span className="text-xs font-bold text-slate-900">{log.title}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{log.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{log.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {log.reporterName} {log.unit ? `· ${log.unit}` : ""} · {log.timeAgo}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1 items-end">
                    {!log.ackAt ? (
                      <button
                        onClick={() => handleAck(log.id)}
                        disabled={isPending}
                        className="px-2.5 py-1 bg-[#0055D4] text-white text-[11px] font-bold rounded-lg hover:bg-[#0044AA]"
                      >
                        Dar Ciência
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                        Ciência dada
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedOccurrenceForOS(log.id)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900"
                    >
                      + Criar OS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ocorrências Recentes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="clipboard" size={18} className="text-[#0055D4]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Ocorrências em Andamento
              </h3>
            </div>
            <Link href="/painel/ocorrencias" className="text-xs font-bold text-[#0055D4] hover:underline">
              Gerenciar todas
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Nenhuma ocorrência em andamento.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((occ) => (
                <div key={occ.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-700">{occ.code}</span>
                      <span className="text-xs font-bold text-slate-900">{occ.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {occ.location} · Status: <strong>{occ.status}</strong> · {occ.timeAgo}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOccurrenceForOS(occ.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    Gerar OS
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Mapa Operacional */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="grid" size={18} className="text-[#0055D4]" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Mapa Operacional de Ocorrências e Equipamentos
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Visualização geolocalizada no condomínio</span>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <CondoMap
            occurrences={mapOccurrences}
            condo={condoCoordinates}
          />
        </div>
      </div>

      {/* MODAL: CRIAR OS A PARTIR DE OCORRÊNCIA */}
      {selectedOccurrenceForOS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="wrench" size={20} className="text-[#0055D4]" />
                Criar Ordem de Serviço
              </h3>
              <button onClick={() => setSelectedOccurrenceForOS(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="space-y-3 mt-4 text-xs">
              <input type="hidden" name="occurrenceId" value={selectedOccurrenceForOS} />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Ordem de Serviço</label>
                <input name="title" required placeholder="Ex: Reparo hidráulico urgente" className="w-full input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Prevista de Execução</label>
                  <input type="date" name="scheduledFor" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Estimado (R$)</label>
                  <input name="cost" placeholder="0,00" className="w-full input text-sm" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Técnico / Responsável Designado</label>
                <input name="technician" placeholder="Ex: Equipe de Manutenção Interna ou Empresa" className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedOccurrenceForOS(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-[#0055D4] text-white rounded-xl font-bold">
                  {isPending ? "Criando OS..." : "Criar Ordem & Atualizar Ocorrência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
