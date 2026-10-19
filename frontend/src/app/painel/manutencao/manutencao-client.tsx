"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { Icon } from "@/components/icon";
import { dateBR, daysUntil, isoDate, money } from "@/lib/utils";
import {
  completeOrderAction,
  deleteAssetAction,
  deleteOrderAction,
  deletePlanAction,
  generateOrderFromPlanAction,
  saveAssetAction,
  saveOrderAction,
  savePlanAction,
  updateOrderStatusAction,
} from "@/lib/actions/admin";

export type AssetRow = {
  id: number;
  condoId: number;
  name: string;
  category: string;
  location: string | null;
  brand: string | null;
  serial: string | null;
  installedAt: string | null;
  status: string;
  notes: string | null;
};

export type PlanRow = {
  id: number;
  condoId: number;
  assetId: number | null;
  title: string;
  frequencyDays: number;
  checklist: string[] | null;
  vendorId: number | null;
  responsible: string | null;
  nextDueAt: string | null;
  lastDoneAt: string | null;
  active: boolean;
};

export type OrderRow = {
  id: number;
  kind: string;
  title: string;
  status: string;
  scheduledFor: string | null;
  completedAt: string | null;
  costCents: number | null;
  technician: string | null;
  report: string | null;
  assetName: string | null;
  assetId?: number | null;
  vendorName: string | null;
  vendorId?: number | null;
  description?: string | null;
  planId?: number | null;
};

export type VendorRow = {
  id: number;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
};

interface ManutencaoClientProps {
  assets: AssetRow[];
  plans: PlanRow[];
  orders: OrderRow[];
  vendors: VendorRow[];
  isStaff: boolean;
}

