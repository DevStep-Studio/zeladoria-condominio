"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { dateTimeBR, timeAgoBR } from "@/lib/utils";
import {
  updateOccurrenceStatusAction,
  updateOccurrenceDetailsAction,
  reopenOccurrenceAction,
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
  attachments: string[] | null;
  residentRating: number | null;
  residentComment: string | null;
  createdAt: Date | null;
  occurredAt: Date | null;
  resolvedAt: Date | null;
  reportedById: number | null;
  reporterName: string | null;
  unitNumber: string | null;
  blockName: string | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
};

export type CommentItem = {
  id: number;
  occurrenceId: number;
  body: string;
  createdAt: Date | null;
  userName: string | null;
  userId: number | null;
};

export type StaffMember = {
  id: number;
  name: string;
  role: string;
};

type FilterTab = "todas" | "recebidas" | "em_atendimento" | "concluidas";

// Cores sólidas padrão do Design System: Azul (#0055D4), Amarelo (#FFD000), Verde, Vermelho, Neutros
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  recebida: {
    label: "Recebida",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    dotColor: "bg-slate-400",
  },
  em_analise: {
    label: "Em análise",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    dotColor: "bg-[#FFD000]",
  },
  em_execucao: {
    label: "Em atendimento",
    badgeBg: "bg-blue-100",
    badgeText: "text-[#0055D4]",
    dotColor: "bg-[#0055D4]",
  },
  em_andamento: {
    label: "Em atendimento",
    badgeBg: "bg-blue-100",
    badgeText: "text-[#0055D4]",
    dotColor: "bg-[#0055D4]",
  },
  aguardando_morador: {
    label: "Aguardando morador",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    dotColor: "bg-purple-500",
  },
  resolvida: {
    label: "Resolvida",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    dotColor: "bg-emerald-600",
  },
  cancelada: {
    label: "Cancelada",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    dotColor: "bg-rose-500",
  },
};

