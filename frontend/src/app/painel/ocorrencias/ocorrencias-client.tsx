"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  INTERNAL_BTN_PRIMARY_CLS,
  INTERNAL_BTN_SECONDARY_CLS,
  INTERNAL_SELECT_CLS,
  INTERNAL_TEXTAREA_CLS,
  InternalDataTable,
  InternalEmptyState,
  InternalFormField,
  InternalPageHeader,
  InternalPageLayout,
  InternalSectionCard,
  InternalStatGrid,
  InternalStatusBadge,
  InternalTimeline,
  type InternalTimelineStep,
  type InternalTone,
} from "@/components/internal/internal-ui";
import {
  InternalDetailPanel,
  InternalDrawer,
  InternalFilterBar,
  InternalModal,
  InternalSearchInput,
  InternalStatFilterCard,
  InternalTabStrip,
  InternalViewToggle,
} from "@/components/internal/internal-interactive";
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

// Cores sólidas padrão do Design System: Azul (#1455FF), Amarelo (#FFD000), Verde, Vermelho, Neutros
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
    badgeText: "text-[#1455FF]",
    dotColor: "bg-[#1455FF]",
  },
  em_andamento: {
    label: "Em atendimento",
    badgeBg: "bg-blue-50 border border-blue-200/80",
    badgeText: "text-[#1455FF]",
    dotColor: "bg-[#1455FF]",
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
  const [viewMode, setViewMode] = useState<"cards" | "tabela">("cards"); // Cards ou Lista/Tabela para todos os perfis
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Persistência segura da preferência de visualização no navegador
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("zc_ocorrencias_view_v1");
      if (saved === "cards" || saved === "tabela") setViewMode(saved);
    } catch {
      // ignora restrições de storage
    }
  }, []);

  function handleChangeViewMode(nextMode: "cards" | "tabela") {
    setViewMode(nextMode);
    try {
      window.localStorage.setItem("zc_ocorrencias_view_v1", nextMode);
    } catch {
      // ignora restrições de storage
    }
  }

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
    <InternalPageLayout>
      {/* 1. CABEÇALHO DA PÁGINA */}
      <InternalPageHeader
        icon="clipboard"
        title="Ocorrências"
        description="Acompanhe solicitações e manutenções do condomínio."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Ocorrências" },
        ]}
        badge={
          <InternalStatusBadge tone="blue">
            {occurrences.length} {occurrences.length === 1 ? "registro" : "registros"}
          </InternalStatusBadge>
        }
        actions={
          <Link href="/painel/ocorrencias/nova" className={INTERNAL_BTN_PRIMARY_CLS}>
            <Icon name="plus" size={15} strokeWidth={2.5} />
            <span>Nova ocorrência</span>
          </Link>
        }
      />

      {/* 2. INDICADORES COMPACTOS COM DADOS REAIS */}
      <InternalStatGrid columns={4}>
        <InternalStatFilterCard
          label="Recebidas"
          value={counts.recebidas}
          hint="aguardando análise"
          icon="inbox"
          tone="amber"
          active={activeTab === "recebidas"}
          onClick={() => setActiveTab((prev) => (prev === "recebidas" ? "todas" : "recebidas"))}
        />
        <InternalStatFilterCard
          label="Em atendimento"
          value={counts.em_atendimento}
          hint="em andamento"
          icon="wrench"
          tone="blue"
          active={activeTab === "em_atendimento"}
          onClick={() => setActiveTab((prev) => (prev === "em_atendimento" ? "todas" : "em_atendimento"))}
        />
        <InternalStatFilterCard
          label="Concluídas"
          value={counts.concluidas}
          hint="resolvidas"
          icon="check-circle"
          tone="green"
          active={activeTab === "concluidas"}
          onClick={() => setActiveTab((prev) => (prev === "concluidas" ? "todas" : "concluidas"))}
        />
        <InternalStatFilterCard
          label="Total"
          value={counts.todas}
          hint="no condomínio"
          icon="clipboard"
          tone="navy"
          active={activeTab === "todas"}
          onClick={() => setActiveTab("todas")}
        />
      </InternalStatGrid>

      {/* Alerta de Feedback Global */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-[#FDECEC] text-[#D92D20] border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={feedback.type === "success" ? "check-circle" : "alert-triangle"}
              size={16}
              className={feedback.type === "success" ? "text-[#16A34A]" : "text-[#EF4444]"}
            />
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-[#526079] hover:text-[#101828] cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* 3. BARRA DE FILTROS ORGANIZADA + BUSCA + ORDENAÇÃO + ALTERNÂNCIA LISTA/CARDS */}
      <InternalFilterBar
        left={
          <InternalTabStrip
            tabs={[
              { key: "todas", label: "Todas", count: counts.todas },
              { key: "recebidas", label: "Recebidas", count: counts.recebidas },
              { key: "em_atendimento", label: "Em atendimento", count: counts.em_atendimento },
              { key: "concluidas", label: "Concluídas", count: counts.concluidas },
            ]}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as FilterTab)}
          />
        }
        right={
          <>
            <InternalSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar ocorrência, código ou local..."
              className="sm:w-56 md:w-64"
            />

            <button
              type="button"
              onClick={() => setOnlyWithPhotos((prev) => !prev)}
              className={`inline-flex h-9.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                onlyWithPhotos
                  ? "border-[#1455FF] bg-[#EAF1FF] text-[#1455FF]"
                  : "border-[#E2E8F0] bg-white text-[#526079] hover:text-[#101828] hover:bg-[#F5F8FC]"
              }`}
              title="Filtrar ocorrências que possuem fotos anexadas"
            >
              <Icon name="camera" size={14} />
              <span>Com fotos</span>
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={() => setNeedsAttentionOnly((prev) => !prev)}
                className={`inline-flex h-9.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  needsAttentionOnly
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-[#E2E8F0] bg-white text-[#526079] hover:text-[#101828] hover:bg-[#F5F8FC]"
                }`}
                title="Filtrar ocorrências prioritárias ou sem responsável"
              >
                <Icon name="alert-triangle" size={14} />
                <span className="hidden sm:inline">Prioritárias</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={`inline-flex h-9.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory !== "todas" || selectedSeverity !== "todas"
                  ? "border-[#1455FF] bg-[#EAF1FF] text-[#1455FF]"
                  : "border-[#E2E8F0] bg-white text-[#526079] hover:text-[#101828] hover:bg-[#F5F8FC]"
              }`}
            >
              <Icon name="filter" size={14} />
              <span>Filtros</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recentes" | "antigas" | "prioridade")}
              aria-label="Ordenar ocorrências"
              className="h-9.5 rounded-xl border border-[#E2E8F0] bg-white pl-3 pr-8 text-xs font-bold text-[#101828] outline-none focus:border-[#1455FF] cursor-pointer shrink-0"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="prioridade">Maior prioridade</option>
            </select>

            <InternalViewToggle
              value={viewMode}
              onChange={(next) => handleChangeViewMode(next as "cards" | "tabela")}
              options={[
                { key: "cards", label: "Cards", icon: "grid" },
                { key: "tabela", label: "Lista", icon: "menu" },
              ]}
            />
          </>
        }
      />

      {/* 4. LISTAGEM REFINADA DE OCORRÊNCIAS (CARDS COMPACTOS OU LISTA ESTRUTURADA) */}
      {filteredOccurrences.length === 0 ? (
        <InternalEmptyState
          title="Nenhuma ocorrência encontrada"
          description={
            search || selectedCategory !== "todas" || selectedSeverity !== "todas" || needsAttentionOnly || onlyWithPhotos
              ? "Nenhum resultado corresponde aos filtros aplicados. Tente limpar os filtros para visualizar outros chamados."
              : "Se você encontrar algum problema ou reparo necessário no condomínio, registre agora."
          }
          icon="clipboard"
          action={
            <>
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
                  className={INTERNAL_BTN_SECONDARY_CLS}
                >
                  Limpar filtros
                </button>
              )}
              <Link href="/painel/ocorrencias/nova" className={INTERNAL_BTN_PRIMARY_CLS}>
                <Icon name="plus" size={15} strokeWidth={2.5} />
                <span>Registrar ocorrência</span>
              </Link>
            </>
          }
        />
      ) : viewMode === "tabela" ? (
        <>
          {/* Visualização em Lista Estruturada (Desktop) */}
          <InternalSectionCard noPadding className="hidden md:block">
            <InternalDataTable>
              <thead className="bg-[#F5F8FC] border-b border-[#E2E8F0] text-[#526079] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Ocorrência</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Localização</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  {isStaff && <th className="px-4 py-3">Responsável</th>}
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1F7]">
                {filteredOccurrences.map((occ) => {
                  const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
                  const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
                  const cat = formatCategory(occ.category);
                  const cleanLoc = formatCleanLocation(occ);
                  const cleanDate = formatCleanDate(occ.createdAt);
                  const photoCount = occ.attachments?.length ?? 0;

                  return (
                    <tr
                      key={occ.id}
                      onClick={() => openOccurrence(occ)}
                      className="hover:bg-[#F5F8FC]/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#1455FF] whitespace-nowrap">
                        {occ.code}
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-[#101828] truncate group-hover:text-[#1455FF] transition-colors">
                            {occ.title}
                          </p>
                          {photoCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-[#EAF1FF] px-1.5 py-0.5 text-[10px] font-bold text-[#1455FF] shrink-0"
                              title={`${photoCount} foto(s) anexada(s)`}
                            >
                              <Icon name="camera" size={10} />
                              <span>{photoCount}</span>
                            </span>
                          )}
                        </div>
                        {occ.description && (
                          <p className="text-[11px] text-[#526079] truncate mt-0.5">{occ.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-[#526079]">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name={cat.icon} size={13} className="text-[#1455FF]" />
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#526079] max-w-[190px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <Icon name="map-pin" size={12} className="text-[#8996A9] shrink-0" />
                          <span className="truncate">{cleanLoc}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sv.badgeBg} ${sv.badgeText}`}>
                          {sv.isUrgent && <Icon name="alert-triangle" size={11} className="text-red-600" />}
                          {sv.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.badgeBg} ${st.badgeText}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                          {st.label}
                        </span>
                      </td>
                      {isStaff && (
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {occ.assignedToName ? (
                            <span className="font-semibold text-[#101828]">{occ.assignedToName}</span>
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                              Sem responsável
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-[#526079] whitespace-nowrap">
                        {cleanDate.formatted}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-[#1455FF] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Abrir</span>
                          <Icon name="chevron-right" size={13} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </InternalDataTable>
          </InternalSectionCard>

          {/* Visualização em Lista (Mobile) */}
          <div className="space-y-2.5 md:hidden">
            {filteredOccurrences.map((occ) => {
              const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
              const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
              const cat = formatCategory(occ.category);
              const cleanLoc = formatCleanLocation(occ);
              const cleanDate = formatCleanDate(occ.createdAt);
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => openOccurrence(occ)}
                  className="w-full text-left rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(7,26,56,0.03)] space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#1455FF]">{occ.code}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.badgeBg} ${st.badgeText}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                      {st.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#101828] line-clamp-2 break-words [overflow-wrap:anywhere]">
                    {occ.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#526079]">
                    <span>{cat.label}</span>
                    <span>•</span>
                    <span className="truncate max-w-[180px]">{cleanLoc}</span>
                    <span>•</span>
                    <span>{cleanDate.formatted}</span>
                    {sv.isUrgent && (
                      <InternalStatusBadge tone="red">Urgente</InternalStatusBadge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Grid Responsivo em Cards Compactos (Proporções padronizadas e sem espaço morto para registros sem foto) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOccurrences.map((occ) => {
            const st = STATUS_CONFIG[occ.status] || STATUS_CONFIG.recebida;
            const sv = SEVERITY_CONFIG[occ.severity] || SEVERITY_CONFIG.media;
            const cat = formatCategory(occ.category);
            const occComments = comments.filter((c) => c.occurrenceId === occ.id);
            const photos = occ.attachments || [];
            const hasPhotos = photos.length > 0;
            const firstPhoto = hasPhotos ? photos[0] : null;
            const cleanLoc = formatCleanLocation(occ);
            const cleanDate = formatCleanDate(occ.createdAt);

            return (
              <article
                key={occ.id}
                onClick={() => openOccurrence(occ)}
                className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(7,26,56,0.035)] hover:border-[#1455FF]/45 hover:shadow-[0_8px_22px_rgba(20,85,255,0.09)] transition-all overflow-hidden cursor-pointer"
              >
                <div>
                  {/* Mídia Padronizada 16:9 somente quando existir foto real anexada */}
                  {hasPhotos && firstPhoto && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(photos, 0);
                      }}
                      className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 border-b border-[#EDF1F7] cursor-zoom-in"
                      title="Clique para ampliar a fotografia"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={firstPhoto}
                        alt={occ.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center pointer-events-none">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-[#081A37]/80 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                          <Icon name="search" size={12} />
                          <span>Ampliar</span>
                        </span>
                      </div>
                      {photos.length > 1 && (
                        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-[#081A37]/85 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                          <Icon name="camera" size={11} />
                          <span>+{photos.length - 1}</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Topo: Código + Status + Categoria + Prioridade */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-extrabold text-[#1455FF] bg-[#EAF1FF] px-2.5 py-0.5 rounded-md">
                        {occ.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.badgeBg} ${st.badgeText}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                        {st.label}
                      </span>
                    </div>

                    {/* Título truncado contextualmente + Resumo objetivo */}
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-[15px] sm:text-base font-extrabold text-[#101828] group-hover:text-[#1455FF] transition-colors leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
                        {occ.title}
                      </h3>
                      {occ.description && (
                        <p className="text-xs text-[#526079] leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
                          {occ.description}
                        </p>
                      )}
                    </div>

                    {/* Tags de Categoria, Prioridade e Mensagens */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F5F8FC] px-2 py-0.5 text-[11px] font-semibold text-[#526079]">
                        <Icon name={cat.icon} size={11} className="text-[#1455FF]" />
                        <span>{cat.label}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${sv.badgeBg} ${sv.badgeText}`}>
                        {sv.isUrgent && <Icon name="alert-triangle" size={10} />}
                        <span>{sv.label}</span>
                      </span>
                      {occComments.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF1FF] px-2 py-0.5 text-[11px] font-bold text-[#1455FF]">
                          <Icon name="mail" size={10} />
                          <span>{occComments.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé com Metadados + Ação */}
                <div className="border-t border-[#EDF1F7] bg-[#F5F8FC]/55 px-4 py-3 sm:px-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#526079]">
                    <span className="inline-flex items-center gap-1.5 font-medium truncate min-w-0">
                      <Icon name="map-pin" size={12} className="text-[#8996A9] shrink-0" />
                      <span className="truncate">{cleanLoc}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 shrink-0 tabular-nums">
                      <Icon name="clock" size={11} className="text-[#8996A9]" />
                      <span>{cleanDate.formatted}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    {occ.assignedToName ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#101828] truncate">
                        <Icon name="user-check" size={12} className="text-[#16A34A] shrink-0" />
                        <span className="truncate">{occ.assignedToName}</span>
                      </span>
                    ) : isStaff ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-bold text-amber-800">
                        Sem responsável
                      </span>
                    ) : (
                      <span className="text-[#8996A9] truncate">Toque para acompanhar</span>
                    )}

                    <span className="inline-flex items-center gap-1 font-bold text-[#1455FF] shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver detalhes</span>
                      <Icon name="chevron-right" size={13} />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRAWER DE DETALHES EM DUAS COLUNAS + TIMELINE REAL                    */}
      {/* ========================================================================= */}
      <InternalDrawer
        isOpen={Boolean(activeOccurrence)}
        onClose={closeOccurrence}
        size="2xl"
        title={activeOccurrence?.title ?? ""}
        badges={
          activeOccurrence && (
            <>
              <span className="font-mono text-xs font-extrabold text-[#1455FF] bg-[#EAF1FF] px-2.5 py-0.5 rounded-md">
                {activeOccurrence.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).badgeBg} ${(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).badgeText}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).dotColor}`}
                />
                {(STATUS_CONFIG[activeOccurrence.status] || STATUS_CONFIG.recebida).label}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${(SEVERITY_CONFIG[activeOccurrence.severity] || SEVERITY_CONFIG.media).badgeBg} ${(SEVERITY_CONFIG[activeOccurrence.severity] || SEVERITY_CONFIG.media).badgeText}`}
              >
                {(SEVERITY_CONFIG[activeOccurrence.severity] || SEVERITY_CONFIG.media).label}
              </span>
            </>
          )
        }
        subtitle={
          activeOccurrence && (
            <>
              <span className="inline-flex items-center gap-1">
                <Icon name="map-pin" size={13} className="text-[#8996A9]" />
                <span>{formatCleanLocation(activeOccurrence)}</span>
              </span>
              <span>•</span>
              <span>
                {activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Hoje"}
              </span>
            </>
          )
        }
        footer={
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escreva uma mensagem ou atualização para este chamado..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 text-xs sm:text-sm text-[#101828] placeholder:text-[#8996A9] outline-none focus:bg-white focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/15 transition-all"
            />
            <button
              type="submit"
              disabled={isPending || !newCommentText.trim()}
              className={INTERNAL_BTN_PRIMARY_CLS}
            >
              <span>Enviar</span>
              <Icon name="arrow-right" size={14} strokeWidth={2.4} />
            </button>
          </form>
        }
      >
        {activeOccurrence && (
          <InternalDetailPanel
            main={
              <>
                {/* Descrição completa */}
                <InternalSectionCard title="Descrição completa" icon="file-text" tone="blue">
                  <p className="text-xs sm:text-sm text-[#101828] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {activeOccurrence.description}
                  </p>
                </InternalSectionCard>

                {/* Fotografias / Anexos (exibido somente quando houver mídia real) */}
                {activeOccurrence.attachments && activeOccurrence.attachments.length > 0 && (
                  <InternalSectionCard
                    title={`Fotografias anexadas (${activeOccurrence.attachments.length})`}
                    subtitle="Clique em qualquer imagem para abrir em tela cheia."
                    icon="camera"
                    tone="blue"
                  >
                    <div className="space-y-3">
                      <div
                        onClick={() => openLightbox(activeOccurrence.attachments!, 0)}
                        className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-slate-100 group cursor-zoom-in"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeOccurrence.attachments[0]}
                          alt={activeOccurrence.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-[#081A37]/85 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                            <Icon name="search" size={13} />
                            <span>Ampliar imagem</span>
                          </span>
                        </div>
                      </div>

                      {activeOccurrence.attachments.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {activeOccurrence.attachments.map((src, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openLightbox(activeOccurrence.attachments!, idx)}
                              className="relative h-16 w-22 shrink-0 overflow-hidden rounded-xl border-2 border-[#E2E8F0] hover:border-[#1455FF] transition-all cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={`Miniatura ${idx + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </InternalSectionCard>
                )}

                {/* Parecer / Ações tomadas */}
                {activeOccurrence.actionsTaken && (
                  <InternalSectionCard title="Ações tomadas pela equipe" icon="wrench" tone="green">
                    <p className="text-xs sm:text-sm text-[#101828] leading-relaxed whitespace-pre-line">
                      {activeOccurrence.actionsTaken}
                    </p>
                  </InternalSectionCard>
                )}

                {/* Confirmação de Resolução pelo Morador */}
                {isResident && activeOccurrence.status === "resolvida" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check-circle" size={18} className="text-[#16A34A] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                          Esta ocorrência foi resolvida?
                        </h4>
                        <p className="text-xs text-emerald-900 mt-0.5">
                          A administração marcou este chamado como concluído. Confirme se o problema foi solucionado.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRatingModalOpen(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white px-3.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Sim, resolvido</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReopenModalOpen(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Ainda existe problema</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Comentários & Mensagens */}
                <InternalSectionCard
                  title="Histórico e mensagens"
                  subtitle={`${activeComments.length} ${activeComments.length === 1 ? "mensagem registrada" : "mensagens registradas"}`}
                  icon="mail"
                  tone="blue"
                >
                  <div className="space-y-3">
                    <div className="text-center py-1">
                      <span className="inline-block rounded-full bg-[#F5F8FC] border border-[#E2E8F0] px-3 py-1 text-[11px] font-semibold text-[#526079]">
                        Ocorrência registrada em{" "}
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
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm ${
                              isCurrentUser
                                ? "bg-[#1455FF] text-white rounded-br-xs"
                                : "bg-[#F5F8FC] border border-[#E2E8F0] text-[#101828] rounded-bl-xs"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 text-[10px] font-bold mb-1 ${
                                isCurrentUser ? "text-blue-100" : "text-[#526079]"
                              }`}
                            >
                              <span>{c.userName || "Usuário"}</span>
                              <span>•</span>
                              <span>{c.createdAt ? dateTimeBR(c.createdAt) : "Agora"}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-line break-words">{c.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </InternalSectionCard>
              </>
            }
            sidebar={
              <>
                {/* Resumo Estruturado na Coluna Lateral */}
                <InternalSectionCard title="Dados do chamado" icon="info" tone="blue">
                  <dl className="space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] pb-2">
                      <dt className="font-semibold text-[#526079]">Categoria</dt>
                      <dd className="font-bold text-[#101828] capitalize">
                        {formatCategory(activeOccurrence.category).label}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] pb-2">
                      <dt className="font-semibold text-[#526079]">Prioridade</dt>
                      <dd className="font-bold text-[#101828]">
                        {(SEVERITY_CONFIG[activeOccurrence.severity] || SEVERITY_CONFIG.media).label}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] pb-2">
                      <dt className="font-semibold text-[#526079]">Local</dt>
                      <dd className="font-bold text-[#101828] text-right">
                        {formatCleanLocation(activeOccurrence)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] pb-2">
                      <dt className="font-semibold text-[#526079]">Responsável</dt>
                      <dd className="font-bold text-[#101828] text-right">
                        {activeOccurrence.assignedToName || "A definir"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="font-semibold text-[#526079]">Solicitante</dt>
                      <dd className="font-bold text-[#101828] text-right truncate">
                        {activeOccurrence.reporterName || "Morador"}
                        {activeOccurrence.unitNumber ? ` · ${activeOccurrence.unitNumber}` : ""}
                      </dd>
                    </div>
                  </dl>
                </InternalSectionCard>

                {/* Linha do Tempo Real */}
                <InternalSectionCard title="Linha do tempo" icon="clock" tone="navy">
                  <InternalTimeline
                    steps={(() => {
                      const st = activeOccurrence.status;
                      if (st === "cancelada") {
                        return [
                          {
                            id: "reg",
                            label: "Registrada",
                            meta: activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Registrada",
                            state: "done",
                          },
                          {
                            id: "canc",
                            label: "Cancelada",
                            state: "warning",
                          },
                        ] satisfies InternalTimelineStep[];
                      }
                      const inAnalysis = ["em_analise", "em_execucao", "em_andamento", "aguardando_morador", "resolvida"].includes(st);
                      const inExecution = ["em_execucao", "em_andamento", "aguardando_morador", "resolvida"].includes(st);
                      const isDone = st === "resolvida";

                      return [
                        {
                          id: "registrada",
                          label: "Registrada",
                          meta: activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : null,
                          state: "done",
                        },
                        {
                          id: "recebida",
                          label: "Recebida pela administração",
                          state: inAnalysis ? "done" : "current",
                        },
                        {
                          id: "em_atendimento",
                          label: "Em atendimento",
                          state: isDone ? "done" : inExecution || st === "em_analise" ? "current" : "pending",
                        },
                        {
                          id: "concluida",
                          label: "Concluída",
                          meta: activeOccurrence.resolvedAt ? dateTimeBR(activeOccurrence.resolvedAt) : null,
                          state: isDone ? "done" : "pending",
                        },
                      ] satisfies InternalTimelineStep[];
                    })()}
                  />
                </InternalSectionCard>

                {/* Controles da Administração (Preservando RBAC e regras reais) */}
                {isStaff && (
                  <InternalSectionCard title="Gestão do chamado" subtitle="Acesso síndico / gestor" icon="settings" tone="blue">
                    <div className="space-y-3">
                      <InternalFormField label="Status">
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value)}
                          className={INTERNAL_SELECT_CLS}
                        >
                          <option value="recebida">Recebida</option>
                          <option value="em_analise">Em análise</option>
                          <option value="em_execucao">Em atendimento</option>
                          <option value="aguardando_morador">Aguardando morador</option>
                          <option value="resolvida">Resolvida</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </InternalFormField>

                      <InternalFormField label="Prioridade">
                        <select
                          value={adminSeverity}
                          onChange={(e) => setAdminSeverity(e.target.value)}
                          className={INTERNAL_SELECT_CLS}
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </InternalFormField>

                      <InternalFormField label="Responsável">
                        <select
                          value={adminAssignedId}
                          onChange={(e) => setAdminAssignedId(e.target.value)}
                          className={INTERNAL_SELECT_CLS}
                        >
                          <option value="none">— Sem responsável atribuído —</option>
                          {staffMembers.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                              {m.name} ({m.role.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </InternalFormField>

                      <InternalFormField label="Parecer / Providências">
                        <textarea
                          rows={2}
                          value={adminActionsTaken}
                          onChange={(e) => setAdminActionsTaken(e.target.value)}
                          placeholder="Descreva as medidas executadas..."
                          className={INTERNAL_TEXTAREA_CLS}
                        />
                      </InternalFormField>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSaveAdminDetails}
                        className={`${INTERNAL_BTN_PRIMARY_CLS} w-full`}
                      >
                        <Icon name="check" size={15} />
                        <span>Salvar alterações</span>
                      </button>

                      <Link
                        href={`/painel/servicos?categoria=${activeOccurrence.category}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-bold text-[#1455FF] hover:underline pt-1"
                      >
                        <Icon name="briefcase" size={13} />
                        <span>Buscar prestador parceiro</span>
                      </Link>
                    </div>
                  </InternalSectionCard>
                )}
              </>
            }
          />
        )}
      </InternalDrawer>

      {/* ========================================================================= */}
      {/* 5. MODAL DE FILTROS AVANÇADOS (POPOVER / DRAWER - Seção 15)               */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 6. MODAIS PADRONIZADOS (Filtros, Reabertura, Avaliação)                   */}
      {/* ========================================================================= */}
      <InternalModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filtros avançados"
        description="Refine a listagem por categoria, prioridade e anexos."
        icon="filter"
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("todas");
                setSelectedSeverity("todas");
                setNeedsAttentionOnly(false);
                setOnlyWithPhotos(false);
                setFilterModalOpen(false);
              }}
              className={INTERNAL_BTN_SECONDARY_CLS}
            >
              Limpar tudo
            </button>
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className={INTERNAL_BTN_PRIMARY_CLS}
            >
              Aplicar filtros
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <InternalFormField label="Categoria">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={INTERNAL_SELECT_CLS}
            >
              <option value="todas">Todas as categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat).label}
                </option>
              ))}
            </select>
          </InternalFormField>

          <InternalFormField label="Prioridade">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className={INTERNAL_SELECT_CLS}
            >
              <option value="todas">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </InternalFormField>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none text-xs font-bold text-[#101828]">
            <input
              type="checkbox"
              checked={onlyWithPhotos}
              onChange={(e) => setOnlyWithPhotos(e.target.checked)}
              className="rounded border-[#CBD5E1] text-[#1455FF] focus:ring-[#1455FF] h-4 w-4 cursor-pointer"
            />
            <span>Somente ocorrências com fotos anexadas</span>
          </label>
        </div>
      </InternalModal>

      <InternalModal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Reabrir Ocorrência"
        description="Informe o que ainda precisa de atenção para retomarmos o atendimento."
        icon="alert-triangle"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setReopenModalOpen(false)}
              className={INTERNAL_BTN_SECONDARY_CLS}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleReopenOccurrence}
              className={INTERNAL_BTN_PRIMARY_CLS}
            >
              Confirmar reabertura
            </button>
          </>
        }
      >
        <InternalFormField label="Motivo da reabertura">
          <textarea
            rows={4}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Descreva o que ainda não foi solucionado..."
            className={INTERNAL_TEXTAREA_CLS}
          />
        </InternalFormField>
      </InternalModal>

      <InternalModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title="Avaliar Atendimento"
        description="Como você avalia a resolução deste chamado?"
        icon="check-circle"
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRatingModalOpen(false)}
              className={INTERNAL_BTN_SECONDARY_CLS}
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmResolution}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Enviar avaliação
            </button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingStars(star)}
                className="p-1 text-[#FFD000] hover:scale-110 transition-transform cursor-pointer"
              >
                <Icon
                  name="star"
                  size={28}
                  className={star <= ratingStars ? "fill-[#FFD000] text-[#FFD000]" : "text-slate-200 fill-slate-200"}
                />
              </button>
            ))}
          </div>
          <InternalFormField label="Comentário opcional">
            <textarea
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Deixe um comentário sobre o atendimento..."
              className={INTERNAL_TEXTAREA_CLS}
            />
          </InternalFormField>
        </div>
      </InternalModal>

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
                  className={`relative h-14 w-16 sm:h-16 sm:w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${i === lightboxData.index
                      ? "border-[#1455FF] ring-2 ring-blue-500/50 scale-105 opacity-100"
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
    </InternalPageLayout>
  );
}
