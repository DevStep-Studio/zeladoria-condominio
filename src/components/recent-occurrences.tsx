"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";

export type OccurrenceItem = {
  id: number;
  protocol: string;
  title: string;
  category: string;
  unit: string;
  reporter: string;
  status: "aberto" | "em_andamento" | "pendente" | "concluido";
  priority: "baixa" | "media" | "alta" | "urgente";
  createdAt: string;
};

export function RecentOccurrences({
  initialOccurrences = [],
}: {
  initialOccurrences?: OccurrenceItem[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [sortBy, setSortBy] = useState<"recent" | "priority">("recent");

  // Fallback demo occurrences if none are provided
  const items: OccurrenceItem[] = useMemo(() => {
    if (initialOccurrences.length > 0) return initialOccurrences;
    return [
      {
        id: 1,
        protocol: "OCO-2026-0042",
        title: "Vazamento no registro da garagem",
        category: "Hidráulica",
        unit: "Subsolo 1 · Vaga 42",
        reporter: "Zelador Carlos",
        status: "em_andamento",
        priority: "alta",
        createdAt: "Hoje às 10:30",
      },
      {
        id: 2,
        protocol: "OCO-2026-0041",
        title: "Lâmpada queimada no hall do 3º andar",
        category: "Elétrica",
        unit: "Bloco A · Apto 302",
        reporter: "Ana Ribeiro",
        status: "aberto",
        priority: "media",
        createdAt: "Hoje às 08:15",
      },
      {
        id: 3,
        protocol: "OCO-2026-0040",
        title: "Barulho excessivo após às 22h",
        category: "Convivência",
        unit: "Bloco B · Apto 504",
        reporter: "Portaria Central",
        status: "concluido",
        priority: "alta",
        createdAt: "Ontem às 23:10",
      },
      {
        id: 4,
        protocol: "OCO-2026-0039",
        title: "Portão da garagem com abertura lenta",
        category: "Segurança",
        unit: "Entrada Veículos",
        reporter: "Marcos (Porteiro)",
        status: "em_andamento",
        priority: "urgente",
        createdAt: "Ontem às 16:45",
      },
      {
        id: 5,
        protocol: "OCO-2026-0038",
        title: "Higienização dos filtros da piscina",
        category: "Limpeza",
        unit: "Área de Lazer",
        reporter: "Síndico",
        status: "concluido",
        priority: "baixa",
        createdAt: "23/08/2026",
      },
    ];
  }, [initialOccurrences]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.protocol.toLowerCase().includes(search.toLowerCase()) ||
        item.unit.toLowerCase().includes(search.toLowerCase()) ||
        item.reporter.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "todos" || item.status === statusFilter;
      const matchCat = categoryFilter === "todas" || item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchStatus && matchCat;
    });
  }, [items, search, statusFilter, categoryFilter]);

  const getStatusBadge = (status: OccurrenceItem["status"]) => {
    switch (status) {
      case "aberto":
        return <span className="chip bg-blue-50 text-blue-700 border border-blue-200">Aberto</span>;
      case "em_andamento":
        return <span className="chip bg-amber-50 text-amber-700 border border-amber-200">Em andamento</span>;
      case "pendente":
        return <span className="chip bg-orange-50 text-orange-700 border border-orange-200">Pendente</span>;
      case "concluido":
        return <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">Concluído</span>;
    }
  };

  const getPriorityBadge = (priority: OccurrenceItem["priority"]) => {
    switch (priority) {
      case "urgente":
        return <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Urgente</span>;
      case "alta":
        return <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Alta</span>;
      case "media":
        return <span className="text-[10px] font-medium uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Média</span>;
      case "baixa":
        return <span className="text-[10px] font-medium uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Baixa</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight text-[var(--color-ink)]">
            Ocorrências recentes
          </h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ECFDF5] px-1.5 text-[11px] font-extrabold text-[#059669]">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span>Ordenar:</span>
          <button
            type="button"
            onClick={() => setSortBy((s) => (s === "recent" ? "priority" : "recent"))}
            className="text-[var(--color-ink)] font-bold hover:text-[#0070F3] underline-offset-4 hover:underline"
          >
            {sortBy === "recent" ? "Mais recentes" : "Prioridade"}
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted)] -mt-1">
        Busque e filtre protocolos de manutenção e zeladoria.
      </p>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_140px_140px]">
        {/* Search input */}
        <div className="relative flex items-center">
          <Icon name="search" size={16} className="absolute left-3.5 text-[var(--color-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, categoria ou morador..."
            className="input pl-9.5 min-h-10 text-xs"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input min-h-10 py-1 text-xs"
        >
          <option value="todos">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em andamento</option>
          <option value="pendente">Pendente</option>
          <option value="concluido">Concluído</option>
        </select>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input min-h-10 py-1 text-xs"
        >
          <option value="todas">Todas as categorias</option>
          <option value="hidraulica">Hidráulica</option>
          <option value="eletrica">Elétrica</option>
          <option value="seguranca">Segurança</option>
          <option value="limpeza">Limpeza</option>
          <option value="convivencia">Convivência</option>
        </select>
      </div>

      {/* Occurrences List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--color-line)] bg-white p-8 text-center">
            <Icon name="search" size={24} className="mx-auto text-[var(--color-muted)] mb-2" />
            <p className="text-sm font-semibold text-[var(--color-ink)]">Nenhuma ocorrência encontrada</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Tente ajustar os filtros ou termo de busca.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between gap-3 rounded-[14px] border border-[var(--color-line)] bg-white p-4 transition-all duration-150 hover:border-[#0070F3]/40 hover:shadow-sm sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold font-mono text-[#0070F3] bg-blue-50 px-2 py-0.5 rounded">
                    {item.protocol}
                  </span>
                  <span className="chip bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {item.category}
                  </span>
                  {getPriorityBadge(item.priority)}
                </div>

                <h4 className="text-sm font-bold text-[var(--color-ink)] group-hover:text-[#0070F3] transition-colors leading-tight">
                  {item.title}
                </h4>

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {item.unit} · Registrado por <strong className="font-semibold text-[var(--color-ink)]">{item.reporter}</strong> · {item.createdAt}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t border-[var(--color-line)] pt-2.5 sm:border-t-0 sm:pt-0">
                {getStatusBadge(item.status)}
                <Link
                  href={`/painel/chamados`}
                  className="rounded-[8px] border border-[var(--color-line)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  Detalhes
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
