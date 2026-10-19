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

  const items: OccurrenceItem[] = initialOccurrences;

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
    <div className="space-y-4">
      {/* Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-[#0F172A]">
              Ocorrências recentes
            </h3>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ECFDF5] px-2 text-[11px] font-extrabold text-[#059669]">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Busque e filtre protocolos públicos.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Ordenar</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "priority")}
            aria-label="Ordenar ocorrências"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
          >
            <option value="recent">Mais recente: ↓</option>
            <option value="priority">Prioridade: ↑</option>
          </select>
        </div>
      </div>

      {/* Filter and Search Bar matching reference */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        {/* Search input */}
        <div className="relative flex items-center">
          <Icon name="search" size={16} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, rua ou categoria"
            className="w-full rounded-[12px] border border-slate-200 bg-white pl-9.5 pr-4 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#10B981] transition-colors"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>

        {/* Status Dropdown */}
        <div className="relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
            className="appearance-none rounded-[12px] border border-slate-200 bg-white pl-4 pr-8 py-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="todos">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
          </select>
          <Icon name="chevron-down" size={13} className="absolute right-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Button / Dropdown */}
        <div className="relative flex items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="appearance-none rounded-[12px] border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="todas">Todas as categorias</option>
            <option value="saude">Saúde</option>
            <option value="educacao">Educação</option>
            <option value="defesa civil">Defesa Civil</option>
            <option value="participacao">Participação</option>
            <option value="transparencia">Transparência</option>
            <option value="manutencao">Manutenção</option>
            <option value="seguranca">Segurança</option>
            <option value="limpeza">Limpeza</option>
          </select>
          <Icon name="filter" size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <Icon name="chevron-down" size={13} className="absolute right-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Occurrences List / Empty State */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 py-12 px-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#10B981] mb-3">
              <Icon name="check-circle" size={24} />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">Nenhuma ocorrência encontrada</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhuma solicitação ou protocolo aberto no momento para os filtros selecionados.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between gap-3 rounded-[14px] border border-slate-200 bg-white p-4 transition-all duration-150 hover:border-[#10B981]/60 hover:shadow-xs sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold font-mono text-[#059669] bg-emerald-50 px-2 py-0.5 rounded">
                    {item.protocol}
                  </span>
                  <span className="chip bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {item.category}
                  </span>
                  {getPriorityBadge(item.priority)}
                </div>

                <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#059669] transition-colors leading-tight">
                  {item.title}
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  {item.unit} · Registrado por <strong className="font-semibold text-slate-700">{item.reporter}</strong> · {item.createdAt}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t border-slate-100 pt-2.5 sm:border-t-0 sm:pt-0">
                {getStatusBadge(item.status)}
                <Link
                  href={`/painel/ocorrencias`}
                  className="rounded-[8px] border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
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
