"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { dateBR, isoDate, money } from "@/lib/utils";
import {
  createReservationAction,
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
} from "@/lib/actions/reservas";

type Amenity = {
  id: number;
  name: string;
  capacity: number | null;
  feeCents: number | null;
  rules: string | null;
  openTime: string | null;
  closeTime: string | null;
  intervalMinutes: number | null;
  maxHours: number | null;
  requiresApproval: boolean;
};

type ReservationItem = {
  id: number;
  amenityId: number;
  amenityName: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number | null;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  qrToken: string | null;
  unitNumber: string | null;
  blockName: string | null;
  userName: string | null;
  userId: number | null;
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  aprovada: { label: "Aprovada", color: "bg-teal-50 text-[#0D9488] border-teal-200" },
  pendente: { label: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-200" },
  rejeitada: { label: "Rejeitada", color: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelada: { label: "Cancelada", color: "bg-slate-100 text-slate-700 border-slate-200" },
  concluida: { label: "Concluída", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function ReservasClient({
  amenities,
  reservations,
  role,
  currentUserId,
}: {
  amenities: Amenity[];
  reservations: ReservationItem[];
  role: string;
  currentUserId: number;
}) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [bookingAmenity, setBookingAmenity] = useState<Amenity | null>(null);
  const [rejectingReservation, setRejectingReservation] = useState<ReservationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"areas" | "minhas" | "todas">("areas");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const myReservations = reservations.filter((r) => r.userId === currentUserId);
  const pendingApprovals = reservations.filter((r) => r.status === "pendente");

  const handleBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingAmenity) return;
    const formData = new FormData(e.currentTarget);
    formData.set("amenityId", String(bookingAmenity.id));

    startTransition(async () => {
      const res = await createReservationAction(formData);
      if (res?.success) {
        setFeedback({
          type: "success",
          msg: bookingAmenity.requiresApproval
            ? "Solicitação enviada com sucesso! Aguarde a aprovação do síndico."
            : "Reserva confirmada com sucesso!",
        });
        setBookingAmenity(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao realizar reserva." });
      }
    });
  };

  const handleApprove = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      const res = await approveReservationAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Reserva aprovada com sucesso!" });
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao aprovar reserva." });
      }
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReservation) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(rejectingReservation.id));
      formData.set("reason", rejectionReason);
      const res = await rejectReservationAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Reserva recusada com sucesso." });
        setRejectingReservation(null);
        setRejectionReason("");
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao recusar reserva." });
      }
    });
  };

  const handleCancel = (id: number) => {
    if (!confirm("Deseja realmente cancelar esta reserva?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      const res = await cancelReservationAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Reserva cancelada com sucesso." });
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao cancelar reserva." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] flex items-center gap-2.5">
            <Icon name="building" size={28} className="text-[#0D9488]" />
            Reservas de Áreas Comuns
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Agendamento sem conflitos para salão de festas, churrasqueira, coworking, piscina e quadra.
          </p>
        </div>

        {isStaff && pendingApprovals.length > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            {pendingApprovals.length} reservas aguardando aprovação
          </div>
        ) : null}
      </div>

      {/* Feedback banner */}
      {feedback ? (
        <div
          className={`p-4 rounded-[12px] text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-75"
          >
            Fechar
          </button>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="tabbar w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("areas")}
          className={`tab ${activeTab === "areas" ? "tab-active" : ""}`}
        >
          Áreas Disponíveis ({amenities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("minhas")}
          className={`tab ${activeTab === "minhas" ? "tab-active" : ""}`}
        >
          Minhas Reservas ({myReservations.length})
        </button>
        {isStaff ? (
          <button
            type="button"
            onClick={() => setActiveTab("todas")}
            className={`tab ${activeTab === "todas" ? "tab-active" : ""}`}
          >
            Todas as Reservas ({reservations.length})
          </button>
        ) : null}
      </div>

      {/* 1. Áreas Comuns Catalog */}
      {activeTab === "areas" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((amenity) => (
            <div
              key={amenity.id}
              className="card p-6 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="chip bg-teal-50 text-[#0D9488] border-teal-200">
                    {amenity.feeCents ? money(amenity.feeCents) : "Gratuito"}
                  </span>
                  <span className="text-xs text-[var(--color-muted)] font-semibold">
                    Capacidade: {amenity.capacity} pessoas
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--color-ink)] group-hover:text-[#0D9488] transition-colors">
                  {amenity.name}
                </h3>

                <p className="text-xs text-[var(--color-muted)] mt-2 leading-relaxed line-clamp-3">
                  {amenity.rules || "Regras de convivência padrão do condomínio aplicáveis."}
                </p>

                <div className="mt-4 pt-4 border-t border-[var(--color-line)] space-y-1.5 text-xs text-[var(--color-muted)]">
                  <p className="flex items-center gap-1.5">
                    <Icon name="clock" size={14} className="text-[#0D9488]" />
                    Horário: <strong>{amenity.openTime ?? "08:00"} às {amenity.closeTime ?? "22:00"}</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Icon name="shield" size={14} className="text-[#0D9488]" />
                    {amenity.requiresApproval ? "Requer aprovação do síndico" : "Aprovação automática"}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5">
                <button
                  type="button"
                  onClick={() => setBookingAmenity(amenity)}
                  className="btn-primary w-full btn-sm"
                >
                  <Icon name="calendar" size={15} />
                  Reservar Espaço
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* 2. Minhas Reservas Tab */}
      {activeTab === "minhas" ? (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
            Histórico das Minhas Reservas ({myReservations.length})
          </h2>

          {myReservations.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              Você ainda não possui nenhuma reserva solicitada.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {myReservations.map((res) => {
                const statusObj = STATUS_BADGES[res.status] ?? STATUS_BADGES.pendente;
                return (
                  <div
                    key={res.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`chip text-[11px] ${statusObj.color}`}>{statusObj.label}</span>
                        <span className="text-xs font-bold text-[var(--color-muted)]">{dateBR(res.date)}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--color-ink)] mt-1">{res.amenityName}</h3>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        Horário: {res.startTime} às {res.endTime} · {res.guests ?? 0} convidados
                      </p>
                      {res.rejectionReason ? (
                        <p className="text-xs font-semibold text-rose-600 mt-1">
                          Motivo da recusa: {res.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {res.status !== "cancelada" && res.status !== "rejeitada" && res.status !== "concluida" ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(res.id)}
                          disabled={isPending}
                          className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                        >
                          Cancelar Reserva
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* 3. Todas as Reservas (Staff View) */}
      {activeTab === "todas" && isStaff ? (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
            Gestão de Todas as Reservas do Condomínio ({reservations.length})
          </h2>

          <div className="divide-y divide-[var(--color-line)]">
            {reservations.map((res) => {
              const statusObj = STATUS_BADGES[res.status] ?? STATUS_BADGES.pendente;
              return (
                <div
                  key={res.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`chip text-[11px] ${statusObj.color}`}>{statusObj.label}</span>
                      <span className="text-xs font-bold text-[var(--color-muted)]">{dateBR(res.date)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-ink)] mt-1">{res.amenityName}</h3>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {res.startTime} às {res.endTime} · Solicitante: <strong className="text-[var(--color-ink)]">{res.userName}</strong> (Unidade {res.unitNumber ?? "Geral"})
                    </p>
                    {res.notes ? (
                      <p className="text-xs text-[var(--color-subtle)] mt-1">Obs: {res.notes}</p>
                    ) : null}
                    {res.rejectionReason ? (
                      <p className="text-xs font-semibold text-rose-600 mt-1">
                        Motivo da recusa: {res.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  {/* Staff action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {res.status === "pendente" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(res.id)}
                          disabled={isPending}
                          className="btn-success btn-sm"
                        >
                          <Icon name="check" size={14} />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingReservation(res)}
                          disabled={isPending}
                          className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                        >
                          <Icon name="x" size={14} />
                          Recusar
                        </button>
                      </>
                    ) : res.status === "aprovada" ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(res.id)}
                        disabled={isPending}
                        className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Booking Form Modal */}
      {bookingAmenity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setBookingAmenity(null)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div>
                <span className="chip bg-teal-50 text-[#0D9488] text-[10px] uppercase font-bold">
                  {bookingAmenity.feeCents ? money(bookingAmenity.feeCents) : "Gratuito"}
                </span>
                <h2 className="text-xl font-bold text-[var(--color-ink)] mt-1">
                  Reservar {bookingAmenity.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingAmenity(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data da Reserva *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={isoDate()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Qtd. de Convidados</label>
                  <input
                    type="number"
                    name="guests"
                    defaultValue={10}
                    max={bookingAmenity.capacity ?? 100}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hora Inicial *</label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    defaultValue={bookingAmenity.openTime ?? "12:00"}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Hora Final *</label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    defaultValue={bookingAmenity.closeTime ?? "18:00"}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Observações ou Tipo de Evento</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ex: Aniversário em família"
                  className="input"
                />
              </div>

              {/* Rules acceptance checkbox */}
              <div className="p-3 rounded-[12px] bg-slate-50 border border-[var(--color-line)] text-xs text-[var(--color-muted)] space-y-2">
                <p className="font-bold text-[var(--color-ink)]">Regras de Utilização:</p>
                <p>{bookingAmenity.rules || "Zelar pela limpeza e respeitar os limites de horário e barulho."}</p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-[var(--color-ink)] cursor-pointer">
                  <input type="checkbox" required className="rounded text-[#0D9488] focus:ring-teal-200" />
                  <span>Li e aceito os termos do regimento interno.</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingAmenity(null)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Processando..." : "Confirmar Solicitação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Rejection Reason Modal (Staff) */}
      {rejectingReservation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setRejectingReservation(null)}
          />
          <div className="relative w-full max-w-md rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="alert" size={20} className="text-rose-600" />
                Motivo da Recusa da Reserva
              </h2>
              <button
                type="button"
                onClick={() => setRejectingReservation(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {rejectingReservation.amenityName} - {dateBR(rejectingReservation.date)}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Solicitante: {rejectingReservation.userName}
                </p>
              </div>

              <div>
                <label className="label">Justificativa da Recusa *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo para o condômino (ex: manutenção programada, conflito de horário, inadimplência)..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReservation(null)}
                  className="btn-ghost"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !rejectionReason.trim()}
                  className="btn-danger"
                >
                  {isPending ? "Processando..." : "Confirmar Recusa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