const SEVERITY_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string; isUrgent?: boolean }> = {
  baixa: { label: "Baixa", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  media: { label: "Média", badgeBg: "bg-blue-50", badgeText: "text-blue-700" },
  alta: { label: "Alta", badgeBg: "bg-amber-50", badgeText: "text-amber-800" },
  urgente: { label: "Urgente", badgeBg: "bg-red-50", badgeText: "text-red-700", isUrgent: true },
};

export function OcorrenciasClient({
  occurrences,
  comments,
  staffMembers = [],
  role,
  currentUserId,
  currentUserName,
}: {
  occurrences: OccurrenceItem[];
  comments: CommentItem[];
  staffMembers?: StaffMember[];
  role: string;
  currentUserId: number;
  currentUserName?: string;
}) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);
  const isResident = role === "morador";

  // Estados principais
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recentes" | "antigas" | "prioridade">("recentes");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("todas");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Drawer / Detalhes
  const [activeOccurrence, setActiveOccurrence] = useState<OccurrenceItem | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // Edição administrativa in-drawer
  const [adminStatus, setAdminStatus] = useState<string>("");
  const [adminSeverity, setAdminSeverity] = useState<string>("");
  const [adminAssignedId, setAdminAssignedId] = useState<string>("");
  const [adminActionsTaken, setAdminActionsTaken] = useState<string>("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sincronização via URL (Deep Linking & Reload Preservation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get("highlight") || params.get("id");
    if (highlight) {
      const match = occurrences.find(
        (o) => o.code.toLowerCase() === highlight.toLowerCase() || String(o.id) === highlight
      );
      if (match) {
        openOccurrence(match, false);
      }
    }
  }, [occurrences]);

  function openOccurrence(occ: OccurrenceItem, updateUrl = true) {
    setActiveOccurrence(occ);
    setAdminStatus(occ.status);
    setAdminSeverity(occ.severity);
    setAdminAssignedId(occ.assignedToId ? String(occ.assignedToId) : "none");
    setAdminActionsTaken(occ.actionsTaken || "");

    if (updateUrl && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("highlight", occ.code);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function closeOccurrence() {
    setActiveOccurrence(null);
    setReopenModalOpen(false);
    setRatingModalOpen(false);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("highlight");
      url.searchParams.delete("id");
      window.history.replaceState(null, "", url.toString());
    }
  }

  // Contadores reais por status para as Tabs
  const counts = useMemo(() => {
    return {
      todas: occurrences.length,
      recebidas: occurrences.filter((occ) => occ.status === "recebida" || occ.status === "em_analise").length,
      em_atendimento: occurrences.filter(
        (occ) =>
          occ.status === "em_execucao" ||
          occ.status === "em_andamento" ||
          occ.status === "aguardando_morador"
      ).length,
      concluidas: occurrences.filter((occ) => occ.status === "resolvida" || occ.status === "cancelada").length,
    };
  }, [occurrences]);

  // Filtragem e ordenação
  const filteredOccurrences = useMemo(() => {
    return occurrences
      .filter((occ) => {
        // Tab de status
        if (activeTab === "recebidas" && occ.status !== "recebida" && occ.status !== "em_analise") {
          return false;
        }
        if (
          activeTab === "em_atendimento" &&
          occ.status !== "em_execucao" &&
          occ.status !== "em_andamento" &&
          occ.status !== "aguardando_morador"
        ) {
          return false;
        }
        if (activeTab === "concluidas" && occ.status !== "resolvida" && occ.status !== "cancelada") {
          return false;
        }

        // Filtro rápido: Precisa de atenção (para Síndico)
        if (needsAttentionOnly) {
          const isUrgent = occ.severity === "urgente";
          const noResponsible = !occ.assignedToId;
          const isPendingStaff = occ.status === "recebida" || occ.status === "em_analise";
          if (!isUrgent && !noResponsible && !isPendingStaff) return false;
        }

        // Categoria
        if (selectedCategory !== "todas" && occ.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Severidade / Prioridade
        if (selectedSeverity !== "todas" && occ.severity.toLowerCase() !== selectedSeverity.toLowerCase()) {
          return false;
        }

        // Busca livre (código, título, local, categoria, morador)
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesTitle = occ.title.toLowerCase().includes(q);
          const matchesCode = occ.code.toLowerCase().includes(q);
          const matchesLocation = occ.exactLocation?.toLowerCase().includes(q);
          const matchesCategory = occ.category.toLowerCase().includes(q);
          const matchesReporter = occ.reporterName?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCode && !matchesLocation && !matchesCategory && !matchesReporter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "antigas") {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA - tB;
        }
        if (sortBy === "prioridade") {
          const weight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };
          return (weight[b.severity] || 0) - (weight[a.severity] || 0);
        }
        // Padrão: mais recentes primeiro
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
  }, [occurrences, activeTab, needsAttentionOnly, selectedCategory, selectedSeverity, search, sortBy]);

  // Lista de categorias únicas para filtro
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    occurrences.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, [occurrences]);

  // Comentários da ocorrência ativa
  const activeComments = useMemo(() => {
    if (!activeOccurrence) return [];
    return comments.filter((c) => c.occurrenceId === activeOccurrence.id);
  }, [comments, activeOccurrence]);

  // Ação: Enviar Comentário / Mensagem
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
        setFeedback({ type: "success", msg: "Mensagem enviada com sucesso!" });
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao enviar mensagem." });
      }
    });
  };

  // Ação: Síndico Salvar Alterações de Status, Prioridade e Responsável
  const handleSaveAdminDetails = () => {
    if (!activeOccurrence) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(activeOccurrence.id));
      formData.set("status", adminStatus);
      formData.set("severity", adminSeverity);
      formData.set("assignedToId", adminAssignedId);
      formData.set("actionsTaken", adminActionsTaken);

      const res = await updateOccurrenceDetailsAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Ocorrência atualizada com sucesso!" });
        setActiveOccurrence((prev) =>
          prev
            ? {
                ...prev,
                status: adminStatus,
                severity: adminSeverity,
                assignedToId: adminAssignedId === "none" ? null : Number(adminAssignedId),
                actionsTaken: adminActionsTaken,
              }
            : null
        );
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao atualizar ocorrência." });
      }
    });
  };

  // Ação: Morador Reabrir Ocorrência
  const handleReopenOccurrence = () => {
    if (!activeOccurrence) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(activeOccurrence.id));
      formData.set("reason", reopenReason.trim() || "Morador indicou que o problema ainda persiste.");

      const res = await reopenOccurrenceAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Ocorrência reaberta e notificada à administração." });
        setReopenModalOpen(false);
        setActiveOccurrence((prev) => (prev ? { ...prev, status: "em_analise" } : null));
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao reabrir ocorrência." });
      }
    });
  };

  // Ação: Morador Confirmar Resolução com Avaliação
  const handleConfirmResolution = () => {
    if (!activeOccurrence) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(activeOccurrence.id));
      formData.set("rating", String(ratingStars));
      formData.set("residentComment", ratingComment.trim());

      const res = await rateOccurrenceAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Resolução confirmada! Obrigado pela avaliação." });
        setRatingModalOpen(false);
        setActiveOccurrence((prev) =>
          prev ? { ...prev, residentRating: ratingStars, residentComment: ratingComment.trim() } : null
        );
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao registrar avaliação." });
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. CABEÇALHO DA PÁGINA (Conforme Seção 4 do Spec) */}
      <PageHeader
        icon="clipboard"
        title="Ocorrências"
        description="Acompanhe os problemas e solicitações do seu condomínio."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0055D4] border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
            {occurrences.length} {occurrences.length === 1 ? "registro" : "registros"}
          </span>
        }
        actions={
          <Link
            href="/painel/ocorrencias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFD000] hover:bg-[#FFE04D] active:bg-[#E6BB00] text-[#12162A] px-4 py-2 text-xs sm:text-sm font-black shadow-xs transition-colors cursor-pointer"
          >
            <Icon name="plus" size={15} strokeWidth={2.6} />
            <span>+ Nova ocorrência</span>
          </Link>
        }
      />

      {/* Alerta de Feedback Global */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={feedback.type === "success" ? "check-circle" : "alert-triangle"}
              size={15}
              className={feedback.type === "success" ? "text-emerald-600" : "text-red-600"}
            />
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* 2. RESUMO DE STATUS (TABS COMPACTAS) & BUSCA / FILTROS (Conforme Seções 5, 14, 15) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Tabs Compactas Segmentadas com Contadores Reais */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
          {[
            { key: "todas" as FilterTab, label: "Todas", count: counts.todas },
            { key: "recebidas" as FilterTab, label: "Recebidas", count: counts.recebidas },
            { key: "em_atendimento" as FilterTab, label: "Em atendimento", count: counts.em_atendimento },
            { key: "concluidas" as FilterTab, label: "Concluídas", count: counts.concluidas },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#0055D4] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de Busca + Botão Filtros + Ordenação */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Icon
              name="search"
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar ocorrência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          {/* Botão de Filtros Adicionais */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer ${
              selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly
                ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon name="filter" size={13} />
            <span>Filtros</span>
            {(selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly) && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
            )}
          </button>

          {/* Filtro Rápido para Gestão: Precisa de Atenção */}
          {isStaff && (
            <button
              type="button"
              onClick={() => setNeedsAttentionOnly((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer ${
                needsAttentionOnly
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Filtrar ocorrências urgentes, atrasadas ou sem responsável"
            >
              <Icon name="alert-triangle" size={13} className={needsAttentionOnly ? "text-red-600" : "text-slate-400"} />
              <span className="hidden sm:inline">Precisa de atenção</span>
            </button>
          )}

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0055D4] cursor-pointer"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="prioridade">Maior prioridade</option>
          </select>
        </div>
      </div>

      {/* 3. VISÃO DO MORADOR OU GESTOR (Conforme Seções 6, 7, 8, 9, 30) */}
      {filteredOccurrences.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3 border border-slate-100">
            <Icon name="clipboard" size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma ocorrência encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly
              ? "Nenhum resultado corresponde aos filtros aplicados. Tente limpar os filtros."
              : "Se você encontrar algum problema ou reparo necessário no condomínio, registre agora."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(search || selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("todas");
                  setSelectedSeverity("todas");
                  setNeedsAttentionOnly(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
            <Link
              href="/painel/ocorrencias/nova"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0055D4] text-white hover:bg-[#0047BA] px-3.5 py-1.5 text-xs font-bold transition-colors"
            >
              <Icon name="plus" size={13} strokeWidth={2.5} />
              <span>Registrar ocorrência</span>
            </Link>
          </div>
        </div>
      ) : isStaff ? (
        /* ========================================================================= */
        /* TABELA DE GESTÃO PARA SÍNDICO / STAFF (Desktop Denso, Mobile Compacto)     */
        /* ========================================================================= */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Ocorrência</th>
                  <th className="px-4 py-3">Localização</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Atualização</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOccurrences.map((occ) => {
                  const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
                  const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;

                  return (
                    <tr
                      key={occ.id}
                      onClick={() => openOccurrence(occ)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Código */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0055D4] whitespace-nowrap">
                        {occ.code}
                      </td>

                      {/* Título + Morador */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <p className="font-bold text-[#0F172A] truncate group-hover:text-[#0055D4] transition-colors">
                          {occ.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {occ.reporterName || "Morador"}
                          {occ.unitNumber ? ` · Unidade ${occ.unitNumber}` : ""}
                        </p>
                      </td>

                      {/* Localização */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Icon name="map-pin" size={12} className="text-slate-400" />
                          <span className="truncate max-w-[160px]">{occ.exactLocation || "Área comum"}</span>
                        </span>
                      </td>

                      {/* Prioridade */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${sv.badgeBg} ${sv.badgeText}`}
                        >
                          {sv.isUrgent && <Icon name="alert-triangle" size={10} className="text-red-600" />}
                          {sv.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.badgeBg} ${st.badgeText}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Responsável */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {occ.assignedToName ? (
                          <span className="font-semibold text-slate-800">{occ.assignedToName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Sem responsável</span>
                        )}
                      </td>

                      {/* Atualização */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {timeAgoBR(occ.createdAt)}
                      </td>

                      {/* Ação */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-[#0055D4] group-hover:translate-x-0.5 inline-flex items-center gap-1 transition-transform">
                          Ver detalhe
                          <Icon name="chevron-right" size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISÃO DO MORADOR: LINHAS / CARDS COMPACTOS (Conforme Seções 6, 7, 8, 9)   */
        /* ========================================================================= */
        <div className="space-y-2.5">
          {filteredOccurrences.map((occ) => {
            const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
            const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
            const hasComments = comments.some((c) => c.occurrenceId === occ.id);

            return (
              <div
                key={occ.id}
                onClick={() => openOccurrence(occ)}
                className="group relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Linha 1: Código + Status + Tag Categoria */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#0055D4]">
                      {occ.code}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.badgeBg} ${st.badgeText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                      {st.label}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-semibold text-slate-500 capitalize border border-slate-200/60">
                      {occ.category}
                    </span>

                    {sv.isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold">
                        <Icon name="alert-triangle" size={10} className="text-red-600" />
                        Urgente
                      </span>
                    )}

                    {hasComments && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0055D4]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
                        Atualização
                      </span>
                    )}
                  </div>

                  {/* Linha 2: Título Principal */}
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#0055D4] transition-colors leading-snug">
                    {occ.title}
                  </h3>

                  {/* Linha 3: Localização com Pin + Data do Ocorrido */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Icon name="map-pin" size={12} className="text-slate-400" />
                      <span>{occ.exactLocation || "Área comum"}</span>
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Última atualização: {timeAgoBR(occ.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Seta Chevron Indicativa */}
                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full text-slate-300 group-hover:text-[#0055D4] group-hover:translate-x-0.5 transition-all">
                  <Icon name="chevron-right" size={18} strokeWidth={2.2} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DRAWER LATERAL DE DETALHES (Desktop 480-520px / Mobile Full-Screen)   */}
      {/* (Conforme Seções 17 a 25, 58)                                             */}
      {/* ========================================================================= */}
      {activeOccurrence && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop escurecido */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={closeOccurrence}
            aria-hidden
          />

          <aside className="absolute inset-y-0 right-0 w-full sm:max-w-xl md:max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* CABEÇALHO DO DRAWER (Seção 18) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-white shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0055D4]">
                    {activeOccurrence.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).badgeBg
                    } ${(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).badgeText}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        (STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).dotColor
                      }`}
                    />
                    {(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).label}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                  {activeOccurrence.title}
                </h2>

                <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Icon name="map-pin" size={13} className="text-slate-400" />
                  <span>{activeOccurrence.exactLocation || "Área comum"}</span>
                  <span>•</span>
                  <span>{activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Hoje"}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeOccurrence}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* CORPO DO DRAWER ROLÁVEL */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {/* PROGRESSO VISUAL / TIMELINE DE ESTÁGIOS (Seção 12) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Andamento da Ocorrência
                </span>

                <div className="space-y-2.5">
                  {[
                    {
                      label: "Registrada pelo morador",
                      date: activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : null,
                      isDone: true,
                    },
                    {
                      label: "Recebida pela administração",
                      date: activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : null,
                      isDone: true,
                    },
                    {
                      label: "Em análise",
                      date: null,
                      isDone: ["em_analise", "em_execucao", "em_andamento", "resolvida"].includes(
                        activeOccurrence.status
                      ),
                      isCurrent: activeOccurrence.status === "em_analise",
                    },
                    {
                      label: "Em atendimento / Manutenção",
                      date: null,
                      isDone: ["em_execucao", "em_andamento", "resolvida"].includes(activeOccurrence.status),
                      isCurrent: ["em_execucao", "em_andamento"].includes(activeOccurrence.status),
                    },
                    {
                      label: "Resolvida",
                      date: activeOccurrence.resolvedAt ? dateTimeBR(activeOccurrence.resolvedAt) : null,
                      isDone: activeOccurrence.status === "resolvida",
                      isCurrent: activeOccurrence.status === "resolvida",
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="flex flex-col items-center mt-0.5">
                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${
                            step.isDone
                              ? "bg-emerald-500 text-white"
                              : step.isCurrent
                              ? "bg-[#0055D4] text-white ring-4 ring-blue-100"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {step.isDone ? "✓" : step.isCurrent ? "●" : "○"}
                        </div>
                        {idx < 4 && <div className="w-0.5 h-3 bg-slate-200 mt-1" />}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-bold ${
                            step.isDone || step.isCurrent ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.date && <p className="text-[10px] text-slate-400 font-medium">{step.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESCRIÇÃO (Texto normal e limpo, sem textarea cinza - Seção 19) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Descrição detalhada
                </span>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {activeOccurrence.description}
                </div>
              </div>

              {/* DADOS DE CONTEXTO (Categoria, Severidade, Unidade) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Categoria</span>
                  <p className="font-bold text-slate-800 capitalize mt-0.5">{activeOccurrence.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Prioridade</span>
                  <p className="font-bold text-slate-800 capitalize mt-0.5">{activeOccurrence.severity}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Unidade / Autor</span>
                  <p className="font-bold text-slate-800 truncate mt-0.5">
                    {activeOccurrence.reporterName || "Morador"}
                    {activeOccurrence.unitNumber ? ` (${activeOccurrence.unitNumber})` : ""}
                  </p>
                </div>
              </div>

              {/* FOTOS ANEXADAS (Seção 20) */}
              {activeOccurrence.attachments && activeOccurrence.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Fotos anexadas ({activeOccurrence.attachments.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {activeOccurrence.attachments.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightbox(src)}
                        className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-transform hover:scale-102 cursor-pointer shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Foto ${idx + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FERRAMENTAS DO SÍNDICO / STAFF (Seções 29 a 35) */}
              {isStaff && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0055D4] uppercase tracking-wider">
                      Gestão da Ocorrência
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Acesso Síndico / Gestor</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Alteração Rápida de Status */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Status</label>
                      <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055D4]"
                      >
                        <option value="recebida">Recebida</option>
                        <option value="em_analise">Em análise</option>
                        <option value="em_execucao">Em atendimento</option>
                        <option value="aguardando_morador">Aguardando morador</option>
                        <option value="resolvida">Resolvida</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>

                    {/* Alteração de Severidade */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Prioridade</label>
                      <select
                        value={adminSeverity}
                        onChange={(e) => setAdminSeverity(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055D4]"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    {/* Atribuição de Responsável */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Atribuir Responsável</label>
                      <select
                        value={adminAssignedId}
                        onChange={(e) => setAdminAssignedId(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0055D4]"
                      >
                        <option value="none">— Sem responsável atribuído —</option>
                        {staffMembers.map((m) => (
                          <option key={m.id} value={String(m.id)}>
                            {m.name} ({m.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Parecer / Ações Tomadas */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Ações Tomadas / Parecer</label>
                      <input
                        type="text"
                        value={adminActionsTaken}
                        onChange={(e) => setAdminActionsTaken(e.target.value)}
                        placeholder="Ex: Equipe de manutenção esteve no local..."
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/painel/servicos?categoria=${activeOccurrence.category}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0055D4] hover:underline"
                    >
                      <Icon name="briefcase" size={13} />
                      <span>Buscar prestador parceiro</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveAdminDetails}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>Salvar alterações</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AÇÃO DO MORADOR: CONFIRMAÇÃO DE RESOLUÇÃO (Seções 27 e 28) */}
              {isResident && activeOccurrence.status === "resolvida" && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Icon name="check-circle" size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">Esta ocorrência foi resolvida?</h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        A administração marcou este chamado como concluído. Por favor, confirme se o problema foi
                        realmente solucionado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRatingModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>Sim, resolvido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReopenModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>Ainda existe problema</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CONVERSA CONTEXTUAL / MENSAGENS (Seções 22 a 24, 58) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Histórico & Mensagens
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {activeComments.length} {activeComments.length === 1 ? "mensagem" : "mensagens"}
                  </span>
                </div>

                {/* Linha do tempo das mensagens */}
                <div className="space-y-3">
                  {/* Evento inicial do sistema */}
                  <div className="text-center py-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                      Ocorrência registrada no sistema •{" "}
                      {activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Hoje"}
                    </span>
                  </div>

                  {activeComments.map((c) => {
                    const isCurrentUser = c.userId === currentUserId;

                    return (
                      <div
                        key={c.id}
                        className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                            isCurrentUser
                              ? "bg-[#0055D4] text-white rounded-br-xs"
                              : "bg-slate-100 text-slate-800 rounded-bl-xs"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 text-[10px] font-bold mb-1 ${
                              isCurrentUser ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            <span>{c.userName || "Usuário"}</span>
                            <span>•</span>
                            <span>{c.createdAt ? dateTimeBR(c.createdAt) : "Agora"}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-line">{c.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ENTRADA DE MENSAGEM FIXA INFERIOR (Seção 23) */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escreva uma mensagem para a administração..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={isPending || !newCommentText.trim()}
                  className="h-10 px-4 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>Enviar</span>
                  <Icon name="arrow-right" size={13} strokeWidth={2.4} />
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE FILTROS AVANÇADOS (POPOVER / DRAWER - Seção 15)               */}
      {/* ========================================================================= */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Filtros da Lista</h3>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Categoria */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="todas">Todas as categorias</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Prioridade</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="todas">Todas as prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Botões de Ação do Filtro */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("todas");
                    setSelectedSeverity("todas");
                    setNeedsAttentionOnly(false);
                    setFilterModalOpen(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Limpar tudo
                </button>

                <button
                  type="button"
                  onClick={() => setFilterModalOpen(false)}
                  className="rounded-xl bg-[#0055D4] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#0047BA]"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE REABERTURA (Seção 28)                                         */}
      {/* ========================================================================= */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReopenModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="alert-triangle" size={18} className="text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Reabrir Ocorrência</h3>
              </div>
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Informe o que ainda precisa de atenção para que a equipe administrativa e de manutenção retome o
              atendimento.
            </p>

            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Descreva o que ainda não foi solucionado..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReopenOccurrence}
                className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50"
              >
                Confirmar reabertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE AVALIAÇÃO DE RESOLUÇÃO (Seção 27)                             */}
      {/* ========================================================================= */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRatingModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="check-circle" size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Avaliar Atendimento</h3>
              <p className="text-xs text-slate-500 mt-1">Como você avalia a resolução deste chamado?</p>
            </div>

            {/* 1-5 Estrelas */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1 text-[#FFD000] hover:scale-115 transition-transform cursor-pointer"
                >
                  <Icon
                    name="star"
                    size={26}
                    className={star <= ratingStars ? "fill-[#FFD000] text-[#FFD000]" : "text-slate-200 fill-slate-200"}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Deixe um comentário opcional sobre a equipe..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmResolution}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50"
              >
                Enviar avaliação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. LIGHTBOX DE IMAGENS (Seção 20)                                         */}
      {/* ========================================================================= */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Icon name="x" size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Foto ampliada da ocorrência"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
