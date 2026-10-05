"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { dateBR, isoDate, money } from "@/lib/utils";
import { approveReservationAction, rejectReservationAction, cancelReservationAction } from "@/lib/actions/reservas";
import type { Amenity, AmenityBlock, ReservationItem } from "../types";

interface AdminCalendarProps {
  reservations: ReservationItem[];
  amenities: Amenity[];
  blocks: AmenityBlock[];
  onOpenBlockModal: () => void;
}

export function AdminCalendar({
  reservations,
  amenities,
  blocks,
  onOpenBlockModal,
}: AdminCalendarProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAmenityId, setSelectedAmenityId] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeReservation, setActiveReservation] = useState<ReservationItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (selectedAmenityId !== "all" && r.amenityId !== selectedAmenityId) return false;
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      return true;
    });
  }, [reservations, selectedAmenityId, selectedStatus]);

  // Generate Month Matrix
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const matrix: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = isoDate();

    // Previous month filler
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const mStr = String(month === 0 ? 12 : month).padStart(2, "0");
      const yStr = month === 0 ? year - 1 : year;
      matrix.push({
        dateStr: `${yStr}-${mStr}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      matrix.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Next month filler
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const mStr = String(month === 11 ? 1 : month + 2).padStart(2, "0");
      const yStr = month === 11 ? year + 1 : year;
      matrix.push({
        dateStr: `${yStr}-${mStr}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return matrix;
  }, [currentDate]);

  // Actions
  const handleApprove = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await approveReservationAction(formData);
      setActiveReservation(null);
    });
  };

  const handleReject = (id: number) => {
    const reason = window.prompt("Motivo da recusa:") || "Horário indisponível";
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("reason", reason);
      await rejectReservationAction(formData);
      setActiveReservation(null);
    });
  };

  const handleCancel = (id: number) => {
    if (!confirm("Deseja realmente cancelar esta reserva administrativa?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await cancelReservationAction(formData);
      setActiveReservation(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Top Controls & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(currentDate);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentDate(prev);
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="text-xs font-bold text-slate-900 px-2 capitalize min-w-[120px] text-center">
              {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new Date(currentDate);
                next.setMonth(next.getMonth() + 1);
                setCurrentDate(next);
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Hoje
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedAmenityId}
            onChange={(e) => setSelectedAmenityId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="input py-1.5 text-xs"
          >
            <option value="all">Todos os espaços</option>
            {amenities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input py-1.5 text-xs"
          >
            <option value="all">Status: Todos</option>
            <option value="aprovada">Confirmadas</option>
            <option value="pendente">Aguardando Aprovação</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <button
            type="button"
            onClick={onOpenBlockModal}
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-red-700 hover:bg-red-50"
          >
            <Icon name="lock" size={13} />
            <span>Bloquear data</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MONTH VIEW GRID
          ========================================================================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
          <span>Domingo</span>
          <span>Segunda</span>
          <span>Terça</span>
          <span>Quarta</span>
          <span>Quinta</span>
          <span>Sexta</span>
          <span>Sábado</span>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {monthMatrix.map((cell) => {
            const dayReservations = filteredReservations.filter((r) => r.date === cell.dateStr);
            const dayBlocks = blocks.filter((b) => b.startDate <= cell.dateStr && b.endDate >= cell.dateStr);

            return (
              <div
                key={cell.dateStr}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "bg-white text-slate-800"
                } ${cell.isToday ? "bg-blue-50/30" : ""}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      cell.isToday
                        ? "bg-[#0055D4] text-white font-black"
                        : cell.isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {dayBlocks.length > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500" title="Manutenção / Bloqueio" />
                  )}
                </div>

                {/* Day Items */}
                <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[75px]">
                  {dayBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="truncate rounded-md bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800"
                      title={b.reason}
                    >
                      Bloq: {b.reason}
                    </div>
                  ))}

                  {dayReservations.map((res) => {
                    const isApproved = res.status === "aprovada";
                    const isPendingApproval = res.status === "pendente";

                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => setActiveReservation(res)}
                        className={`w-full text-left truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold border transition-all ${
                          isApproved
                            ? "bg-blue-50 border-blue-200 text-[#0055D4] hover:bg-blue-100"
                            : isPendingApproval
                            ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="font-bold">{res.startTime}</span> · {res.amenityName} (
                        {res.unitNumber ? `Apto ${res.unitNumber}` : "302"})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODAL: RESERVATION SÍNDICO DETAILS & QUICK ACTIONS
          ========================================================================= */}
      {activeReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gerenciar Reserva #{activeReservation.id}</h3>
                <p className="text-xs text-slate-500">{activeReservation.amenityName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReservation(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                  <div><strong>Data:</strong> {dateBR(activeReservation.date)}</div>
                  <div><strong>Horário:</strong> {activeReservation.startTime} às {activeReservation.endTime}</div>
                  <div><strong>Morador:</strong> {activeReservation.userName || "Não informado"}</div>
                  <div><strong>Unidade:</strong> {activeReservation.unitNumber ? `Apto ${activeReservation.unitNumber}` : "302"}</div>
                  <div><strong>Convidados:</strong> {activeReservation.guests || 0}</div>
                  <div><strong>Valor:</strong> {activeReservation.totalCents ? money(activeReservation.totalCents) : "Grátis"}</div>
                </div>

                {activeReservation.notes && (
                  <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 italic mt-2">
                    &quot;{activeReservation.notes}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Actions for Síndico */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {activeReservation.status === "pendente" ? (
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject(activeReservation.id)}
                    className="btn-secondary flex-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleApprove(activeReservation.id)}
                    className="btn-primary flex-1 text-xs"
                  >
                    Aprovar Reserva
                  </button>
                </div>
              ) : (
                <div className="flex w-full justify-between items-center">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleCancel(activeReservation.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancelar Reserva
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReservation(null)}
                    className="btn-secondary text-xs"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
