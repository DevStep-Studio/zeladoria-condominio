"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";

type OrderStatus = "aguardando" | "em_execucao" | "concluida" | "cancelada";

type WorkOrder = {
  id: number;
  code: string;
  service: string;
  category: string;
  vendor: string;
  location: string;
  date: string;
  status: OrderStatus;
  cost: string;
  description: string;
};

const SAMPLE_ORDERS: WorkOrder[] = [
  {
    id: 1,
    code: "OS-2026-041",
    service: "Troca de disjuntor principal e fiação bomba de recalque",
    category: "Elétrica",
    vendor: "Volt & Luz Soluções Elétricas",
    location: "Subsolo -1 (Casa de Bombas)",
    date: "02/09/2026",
    status: "em_execucao",
    cost: "R$ 680,00",
    description: "Substituição preventiva do disjuntor de 50A e revisão dos conectores térmicos da bomba reserva.",
  },
  {
    id: 2,
    code: "OS-2026-039",
    service: "Desentupimento e limpeza de calha da cobertura",
    category: "Hidráulica",
    vendor: "AquaFix Manutenções",
    location: "Cobertura Torre A",
    date: "01/09/2026",
    status: "aguardando",
    cost: "R$ 450,00",
    description: "Remoção de folhas e desobstrução do duto de escoamento pluvial antes do período de chuvas.",
  },
  {
    id: 3,
    code: "OS-2026-035",
    service: "Manutenção preventiva mensal nos elevadores",
    category: "Manutenção",
    vendor: "Atlas Schindler",
    location: "Torres A e B",
    date: "25/08/2026",
    status: "concluida",
    cost: "R$ 1.850,00",
    description: "Lubrificação de cabos de tração, verificação de freios eletromagnéticos e alinhamento de portas.",
  },
  {
    id: 4,
    code: "OS-2026-032",
    service: "Pintura demarcatória das vagas de garagem",
    category: "Pintura",
    vendor: "Color Master",
    location: "Garagem Subsolo -2",
    date: "18/08/2026",
    status: "concluida",
    cost: "R$ 1.200,00",
    description: "Pintura com tinta epóxi refletiva das linhas divisórias das vagas 45 a 80.",
  },
  {
    id: 5,
    code: "OS-2026-028",
    service: "Troca do motor do portão automático de pedestres",
    category: "Segurança",
    vendor: "SegurMax Portaria",
    location: "Portaria Principal",
    date: "10/08/2026",
    status: "cancelada",
    cost: "R$ 550,00",
    description: "Cancelada após constatação de que apenas a fotocélula de segurança precisava de calibração.",
  },
];

const STATUS_MAP: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  aguardando: { label: "Aguardando", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  em_execucao: { label: "Em execução", bg: "bg-blue-50", text: "text-[#0070F3]", border: "border-blue-200" },
  concluida: { label: "Concluída", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelada: { label: "Cancelada", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export default function OrdensPage() {
  const [filter, setFilter] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return SAMPLE_ORDERS.filter((order) => {
      if (filter !== "todas" && order.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          order.code.toLowerCase().includes(q) ||
          order.service.toLowerCase().includes(q) ||
          order.vendor.toLowerCase().includes(q) ||
          order.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Ordens de Serviço
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Acompanhamento de manutenções, prestadores e ordens executadas no condomínio
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600 overflow-x-auto max-w-full">
            {[
              { key: "todas", label: "Todas" },
              { key: "aguardando", label: "Aguardando" },
              { key: "em_execucao", label: "Em execução" },
              { key: "concluida", label: "Concluídas" },
              { key: "cancelada", label: "Canceladas" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-[6px] px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? "bg-white text-[#0070F3] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, serviço ou prestador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 w-full rounded-[8px] border border-slate-200 bg-slate-50 pl-8.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0070F3] focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP: Compact Table */}
      <div className="hidden md:block rounded-[14px] border border-slate-200 bg-white overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Número</th>
              <th className="p-3.5">Serviço</th>
              <th className="p-3.5">Prestador</th>
              <th className="p-3.5">Local</th>
              <th className="p-3.5">Data</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const st = STATUS_MAP[order.status];

              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#0070F3]">
                    {order.code}
                  </td>
                  <td className="p-3.5 font-bold text-[#0F172A] max-w-xs truncate">
                    {order.service}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {order.vendor}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {order.location}
                  </td>
                  <td className="p-3.5 text-slate-500 whitespace-nowrap">
                    {order.date}
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs font-bold text-[#0070F3] hover:underline"
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

      {/* MOBILE: Cards List */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => {
          const st = STATUS_MAP[order.status];

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-xs space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0070F3]">
                  {order.code}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                  {st.label}
                </span>
              </div>

              <h3 className="text-xs font-bold text-[#0F172A]">
                {order.service}
              </h3>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                <p><span className="font-semibold text-slate-600">Prestador:</span> {order.vendor}</p>
                <p><span className="font-semibold text-slate-600">Local:</span> {order.location}</p>
                <p><span className="font-semibold text-slate-600">Data:</span> {order.date}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSelectedOrder(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#0070F3]">
                  {selectedOrder.code}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  {selectedOrder.service}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-[8px]"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Descrição da Manutenção</span>
                <p className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                  {selectedOrder.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Prestador</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedOrder.vendor}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Localização</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedOrder.location}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Data da Execução</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedOrder.date}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Valor do Serviço</span>
                  <p className="font-bold text-emerald-700 mt-0.5">{selectedOrder.cost}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-primary btn-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
