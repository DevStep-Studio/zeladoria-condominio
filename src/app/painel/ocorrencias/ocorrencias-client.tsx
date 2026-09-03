"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";
import {
  updateOccurrenceStatusAction,
  addOccurrenceCommentAction,
  rateOccurrenceAction,
} from "@/lib/actions/ocorrencias";

export type OccurrenceItem = {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  visibility: string;
  status: string;
  exactLocation: string | null;
  actionsTaken: string | null;
  residentRating: number | null;
  residentComment: string | null;
  createdAt: Date | null;
  occurredAt: Date | null;
  resolvedAt: Date | null;
  reportedById: number | null;
  reporterName: string | null;
  unitNumber: string | null;
  blockName: string | null;
};

export type CommentItem = {
  id: number;
  occurrenceId: number;
  body: string;
  createdAt: Date | null;
  userName: string | null;
  userId: number | null;
};

type FilterStatus = "todas" | "recebidas" | "em_execucao" | "concluidas";

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  recebida: { label: "Recebida", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  em_analise: { label: "Em análise", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  em_execucao: { label: "Em execução", bg: "bg-blue-50", text: "text-[#0070F3]", border: "border-blue-200" },
  aguardando_morador: { label: "Aguardando morador", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  resolvida: { label: "Concluída", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelada: { label: "Cancelada", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const SEVERITY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  baixa: { label: "Baixa", bg: "bg-slate-100", text: "text-slate-700" },
  media: { label: "Média", bg: "bg-blue-50", text: "text-[#0070F3]" },
  alta: { label: "Alta", bg: "bg-amber-50", text: "text-amber-700" },
  urgente: { label: "Urgente", bg: "bg-red-50", text: "text-red-600" },
};

export function OcorrenciasClient({
  occurrences,
  comments,
  role,
  currentUserId,
}: {
  occurrences: OccurrenceItem[];
  comments: CommentItem[];
  role: string;
  currentUserId: number;
}) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);
  const [filter, setFilter] = useState<FilterStatus>("todas");
  const [search, setSearch] = useState("");
  const [activeOccurrence, setActiveOccurrence] = useState<OccurrenceItem | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter logic strictly adhering to prompt: Todas, Recebidas, Em execução, Concluídas
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occ) => {
      // Status filter
      if (filter === "recebidas" && occ.status !== "recebida" && occ.status !== "em_analise") {
        return false;
      }
      if (filter === "em_execucao" && occ.status !== "em_execucao" && occ.status !== "em_andamento") {
        return false;
      }
      if (filter === "concluidas" && occ.status !== "resolvida" && occ.status !== "concluido") {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = occ.title.toLowerCase().includes(q);
        const matchesCode = occ.code.toLowerCase().includes(q);
        const matchesCategory = occ.category.toLowerCase().includes(q);
        const matchesLocation = occ.exactLocation?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesCategory && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [occurrences, filter, search]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOccurrence || !newCommentText.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("occurrenceId", String(activeOccurrence.id));
      formData.set("body", newCommentText);
      const res = await addOccurrenceCommentAction(formData);
      if (res?.success) {
        setNewCommentText("");
        setFeedback({ type: "success", msg: "Comentário enviado!" });
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao enviar comentário." });
      }
    });
  };

  const handleUpdateStatus = (status: string) => {
    if (!activeOccurrence) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(activeOccurrence.id));
      formData.set("status", status);
      const res = await updateOccurrenceStatusAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: `Status atualizado para ${status}!` });
        setActiveOccurrence((prev) => (prev ? { ...prev, status } : null));
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao atualizar status." });
      }
    });
  };

  // Real-time status counts for tab badges
  const counts = useMemo(() => {
    return {
      todas: occurrences.length,
      recebidas: occurrences.filter((occ) => occ.status === "recebida" || occ.status === "em_analise").length,
      em_execucao: occurrences.filter((occ) => occ.status === "em_execucao" || occ.status === "em_andamento").length,
      concluidas: occurrences.filter((occ) => occ.status === "resolvida" || occ.status === "concluido").length,
    };
  }, [occurrences]);

  const tabs: { key: FilterStatus; label: string; icon: any; count: number }[] = [
    { key: "todas", label: "Todas", icon: "grid", count: counts.todas },
    { key: "recebidas", label: "Recebidas", icon: "clock", count: counts.recebidas },
    { key: "em_execucao", label: "Em execução", icon: "wrench", count: counts.em_execucao },
    { key: "concluidas", label: "Concluídas", icon: "check-circle", count: counts.concluidas },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <span>Ocorrências</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-bold text-[#0055D4] border border-blue-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
              {occurrences.length} registradas
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Acompanhe, gerencie e registre ocorrências no condomínio
          </p>
        </div>

        <Link
          href="/painel/ocorrencias/nova"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFD000] hover:bg-[#E6BC00] text-[#12162A] px-4 py-2.5 text-xs sm:text-sm font-black shadow-md shadow-[#FFD000]/25 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Icon name="plus" size={15} strokeWidth={2.6} />
          <span>Nova ocorrência</span>
        </Link>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className={`p-3 rounded-[10px] text-xs font-semibold flex items-center justify-between ${
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <span>{feedback.msg}</span>
          <button type="button" onClick={() => setFeedback(null)} className="underline text-[11px] font-bold">
            OK
          </button>
        </div>
      )}

      {/* Filter and Search Bar - Minimalista, Fluido e Coeso com a Home */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Segmented Capsule Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#0055D4] to-[#0070F3] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  name={tab.icon}
                  size={14}
                  strokeWidth={2.2}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span>{tab.label}</span>
                <span
                  className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar + Occurrences Counter */}
        <div className="flex items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Icon
              name="search"
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por código, título ou local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/80 bg-white pl-9.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>

          <span className="hidden sm:inline text-xs font-bold text-slate-400 whitespace-nowrap">
            {filteredOccurrences.length} {filteredOccurrences.length === 1 ? "ocorrência" : "ocorrências"}
          </span>
        </div>
      </div>

      {/* Occurrences List */}
      {filteredOccurrences.length === 0 ? (
        <div className="rounded-[14px] border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
            <Icon name="clipboard" size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma ocorrência encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Não há ocorrências correspondentes aos filtros selecionados.
          </p>
          <Link
            href="/painel/ocorrencias/nova"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-blue-50 text-[#0070F3] hover:bg-blue-100 px-3.5 py-1.5 text-xs font-bold transition-colors"
          >
            <Icon name="plus" size={13} />
            <span>Criar ocorrência</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredOccurrences.map((occ) => {
            const st = STATUS_MAP[occ.status] || STATUS_MAP.recebida;
            const sv = SEVERITY_MAP[occ.severity] || SEVERITY_MAP.media;

            return (
              <div
                key={occ.id}
                onClick={() => setActiveOccurrence(occ)}
                className="cursor-pointer rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#0070F3]">
                        {occ.code}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                        {occ.category}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${sv.bg} ${sv.text}`}>
                        {sv.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                      {occ.title}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {occ.description}
                    </p>

                    {/* Location */}
                    {occ.exactLocation && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 pt-1">
                        <Icon name="map-pin" size={12} className="text-slate-400" />
                        <span>{occ.exactLocation}</span>
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-start">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Drawer */}
      {activeOccurrence && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveOccurrence(null)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#0070F3]">
                  {activeOccurrence.code}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  {activeOccurrence.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveOccurrence(null)}
                className="rounded-[8px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Descrição</span>
                <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                  {activeOccurrence.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Categoria</span>
                  <p className="font-semibold text-slate-800 capitalize mt-0.5">{activeOccurrence.category}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Prioridade</span>
                  <p className="font-semibold text-slate-800 capitalize mt-0.5">{activeOccurrence.severity}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Status</span>
                  <p className="font-semibold text-[#0070F3] capitalize mt-0.5">{activeOccurrence.status}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Data</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Hoje"}
                  </p>
                </div>
              </div>

              {activeOccurrence.exactLocation && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Localização</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeOccurrence.exactLocation}</p>
                </div>
              )}
            </div>

            {/* Staff Status Actions */}
            {isStaff && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
                  Ações do Síndico / Zelador
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus("em_execucao")}
                    className="btn-ghost btn-sm text-xs text-[#0070F3]"
                  >
                    Iniciar Execução
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus("resolvida")}
                    className="btn-primary btn-sm text-xs"
                  >
                    Marcar como Concluída
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus("cancelada")}
                    className="btn-ghost btn-sm text-xs text-red-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Comments Thread */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico & Mensagens
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {comments
                  .filter((c) => c.occurrenceId === activeOccurrence.id)
                  .map((c) => (
                    <div key={c.id} className="p-2.5 rounded-[8px] bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>{c.userName ?? "Usuário"}</span>
                        <span className="text-slate-400 font-normal">
                          {c.createdAt ? dateTimeBR(c.createdAt) : "Agora"}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.body}</p>
                    </div>
                  ))}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Escreva uma mensagem..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 rounded-[8px] border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#0070F3]"
                />
                <button
                  type="submit"
                  disabled={isPending || !newCommentText.trim()}
                  className="btn-primary btn-sm text-xs px-3"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
