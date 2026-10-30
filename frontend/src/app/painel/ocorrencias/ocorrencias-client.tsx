"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
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

// Mapa e formatação amigável das categorias com ícones semânticos
const CATEGORY_MAP: Record<string, { label: string; icon: IconName }> = {
  iluminacao: { label: "Iluminação", icon: "sun" },
  eletrica: { label: "Elétrica", icon: "sparkles" },
  hidraulica: { label: "Hidráulica", icon: "wrench" },
  ruido: { label: "Barulho", icon: "bell" },
  barulho: { label: "Barulho", icon: "bell" },
  seguranca: { label: "Segurança", icon: "shield" },
  convivencia: { label: "Convivência", icon: "users" },
  elevador: { label: "Elevador", icon: "arrow-up-right" },
  portao: { label: "Portão & Acesso", icon: "key" },
  limpeza: { label: "Limpeza", icon: "sparkles" },
  garagem: { label: "Garagem", icon: "truck" },
  estrutura: { label: "Estrutura", icon: "building" },
  vazamento: { label: "Vazamento", icon: "alert" },
  infiltracao: { label: "Infiltração", icon: "alert" },
  piscina: { label: "Piscina", icon: "sun" },
  jardinagem: { label: "Jardinagem", icon: "sun" },
  outros: { label: "Outros", icon: "file-text" },
};

function formatCategory(catKey: string): { label: string; icon: IconName } {
  const normalized = (catKey || "").toLowerCase().trim();
  return (
    CATEGORY_MAP[normalized] || {
      label: catKey ? catKey.charAt(0).toUpperCase() + catKey.slice(1) : "Geral",
      icon: "file-text",
    }
  );
}

// Deduplicação inteligente de localização (Item 12)
function formatCleanLocation(occ: {
  exactLocation?: string | null;
  blockName?: string | null;
  unitNumber?: string | null;
}): string {
  const loc = (occ.exactLocation || "").trim();
  const unitStr = occ.unitNumber ? `Unidade ${occ.unitNumber}` : "";
  const blockStr = occ.blockName ? occ.blockName.trim() : "";
  const combinedUnit = [blockStr, unitStr].filter(Boolean).join(" · ");

  if (!loc) return combinedUnit || "Área comum";
  if (combinedUnit && loc.toLowerCase().includes(unitStr.toLowerCase())) {
    return loc;
  }
  if (combinedUnit && loc.toLowerCase() === combinedUnit.toLowerCase()) {
    return loc;
  }
  if (combinedUnit && loc !== combinedUnit) {
    return `${loc} · ${combinedUnit}`;
  }
  return loc;
}

// Formatação humanizada e concisa de data (Item 13)
function formatCleanDate(date: Date | string | null): { formatted: string; relative: string } {
  if (!date) return { formatted: "Hoje", relative: "recente" };
  const d = new Date(date);
  if (isNaN(d.getTime())) return { formatted: "Hoje", relative: "recente" };

  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const formatted = `${day} ${month} · ${hours}:${minutes}`;
  const relative = timeAgoBR(d);

  return { formatted, relative };
}

