"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import {
  type SystemIncidentItem,
  type IncidentKPIs,
  type IncidentPriority,
  type IncidentStatus,
  type IncidentType,
  type IncidentActivityItem,
  type IncidentOccurrenceItem,
  type MonitoringRuleItem,
} from "@/lib/services/system-incidents-storage";

interface CentralClientProps {
  initialData: {
    incidents: SystemIncidentItem[];
    kpis: IncidentKPIs;
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
    modules: string[];
    serverTime: string;
  };
  condoId: number | null;
  isSuperAdmin: boolean;
  currentRole: string;
  currentUser: { id: number; name: string };
  condoName: string | null;
}

export function CentralAvisosErrosClient({
  initialData,
  condoId,
  isSuperAdmin,
  currentRole,
  currentUser,
  condoName,
}: CentralClientProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"visao-geral" | "operacionais" | "tecnicos" | "historico" | "regras">("visao-geral");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [sortBy, setSortBy] = useState("last_seen_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Active KPI card filter state
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  // Data state
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date(initialData.serverTime));

  // Drawer & detail state
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<{
    incident: SystemIncidentItem;
    activities: IncidentActivityItem[];
    occurrences: IncidentOccurrenceItem[];
  } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"geral" | "historico" | "diagnostico" | "acoes">("geral");

  // Slide-over Drawer action form states
  const [commentText, setCommentText] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<IncidentPriority>("P2");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Manual Notice Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    type: "aviso" as IncidentType,
    priority: "P2" as IncidentPriority,
    category: "operacional",
    sourceModule: "Administração Condominial",
    assigneeName: "",
    startDate: "",
    endDate: "",
    recommendedAction: "",
    targetAudience: "todos",
    notify: false,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Monitoring rules state
  const [rules, setRules] = useState<MonitoringRuleItem[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState(false);

  // Transitions
  const [, startTransition] = useTransition();

  // Format date helper
  const formatDateTime = useCallback((dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  }, []);

  // Fetch incidents list from API
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const params = new URLSearchParams();
      if (activeTab !== "regras") {
        params.set("tab", activeTab);
      }
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (priorityFilter) params.set("priority", priorityFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (moduleFilter) params.set("module", moduleFilter);
      if (assigneeFilter) params.set("assignee", assigneeFilter);
      if (startDateFilter) params.set("startDate", startDateFilter);
      if (endDateFilter) params.set("endDate", endDateFilter);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("page", String(currentPage));
      params.set("perPage", String(perPage));
      if (condoId) params.set("condoId", String(condoId));

      const res = await fetch(`/api/sistema/avisos-erros?${params.toString()}`);
      if (!res.ok) throw new Error("Falha na consulta");
      const json = await res.json();
      setData(json.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erro ao atualizar lista:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    searchQuery,
    priorityFilter,
    statusFilter,
    moduleFilter,
    assigneeFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    sortDir,
    currentPage,
    perPage,
    condoId,
  ]);

  // Load rules
  const fetchRules = useCallback(async () => {
    setIsRulesLoading(true);
    try {
      const res = await fetch("/api/sistema/avisos-erros/rules");
      if (res.ok) {
        const json = await res.json();
        setRules(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar regras:", err);
    } finally {
      setIsRulesLoading(false);
    }
  }, []);

  // Trigger fetch when filters or page changes
  useEffect(() => {
    if (activeTab === "regras") {
      fetchRules();
    } else {
      fetchIncidents();
    }
  }, [activeTab, priorityFilter, statusFilter, moduleFilter, assigneeFilter, startDateFilter, endDateFilter, currentPage, sortBy, sortDir, fetchRules, fetchIncidents]);

  // Toggle monitoring rule
  const handleToggleRule = async (ruleId: number, currentActive: boolean) => {
    try {
      const res = await fetch("/api/sistema/avisos-erros/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId, active: !currentActive }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, active: !currentActive } : r))
        );
      }
    } catch (err) {
      console.error("Erro ao alterar regra:", err);
    }
  };

  // Open incident detail drawer
  const openIncidentDrawer = async (id: number) => {
    setSelectedIncidentId(id);
    setIsDetailLoading(true);
    setActionError(null);
    setDrawerTab("geral");

    try {
      const res = await fetch(`/api/sistema/avisos-erros/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setSelectedIncidentDetail(json.data);
      setPriorityInput(json.data.incident.priority);
      setAssigneeInput(json.data.incident.assigneeName || "");
    } catch (err) {
      console.error("Erro ao abrir detalhe:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeIncidentDrawer = () => {
    setSelectedIncidentId(null);
    setSelectedIncidentDetail(null);
    setActionError(null);
    setShowResolveModal(false);
  };

  // Handle drawer action: Change status
  const handleStatusChange = async (newStatus: IncidentStatus, notes?: string) => {
    if (!selectedIncidentId) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/sistema/avisos-erros/${selectedIncidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          status: newStatus,
          resolutionNotes: notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Não foi possível alterar o status");
        return;
      }

      setShowResolveModal(false);
      setResolutionText("");
      // Refresh drawer & list
      await openIncidentDrawer(selectedIncidentId);
      fetchIncidents();
    } catch (err: any) {
      setActionError(err.message || "Erro na comunicação");
    }
  };

  // Handle drawer action: Assignee
  const handleAssigneeSubmit = async () => {
    if (!selectedIncidentId || !assigneeInput.trim()) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/sistema/avisos-erros/${selectedIncidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignee",
          assigneeName: assigneeInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Não foi possível atribuir responsável");
        return;
      }

      await openIncidentDrawer(selectedIncidentId);
      fetchIncidents();
    } catch (err: any) {
      setActionError(err.message || "Erro ao atribuir");
    }
  };

  // Handle drawer action: Priority change
  const handlePriorityChange = async (newPriority: IncidentPriority) => {
    if (!selectedIncidentId) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/sistema/avisos-erros/${selectedIncidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "priority",
          priority: newPriority,
          reason: "Atualizado via painel administrativo",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Não foi possível alterar a prioridade");
        return;
      }

      setPriorityInput(newPriority);
      await openIncidentDrawer(selectedIncidentId);
      fetchIncidents();
    } catch (err: any) {
      setActionError(err.message || "Erro ao mudar prioridade");
    }
  };

  // Handle drawer action: Add timeline comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !commentText.trim()) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/sistema/avisos-erros/${selectedIncidentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Não foi possível adicionar o comentário");
        return;
      }

      setCommentText("");
      await openIncidentDrawer(selectedIncidentId);
    } catch (err: any) {
      setActionError(err.message || "Erro ao salvar comentário");
    }
  };

  // Handle drawer action: Silence/Unsilence
  const handleSilenceToggle = async (currentSilenced: boolean) => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/sistema/avisos-erros/${selectedIncidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "silence", silenced: !currentSilenced }),
      });
      if (res.ok) {
        await openIncidentDrawer(selectedIncidentId);
        fetchIncidents();
      }
    } catch (err) {
      console.error("Erro ao silenciar:", err);
    }
  };

  // Handle Manual Notice creation form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/sistema/avisos-erros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || "Não foi possível registrar o aviso");
        setIsCreating(false);
        return;
      }

      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        type: "aviso",
        priority: "P2",
        category: "operacional",
        sourceModule: "Administração Condominial",
        assigneeName: "",
        startDate: "",
        endDate: "",
        recommendedAction: "",
        targetAudience: "todos",
        notify: false,
      });

      fetchIncidents();
    } catch (err: any) {
      setCreateError(err.message || "Erro ao enviar requisição");
    } finally {
      setIsCreating(false);
    }
  };

  // KPI card click: filters list accordingly
  const handleKpiCardClick = (filterType: "ativos" | "criticos" | "analise" | "resolvidos" | "sem_resp") => {
    if (activeKpiFilter === filterType) {
      // Toggle off
      setActiveKpiFilter(null);
      setPriorityFilter("");
      setStatusFilter("");
      setAssigneeFilter("");
      setCurrentPage(1);
      return;
    }

    setActiveKpiFilter(filterType);
    setCurrentPage(1);

    if (filterType === "ativos") {
      setActiveTab("visao-geral");
      setStatusFilter("ativos");
      setPriorityFilter("");
      setAssigneeFilter("");
    } else if (filterType === "criticos") {
      setActiveTab("visao-geral");
      setPriorityFilter("P0");
      setStatusFilter("ativos");
      setAssigneeFilter("");
    } else if (filterType === "analise") {
      setActiveTab("visao-geral");
      setStatusFilter("em_analise");
      setPriorityFilter("");
      setAssigneeFilter("");
    } else if (filterType === "resolvidos") {
      setActiveTab("historico");
      setStatusFilter("resolvido");
      setPriorityFilter("");
      setAssigneeFilter("");
    } else if (filterType === "sem_resp") {
      setActiveTab("visao-geral");
      setAssigneeFilter("sem_responsavel");
      setStatusFilter("ativos");
      setPriorityFilter("");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("");
    setStatusFilter("");
    setModuleFilter("");
    setAssigneeFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setActiveKpiFilter(null);
    setCurrentPage(1);
    fetchIncidents();
  };

  // Priority Badge Styling
  const renderPriorityBadge = (priority: IncidentPriority) => {
    switch (priority) {
      case "P0":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
            <Icon name="alert-triangle" size={12} className="text-red-600 shrink-0" />
            P0 — Crítico
          </span>
        );
      case "P1":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 border border-orange-200">
            <Icon name="alert" size={12} className="text-orange-600 shrink-0" />
            P1 — Alto
          </span>
        );
      case "P2":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Icon name="clock" size={12} className="text-amber-600 shrink-0" />
            P2 — Médio
          </span>
        );
      case "P3":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
            <Icon name="file-text" size={12} className="text-slate-500 shrink-0" />
            P3 — Baixo
          </span>
        );
    }
  };

  // Status Badge Styling
  const renderStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "aberto":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-200/60">
            Aberto
          </span>
        );
      case "reconhecido":
        return (
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200/60">
            Reconhecido
          </span>
        );
      case "em_analise":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#1355FF] border border-blue-200/60">
            Em análise
          </span>
        );
      case "resolvido":
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
            Resolvido
          </span>
        );
      case "encerrado":
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
            Encerrado
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  // Multi-select helpers
  const isAllSelected = data.incidents.length > 0 && selectedIds.length === data.incidents.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.incidents.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4. Cabeçalho da página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Avisos e erros</h1>
            {data.kpis.criticalErrors > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {data.kpis.criticalErrors} crítico{data.kpis.criticalErrors > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Monitore ocorrências, identifique falhas e acompanhe situações que precisam de atenção.
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <Icon name="clock" size={12} className="text-slate-400" />
            <span>Última atualização: {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchIncidents}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1355FF]/20 cursor-pointer disabled:opacity-50"
          >
            <Icon name="refresh" size={13} className={`text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>

          {["superadmin", "sindico", "zelador"].includes(currentRole) && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1355FF] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#1355FF]/20 cursor-pointer"
            >
              <Icon name="plus" size={13} />
              <span>Registrar aviso</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Indicadores principais (5 cards horizontais reais) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Card 1 — Avisos ativos */}
        <button
          type="button"
          onClick={() => handleKpiCardClick("ativos")}
          className={`flex flex-col text-left rounded-xl border bg-white p-3.5 transition-all shadow-sm hover:border-[#1355FF] hover:shadow cursor-pointer ${
            activeKpiFilter === "ativos" ? "border-[#1355FF] ring-2 ring-[#1355FF]/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Avisos ativos</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#1355FF]">
              <Icon name="bell" size={14} />
            </div>
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data.kpis.activeAlerts}</span>
          <span className="mt-1 text-[11px] text-slate-500">Operacionais pendentes</span>
        </button>

        {/* Card 2 — Erros críticos */}
        <button
          type="button"
          onClick={() => handleKpiCardClick("criticos")}
          className={`flex flex-col text-left rounded-xl border bg-white p-3.5 transition-all shadow-sm hover:border-red-500 hover:shadow cursor-pointer ${
            activeKpiFilter === "criticos" ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Erros críticos</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Icon name="alert-triangle" size={14} />
            </div>
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-red-600">{data.kpis.criticalErrors}</span>
          <span className="mt-1 text-[11px] text-slate-500">Gravidade P0 não resolvidos</span>
        </button>

        {/* Card 3 — Em análise */}
        <button
          type="button"
          onClick={() => handleKpiCardClick("analise")}
          className={`flex flex-col text-left rounded-xl border bg-white p-3.5 transition-all shadow-sm hover:border-purple-500 hover:shadow cursor-pointer ${
            activeKpiFilter === "analise" ? "border-purple-500 ring-2 ring-purple-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Em análise</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Icon name="search" size={14} />
            </div>
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data.kpis.inAnalysis}</span>
          <span className="mt-1 text-[11px] text-slate-500">Com responsável atribuído</span>
        </button>

        {/* Card 4 — Resolvidos hoje */}
        <button
          type="button"
          onClick={() => handleKpiCardClick("resolvidos")}
          className={`flex flex-col text-left rounded-xl border bg-white p-3.5 transition-all shadow-sm hover:border-emerald-500 hover:shadow cursor-pointer ${
            activeKpiFilter === "resolvidos" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Resolvidos hoje</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="check-circle" size={14} />
            </div>
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data.kpis.resolvedToday}</span>
          <span className="mt-1 text-[11px] text-slate-500">Soluções registradas hoje</span>
        </button>

        {/* Card 5 — Sem responsável */}
        <button
          type="button"
          onClick={() => handleKpiCardClick("sem_resp")}
          className={`flex flex-col text-left rounded-xl border bg-white p-3.5 transition-all shadow-sm hover:border-amber-500 hover:shadow cursor-pointer col-span-2 sm:col-span-1 ${
            activeKpiFilter === "sem_resp" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Sem responsável</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Icon name="users" size={14} />
            </div>
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data.kpis.unassigned}</span>
          <span className="mt-1 text-[11px] text-slate-500">Demandam atribuição</span>
        </button>
      </div>

      {/* 6. Navegação por abas */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => {
              setActiveTab("visao-geral");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "visao-geral"
                ? "border-[#1355FF] text-[#1355FF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Visão geral</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("operacionais");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "operacionais"
                ? "border-[#1355FF] text-[#1355FF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Avisos operacionais</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("tecnicos");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "tecnicos"
                ? "border-[#1355FF] text-[#1355FF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Erros técnicos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("historico");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "historico"
                ? "border-[#1355FF] text-[#1355FF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Histórico</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("regras");
              fetchRules();
            }}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "regras"
                ? "border-[#1355FF] text-[#1355FF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon name="settings" size={13} className="text-slate-400" />
            <span>Regras de automação</span>
          </button>
        </div>

        {/* 20. Exportação CSV */}
        {activeTab !== "regras" && (
          <a
            href="/api/sistema/avisos-erros/export"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Exportar incidentes filtrados para planilha CSV"
          >
            <Icon name="download" size={12} className="text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </a>
        )}
      </div>

      {activeTab === "regras" ? (
        /* Seção 14 — Regras de Monitoramento e Automações */
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Políticas de Monitoramento e Escalonamento Ativo</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Regras automatizadas avaliam a telemetria do sistema e criam incidentes proativos antes de impactos na operação.
              </p>
            </div>
            {isRulesLoading && <Icon name="refresh" size={14} className="animate-spin text-[#1355FF]" />}
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-lg overflow-hidden">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{rule.name}</span>
                    {renderPriorityBadge(rule.priority)}
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rule.module}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{rule.eventCondition}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Limite: {rule.threshold} evento(s)</span>
                    <span>Janela: {rule.windowMinutes} min</span>
                    {rule.defaultAssigneeName && <span>Resp. padrão: {rule.defaultAssigneeName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => handleToggleRule(rule.id, rule.active)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.active ? "bg-[#1355FF]" : "bg-slate-200"
                    } ${!isSuperAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                    title={isSuperAdmin ? "Ativar/desativar regra" : "Apenas superadmin pode alterar regras"}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${rule.active ? "text-emerald-700" : "text-slate-400"}`}>
                    {rule.active ? "Ativa" : "Pausada"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 10. Filtros e barra de busca */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID (ex: INC-00001), título ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchIncidents()}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1355FF] focus:outline-none focus:ring-2 focus:ring-[#1355FF]/10 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={fetchIncidents}
                className="h-9 rounded-lg bg-[#1355FF] px-4 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              {/* Prioridade */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
              >
                <option value="">Todas as prioridades</option>
                <option value="P0">P0 — Crítico</option>
                <option value="P1">P1 — Alto</option>
                <option value="P2">P2 — Médio</option>
                <option value="P3">P3 — Baixo</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
              >
                <option value="">Todos os status</option>
                <option value="ativos">Apenas ativos</option>
                <option value="aberto">Aberto</option>
                <option value="reconhecido">Reconhecido</option>
                <option value="em_analise">Em análise</option>
                <option value="resolvido">Resolvido</option>
                <option value="encerrado">Encerrado</option>
              </select>

              {/* Módulo */}
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
              >
                <option value="">Todos os módulos</option>
                {data.modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Responsável */}
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
              >
                <option value="">Todos os responsáveis</option>
                <option value="sem_responsavel">Sem responsável</option>
              </select>

              {/* Data Início */}
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
                title="Data inicial"
              />

              {/* Data Fim */}
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-[#1355FF] focus:outline-none"
                title="Data final"
              />

              {(searchQuery || priorityFilter || statusFilter || moduleFilter || assigneeFilter || startDateFilter || endDateFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* 10. Tabela Principal de Avisos e Erros */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="p-8 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                <div className="h-8 bg-slate-50 rounded animate-pulse w-full" />
                <div className="h-8 bg-slate-50 rounded animate-pulse w-full" />
                <div className="h-8 bg-slate-50 rounded animate-pulse w-full" />
              </div>
            )}

            {/* Error State */}
            {!isLoading && hasError && (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Icon name="alert-triangle" size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Não foi possível carregar os avisos e erros.</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Houve uma falha na comunicação com os serviços de monitoramento. Tente novamente.
                </p>
                <button
                  type="button"
                  onClick={fetchIncidents}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1355FF] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasError && data.incidents.length === 0 && (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Icon name="check-circle" size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Nenhum aviso ou erro encontrado.</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não há situações que exijam sua atenção para os filtros selecionados.
                </p>
                {(searchQuery || priorityFilter || statusFilter || moduleFilter || assigneeFilter || startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {/* Main Table */}
            {!isLoading && !hasError && data.incidents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 pl-4 pr-2 w-8">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]/20"
                        />
                      </th>
                      <th className="py-3 px-3 w-28">ID</th>
                      <th className="py-3 px-3">Ocorrência</th>
                      <th className="py-3 px-3 w-24">Tipo</th>
                      <th className="py-3 px-3 w-36">Origem</th>
                      <th className="py-3 px-3 w-28">Prioridade</th>
                      <th className="py-3 px-3 w-28">Status</th>
                      <th className="py-3 px-3 w-36">Responsável</th>
                      <th className="py-3 px-3 w-32">Atualização</th>
                      <th className="py-3 pl-2 pr-4 text-right w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.incidents.map((incident) => {
                      const isSelected = selectedIds.includes(incident.id);
                      return (
                        <tr
                          key={incident.id}
                          onClick={() => openIncidentDrawer(incident.id)}
                          className={`group transition-colors duration-100 hover:bg-blue-50/40 cursor-pointer ${
                            isSelected ? "bg-blue-50/60" : ""
                          }`}
                        >
                          <td
                            className="py-3.5 pl-4 pr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectOne(incident.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(incident.id)}
                              className="rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]/20"
                            />
                          </td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                            {incident.code}
                          </td>
                          <td className="py-3.5 px-3 max-w-sm">
                            <div className="font-semibold text-slate-900 truncate">
                              {incident.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {incident.description}
                            </div>
                            {incident.occurrencesCount > 1 && (
                              <span className="mt-1 inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {incident.occurrencesCount} repetições
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {incident.type === "aviso" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                <Icon name="bell" size={11} className="text-amber-600" />
                                Aviso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
                                <Icon name="alert-triangle" size={11} className="text-red-600" />
                                Erro
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium truncate">
                            {incident.sourceModule}
                          </td>
                          <td className="py-3.5 px-3">
                            {renderPriorityBadge(incident.priority)}
                          </td>
                          <td className="py-3.5 px-3">
                            {renderStatusBadge(incident.status)}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {incident.assigneeName ? (
                              <span className="truncate block font-medium text-slate-800">
                                {incident.assigneeName}
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-slate-400">
                                Sem responsável
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {formatDateTime(incident.lastSeenAt)}
                          </td>
                          <td className="py-3.5 pl-2 pr-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openIncidentDrawer(incident.id);
                              }}
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 group-hover:border-[#1355FF] group-hover:text-[#1355FF] transition-colors"
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !hasError && data.incidents.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                <div>
                  Mostrando <span className="font-semibold text-slate-800">{(data.pagination.page - 1) * perPage + 1}</span> a{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(data.pagination.page * perPage, data.pagination.total)}
                  </span>{" "}
                  de <span className="font-semibold text-slate-800">{data.pagination.total}</span> incidentes
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={data.pagination.page <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    Anterior
                  </button>
                  <span className="px-2 font-medium">
                    {data.pagination.page} de {data.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 11. Detalhes do Incidente (Slide-over Drawer) */}
      {selectedIncidentId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600">
                      {selectedIncidentDetail?.incident.code || "..."}
                    </span>
                    {selectedIncidentDetail && renderPriorityBadge(selectedIncidentDetail.incident.priority)}
                    {selectedIncidentDetail && renderStatusBadge(selectedIncidentDetail.incident.status)}
                  </div>
                  <h2 className="mt-1.5 text-base font-bold text-slate-900">
                    {selectedIncidentDetail?.incident.title || "Carregando detalhes..."}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeIncidentDrawer}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerTab("geral")}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    drawerTab === "geral" ? "border-[#1355FF] text-[#1355FF]" : "border-transparent text-slate-500"
                  }`}
                >
                  Geral
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("historico")}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    drawerTab === "historico" ? "border-[#1355FF] text-[#1355FF]" : "border-transparent text-slate-500"
                  }`}
                >
                  Histórico ({selectedIncidentDetail?.activities.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("diagnostico")}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    drawerTab === "diagnostico" ? "border-[#1355FF] text-[#1355FF]" : "border-transparent text-slate-500"
                  }`}
                >
                  Diagnóstico / Origem
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("acoes")}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    drawerTab === "acoes" ? "border-[#1355FF] text-[#1355FF]" : "border-transparent text-slate-500"
                  }`}
                >
                  Ações de Resolução
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
                {isDetailLoading ? (
                  <div className="py-12 text-center space-y-2">
                    <Icon name="refresh" size={18} className="animate-spin text-[#1355FF] mx-auto" />
                    <span className="text-slate-500">Buscando dados em tempo real...</span>
                  </div>
                ) : selectedIncidentDetail ? (
                  <>
                    {actionError && (
                      <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                        {actionError}
                      </div>
                    )}

                    {/* Tab 1: Geral */}
                    {drawerTab === "geral" && (
                      <div className="space-y-4">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Descrição Completa
                          </span>
                          <p className="mt-1 text-slate-900 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                            {selectedIncidentDetail.incident.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200/80">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Módulo</span>
                            <span className="font-semibold text-slate-800">{selectedIncidentDetail.incident.sourceModule}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Condomínio</span>
                            <span className="font-semibold text-slate-800">{selectedIncidentDetail.incident.condoName || "Global / Plataforma"}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Responsável Atual</span>
                            <span className="font-semibold text-slate-800">
                              {selectedIncidentDetail.incident.assigneeName || "Sem responsável"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Total de Repetições</span>
                            <span className="font-semibold text-slate-800">
                              {selectedIncidentDetail.incident.occurrencesCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Primeira Detecção</span>
                            <span className="text-slate-700">{formatDateTime(selectedIncidentDetail.incident.firstSeenAt)}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Última Ocorrência</span>
                            <span className="text-slate-700">{formatDateTime(selectedIncidentDetail.incident.lastSeenAt)}</span>
                          </div>
                        </div>

                        {selectedIncidentDetail.incident.recommendedAction && (
                          <div className="rounded-lg bg-blue-50/70 p-3.5 border border-blue-200/80 text-blue-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs text-[#1355FF]">
                              <Icon name="check-circle" size={13} />
                              Ação Recomendada:
                            </span>
                            <p className="text-xs text-blue-950">{selectedIncidentDetail.incident.recommendedAction}</p>
                          </div>
                        )}

                        {selectedIncidentDetail.incident.status === "resolvido" && (
                          <div className="rounded-lg bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-900 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-700">
                              <Icon name="check-circle" size={13} />
                              Solução Adotada (Registrada em {formatDateTime(selectedIncidentDetail.incident.resolvedAt)} por {selectedIncidentDetail.incident.resolvedByName}):
                            </span>
                            <p className="text-xs text-emerald-950">{selectedIncidentDetail.incident.resolutionNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Histórico (Linha do tempo) */}
                    {drawerTab === "historico" && (
                      <div className="space-y-4">
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {selectedIncidentDetail.activities.map((act) => (
                            <div key={act.id} className="relative">
                              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#1355FF] shadow-xs" />
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-900">{act.userName}</span>
                                  <span className="text-slate-400">{formatDateTime(act.createdAt)}</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                  {act.action}
                                </div>
                                {act.notes && <p className="text-xs text-slate-800 mt-1">{act.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add comment box */}
                        <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-slate-200 space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Adicionar comentário ou nota interna:
                          </label>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Descreva detalhes da investigação, contato com terceiros ou observações..."
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#1355FF] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="rounded-lg bg-[#1355FF] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                          >
                            Salvar comentário
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Tab 3: Diagnóstico / Origem */}
                    {drawerTab === "diagnostico" && (
                      <div className="space-y-4">
                        {/* Direct module link for operational alerts */}
                        {selectedIncidentDetail.incident.relatedUrl && (
                          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-slate-900 block">Registro Relacionado</span>
                              <span className="text-[11px] text-slate-500">
                                Módulo de origem: {selectedIncidentDetail.incident.sourceModule}
                              </span>
                            </div>
                            <Link
                              href={selectedIncidentDetail.incident.relatedUrl}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1355FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              <span>Ir para o registro</span>
                              <Icon name="external-link" size={12} />
                            </Link>
                          </div>
                        )}

                        {/* Technical context for diagnostics */}
                        {selectedIncidentDetail.incident.correlationId && (
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Correlation ID
                            </span>
                            <code className="mt-1 block p-2 rounded bg-slate-100 font-mono text-[11px] text-slate-800">
                              {selectedIncidentDetail.incident.correlationId}
                            </code>
                          </div>
                        )}

                        {selectedIncidentDetail.incident.technicalContext && (
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Contexto Técnico Seguro
                            </span>
                            <pre className="mt-1 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                              {JSON.stringify(selectedIncidentDetail.incident.technicalContext, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Stack trace (only authorized platform admin) */}
                        {selectedIncidentDetail.incident.stackTrace && isSuperAdmin && (
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Stack Trace (Privativo Técnico)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedIncidentDetail.incident.stackTrace || "");
                                  alert("Stack trace copiado para a área de transferência!");
                                }}
                                className="text-[10px] font-semibold text-[#1355FF] hover:underline"
                              >
                                Copiar trace
                              </button>
                            </div>
                            <pre className="mt-1 p-3 rounded-lg bg-slate-900 text-rose-300 font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed">
                              {selectedIncidentDetail.incident.stackTrace}
                            </pre>
                          </div>
                        )}

                        {/* Recent occurrences list */}
                        {selectedIncidentDetail.occurrences.length > 0 && (
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                              Ocorrências Recentes Agrupadas ({selectedIncidentDetail.occurrences.length})
                            </span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {selectedIncidentDetail.occurrences.map((occ) => (
                                <div key={occ.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px]">
                                  <div className="flex justify-between text-slate-500">
                                    <span className="font-mono">{occ.correlationId || "—"}</span>
                                    <span>{formatDateTime(occ.createdAt)}</span>
                                  </div>
                                  <p className="font-medium text-slate-800 mt-0.5">{occ.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Ações Operacionais */}
                    {drawerTab === "acoes" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs">Ciclo de Resolução e Atribuição</h4>

                          {/* Quick Assume button */}
                          {selectedIncidentDetail.incident.assigneeName !== currentUser.name && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssigneeInput(currentUser.name);
                                handleAssigneeSubmit();
                              }}
                              className="w-full rounded-lg bg-white border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                            >
                              Assumir este incidente (Atribuir a mim)
                            </button>
                          )}

                          {/* Atribuir a outro responsável */}
                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Atribuir responsável:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nome do colaborador ou equipe..."
                                value={assigneeInput}
                                onChange={(e) => setAssigneeInput(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#1355FF] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleAssigneeSubmit}
                                className="rounded-lg bg-[#1355FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                              >
                                Atribuir
                              </button>
                            </div>
                          </div>

                          {/* Alterar Prioridade */}
                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Ajustar prioridade:
                            </label>
                            <div className="flex gap-2">
                              {(["P0", "P1", "P2", "P3"] as IncidentPriority[]).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => handlePriorityChange(p)}
                                  className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all border ${
                                    priorityInput === p
                                      ? "bg-[#1355FF] text-white border-[#1355FF]"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Mudanças de status */}
                          <div className="pt-2 border-t border-slate-200/80 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Transição de Status:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedIncidentDetail.incident.status !== "reconhecido" &&
                                selectedIncidentDetail.incident.status !== "resolvido" && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange("reconhecido")}
                                    className="rounded-lg bg-white border border-purple-200 text-purple-700 py-1.5 text-xs font-semibold hover:bg-purple-50"
                                  >
                                    Reconhecer
                                  </button>
                                )}

                              {selectedIncidentDetail.incident.status !== "em_analise" &&
                                selectedIncidentDetail.incident.status !== "resolvido" && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange("em_analise")}
                                    className="rounded-lg bg-white border border-blue-200 text-[#1355FF] py-1.5 text-xs font-semibold hover:bg-blue-50"
                                  >
                                    Colocar em análise
                                  </button>
                                )}

                              {selectedIncidentDetail.incident.status !== "resolvido" && (
                                <button
                                  type="button"
                                  onClick={() => setShowResolveModal(true)}
                                  className="rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700 col-span-2"
                                >
                                  Marcar como resolvido...
                                </button>
                              )}

                              {selectedIncidentDetail.incident.status === "resolvido" && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange("aberto", "Incidente reaberto pois a falha voltou a ocorrer.")}
                                  className="rounded-lg bg-white border border-rose-200 text-rose-700 py-1.5 text-xs font-semibold hover:bg-rose-50 col-span-2"
                                >
                                  Reabrir incidente
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Silenciar */}
                          <div className="pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => handleSilenceToggle(selectedIncidentDetail.incident.silenced)}
                              className="text-xs text-slate-500 hover:text-slate-800 underline"
                            >
                              {selectedIncidentDetail.incident.silenced ? "Reativar alertas" : "Silenciar este alerta"}
                            </button>
                          </div>
                        </div>

                        {/* Modal para descrição da solução (obrigatória) */}
                        {showResolveModal && (
                          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-3">
                            <h5 className="font-bold text-emerald-950 text-xs">
                              Registrar Solução Adotada (Obrigatória)
                            </h5>
                            <p className="text-[11px] text-emerald-800">
                              Para encerrar com rastreabilidade, descreva a causa raiz identificada e a ação corretiva executada.
                            </p>
                            <textarea
                              rows={3}
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              placeholder="Ex: Bomba substituída pelo fornecedor HidroFix com garantia de 12 meses..."
                              className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowResolveModal(false)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={resolutionText.trim().length < 5}
                                onClick={() => handleStatusChange("resolvido", resolutionText.trim())}
                                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Confirmar Resolução
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. Modal Registrar Aviso Manual */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar aviso administrativo</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publique avisos operacionais manuais para monitoramento e acompanhamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
                  {createError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título do aviso / incidente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manutenção emergencial da rede elétrica Torre B"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição detalhada *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva a situação, impactos esperados e procedimentos adotados..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as IncidentType })}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                  >
                    <option value="aviso">Aviso operacional</option>
                    <option value="erro">Falha técnica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridade *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as IncidentPriority })}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                  >
                    <option value="P0">P0 — Crítico</option>
                    <option value="P1">P1 — Alto</option>
                    <option value="P2">P2 — Médio</option>
                    <option value="P3">P3 — Baixo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Módulo responsável</label>
                  <input
                    type="text"
                    value={createForm.sourceModule}
                    onChange={(e) => setCreateForm({ ...createForm, sourceModule: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsável designado</label>
                  <input
                    type="text"
                    placeholder="Nome do colaborador..."
                    value={createForm.assigneeName}
                    onChange={(e) => setCreateForm({ ...createForm, assigneeName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ação recomendada</label>
                <input
                  type="text"
                  placeholder="Ex: Manter disjuntor desligado e acionar engenharia."
                  value={createForm.recommendedAction}
                  onChange={(e) => setCreateForm({ ...createForm, recommendedAction: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-[#1355FF] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="notifyToggle"
                  checked={createForm.notify}
                  onChange={(e) => setCreateForm({ ...createForm, notify: e.target.checked })}
                  className="rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]/20"
                />
                <label htmlFor="notifyToggle" className="text-slate-700 cursor-pointer font-medium">
                  Disparar notificação imediata para usuários do condomínio
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-[#1355FF] px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? "Registrando..." : "Registrar aviso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
