"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { dateBR, money, percent, isoDate } from "@/lib/utils";
import {
  payTransactionAction,
  registerChargePaymentAction,
  saveTransactionAction,
} from "@/lib/actions/admin";

export type TransactionItem = {
  id: number;
  kind: "receita" | "despesa";
  category: string;
  costCenter: string | null;
  description: string;
  amountCents: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  reserveFund: boolean;
  vendorName: string | null;
  attachmentUrl?: string | null;
};

export type ChargeItem = {
  id: number;
  reference: string;
  amountCents: number;
  dueDate: string;
  status: string;
  unit: string | null;
  block: string | null;
  method?: string | null;
};

export type BudgetItem = {
  id: number;
  category: string;
  plannedCents: number;
  year: number;
};

export type VendorOption = {
  id: number;
  name: string;
  category?: string | null;
};

const CATEGORY_NAMES: Record<string, string> = {
  pessoal: "Folha / Pessoal",
  utilidades: "Água, Luz & Gás",
  manutencao: "Manutenções & Reparos",
  administrativo: "Administração & Seguros",
  suprimentos: "Materiais & Limpeza",
  taxa_condominial: "Taxa Condominial",
  fundo_reserva: "Fundo de Reserva",
  obras: "Obras & Benfeitorias",
  outros: "Outros Lançamentos",
};

