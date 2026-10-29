"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { AppEmptyState, AppModal, AppButton } from "@/components/app-ui";

function formatMoney(centsVal: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centsVal / 100);
}

type RawOrder = {
  id: number;
  kind?: string;
  title: string;
  status: string;
  scheduledFor?: string | null;
  completedAt?: string | null;
  costCents?: number | null;
  technician?: string | null;
  report?: string | null;
  description?: string | null;
  assetId?: number | null;
};

type Asset = {
  id: number;
  name: string;
  location?: string | null;
  category?: string | null;
};

type Vendor = {
  id: number;
  name: string;
  category?: string | null;
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  programada: { label: "Programada", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  aguardando: { label: "Aguardando", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  em_execucao: { label: "Em execução", bg: "bg-blue-50", text: "text-[#1355FF]", border: "border-blue-200" },
  concluida: { label: "Concluída", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelada: { label: "Cancelada", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export function OrdensClient({
  initialOrders = [],
  assets = [],
  vendors = [],
}: {
  initialOrders?: RawOrder[];
  assets?: Asset[];
  vendors?: Vendor[];
}) {
  const [filter, setFilter] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RawOrder | null>(null);

  const assetMap = useMemo(() => {
    const map = new Map<number, Asset>();
    for (const a of assets) map.set(a.id, a);
    return map;
  }, [assets]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const statusKey = order.status?.toLowerCase() || "programada";
      if (filter !== "todas" && statusKey !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const assetName = order.assetId ? assetMap.get(order.assetId)?.name.toLowerCase() || "" : "";
        const title = order.title.toLowerCase();
        const desc = (order.description || "").toLowerCase();
        const tech = (order.technician || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || tech.includes(q) || assetName.includes(q);
      }
      return true;
    });
  }, [initialOrders, filter, search, assetMap]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="wrench"
        title="Ordens de Serviço"
        description="Gestão de intervenções preventivas, corretivas e contratos de manutenção predial."
        actions={
          <Link
            href="/painel/manutencao?tab=planos"
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-xs"
          >
            <Icon name="plus" size={15} />
            Nova Ordem / Plano
          </Link>
        }
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "todas", label: "Todas" },
            { id: "programada", label: "Programadas" },
            { id: "em_execucao", label: "Em Execução" },
            { id: "concluida", label: "Concluídas" },
            { id: "cancelada", label: "Canceladas" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-[8px] transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#1355FF] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por serviço, ativo ou técnico..."
            className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1355FF]/20 focus:border-[#1355FF]"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
            <Icon name="search" size={14} />
          </span>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-[12px] border border-slate-200/80 bg-white p-8">
          <AppEmptyState
            icon="wrench"
            title="Nenhuma ordem de serviço encontrada"
            description={
              search
                ? `Nenhum registro corresponde aos filtros selecionados.`
                : `Não existem ordens de serviço registradas no momento.`
            }
            action={{
              label: "Ver Cronograma de Manutenção",
              onClick: () => { window.location.href = "/painel/manutencao"; },
              icon: "wrench",
            }}
          />
        </div>
      ) : (
        <div className="rounded-[12px] border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código / Título</th>
                  <th className="py-3 px-4">Ativo / Local</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Data Agendada</th>
                  <th className="py-3 px-4">Custo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const statusKey = order.status?.toLowerCase() || "programada";
                  const statusMeta = STATUS_MAP[statusKey] || STATUS_MAP.programada;
                  const asset = order.assetId ? assetMap.get(order.assetId) : null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">
                          {order.title}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          OS-#{String(order.id).padStart(4, "0")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {asset ? (
                          <div>
                            <p className="font-medium text-slate-800">{asset.name}</p>
                            <p className="text-[10px] text-slate-400">{asset.location || "Área Comum"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Não especificado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] capitalize">
                          {order.kind || "preventiva"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {order.scheduledFor || order.completedAt || "A definir"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        {order.costCents ? formatMoney(order.costCents) : "R$ 0,00"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1355FF] hover:underline"
                        >
                          <span>Detalhes</span>
                          <Icon name="chevron-right" size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <AppModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Ordem de Serviço #OS-${String(selectedOrder.id).padStart(4, "0")}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Título da Intervenção</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOrder.title}</p>
            </div>

            {selectedOrder.description && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Escopo / Descrição</span>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-[8px] border border-slate-200">
                  {selectedOrder.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-[8px] border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo</span>
                <p className="font-bold text-slate-800 capitalize mt-0.5">{selectedOrder.kind || "preventiva"}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-[8px] border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Custo</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedOrder.costCents ? formatMoney(selectedOrder.costCents) : "R$ 0,00"}
                </p>
              </div>
            </div>

            {selectedOrder.report && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laudo / Relatório de Execução</span>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-emerald-50/50 p-3 rounded-[8px] border border-emerald-200">
                  {selectedOrder.report}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <AppButton variant="secondary" onClick={() => setSelectedOrder(null)}>
                Fechar
              </AppButton>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