export function ManutencaoClient({
  assets: initialAssets,
  plans: initialPlans,
  orders: initialOrders,
  vendors,
  isStaff,
}: ManutencaoClientProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "orders" | "assets" | "analytics">("plans");
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [planSearch, setPlanSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "late" | "soon" | "ok">("all");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderKindFilter, setOrderKindFilter] = useState<string>("all");

  const [assetSearch, setAssetSearch] = useState("");
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>("all");

  // Modals state
  const [assetModal, setAssetModal] = useState<{ open: boolean; item?: AssetRow | null }>({ open: false });
  const [planModal, setPlanModal] = useState<{ open: boolean; item?: PlanRow | null }>({ open: false });
  const [orderModal, setOrderModal] = useState<{
    open: boolean;
    item?: OrderRow | null;
    defaultAssetId?: number;
    defaultPlanId?: number;
  }>({ open: false });
  const [completeModal, setCompleteModal] = useState<{ open: boolean; order?: OrderRow | null }>({ open: false });

  const today = isoDate();

  // Computations
  const latePlans = useMemo(() => initialPlans.filter((p) => (p.nextDueAt ?? today) < today), [initialPlans, today]);
  const soonPlans = useMemo(
    () => initialPlans.filter((p) => (p.nextDueAt ?? "") >= today && (daysUntil(p.nextDueAt) ?? 99) <= 15),
    [initialPlans, today]
  );
  const openOrders = useMemo(
    () => initialOrders.filter((o) => o.status === "programada" || o.status === "em_andamento"),
    [initialOrders]
  );
  const totalCompletedCost = useMemo(
    () => initialOrders.filter((o) => o.status === "concluida").reduce((acc, o) => acc + (o.costCents ?? 0), 0),
    [initialOrders]
  );

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return initialPlans.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(planSearch.toLowerCase()) ||
        (p.responsible ?? "").toLowerCase().includes(planSearch.toLowerCase()) ||
        (initialAssets.find((a) => a.id === p.assetId)?.name ?? "").toLowerCase().includes(planSearch.toLowerCase());
      if (!matchesSearch) return false;

      const days = daysUntil(p.nextDueAt);
      if (planFilter === "late") return days !== null && days < 0;
      if (planFilter === "soon") return days !== null && days >= 0 && days <= 15;
      if (planFilter === "ok") return days !== null && days > 15;
      return true;
    });
  }, [initialPlans, planSearch, planFilter, initialAssets]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((o) => {
      const matchesSearch =
        o.title.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.assetName ?? "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.vendorName ?? "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.technician ?? "").toLowerCase().includes(orderSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (orderKindFilter !== "all" && o.kind !== orderKindFilter) return false;
      return true;
    });
  }, [initialOrders, orderSearch, orderStatusFilter, orderKindFilter]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return initialAssets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
        (a.brand ?? "").toLowerCase().includes(assetSearch.toLowerCase()) ||
        (a.location ?? "").toLowerCase().includes(assetSearch.toLowerCase()) ||
        (a.serial ?? "").toLowerCase().includes(assetSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (assetCategoryFilter !== "all" && a.category !== assetCategoryFilter) return false;
      return true;
    });
  }, [initialAssets, assetSearch, assetCategoryFilter]);

  // Failures Analysis
  const failuresByAsset = useMemo(() => {
    return initialOrders
      .filter((o) => o.kind === "corretiva")
      .reduce<Record<string, { count: number; totalCost: number }>>((acc, o) => {
        const key = o.assetName ?? "Área comum";
        if (!acc[key]) acc[key] = { count: 0, totalCost: 0 };
        acc[key].count += 1;
        acc[key].totalCost += o.costCents ?? 0;
        return acc;
      }, {});
  }, [initialOrders]);

  const categories = useMemo(() => {
    const set = new Set(initialAssets.map((a) => a.category));
    return Array.from(set);
  }, [initialAssets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Manutenção Preventiva & Ativos"
        subtitle="Controle completo de equipamentos, planos preventivos periódicos, ordens de serviço e indicadores técnicos."
        actions={
          isStaff ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOrderModal({ open: true, item: null })}
                className="btn-primary inline-flex items-center gap-2 shadow-sm"
              >
                <Icon name="plus" className="h-4 w-4" />
                Nova Ordem de Serviço
              </button>
              <button
                type="button"
                onClick={() => setPlanModal({ open: true, item: null })}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Icon name="calendar" className="h-4 w-4" />
                Criar Plano
              </button>
              <button
                type="button"
                onClick={() => setAssetModal({ open: true, item: null })}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Icon name="wrench" className="h-4 w-4" />
                Cadastrar Equipamento
              </button>
            </div>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Equipamentos Ativos"
          value={initialAssets.length}
          icon="wrench"
          tone="blue"
          hint={`${initialAssets.filter((a) => a.status === "operacional").length} em operação`}
        />
        <StatCard
          label="Planos Vencidos"
          value={latePlans.length}
          icon="alert"
          tone={latePlans.length > 0 ? "yellow" : "blue"}
          hint={latePlans.length > 0 ? "Requer ação imediata" : "Tudo em dia"}
        />
        <StatCard
          label="Vencem em 15 dias"
          value={soonPlans.length}
          icon="clock"
          tone={soonPlans.length > 0 ? "yellow" : "blue"}
          hint="Preventivas agendadas"
        />
        <StatCard
          label="OS em Aberto"
          value={openOrders.length}
          icon="wrench"
          tone="purple"
          hint={`${initialOrders.filter((o) => o.kind === "corretiva" && o.status !== "concluida").length} corretivas`}
        />
        <StatCard
          label="Custo Concluído"
          value={money(totalCompletedCost)}
          icon="wallet"
          tone="green"
          hint="Total finalizado"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "plans"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon name="calendar" className="h-4 w-4" />
            Planos Preventivos & Calendário
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "plans"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
              }`}
            >
              {initialPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "orders"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon name="file-text" className="h-4 w-4" />
            Ordens de Serviço (OS)
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "orders"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
              }`}
            >
              {initialOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "assets"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon name="wrench" className="h-4 w-4" />
            Equipamentos & Ativos
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "assets"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
              }`}
            >
              {initialAssets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon name="chart" className="h-4 w-4" />
            Indicadores & Falhas
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary hidden items-center gap-2 sm:inline-flex text-xs"
        >
          <Icon name="download" className="h-3.5 w-3.5" />
          Imprimir / Exportar
        </button>
      </div>

      {/* TAB 1: PLANOS PREVENTIVOS & CALENDÁRIO */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
              <input
                type="text"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder="Buscar por plano, equipamento ou responsável..."
                className="input pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPlanFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planFilter === "all" ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
                }`}
              >
                Todos ({initialPlans.length})
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter("late")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planFilter === "late" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                Vencidos ({latePlans.length})
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter("soon")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planFilter === "soon" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                Próximos 15 dias ({soonPlans.length})
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter("ok")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planFilter === "ok" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                Em dia
              </button>
            </div>
          </div>

          <Card
            title="Cronograma de Manutenção Preventiva Periódica"
            description="Rotinas periódicas obrigatórias e preventivas dos principais ativos do condomínio."
          >
            {filteredPlans.length === 0 ? (
              <EmptyState
                title="Nenhum plano de manutenção encontrado"
                description={
                  planSearch
                    ? "Tente ajustar seus termos de busca ou filtros."
                    : "Cadastre planos preventivos para garantir a conservação predial."
                }
                icon="calendar"
              />
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {filteredPlans.map((plan) => {
                  const days = daysUntil(plan.nextDueAt);
                  const isLate = days !== null && days < 0;
                  const isSoon = days !== null && days >= 0 && days <= 15;
                  const asset = initialAssets.find((a) => a.id === plan.assetId);
                  const vendor = vendors.find((v) => v.id === plan.vendorId);

                  return (
                    <div
                      key={plan.id}
                      className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-[var(--color-ink)]">{plan.title}</h3>
                          {isLate ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-300">
                              <Icon name="alert" className="h-3 w-3" />
                              {Math.abs(days!)} dias atrasado
                            </span>
                          ) : isSoon ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                              <Icon name="clock" className="h-3 w-3" />
                              Vence em {days} dias
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-300">
                              <Icon name="check" className="h-3 w-3" />
                              Em dia ({days}d)
                            </span>
                          )}
                          <span className="text-xs text-[var(--color-muted)] font-medium">
                            Frequência: a cada {plan.frequencyDays} dias
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                          <span>
                            <strong>Ativo:</strong> {asset ? `${asset.name} (${asset.location || asset.category})` : "Área Comum Geral"}
                          </span>
                          <span>
                            <strong>Próxima execução:</strong> {dateBR(plan.nextDueAt)}
                          </span>
                          {plan.lastDoneAt && (
                            <span>
                              <strong>Última:</strong> {dateBR(plan.lastDoneAt)}
                            </span>
                          )}
                          <span>
                            <strong>Responsável:</strong> {plan.responsible || vendor?.name || "Equipe de Manutenção"}
                          </span>
                        </div>

                        {plan.checklist && plan.checklist.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                            {plan.checklist.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-line)] px-2 py-0.5 text-[11px] text-[var(--color-ink)]"
                              >
                                <Icon name="check-circle" className="h-3 w-3 text-emerald-600" />
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {isStaff && (
                        <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                          <form action={generateOrderFromPlanAction} onSubmit={() => startTransition(() => {})}>
                            <input type="hidden" name="planId" value={plan.id} />
                            <button
                              type="submit"
                              disabled={isPending}
                              className="btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                              title="Gerar Ordem de Serviço Imediata para este Plano"
                            >
                              <Icon name="plus" className="h-3.5 w-3.5" />
                              Gerar O.S.
                            </button>
                          </form>

                          <button
                            type="button"
                            onClick={() => setPlanModal({ open: true, item: plan })}
                            className="btn-secondary btn-sm inline-flex items-center gap-1"
                            title="Editar Plano"
                          >
                            <Icon name="settings" className="h-3.5 w-3.5" />
                            Editar
                          </button>

                          <form
                            action={deletePlanAction}
                            onSubmit={(e) => {
                              if (!confirm("Tem certeza que deseja excluir este plano preventivo?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={plan.id} />
                            <button
                              type="submit"
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              title="Excluir Plano"
                            >
                              <Icon name="x" className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: ORDENS DE SERVIÇO */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar OS por título, ativo, fornecedor ou técnico..."
                className="input pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="input py-1.5 text-xs"
              >
                <option value="all">Status: Todos</option>
                <option value="programada">Programadas</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluídas</option>
              </select>

              <select
                value={orderKindFilter}
                onChange={(e) => setOrderKindFilter(e.target.value)}
                className="input py-1.5 text-xs"
              >
                <option value="all">Tipo: Todos</option>
                <option value="preventiva">Preventivas</option>
                <option value="corretiva">Corretivas</option>
              </select>
            </div>
          </div>

          <Card
            title="Ordens de Serviço (Preventivas & Corretivas)"
            description="Histórico, execução em tempo real e laudos técnicos conclusivos."
          >
            {filteredOrders.length === 0 ? (
              <EmptyState
                title="Nenhuma ordem de serviço encontrada"
                description={
                  orderSearch
                    ? "Tente ajustar seus termos de busca ou filtros."
                    : "Abra novas ordens de manutenção preventiva ou corretiva."
                }
                icon="wrench"
              />
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const isConcluida = order.status === "concluida";
                  const isAndamento = order.status === "em_andamento";

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isConcluida
                          ? "border-[var(--color-line)] bg-[var(--color-surface)]"
                          : isAndamento
                          ? "border-amber-300 bg-amber-50/40 shadow-sm"
                          : "border-blue-200 bg-blue-50/20 shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base text-[var(--color-ink)]">{order.title}</h3>
                            <Badge tone={order.kind === "preventiva" ? "blue" : "amber"}>
                              {order.kind === "preventiva" ? "Preventiva" : "Corretiva"}
                            </Badge>
                            <Badge tone={isConcluida ? "green" : isAndamento ? "amber" : "neutral"}>
                              {isConcluida ? "Concluída" : isAndamento ? "Em Andamento" : "Programada"}
                            </Badge>
                          </div>

                          <p className="text-xs text-[var(--color-muted)] flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                              <strong>Ativo:</strong> {order.assetName || "Área comum"}
                            </span>
                            <span>
                              <strong>Prestador:</strong> {order.vendorName || "Interno"}
                            </span>
                            {order.technician && (
                              <span>
                                <strong>Técnico:</strong> {order.technician}
                              </span>
                            )}
                            <span>
                              <strong>Data Agendada:</strong> {dateBR(order.scheduledFor)}
                            </span>
                            {order.completedAt && (
                              <span>
                                <strong>Conclusão:</strong> {dateBR(order.completedAt)}
                              </span>
                            )}
                            <span>
                              <strong>Custo:</strong> {money(order.costCents)}
                            </span>
                          </p>

                          {order.description && (
                            <p className="text-xs text-[var(--color-ink)] bg-black/5 dark:bg-white/5 rounded-lg p-2.5 mt-2 font-mono whitespace-pre-line">
                              {order.description}
                            </p>
                          )}

                          {order.report && (
                            <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                              <p className="font-bold flex items-center gap-1">
                                <Icon name="check-circle" className="h-3.5 w-3.5 text-emerald-700" />
                                Laudo Técnico / Parecer de Conclusão:
                              </p>
                              <p className="mt-1 whitespace-pre-line text-emerald-800">{order.report}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions for Staff */}
                        {isStaff && (
                          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 sm:pt-0">
                            {!isConcluida && (
                              <>
                                {!isAndamento ? (
                                  <form action={updateOrderStatusAction}>
                                    <input type="hidden" name="id" value={order.id} />
                                    <input type="hidden" name="status" value="em_andamento" />
                                    <button
                                      type="submit"
                                      className="btn-secondary btn-sm inline-flex items-center gap-1"
                                      title="Marcar como em andamento"
                                    >
                                      <Icon name="clock" className="h-3.5 w-3.5" />
                                      Iniciar Atendimento
                                    </button>
                                  </form>
                                ) : (
                                  <form action={updateOrderStatusAction}>
                                    <input type="hidden" name="id" value={order.id} />
                                    <input type="hidden" name="status" value="programada" />
                                    <button
                                      type="submit"
                                      className="btn-secondary btn-sm inline-flex items-center gap-1"
                                      title="Retornar para programada"
                                    >
                                      Pausar
                                    </button>
                                  </form>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setCompleteModal({ open: true, order })}
                                  className="btn-success btn-sm inline-flex items-center gap-1 shadow-sm"
                                >
                                  <Icon name="check" className="h-3.5 w-3.5" />
                                  Concluir com Laudo
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setOrderModal({ open: true, item: order })}
                              className="btn-secondary btn-sm"
                              title="Editar Ordem"
                            >
                              <Icon name="settings" className="h-3.5 w-3.5" />
                            </button>

                            <form
                              action={deleteOrderAction}
                              onSubmit={(e) => {
                                if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <input type="hidden" name="id" value={order.id} />
                              <button
                                type="submit"
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                title="Excluir Ordem"
                              >
                                <Icon name="x" className="h-4 w-4" />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: EQUIPAMENTOS & ATIVOS */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Buscar por nome, marca, local ou número de série..."
                className="input pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={assetCategoryFilter}
                onChange={(e) => setAssetCategoryFilter(e.target.value)}
                className="input py-1.5 text-xs"
              >
                <option value="all">Categorias: Todas</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card
            title="Inventário Geral de Ativos & Maquinário"
            description="Todos os equipamentos monitorados, marcas, números de série e histórico."
          >
            {filteredAssets.length === 0 ? (
              <EmptyState
                title="Nenhum equipamento cadastrado"
                description={
                  assetSearch
                    ? "Tente ajustar seus termos de busca."
                    : "Cadastre elevadores, bombas, geradores, portões e instalações elétricas."
                }
                icon="wrench"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => {
                  const assetPlans = initialPlans.filter((p) => p.assetId === asset.id);
                  const assetOrders = initialOrders.filter(
                    (o) => o.assetName === asset.name || (o.description ?? "").includes(asset.name)
                  );

                  return (
                    <div
                      key={asset.id}
                      className="flex flex-col justify-between rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                              {asset.category}
                            </span>
                            <h3 className="font-semibold text-base text-[var(--color-ink)] leading-snug">{asset.name}</h3>
                          </div>
                          <Badge
                            tone={
                              asset.status === "operacional" ? "green" : asset.status === "manutencao" ? "yellow" : "red"
                            }
                          >
                            {asset.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-[var(--color-muted)]">
                          {asset.location && (
                            <p>
                              <strong>Local:</strong> {asset.location}
                            </p>
                          )}
                          {asset.brand && (
                            <p>
                              <strong>Marca/Modelo:</strong> {asset.brand}
                            </p>
                          )}
                          {asset.serial && (
                            <p>
                              <strong>Nº Série:</strong> {asset.serial}
                            </p>
                          )}
                          {asset.installedAt && (
                            <p>
                              <strong>Instalado em:</strong> {dateBR(asset.installedAt)}
                            </p>
                          )}
                        </div>

                        {asset.notes && (
                          <p className="text-xs text-[var(--color-muted)] bg-[var(--color-surface-muted)] p-2 rounded-lg italic">
                            {asset.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-xs text-[var(--color-muted)]">
                        <span>
                          {assetPlans.length} plano(s) · {assetOrders.length} OS
                        </span>

                        {isStaff && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setOrderModal({ open: true, defaultAssetId: asset.id })}
                              className="btn-primary btn-sm text-[11px] py-1 px-2"
                              title="Abrir OS para este equipamento"
                            >
                              + OS
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssetModal({ open: true, item: asset })}
                              className="btn-secondary btn-sm text-[11px] py-1 px-2"
                              title="Editar Ativo"
                            >
                              Editar
                            </button>
                            <form
                              action={deleteAssetAction}
                              onSubmit={(e) => {
                                if (!confirm(`Tem certeza que deseja excluir "${asset.name}"?`)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <input type="hidden" name="id" value={asset.id} />
                              <button
                                type="submit"
                                className="rounded-md p-1 text-red-600 hover:bg-red-50 transition-colors"
                                title="Excluir Ativo"
                              >
                                <Icon name="x" className="h-3.5 w-3.5" />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: INDICADORES DE FALHAS & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Equipamentos com Maior Índice de Chamados Corretivos"
              description="Identifique maquinários que geram falhas recorrentes e demandam substituição ou revisão aprofundada."
            >
              {Object.keys(failuresByAsset).length === 0 ? (
                <EmptyState title="Nenhuma manutenção corretiva registrada" icon="chart" />
              ) : (
                <div className="divide-y divide-[var(--color-line)]">
                  {Object.entries(failuresByAsset)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([name, data], idx) => (
                      <div key={name} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-xs font-bold text-[var(--color-ink)]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-[var(--color-ink)]">{name}</p>
                            <p className="text-xs text-[var(--color-muted)]">Custo acumulado: {money(data.totalCost)}</p>
                          </div>
                        </div>
                        <Badge tone={data.count >= 2 ? "red" : "amber"}>{data.count} corretiva(s)</Badge>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            <Card
              title="Distribuição Preventiva vs. Corretiva"
              description="A proporção ideal recomendada pelo mercado é de pelo menos 80% Preventiva para 20% Corretiva."
            >
              {initialOrders.length === 0 ? (
                <EmptyState title="Sem dados de ordens" icon="chart" />
              ) : (
                <div className="space-y-6 pt-2">
                  {(() => {
                    const preventivas = initialOrders.filter((o) => o.kind === "preventiva").length;
                    const corretivas = initialOrders.filter((o) => o.kind === "corretiva").length;
                    const total = preventivas + corretivas || 1;
                    const prevPct = Math.round((preventivas / total) * 100);
                    const corrPct = 100 - prevPct;

                    return (
                      <div className="space-y-4">
                        <div className="h-4 w-full overflow-hidden rounded-full bg-amber-500 flex shadow-inner">
                          <div
                            style={{ width: `${prevPct}%` }}
                            className="h-full bg-blue-600 transition-all duration-500"
                            title={`Preventivas: ${prevPct}%`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Preventivas</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{prevPct}%</p>
                            <p className="text-xs text-blue-600 mt-0.5">{preventivas} ordens executadas</p>
                          </div>
                          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Corretivas (Falhas)</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">{corrPct}%</p>
                            <p className="text-xs text-amber-600 mt-0.5">{corretivas} ocorrências emergenciais</p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-muted)]">
                          <strong>Dica de Gestão:</strong> Manter um índice preventivo acima de 75% reduz em até 40% o custo de reposição de peças em condomínios residenciais.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: NOVA / EDITAR ORDEM */}
      {orderModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                {orderModal.item ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
              </h2>
              <button
                type="button"
                onClick={() => setOrderModal({ open: false })}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <form
              action={saveOrderAction}
              onSubmit={() => setOrderModal({ open: false })}
              className="mt-4 space-y-3.5"
            >
              {orderModal.item?.id && <input type="hidden" name="id" value={orderModal.item.id} />}

              <div>
                <label className="label">Título do Serviço / Ocorrência *</label>
                <input
                  name="title"
                  defaultValue={orderModal.item?.title || ""}
                  placeholder="Ex: Revisão semestral do gerador de energia"
                  required
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de Manutenção</label>
                  <select name="kind" defaultValue={orderModal.item?.kind || "corretiva"} className="input w-full">
                    <option value="corretiva">Corretiva (Falha / Reparo)</option>
                    <option value="preventiva">Preventiva (Rotina)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Data Agendada</label>
                  <input
                    type="date"
                    name="scheduledFor"
                    defaultValue={orderModal.item?.scheduledFor || today}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Equipamento / Ativo</label>
                  <select
                    name="assetId"
                    defaultValue={orderModal.item?.assetId || orderModal.defaultAssetId || ""}
                    className="input w-full"
                  >
                    <option value="">Área Comum Geral</option>
                    {initialAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Fornecedor / Empresa</label>
                  <select
                    name="vendorId"
                    defaultValue={orderModal.item?.vendorId || ""}
                    className="input w-full"
                  >
                    <option value="">Equipe Interna</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Técnico / Responsável</label>
                  <input
                    name="technician"
                    defaultValue={orderModal.item?.technician || ""}
                    placeholder="Ex: Carlos Oliveira"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Custo Estimado / Real (R$)</label>
                  <input
                    name="cost"
                    defaultValue={
                      orderModal.item?.costCents ? (orderModal.item.costCents / 100).toFixed(2).replace(".", ",") : ""
                    }
                    placeholder="0,00"
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">Descrição Detalhada / Escopo</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={orderModal.item?.description || ""}
                  placeholder="Descreva as instruções ou o problema diagnosticado..."
                  className="input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setOrderModal({ open: false })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {orderModal.item ? "Salvar Alterações" : "Abrir Ordem de Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCLUIR ORDEM COM LAUDO */}
      {completeModal.open && completeModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Concluir Ordem de Serviço</h2>
                <p className="text-xs text-[var(--color-muted)]">{completeModal.order.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModal({ open: false })}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <form
              action={completeOrderAction}
              onSubmit={() => setCompleteModal({ open: false })}
              className="mt-4 space-y-3.5"
            >
              <input type="hidden" name="id" value={completeModal.order.id} />

              <div>
                <label className="label">Laudo Técnico / Observações Conclusivas *</label>
                <textarea
                  name="report"
                  rows={4}
                  required
                  placeholder="Descreva os serviços executados, peças substituídas, testes realizados e parecer de liberação do equipamento..."
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Custo Final Fechado (R$)</label>
                <input
                  name="cost"
                  defaultValue={
                    completeModal.order.costCents
                      ? (completeModal.order.costCents / 100).toFixed(2).replace(".", ",")
                      : ""
                  }
                  placeholder="0,00"
                  className="input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setCompleteModal({ open: false })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-success">
                  Confirmar Conclusão & Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR EQUIPAMENTO */}
      {assetModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                {assetModal.item ? "Editar Equipamento" : "Cadastrar Equipamento"}
              </h2>
              <button
                type="button"
                onClick={() => setAssetModal({ open: false })}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <form
              action={saveAssetAction}
              onSubmit={() => setAssetModal({ open: false })}
              className="mt-4 space-y-3"
            >
              {assetModal.item?.id && <input type="hidden" name="id" value={assetModal.item.id} />}

              <div>
                <label className="label">Nome do Equipamento / Ativo *</label>
                <input
                  name="name"
                  defaultValue={assetModal.item?.name || ""}
                  placeholder="Ex: Elevador Social Torre A"
                  required
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria</label>
                  <select name="category" defaultValue={assetModal.item?.category || "elevador"} className="input w-full">
                    <option value="elevador">Elevador</option>
                    <option value="hidraulica">Hidráulica / Bombas</option>
                    <option value="portao">Portão & Acesso</option>
                    <option value="seguranca">Segurança & CFTV</option>
                    <option value="eletrica">Elétrica & Geradores</option>
                    <option value="equipamento">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select name="status" defaultValue={assetModal.item?.status || "operacional"} className="input w-full">
                    <option value="operacional">Operacional</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Localização</label>
                  <input
                    name="location"
                    defaultValue={assetModal.item?.location || ""}
                    placeholder="Ex: Casa de Máquinas"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Marca / Fabricante</label>
                  <input
                    name="brand"
                    defaultValue={assetModal.item?.brand || ""}
                    placeholder="Ex: Otis / Atlas Schindler"
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nº de Série</label>
                  <input
                    name="serial"
                    defaultValue={assetModal.item?.serial || ""}
                    placeholder="Ex: SN-948291-B"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Data de Instalação</label>
                  <input
                    type="date"
                    name="installedAt"
                    defaultValue={assetModal.item?.installedAt || ""}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">Observações Técnicas</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={assetModal.item?.notes || ""}
                  placeholder="Informações adicionais, garantia, especificações..."
                  className="input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setAssetModal({ open: false })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {assetModal.item ? "Salvar Alterações" : "Salvar Equipamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR PLANO PREVENTIVO */}
      {planModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                {planModal.item ? "Editar Plano Preventivo" : "Novo Plano Preventivo"}
              </h2>
              <button
                type="button"
                onClick={() => setPlanModal({ open: false })}
                className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <form
              action={savePlanAction}
              onSubmit={() => setPlanModal({ open: false })}
              className="mt-4 space-y-3"
            >
              {planModal.item?.id && <input type="hidden" name="id" value={planModal.item.id} />}

              <div>
                <label className="label">Título do Plano *</label>
                <input
                  name="title"
                  defaultValue={planModal.item?.title || ""}
                  placeholder="Ex: Manutenção Mensal das Bombas de Recalque"
                  required
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Equipamento Vinculado</label>
                <select name="assetId" defaultValue={planModal.item?.assetId || ""} className="input w-full">
                  <option value="">Área Comum Geral</option>
                  {initialAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Frequência (dias)</label>
                  <input
                    type="number"
                    name="frequencyDays"
                    defaultValue={planModal.item?.frequencyDays || 30}
                    required
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Próximo Vencimento</label>
                  <input
                    type="date"
                    name="nextDueAt"
                    defaultValue={planModal.item?.nextDueAt || today}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fornecedor Contratado</label>
                  <select name="vendorId" defaultValue={planModal.item?.vendorId || ""} className="input w-full">
                    <option value="">Equipe Interna</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Responsável Técnico</label>
                  <input
                    name="responsible"
                    defaultValue={planModal.item?.responsible || ""}
                    placeholder="Ex: Zelador / Técnico"
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label">Checklist de Verificação (1 item por linha)</label>
                <textarea
                  name="checklist"
                  rows={3}
                  defaultValue={planModal.item?.checklist ? planModal.item.checklist.join("\n") : ""}
                  placeholder={"Checar vazamentos\nVerificar nível de óleo\nTestar acionamento automático"}
                  className="input w-full font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setPlanModal({ open: false })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {planModal.item ? "Salvar Alterações" : "Criar Plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