export function FinanceiroClient({
  condoName,
  transactions,
  charges,
  budgets,
  vendors,
  currentYear,
  canManage = true,
}: {
  condoName: string;
  transactions: TransactionItem[];
  charges: ChargeItem[];
  budgets: BudgetItem[];
  vendors: VendorOption[];
  currentYear: number;
  canManage?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"visao_geral" | "extrato" | "cobrancas" | "orcamento" | "contas_pagar">("visao_geral");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<"todos" | "receita" | "despesa">("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todos");
  const [chargeStatusFilter, setChargeStatusFilter] = useState<string>("todos");

  // Modal states
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [settlingCharge, setSettlingCharge] = useState<ChargeItem | null>(null);
  const [payingTransaction, setPayingTransaction] = useState<TransactionItem | null>(null);

  // New Transaction form state
  const [txKind, setTxKind] = useState<"despesa" | "receita">("despesa");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDueDate, setTxDueDate] = useState(isoDate());
  const [txCategory, setTxCategory] = useState("manutencao");
  const [txCostCenter, setTxCostCenter] = useState("administracao");
  const [txVendorId, setTxVendorId] = useState("");
  const [txReserveFund, setTxReserveFund] = useState(false);
  const [txAttachmentUrl, setTxAttachmentUrl] = useState("");
  const [settleMethod, setSettleMethod] = useState("pix");

  const [isPending, startTransition] = useTransition();
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // KPI calculations
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.kind === "receita").reduce((a, t) => a + t.amountCents, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.kind === "despesa").reduce((a, t) => a + t.amountCents, 0),
    [transactions]
  );
  const netResult = totalIncome - totalExpense;
  const reserveFundBalance = useMemo(
    () => transactions.filter((t) => t.reserveFund).reduce((a, t) => a + t.amountCents, 0),
    [transactions]
  );
  const payableTransactions = useMemo(
    () => transactions.filter((t) => t.kind === "despesa" && t.status !== "pago"),
    [transactions]
  );
  const totalPayableAmount = useMemo(
    () => payableTransactions.reduce((a, t) => a + t.amountCents, 0),
    [payableTransactions]
  );

  const overdueCharges = useMemo(
    () => charges.filter((c) => c.status === "vencida"),
    [charges]
  );
  const totalOverdueAmount = useMemo(
    () => overdueCharges.reduce((a, c) => a + c.amountCents, 0),
    [overdueCharges]
  );
  const delinquencyRate = percent(overdueCharges.length, charges.length);

  // Realized by category
  const realizedByCategory = useMemo(() => {
    return transactions
      .filter((t) => t.kind === "despesa")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amountCents;
        return acc;
      }, {});
  }, [transactions]);

  // Filtered transactions for Extrato
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterKind !== "todos" && t.kind !== filterKind) return false;
      if (filterStatus !== "todos" && t.status !== filterStatus) return false;
      if (filterCategory !== "todos" && t.category !== filterCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(q);
        const vendorMatch = t.vendorName?.toLowerCase().includes(q);
        const catMatch = t.category.toLowerCase().includes(q);
        if (!descMatch && !vendorMatch && !catMatch) return false;
      }
      return true;
    });
  }, [transactions, filterKind, filterStatus, filterCategory, searchTerm]);

  // Filtered charges
  const filteredCharges = useMemo(() => {
    return charges.filter((c) => {
      if (chargeStatusFilter !== "todos" && c.status !== chargeStatusFilter) return false;
      return true;
    });
  }, [charges, chargeStatusFilter]);

  // Actions
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription.trim() || !txAmount.trim()) return;

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("kind", txKind);
        fd.append("description", txDescription.trim());
        fd.append("amount", txAmount);
        fd.append("dueDate", txDueDate);
        fd.append("category", txCategory);
        fd.append("costCenter", txCostCenter);
        if (txVendorId) fd.append("vendorId", txVendorId);
        if (txReserveFund) fd.append("reserveFund", "on");
        if (txAttachmentUrl) fd.append("attachmentUrl", txAttachmentUrl);

        await saveTransactionAction(fd);
        setIsNewTxModalOpen(false);
        setTxDescription("");
        setTxAmount("");
        setTxAttachmentUrl("");
        setFeedbackMessage({ type: "success", text: "Lançamento registrado com sucesso!" });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } catch (err: any) {
        setFeedbackMessage({ type: "error", text: err?.message || "Erro ao registrar lançamento." });
      }
    });
  };

  const handlePayTransaction = (tx: TransactionItem) => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("id", String(tx.id));
        await payTransactionAction(fd);
        setPayingTransaction(null);
        setFeedbackMessage({ type: "success", text: `Lançamento "${tx.description}" baixado como pago!` });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } catch (err: any) {
        setFeedbackMessage({ type: "error", text: err?.message || "Erro ao baixar lançamento." });
      }
    });
  };

  const handleSettleCharge = (charge: ChargeItem) => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("id", String(charge.id));
        fd.append("method", settleMethod);
        await registerChargePaymentAction(fd);
        setSettlingCharge(null);
        setFeedbackMessage({ type: "success", text: `Cobrança da unidade ${charge.block} ${charge.unit} quitada via ${settleMethod.toUpperCase()}!` });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } catch (err: any) {
        setFeedbackMessage({ type: "error", text: err?.message || "Erro ao quitar cobrança." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] shadow-2xs">
              <Icon name="wallet" size={18} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
                Gestão Financeira & DRE
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {condoName} · Prestação de contas do exercício {currentYear}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/financeiro"
            download
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Icon name="download" size={13} className="text-slate-500" />
            <span>Exportar CSV</span>
          </a>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>Novo Lançamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback message banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in duration-150 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={feedbackMessage.type === "success" ? "check-circle" : "alert-triangle"}
              size={15}
            />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      )}

      {/* Executive KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Receitas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Receitas</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="trending" size={12} />
            </span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-emerald-600 truncate">
            {money(totalIncome)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Taxas e arrecadações</p>
        </div>

        {/* Despesas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Despesas</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Icon name="wallet" size={12} />
            </span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-[#0F172A] truncate">
            {money(totalExpense)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Lançamentos realizados</p>
        </div>

        {/* Saldo Líquido */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resultado (Saldo)</span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                netResult >= 0 ? "bg-blue-50 text-[#0055D4]" : "bg-rose-50 text-rose-600"
              }`}
            >
              <Icon name="chart" size={12} />
            </span>
          </div>
          <p
            className={`mt-2 text-lg sm:text-xl font-black truncate ${
              netResult >= 0 ? "text-[#0055D4]" : "text-rose-600"
            }`}
          >
            {money(netResult)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
            {netResult >= 0 ? "Superávit do período" : "Déficit operacional"}
          </p>
        </div>

        {/* Contas a Pagar */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Contas a Pagar</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Icon name="clock" size={12} />
            </span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-amber-700 truncate">
            {money(totalPayableAmount)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
            {payableTransactions.length} títulos pendentes
          </p>
        </div>

        {/* Inadimplência / Fundo de Reserva */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inadimplência</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Icon name="shield" size={12} />
            </span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-[#0F172A] truncate">
            {delinquencyRate}%
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 font-medium truncate">
            {money(totalOverdueAmount)} em atraso ({overdueCharges.length} unid.)
          </p>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: "visao_geral", label: "Visão Geral & DRE", icon: "chart" as IconName },
          { id: "extrato", label: "Extrato & Lançamentos", icon: "file-text" as IconName, count: transactions.length },
          { id: "cobrancas", label: "Cobranças & Inadimplência", icon: "wallet" as IconName, count: overdueCharges.length > 0 ? `${overdueCharges.length} atrasadas` : undefined },
          { id: "orcamento", label: "Orçamento Anual (Budget)", icon: "target" as IconName },
          { id: "contas_pagar", label: "Contas a Pagar", icon: "clock" as IconName, count: payableTransactions.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-[#0055D4] text-[#0055D4] bg-blue-50/40 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon name={tab.icon} size={14} className={isActive ? "text-[#0055D4]" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-blue-100 text-[#0055D4]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISÃO GERAL & DRE */}
      {activeTab === "visao_geral" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Orçamento x Realizado */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Orçamento Planejado vs. Realizado</h3>
                  <p className="text-xs text-slate-500">Acompanhamento do teto orçamentário por categoria</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{currentYear}</span>
              </div>

              {budgets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum orçamento cadastrado para este condomínio.
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((b) => {
                    const realized = realizedByCategory[b.category] ?? 0;
                    const pct = percent(realized, b.plannedCents);
                    const isOverBudget = pct > 100;
                    const isWarning = pct >= 80 && pct <= 100;

                    return (
                      <div key={b.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0F172A]">
                            {CATEGORY_NAMES[b.category] || b.category}
                          </span>
                          <span className="text-slate-500 font-mono">
                            <strong className={isOverBudget ? "text-rose-600" : "text-slate-800"}>
                              {money(realized)}
                            </strong>{" "}
                            / {money(b.plannedCents)}{" "}
                            <span
                              className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isOverBudget
                                  ? "bg-rose-100 text-rose-700"
                                  : isWarning
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {pct}%
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverBudget
                                ? "bg-rose-500"
                                : isWarning
                                ? "bg-amber-500"
                                : "bg-[#0055D4]"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Demonstrativo Resumido DRE */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2.5">
                Demonstrativo de Resultados do Exercício (DRE)
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between py-2 font-bold text-emerald-700">
                  <span>(+) Receitas Operacionais (Taxas e Cotas)</span>
                  <span>{money(totalIncome)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span className="pl-3">(-) Despesas com Pessoal e Encargos</span>
                  <span>{money(realizedByCategory["pessoal"] ?? 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span className="pl-3">(-) Consumos e Concessionárias (Água/Luz)</span>
                  <span>{money(realizedByCategory["utilidades"] ?? 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span className="pl-3">(-) Manutenções e Conservação Predial</span>
                  <span>{money(realizedByCategory["manutencao"] ?? 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span className="pl-3">(-) Despesas Administrativas & Seguros</span>
                  <span>{money(realizedByCategory["administrativo"] ?? 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span className="pl-3">(-) Materiais e Suprimentos</span>
                  <span>{money(realizedByCategory["suprimentos"] ?? 0)}</span>
                </div>
                <div className="flex justify-between py-2.5 font-bold text-sm border-t-2 border-slate-200 pt-3">
                  <span className="text-[#0F172A]">(=) Superávit / Déficit Operacional</span>
                  <span className={netResult >= 0 ? "text-[#0055D4]" : "text-rose-600"}>
                    {money(netResult)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fundo de Reserva & Ações Rápidas */}
          <div className="space-y-6">
            {/* Fundo de Reserva Card */}
            <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-[#0055D4]">
                <Icon name="shield" size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Fundo de Reserva</h4>
              </div>
              <p className="text-2xl font-black text-[#0F172A]">{money(reserveFundBalance)}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reserva legal destinada a emergências, obras estruturais e melhorias aprovadas em assembleia.
              </p>
            </div>

            {/* Inadimplência Alerta */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-[#0F172A]">Controle de Inadimplência</h4>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  {overdueCharges.length} títulos
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Taxa de inadimplência:</span>
                  <strong className="text-rose-600">{delinquencyRate}%</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total a receber em atraso:</span>
                  <strong className="text-slate-800">{money(totalOverdueAmount)}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("cobrancas");
                  setChargeStatusFilter("vencida");
                }}
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0055D4] py-2 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Ver cobranças em aberto →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTRATO & LANÇAMENTOS */}
      {activeTab === "extrato" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar lançamento, fornecedor ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              {/* Kind Filter */}
              <select
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value as any)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-[#0055D4]"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="receita">Apenas Receitas</option>
                <option value="despesa">Apenas Despesas</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-[#0055D4]"
              >
                <option value="todos">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-400 px-2">
              {filteredTransactions.length} lançamentos encontrados
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Descrição & Fornecedor</th>
                    <th className="py-3 px-4">Categoria / Centro</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Nenhum lançamento encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0F172A]">{t.description}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className={t.kind === "receita" ? "text-emerald-600 font-bold" : "text-slate-600 font-semibold"}>
                              {t.kind === "receita" ? "Receita" : "Despesa"}
                            </span>
                            {t.vendorName && <span>· {t.vendorName}</span>}
                            {t.reserveFund && (
                              <span className="text-[#0055D4] font-semibold">· Fundo Reserva</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {CATEGORY_NAMES[t.category] || t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                          {dateBR(t.dueDate)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          <span className={t.kind === "receita" ? "text-emerald-600 font-mono" : "text-[#0F172A] font-mono"}>
                            {money(t.amountCents)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              t.status === "pago"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : t.status === "atrasado"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {canManage && t.status !== "pago" && t.kind === "despesa" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handlePayTransaction(t)}
                              className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent px-2.5 py-1 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Baixar Pago
                            </button>
                          ) : t.status === "pago" && t.paidDate ? (
                            <span className="text-[10px] text-slate-400">Pago em {dateBR(t.paidDate)}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COBRANÇAS & INADIMPLÊNCIA */}
      {activeTab === "cobrancas" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChargeStatusFilter("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  chargeStatusFilter === "todos"
                    ? "bg-[#0055D4] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todas ({charges.length})
              </button>
              <button
                type="button"
                onClick={() => setChargeStatusFilter("vencida")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  chargeStatusFilter === "vencida"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Vencidas / Em Atraso ({overdueCharges.length})
              </button>
              <button
                type="button"
                onClick={() => setChargeStatusFilter("paga")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  chargeStatusFilter === "paga"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Pagas ({charges.filter((c) => c.status === "paga").length})
              </button>
            </div>
          </div>

          {/* Charges Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Unidade / Morador</th>
                    <th className="py-3 px-4">Referência</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-right">Valor da Taxa</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quitação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCharges.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Nenhuma cobrança encontrada para esta categoria.
                      </td>
                    </tr>
                  ) : (
                    filteredCharges.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0F172A]">{c.block || "Bloco"} · Unidade {c.unit}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.reference}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                          {dateBR(c.dueDate)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap font-mono text-slate-900">
                          {money(c.amountCents)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              c.status === "paga"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {canManage && c.status !== "paga" ? (
                            <button
                              type="button"
                              onClick={() => setSettlingCharge(c)}
                              className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Dar Quitação
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Quitado {c.method ? `via ${c.method.toUpperCase()}` : ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORÇAMENTO ANUAL */}
      {activeTab === "orcamento" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Planejamento Orçamentário {currentYear}</h3>
              <p className="text-xs text-slate-500">Comparação anual entre verba aprovada em assembleia e despesas incorridas</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Centro de Custo / Categoria</th>
                    <th className="py-3 px-4 text-right">Planejado (Ano)</th>
                    <th className="py-3 px-4 text-right">Realizado (Acumulado)</th>
                    <th className="py-3 px-4 text-right">Saldo Restante</th>
                    <th className="py-3 px-4 text-center">% Consumido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => {
                    const realized = realizedByCategory[b.category] ?? 0;
                    const balance = b.plannedCents - realized;
                    const pct = percent(realized, b.plannedCents);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-[#0F172A]">
                          {CATEGORY_NAMES[b.category] || b.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {money(b.plannedCents)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                          {money(realized)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={balance >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {money(balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              pct > 100
                                ? "bg-rose-100 text-rose-700"
                                : pct >= 80
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONTAS A PAGAR */}
      {activeTab === "contas_pagar" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Fila de Contas a Pagar</h3>
                <p className="text-xs text-slate-500">Títulos com vencimento pendente ou em atraso</p>
              </div>
              <span className="text-sm font-black text-amber-700 font-mono">
                Total: {money(totalPayableAmount)}
              </span>
            </div>

            {payableTransactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Icon name="check-circle" size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">Todas as contas estão em dia!</p>
                <p className="text-[11px] text-slate-400">Nenhum título pendente de liquidação no momento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payableTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{tx.description}</p>
                      <p className="text-[10px] text-slate-500">
                        {CATEGORY_NAMES[tx.category] || tx.category} {tx.vendorName ? `· ${tx.vendorName}` : ""} · Vencimento: <strong className="font-mono text-slate-800">{dateBR(tx.dueDate)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className="text-xs font-black font-mono text-[#0F172A]">
                        {money(tx.amountCents)}
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handlePayTransaction(tx)}
                          className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          Baixar Pagamento
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVO LANÇAMENTO */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsNewTxModalOpen(false)}
            aria-hidden
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Registrar Lançamento Financeiro</h3>
              <button
                type="button"
                onClick={() => setIsNewTxModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
              {/* Kind selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxKind("despesa")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      txKind === "despesa"
                        ? "border-rose-500 bg-rose-50 text-rose-700 shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxKind("receita")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      txKind === "receita"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Lançamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manutenção preventiva do elevador social"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0055D4]"
                />
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0055D4]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0055D4]"
                  />
                </div>
              </div>

              {/* Category & Cost Center */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 outline-none focus:border-[#0055D4]"
                  >
                    <option value="manutencao">Manutenções & Reparos</option>
                    <option value="pessoal">Folha / Pessoal</option>
                    <option value="utilidades">Água, Luz & Gás</option>
                    <option value="administrativo">Administração & Seguros</option>
                    <option value="suprimentos">Materiais & Limpeza</option>
                    <option value="taxa_condominial">Taxa Condominial</option>
                    <option value="fundo_reserva">Fundo de Reserva</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centro de Custo</label>
                  <select
                    value={txCostCenter}
                    onChange={(e) => setTxCostCenter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 outline-none focus:border-[#0055D4]"
                  >
                    <option value="administracao">Administração</option>
                    <option value="pessoal">Pessoal / Portaria</option>
                    <option value="areas_comuns">Áreas Comuns</option>
                    <option value="obras">Obras & Melhorias</option>
                  </select>
                </div>
              </div>

              {/* Vendor (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fornecedor Vinculado (Opcional)</label>
                <select
                  value={txVendorId}
                  onChange={(e) => setTxVendorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 outline-none focus:border-[#0055D4]"
                >
                  <option value="">Nenhum fornecedor específico</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reserve Fund Checkbox */}
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={txReserveFund}
                  onChange={(e) => setTxReserveFund(e.target.checked)}
                  className="h-4 w-4 rounded text-[#0055D4] focus:ring-[#0055D4]"
                />
                <span>Compõe o Fundo de Reserva do condomínio</span>
              </label>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !txDescription.trim() || !txAmount.trim()}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending && <Icon name="refresh" size={12} className="animate-spin text-white" />}
                  <span>Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUITAR COBRANÇA */}
      {settlingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSettlingCharge(null)}
            aria-hidden
          />

          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-[#0F172A]">Registrar Quitação</h3>
              <button
                type="button"
                onClick={() => setSettlingCharge(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-xs">
              <p className="text-slate-500">Unidade: <strong className="text-slate-800">{settlingCharge.block} {settlingCharge.unit}</strong></p>
              <p className="text-slate-500">Referência: <strong className="text-slate-800">{settlingCharge.reference}</strong></p>
              <p className="text-slate-500">Valor: <strong className="text-emerald-700 font-mono">{money(settlingCharge.amountCents)}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={settleMethod}
                onChange={(e) => setSettleMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0055D4]"
              >
                <option value="pix">PIX Instantâneo</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência / TED</option>
                <option value="cartao">Cartão de Crédito / Débito</option>
                <option value="dinheiro">Espécie / Dinheiro</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettlingCharge(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSettleCharge(settlingCharge)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Confirmando..." : "Confirmar Quitação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