// Cores sólidas padrão do Design System: Azul (#1355FF), Amarelo (#FFD000), Verde, Vermelho, Neutros
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  recebida: {
    label: "Recebida",
    badgeBg: "bg-slate-100 border border-slate-200/80",
    badgeText: "text-slate-700",
    dotColor: "bg-slate-400",
  },
  em_analise: {
    label: "Em análise",
    badgeBg: "bg-amber-50 border border-amber-200/80",
    badgeText: "text-amber-800",
    dotColor: "bg-amber-500",
  },
  em_execucao: {
    label: "Em atendimento",
    badgeBg: "bg-blue-50 border border-blue-200/80",
    badgeText: "text-[#1355FF]",
    dotColor: "bg-[#1355FF]",
  },
  em_andamento: {
    label: "Em atendimento",
    badgeBg: "bg-blue-50 border border-blue-200/80",
    badgeText: "text-[#1355FF]",
    dotColor: "bg-[#1355FF]",
  },
  aguardando_morador: {
    label: "Aguardando morador",
    badgeBg: "bg-purple-50 border border-purple-200/80",
    badgeText: "text-purple-700",
    dotColor: "bg-purple-500",
  },
  resolvida: {
    label: "Resolvida",
    badgeBg: "bg-emerald-50 border border-emerald-200/80",
    badgeText: "text-emerald-800",
    dotColor: "bg-emerald-600",
  },
  cancelada: {
    label: "Cancelada",
    badgeBg: "bg-rose-50 border border-rose-200/80",
    badgeText: "text-rose-700",
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
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false); // Filtro visual Com fotos (Item 28)
  const [viewMode, setViewMode] = useState<"cards" | "tabela">("cards"); // Padrão: Cards com foco visual (Item 9, 48)
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Drawer / Detalhes
  const [activeOccurrence, setActiveOccurrence] = useState<OccurrenceItem | null>(null);
  const [lightboxData, setLightboxData] = useState<{ photos: string[]; index: number } | null>(null); // Galeria Lightbox (Item 6, 52)
  const [newCommentText, setNewCommentText] = useState("");
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // Funções de controle do Lightbox (Itens 6, 22, 52)
  function openLightbox(photos: string[], index = 0) {
    if (!photos || photos.length === 0) return;
    setLightboxData({ photos, index });
  }

  function nextLightboxPhoto() {
    if (!lightboxData || lightboxData.photos.length <= 1) return;
    setLightboxData((prev) =>
      prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null
    );
  }

  function prevLightboxPhoto() {
    if (!lightboxData || lightboxData.photos.length <= 1) return;
    setLightboxData((prev) =>
      prev
        ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length }
        : null
    );
  }

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
    if (params.get("criticas") === "1") {
      setNeedsAttentionOnly(true);
      setSelectedSeverity("urgente");
    }
  }, [occurrences]);

  // Lock de scroll e listener Escape/Setas para modais, drawer e lightbox
  useEffect(() => {
    if (!activeOccurrence && !filterModalOpen && !reopenModalOpen && !ratingModalOpen && !lightboxData) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxData) setLightboxData(null);
        else if (ratingModalOpen) setRatingModalOpen(false);
        else if (reopenModalOpen) setReopenModalOpen(false);
        else if (filterModalOpen) setFilterModalOpen(false);
        else if (activeOccurrence) closeOccurrence();
      } else if (lightboxData) {
        if (e.key === "ArrowRight") nextLightboxPhoto();
        if (e.key === "ArrowLeft") prevLightboxPhoto();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeOccurrence, filterModalOpen, reopenModalOpen, ratingModalOpen, lightboxData]);

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

        // Filtro rápido: Somente com fotos (Item 28)
        if (onlyWithPhotos) {
          const hasPhotos = Boolean(occ.attachments && occ.attachments.length > 0);
          if (!hasPhotos) return false;
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
  }, [occurrences, activeTab, needsAttentionOnly, onlyWithPhotos, selectedCategory, selectedSeverity, search, sortBy]);

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
      {/* 1. CABEÇALHO DA PÁGINA */}
      <PageHeader
        icon="clipboard"
        title="Ocorrências"
        description="Acompanhamento e registro de demandas prediais e convivência."
        badge={
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60">
            {occurrences.length} {occurrences.length === 1 ? "registro" : "registros"}
          </span>
        }
        actions={
          <Link
            href="/painel/ocorrencias/nova"
            className="btn-primary min-h-9 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Icon name="plus" size={14} />
            <span>Nova ocorrência</span>
          </Link>
        }
      />

      {/* Alerta de Feedback Global */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={feedback.type === "success" ? "check" : "alert-triangle"}
              size={14}
              className={feedback.type === "success" ? "text-emerald-600" : "text-red-600"}
            />
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* 2. STATUS SEGMENTADO & BUSCA / FILTROS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 overflow-x-auto max-w-full scrollbar-none">
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
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`flex h-4 min-w-[18px] items-center justify-center rounded px-1 text-[10px] tabular-nums font-semibold ${
                    isActive ? "bg-blue-50 text-[#1355FF]" : "bg-slate-200/80 text-slate-600"
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
          <div className="relative w-full sm:w-60">
            <Icon
              name="search"
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar ocorrência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 w-full rounded-md border border-slate-200 bg-white pl-8.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1355FF] focus:ring-1 focus:ring-[#1355FF]/20 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <Icon name="x" size={11} />
              </button>
            )}
          </div>

          {/* Botão de Filtros Adicionais */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`inline-flex h-8.5 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly || onlyWithPhotos
                ? "border-[#1355FF] bg-blue-50 text-[#1355FF]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon name="filter" size={12} />
            <span>Filtros</span>
            {(selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly || onlyWithPhotos) && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#1355FF]" />
            )}
          </button>

          {/* Filtro Rápido: Somente com Fotos (Item 26, 28) */}
          <button
            type="button"
            onClick={() => setOnlyWithPhotos((prev) => !prev)}
            className={`inline-flex h-8.5 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
              onlyWithPhotos
                ? "border-[#1355FF] bg-blue-50 text-[#1355FF] font-semibold"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            title="Filtrar ocorrências que possuem fotos anexadas"
          >
            <Icon name="camera" size={13} className={onlyWithPhotos ? "text-[#1355FF]" : "text-slate-400"} />
            <span>Com fotos</span>
            {onlyWithPhotos && <span className="h-1.5 w-1.5 rounded-full bg-[#1355FF]" />}
          </button>

          {/* Filtro Rápido para Gestão: Precisa de Atenção */}
          {isStaff && (
            <button
              type="button"
              onClick={() => setNeedsAttentionOnly((prev) => !prev)}
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                needsAttentionOnly
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Filtrar ocorrências com atenção prioritária"
            >
              <Icon name="alert-triangle" size={12} className={needsAttentionOnly ? "text-amber-700" : "text-slate-400"} />
              <span className="hidden sm:inline">Prioritárias</span>
            </button>
          )}

          {/* Alternador de Visualização para Staff (Cards visuais / Tabela) */}
          {isStaff && (
            <div className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "cards" ? "bg-slate-100 text-[#1355FF] font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Visualização em Cards com Fotos"
              >
                <Icon name="grid" size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tabela")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "tabela" ? "bg-slate-100 text-[#1355FF] font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Visualização em Tabela"
              >
                <Icon name="menu" size={13} />
              </button>
            </div>
          )}

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1355FF] cursor-pointer"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="prioridade">Prioridade</option>
          </select>
        </div>
      </div>

      {/* 3. VISÃO DE OCORRÊNCIAS COM DESTAQUE VISUAL NAS FOTOS (Itens 1 a 10, 36, 40, 48) */}
      {filteredOccurrences.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-slate-200/90 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-400 mb-3 border border-slate-200/80">
            <Icon name="clipboard" size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma ocorrência encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly || onlyWithPhotos
              ? "Nenhum resultado corresponde aos filtros aplicados. Tente limpar os filtros."
              : "Se você encontrar algum problema ou reparo necessário no condomínio, registre agora."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(search || selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly || onlyWithPhotos) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("todas");
                  setSelectedSeverity("todas");
                  setNeedsAttentionOnly(false);
                  setOnlyWithPhotos(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
            <Link
              href="/painel/ocorrencias/nova"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1355FF] text-white hover:bg-[#0D47E6] px-3.5 py-1.5 text-xs font-semibold transition-colors"
            >
              <Icon name="plus" size={13} strokeWidth={2.5} />
              <span>Registrar ocorrência</span>
            </Link>
          </div>
        </div>
      ) : isStaff && viewMode === "tabela" ? (
        /* Visualização Opcional em Tabela para Gestão */
        <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Ocorrência</th>
                  <th className="px-4 py-2.5">Localização</th>
                  <th className="px-4 py-2.5">Prioridade</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Responsável</th>
                  <th className="px-4 py-2.5">Atualização</th>
                  <th className="px-4 py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOccurrences.map((occ) => {
                  const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
                  const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
                  const cleanLoc = formatCleanLocation(occ);
                  const cleanDate = formatCleanDate(occ.createdAt);

                  return (
                    <tr
                      key={occ.id}
                      onClick={() => openOccurrence(occ)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5 font-mono font-bold text-[#1355FF] whitespace-nowrap">
                        {occ.code}
                      </td>
                      <td className="px-4 py-2.5 max-w-[280px]">
                        <p className="font-bold text-[#0F172A] truncate group-hover:text-[#1355FF] transition-colors">
                          {occ.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {occ.reporterName || "Morador"}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Icon name="map-pin" size={12} className="text-slate-400" />
                          <span className="truncate max-w-[160px]">{cleanLoc}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${sv.badgeBg} ${sv.badgeText}`}>
                          {sv.isUrgent && <Icon name="alert-triangle" size={10} className="text-red-600" />}
                          {sv.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.badgeBg} ${st.badgeText}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {occ.assignedToName ? (
                          <span className="font-semibold text-slate-800">{occ.assignedToName}</span>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Sem responsável</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {cleanDate.relative}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#1355FF] group-hover:translate-x-0.5 inline-flex items-center gap-1 transition-transform">
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
        /* Visualização Primária em Coluna Única: Cards com Destaque nas Fotos (Itens 3, 4, 5, 8, 9, 36, 40, 48) */
        <div className="space-y-3">
          {filteredOccurrences.map((occ) => {
            const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
            const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
            const cat = formatCategory(occ.category);
            const occComments = comments.filter((c) => c.occurrenceId === occ.id);
            const hasPhotos = Boolean(occ.attachments && occ.attachments.length > 0);
            const photos = occ.attachments || [];
            const firstPhoto = hasPhotos ? photos[0] : null;
            const cleanLoc = formatCleanLocation(occ);
            const cleanDate = formatCleanDate(occ.createdAt);

            /* CARD COM FOTO (Itens 3, 4, 5, 6, 7, 36, 48) */
            if (hasPhotos && firstPhoto) {
              return (
                <div
                  key={occ.id}
                  className="group relative flex flex-col sm:flex-row items-stretch rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all overflow-hidden"
                >
                  {/* Coluna da Foto: 25% a 32% no desktop, altura 150-190px, object-cover - Clicar amplia no Lightbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(photos, 0);
                    }}
                    className="w-full sm:w-60 md:w-68 lg:w-72 shrink-0 relative overflow-hidden bg-slate-900 h-44 sm:h-auto min-h-[150px] max-h-[190px] cursor-zoom-in"
                    title="Clique para ampliar a foto no visualizador"
                  >
                    <img
                      src={firstPhoto}
                      alt={occ.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    {/* Overlay sutil ao passar o mouse sobre a foto */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
                        <Icon name="search" size={12} />
                        Ampliar
                      </span>
                    </div>

                    {/* Indicador de Múltiplas Fotos (Item 6, 51) */}
                    {photos.length > 1 && (
                      <div
                        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 shadow-sm"
                        title={`Galeria com ${photos.length} fotos`}
                      >
                        <Icon name="camera" size={12} className="text-white" />
                        <span>+{photos.length - 1}</span>
                      </div>
                    )}

                    {/* Categoria sobre a foto em mobile */}
                    <div className="sm:hidden absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold shadow-sm">
                        <Icon name={cat.icon} size={11} className="text-white shrink-0" />
                        <span>{cat.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Coluna de Conteúdo (68% a 75%) - Clicar abre o Drawer */}
                  <div
                    onClick={() => openOccurrence(occ)}
                    className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between gap-2.5 cursor-pointer"
                  >
                    {/* Linha 1: Badges Superiores */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {occ.code}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.badgeBg} ${st.badgeText}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                        {st.label}
                      </span>

                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-semibold text-slate-600 border border-slate-200/60">
                        <Icon name={cat.icon} size={11} className="text-slate-500 shrink-0" />
                        <span>{cat.label}</span>
                      </span>

                      {/* Prioridade Alta / Urgente (Item 32) */}
                      {sv.isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/60">
                          <Icon name="alert-triangle" size={10} className="text-rose-600 shrink-0" />
                          <span>Alta prioridade</span>
                        </span>
                      )}

                      {/* Novas Mensagens / Atualizações (Item 33) */}
                      {occComments.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1355FF] text-[10px] font-bold border border-blue-200/50">
                          <Icon name="mail" size={10} className="text-[#1355FF] shrink-0" />
                          <span>
                            {occComments.length} {occComments.length === 1 ? "mensagem" : "mensagens"}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Linha 2: Título Principal e Trecho da Descrição (Itens 10, 11) */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1355FF] transition-colors leading-snug tracking-tight">
                        {occ.title}
                      </h3>
                      {occ.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 mt-1 font-normal leading-relaxed">
                          {occ.description}
                        </p>
                      )}
                    </div>

                    {/* Linha 3: Metadados Estruturados (Local, Data, Responsável, Seta) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500 flex-wrap">
                      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                        {/* Local sem duplicação (Item 12) */}
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Icon name="map-pin" size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{cleanLoc}</span>
                        </span>

                        <span className="text-slate-300">•</span>

                        {/* Data simplificada (Item 13) */}
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                          <Icon name="clock" size={11} className="text-slate-400 shrink-0" />
                          <span>{cleanDate.formatted}</span>
                          <span className="text-slate-400 hidden md:inline">({cleanDate.relative})</span>
                        </span>

                        {/* Responsável (Itens 17, 40) */}
                        {occ.assignedToName ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                              <Icon name="user-check" size={11} className="text-slate-500 shrink-0" />
                              <span>{occ.assignedToName}</span>
                            </span>
                          </>
                        ) : isStaff ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                              <Icon name="alert-triangle" size={10} className="text-amber-600 shrink-0" />
                              <span>Sem responsável</span>
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Seta indicativa no final */}
                      <div className="flex items-center gap-1 text-slate-300 group-hover:text-[#1355FF] transition-colors ml-auto">
                        <span className="text-xs font-semibold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver detalhes
                        </span>
                        <Icon name="chevron-right" size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* CARD SEM FOTO — COMPACTO (Itens 8, 37, 48) */
            return (
              <div
                key={occ.id}
                onClick={() => openOccurrence(occ)}
                className="group relative flex items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:py-3.5 sm:px-5 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Linha 1: Badges Superiores */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {occ.code}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.badgeBg} ${st.badgeText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                      {st.label}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-semibold text-slate-600 border border-slate-200/60">
                      <Icon name={cat.icon} size={11} className="text-slate-500 shrink-0" />
                      <span>{cat.label}</span>
                    </span>

                    {sv.isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/60">
                        <Icon name="alert-triangle" size={10} className="text-rose-600 shrink-0" />
                        <span>Alta prioridade</span>
                      </span>
                    )}

                    {occComments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1355FF] text-[10px] font-bold border border-blue-200/50">
                        <Icon name="mail" size={10} className="text-[#1355FF] shrink-0" />
                        <span>
                          {occComments.length} {occComments.length === 1 ? "mensagem" : "mensagens"}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Linha 2: Título Principal e Trecho da Descrição */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1355FF] transition-colors leading-snug tracking-tight">
                      {occ.title}
                    </h3>
                    {occ.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal leading-relaxed">
                        {occ.description}
                      </p>
                    )}
                  </div>

                  {/* Linha 3: Metadados Estruturados */}
                  <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <Icon name="map-pin" size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{cleanLoc}</span>
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                      <Icon name="clock" size={11} className="text-slate-400 shrink-0" />
                      <span>{cleanDate.formatted}</span>
                      <span className="text-slate-400 hidden sm:inline">({cleanDate.relative})</span>
                    </span>

                    {occ.assignedToName ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                          <Icon name="user-check" size={11} className="text-slate-500 shrink-0" />
                          <span>{occ.assignedToName}</span>
                        </span>
                      </>
                    ) : isStaff ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                          <Icon name="alert-triangle" size={10} className="text-amber-600 shrink-0" />
                          <span>Sem responsável</span>
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Seta indicativa no final */}
                <div className="flex items-center gap-1 text-slate-300 group-hover:text-[#1355FF] transition-colors shrink-0 self-center">
                  <span className="text-xs font-semibold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalhes
                  </span>
                  <Icon name="chevron-right" size={14} className="group-hover:translate-x-1 transition-transform" />
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
                  <span className="font-mono text-xs font-bold text-[#1355FF]">
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
              {/* GALERIA DE FOTOS EM DESTAQUE NO TOPO (Itens 17, 18, 20) */}
              {activeOccurrence.attachments && activeOccurrence.attachments.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Registro Fotográfico ({activeOccurrence.attachments.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Icon name="search" size={11} />
                      Clique para ampliar
                    </span>
                  </div>

                  {/* Foto Principal em Destaque */}
                  <div
                    onClick={() => openLightbox(activeOccurrence.attachments!, 0)}
                    className="relative aspect-video sm:aspect-16/10 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 group cursor-zoom-in shadow-xs"
                    title="Clique para abrir foto em tela cheia"
                  >
                    <img
                      src={activeOccurrence.attachments[0]}
                      alt={activeOccurrence.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-xs shadow-md">
                        <Icon name="search" size={13} />
                        Ampliar foto em tela cheia
                      </span>
                    </div>
                    {activeOccurrence.attachments.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-bold backdrop-blur-xs shadow-xs pointer-events-none">
                        1 de {activeOccurrence.attachments.length} fotos
                      </span>
                    )}
                  </div>

                  {/* Faixa de Miniaturas se houver mais de 1 foto */}
                  {activeOccurrence.attachments.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                      {activeOccurrence.attachments.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openLightbox(activeOccurrence.attachments!, idx)}
                          className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-slate-200 hover:border-[#1355FF] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 group"
                        >
                          <img
                            src={src}
                            alt={`Miniatura ${idx + 1}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROGRESSO VISUAL / TIMELINE DE ESTÁGIOS (Seção 12) */}
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
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
                              ? "bg-[#1355FF] text-white ring-4 ring-blue-100"
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


              {/* FERRAMENTAS DO SÍNDICO / STAFF (Seções 29 a 35) */}
              {isStaff && (
                <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1355FF] uppercase tracking-wider">
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
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#1355FF]"
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
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#1355FF]"
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
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#1355FF]"
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
                        className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#1355FF]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/painel/servicos?categoria=${activeOccurrence.category}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1355FF] hover:underline"
                    >
                      <Icon name="briefcase" size={13} />
                      <span>Buscar prestador parceiro</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveAdminDetails}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>Salvar alterações</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AÇÃO DO MORADOR: CONFIRMAÇÃO DE RESOLUÇÃO (Seções 27 e 28) */}
              {isResident && activeOccurrence.status === "resolvida" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-3">
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
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Sim, resolvido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReopenModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
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
                          className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs shadow-2xs ${
                            isCurrentUser
                              ? "bg-[#1355FF] text-white rounded-br-xs"
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
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={isPending || !newCommentText.trim()}
                  className="h-10 px-4 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
          <div className="relative w-full max-w-sm rounded-lg border border-slate-200/90 bg-white p-5 shadow-xl space-y-4">
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
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-semibold text-slate-800"
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
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="todas">Todas as prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Somente com fotos */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyWithPhotos}
                  onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                  className="rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF] h-4 w-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700">Somente ocorrências com fotos</span>
              </label>

              {/* Botões de Ação do Filtro */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("todas");
                    setSelectedSeverity("todas");
                    setNeedsAttentionOnly(false);
                    setOnlyWithPhotos(false);
                    setFilterModalOpen(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Limpar tudo
                </button>

                <button
                  type="button"
                  onClick={() => setFilterModalOpen(false)}
                  className="rounded-md bg-[#1355FF] text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#0D47E6]"
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
          <div className="relative w-full max-w-md rounded-lg border border-slate-200/90 bg-white p-5 shadow-xl space-y-4">
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
              className="w-full rounded-md border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="rounded-md border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReopenOccurrence}
                className="rounded-md bg-[#1355FF] hover:bg-[#0D47E6] text-white px-4 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-50"
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
          <div className="relative w-full max-w-sm rounded-lg border border-slate-200/90 bg-white p-5 shadow-xl space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Icon name="check-circle" size={20} />
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
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#1355FF]"
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
      {/* 8. LIGHTBOX / GALERIA DE FOTOS EM TELA CHEIA (Itens 6, 20, 22, 52)         */}
      {/* ========================================================================= */}
      {lightboxData && lightboxData.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 sm:p-6 select-none animate-in fade-in duration-150"
          onClick={() => setLightboxData(null)}
        >
          {/* Barra Superior: Contador e Botão Fechar */}
          <div className="w-full flex items-center justify-between z-20">
            <span className="text-white/90 text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              Foto {lightboxData.index + 1} de {lightboxData.photos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxData(null)}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar visualizador de fotos"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Área Central: Foto Principal + Setas de Navegação */}
          <div className="relative flex-1 w-full flex items-center justify-center my-3 overflow-hidden">
            {lightboxData.photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightboxPhoto();
                }}
                className="absolute left-2 sm:left-6 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-xl hover:scale-105"
                aria-label="Foto anterior (Seta esquerda)"
              >
                <Icon name="chevron-left" size={24} />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxData.photos[lightboxData.index]}
              alt={`Foto ${lightboxData.index + 1} da ocorrência`}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />

            {lightboxData.photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightboxPhoto();
                }}
                className="absolute right-2 sm:right-6 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-xl hover:scale-105"
                aria-label="Próxima foto (Seta direita)"
              >
                <Icon name="chevron-right" size={24} />
              </button>
            )}
          </div>

          {/* Barra Inferior: Miniaturas */}
          {lightboxData.photos.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1.5 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxData.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxData({ ...lightboxData, index: i })}
                  className={`relative h-14 w-16 sm:h-16 sm:w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    i === lightboxData.index
                      ? "border-[#1355FF] ring-2 ring-blue-500/50 scale-105 opacity-100"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Miniatura ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
