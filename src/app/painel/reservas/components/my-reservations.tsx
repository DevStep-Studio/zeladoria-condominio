"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { dateBR, isoDate, money } from "@/lib/utils";
import { cancelReservationAction } from "@/lib/actions/reservas";
import type { Amenity, ReservationItem } from "../types";

interface MyReservationsProps {
  reservations: ReservationItem[];
  amenities: Amenity[];
  currentUserId: number;
}

export function MyReservations({ reservations, amenities, currentUserId }: MyReservationsProps) {
  const [filter, setFilter] = useState<"upcoming" | "pending" | "history" | "cancelled">("upcoming");
  const [selectedDetail, setSelectedDetail] = useState<ReservationItem | null>(null);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; item?: ReservationItem | null }>({ open: false });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayStr = isoDate();

  const myReservations = useMemo(() => {
    return reservations.filter((r) => r.userId === currentUserId);
  }, [reservations, currentUserId]);

  const upcoming = useMemo(
    () => myReservations.filter((r) => r.status === "aprovada" && r.date >= todayStr),
    [myReservations, todayStr]
  );
  const pending = useMemo(
    () => myReservations.filter((r) => r.status === "pendente"),
    [myReservations]
  );
  const history = useMemo(
    () => myReservations.filter((r) => (r.status === "concluida" || (r.status === "aprovada" && r.date < todayStr))),
    [myReservations, todayStr]
  );
  const cancelled = useMemo(
    () => myReservations.filter((r) => r.status === "cancelada" || r.status === "rejeitada"),
    [myReservations]
  );

  const displayedList = useMemo(() => {
    if (filter === "upcoming") return upcoming;
    if (filter === "pending") return pending;
    if (filter === "history") return history;
    return cancelled;
  }, [filter, upcoming, pending, history, cancelled]);

  const handleConfirmCancel = () => {
    if (!cancelModal.item) return;
    setCancelError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(cancelModal.item!.id));
      formData.set("reason", cancelReason || "Cancelamento pelo condômino");

      const res = await cancelReservationAction(formData);
      if (res.success) {
        setCancelModal({ open: false, item: null });
        setCancelReason("");
        if (selectedDetail?.id === cancelModal.item!.id) {
          setSelectedDetail(null);
        }
      } else {
        setCancelError(res.error || "Não foi possível cancelar a reserva.");
      }
    });
  };

  const getSpaceForRes = (amenityId: number): Amenity | undefined => {
    return amenities.find((a) => a.id === amenityId);
  };

  const getPhotoForAmenity = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("churrasq")) return "/amenities/churrasqueira.jpg";
    if (lower.includes("coworking") || lower.includes("reuni")) return "/amenities/coworking.jpg";
    if (lower.includes("quadra") || lower.includes("esporte")) return "/amenities/quadra.jpg";
    if (lower.includes("festa") || lower.includes("salao") || lower.includes("salão")) return "/amenities/salao-festas.jpg";
    if (lower.includes("piscina")) return "/amenities/piscina.jpg";
    if (lower.includes("academia")) return "/amenities/academia.jpg";
    return "/amenities/salao-festas.jpg";
  };

  return (
    <div className="space-y-4">
      {/* Subtabs Filter Capsule */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter("upcoming")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "upcoming"
              ? "bg-[#0055D4] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Próximas</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${filter === "upcoming" ? "bg-white/20" : "bg-slate-200"}`}>
            {upcoming.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "pending"
              ? "bg-[#0055D4] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Aguardando aprovação</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${filter === "pending" ? "bg-white/20" : "bg-slate-200"}`}>
            {pending.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("history")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "history"
              ? "bg-[#0055D4] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Histórico</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${filter === "history" ? "bg-white/20" : "bg-slate-200"}`}>
            {history.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("cancelled")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "cancelled"
              ? "bg-[#0055D4] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Canceladas</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${filter === "cancelled" ? "bg-white/20" : "bg-slate-200"}`}>
            {cancelled.length}
          </span>
        </button>
      </div>

      {/* List / Empty State */}
      {displayedList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="calendar" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {filter === "upcoming"
              ? "Você não possui nenhuma reserva futura confirmada"
              : filter === "pending"
              ? "Nenhuma solicitação aguardando aprovação no momento"
              : filter === "history"
              ? "Nenhuma reserva no histórico"
              : "Nenhuma reserva cancelada"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore as áreas comuns disponíveis do condomínio para agendar eventos e atividades.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedList.map((item) => {
            const photo = getPhotoForAmenity(item.amenityName);
            const isApproved = item.status === "aprovada";
            const isPendingApproval = item.status === "pendente";
            const isCancelled = item.status === "cancelada";
            const isRejected = item.status === "rejeitada";
            const isCompleted = item.status === "concluida";

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                      <Image src={photo} alt={item.amenityName} fill className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.amenityName}
                        </h4>
                        {isApproved && (
                          <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Confirmada
                          </span>
                        )}
                        {isPendingApproval && (
                          <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            Aguardando
                          </span>
                        )}
                        {isCancelled && (
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            Cancelada
                          </span>
                        )}
                        {isRejected && (
                          <span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                            Recusada
                          </span>
                        )}
                        {isCompleted && (
                          <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0055D4] border border-blue-200">
                            Concluída
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-700">
                        {dateBR(item.date)} · {item.startTime} às {item.endTime}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {item.guests ? `${item.guests} convidados` : "Sem convidados informados"}
                        {item.totalCents && item.totalCents > 0 ? ` · ${money(item.totalCents)}` : " · Grátis"}
                      </p>
                    </div>
                  </div>

                  {item.rejectionReason && (
                    <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
                      <strong>Motivo da recusa:</strong> {item.rejectionReason}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md italic">
                      &quot;{item.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetail(item)}
                    className="btn-secondary btn-sm text-xs flex-1 text-center"
                  >
                    Ver comprovante
                  </button>

                  {(isApproved || isPendingApproval) && item.date >= todayStr && (
                    <button
                      type="button"
                      onClick={() => setCancelModal({ open: true, item })}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: RESERVATION DETAILS / COMPROVANTE
          ========================================================================= */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Comprovante de Reserva</h3>
                <p className="text-xs text-slate-500">Código: #{selectedDetail.id.toString().padStart(5, "0")}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 text-slate-700"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex justify-between font-bold text-sm text-slate-900 border-b border-slate-200 pb-1.5">
                  <span>{selectedDetail.amenityName}</span>
                  <span className="capitalize text-[#0055D4]">{selectedDetail.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-slate-700">
                  <div><strong>Data:</strong> {dateBR(selectedDetail.date)}</div>
                  <div><strong>Horário:</strong> {selectedDetail.startTime} às {selectedDetail.endTime}</div>
                  <div><strong>Unidade:</strong> {selectedDetail.unitNumber ? `Apto ${selectedDetail.unitNumber}` : "302"}</div>
                  <div><strong>Convidados:</strong> {selectedDetail.guests || 0}</div>
                  <div><strong>Valor:</strong> {selectedDetail.totalCents ? money(selectedDetail.totalCents) : "Grátis"}</div>
                  <div><strong>Status:</strong> {selectedDetail.status}</div>
                </div>
              </div>

              {/* QR Token Box */}
              {selectedDetail.qrToken && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center space-y-1">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Token de Validação na Portaria</p>
                  <p className="font-mono text-base font-black tracking-widest text-[#0055D4]">
                    {selectedDetail.qrToken}
                  </p>
                  <p className="text-[10px] text-slate-500">Apresente este código caso solicitado na portaria ou zeladoria.</p>
                </div>
              )}

              {/* Guest List Preview */}
              {selectedDetail.guestList && selectedDetail.guestList.length > 0 && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">Lista de convidados cadastrada:</p>
                  <div className="max-h-24 overflow-y-auto rounded-lg bg-slate-50 p-2 border border-slate-200 text-[11px] text-slate-600">
                    <ol className="list-decimal list-inside">
                      {selectedDetail.guestList.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <Icon name="download" size={14} />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="btn-primary text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CANCEL RESERVATION CONFIRMATION
          ========================================================================= */}
      {cancelModal.open && cancelModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cancelar Reserva</h3>
              <button
                type="button"
                onClick={() => setCancelModal({ open: false, item: null })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {cancelError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-slate-600">
              Tem certeza que deseja cancelar sua reserva de{" "}
              <strong>{cancelModal.item.amenityName}</strong> para o dia{" "}
              <strong>{dateBR(cancelModal.item.date)} ({cancelModal.item.startTime}–{cancelModal.item.endTime})</strong>?
            </p>

            <div>
              <label className="label">Motivo do cancelamento (opcional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Ex: Imprevisto familiar, mudança de data..."
                className="input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setCancelModal({ open: false, item: null })}
                className="btn-secondary text-xs"
              >
                Manter Reserva
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                {isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
