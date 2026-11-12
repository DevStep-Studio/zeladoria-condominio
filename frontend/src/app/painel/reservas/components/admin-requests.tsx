"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { dateBR, money } from "@/lib/utils";
import {
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
} from "@/lib/actions/reservas";
import type { Amenity, ReservationItem } from "../types";

interface AdminRequestsProps {
  requests: ReservationItem[];
  allReservations?: ReservationItem[];
  amenities?: Amenity[];
  onRefresh?: () => void;
}

export function AdminRequests({
  requests,
  allReservations = [],
  amenities = [],
  onRefresh,
}: AdminRequestsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active view filter: "pendentes" | "aprovadas" | "todas" | "historico"
  const [activeFilter, setActiveFilter] = useState<"pendentes" | "aprovadas" | "todas" | "historico">(
    requests.length > 0 ? "pendentes" : "aprovadas"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAmenityId, setSelectedAmenityId] = useState<string>("all");
  const [actionFeedback, setActionFeedback] = useState<{ tone: "green" | "rose" | "amber"; message: string } | null>(null);

  function broadcastUpdate() {
    if (typeof window !== "undefined") {
      try {
        const bc = new BroadcastChannel("zc_reservas_sync");
        bc.postMessage({ type: "RESERVATION_UPDATED", timestamp: Date.now() });
        bc.close();
      } catch {}
      try {
        localStorage.setItem("zc_reservas_last_update", String(Date.now()));
      } catch {}
    }
  }

  const handleApprove = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      const res = await approveReservationAction(formData);
      if (res?.success) {
        setActionFeedback({ tone: "green", message: "Reserva aprovada com sucesso! O morador foi notificado." });
        broadcastUpdate();
        onRefresh?.();
        router.refresh();
      } else {
        setActionFeedback({ tone: "rose", message: res?.error || "Erro ao aprovar reserva." });
      }
    });
  };

  const handleReject = (id: number) => {
    const promptValue = window.prompt("Informe o motivo da recusa (será enviado ao morador):");
    if (promptValue === null) return;
    const reason = promptValue.trim() || "Horário indisponível";
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("reason", reason);
      const res = await rejectReservationAction(formData);
      if (res?.success) {
        setActionFeedback({ tone: "amber", message: "Solicitação recusada. O morador foi notificado." });
        broadcastUpdate();
        onRefresh?.();
        router.refresh();
      } else {
        setActionFeedback({ tone: "rose", message: res?.error || "Erro ao recusar reserva." });
      }
    });
  };

  const handleCancel = (id: number) => {
    const promptValue = window.prompt("Confirmar cancelamento administrativo desta reserva? Motivo:");
    if (promptValue === null) return;
    const reason = promptValue.trim() || "Cancelamento administrativo pelo condomínio";
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("reason", reason);
      const res = await cancelReservationAction(formData);
      if (res?.success) {
        setActionFeedback({ tone: "amber", message: "Reserva cancelada com sucesso." });
        broadcastUpdate();
        onRefresh?.();
        router.refresh();
      } else {
        setActionFeedback({ tone: "rose", message: res?.error || "Erro ao cancelar reserva." });
      }
    });
  };

  // Aggregated lists
  const approvedReservations = useMemo(() => {
    return allReservations.filter((r) => r.status === "aprovada");
  }, [allReservations]);

  const cancelledOrRejected = useMemo(() => {
    return allReservations.filter((r) => r.status === "rejeitada" || r.status === "cancelada");
  }, [allReservations]);

  // Filtered reservations based on active filter, search and space
  const displayedReservations = useMemo(() => {
    let baseList: ReservationItem[] = [];
    if (activeFilter === "pendentes") {
      baseList = requests;
    } else if (activeFilter === "aprovadas") {
      baseList = approvedReservations;
    } else if (activeFilter === "historico") {
      baseList = cancelledOrRejected;
    } else {
      baseList = allReservations;
    }

    return baseList.filter((item) => {
      // Space filter
      if (selectedAmenityId !== "all" && String(item.amenityId) !== selectedAmenityId) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesResident = (item.userName || "").toLowerCase().includes(q);
        const matchesUnit = (item.unitNumber || "").toLowerCase().includes(q);
        const matchesBlock = (item.blockName || "").toLowerCase().includes(q);
        const matchesAmenity = (item.amenityName || "").toLowerCase().includes(q);
        if (!matchesResident && !matchesUnit && !matchesBlock && !matchesAmenity) {
          return false;
        }
      }
      return true;
    });
  }, [activeFilter, requests, approvedReservations, cancelledOrRejected, allReservations, selectedAmenityId, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3 text-xs font-semibold ${
            actionFeedback.tone === "green"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : actionFeedback.tone === "rose"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Control bar: Pills & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveFilter("pendentes")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "pendentes"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            Aguardando Aprovação ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("aprovadas")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "aprovadas"
                ? "bg-[#1355FF] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            Confirmadas ({approvedReservations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("todas")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "todas"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            Todas ({allReservations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("historico")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "historico"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            Canceladas/Recusadas ({cancelledOrRejected.length})
          </button>
        </div>

        {/* Search & Space selector */}
        <div className="flex items-center gap-2">
          {amenities.length > 0 && (
            <select
              value={selectedAmenityId}
              onChange={(e) => setSelectedAmenityId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos os espaços</option>
              {amenities.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Icon
              name="search"
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar morador, unidade..."
              className="input pl-8 py-1.5 text-xs w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {displayedReservations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="calendar" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {activeFilter === "pendentes"
              ? "Tudo em dia!"
              : "Nenhuma reserva encontrada"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === "pendentes"
              ? "Não há nenhuma solicitação pendente de aprovação no momento."
              : "Nenhuma reserva corresponde aos filtros selecionados."}
          </p>
        </div>
      ) : activeFilter === "pendentes" ? (
        /* Actionable Pending Approval Cards */
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedReservations.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-amber-300 bg-amber-50/40 p-4 shadow-xs space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2 border-b border-amber-200/60 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.userName || "Morador"}
                    </h4>
                    <p className="text-xs font-semibold text-[#1355FF]">
                      {item.unitNumber ? `Apto ${item.unitNumber}` : "Unidade vinculada"}
                      {item.blockName ? ` (${item.blockName})` : ""}
                    </p>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                    Aguardando aprovação
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  <p>
                    <strong>Espaço:</strong> {item.amenityName}
                  </p>
                  <p>
                    <strong>Data & Horário:</strong> {dateBR(item.date)} · das {item.startTime} às {item.endTime}
                  </p>
                  <p>
                    <strong>Convidados:</strong> {item.guests || 0} pessoas
                    {item.totalCents && item.totalCents > 0 ? ` · Taxa: ${money(item.totalCents)}` : " · Grátis"}
                  </p>
                  {item.notes && (
                    <p className="rounded-md bg-white p-2 border border-amber-200/60 italic text-slate-600 mt-1">
                      &quot;{item.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleReject(item.id)}
                  className="btn-secondary flex-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Recusar
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApprove(item.id)}
                  className="btn-primary flex-1 text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <Icon name="check" size={14} />
                  <span>Aprovar Reserva</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Full Condominium Reservations List / Table */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Espaço</th>
                  <th className="px-4 py-3">Morador / Unidade</th>
                  <th className="px-4 py-3">Data & Horário</th>
                  <th className="px-4 py-3">Convidados</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedReservations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.amenityName}</div>
                      {item.totalCents && item.totalCents > 0 ? (
                        <div className="text-[11px] text-slate-500">{money(item.totalCents)}</div>
                      ) : (
                        <div className="text-[11px] text-emerald-600 font-medium">Gratuito</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.userName || "Morador"}</div>
                      <div className="text-[11px] text-[#1355FF]">
                        {item.unitNumber ? `Apto ${item.unitNumber}` : "Unidade vinculada"}
                        {item.blockName ? ` (${item.blockName})` : ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{dateBR(item.date)}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.startTime} às {item.endTime}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {item.guests || 0} {item.guests === 1 ? "pessoa" : "pessoas"}
                    </td>

                    <td className="px-4 py-3">
                      {item.status === "aprovada" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Confirmada
                        </span>
                      ) : item.status === "pendente" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Pendente
                        </span>
                      ) : item.status === "cancelada" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                          Cancelada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          Rejeitada
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {item.status === "pendente" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleApprove(item.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleReject(item.id)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Recusar
                          </button>
                        </div>
                      ) : item.status === "aprovada" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleCancel(item.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {item.rejectionReason || item.cancellationReason || "Finalizada"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
