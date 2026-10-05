"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Icon, type IconName } from "@/components/icon";
import { dateBR, isoDate, money } from "@/lib/utils";
import { createReservationAction } from "@/lib/actions/reservas";
import type { Amenity, AmenityBlock, CurrentUser, ReservationItem } from "../types";

interface SpaceDetailsModalProps {
  space: Amenity | null;
  initialAction?: "details" | "reserve";
  reservations: ReservationItem[];
  blocks: AmenityBlock[];
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: (reservationId?: number) => void;
}

const FEATURE_ICONS: Record<string, { label: string; icon: IconName }> = {
  wifi: { label: "Wi-Fi dedicado", icon: "globe" },
  ar_condicionado: { label: "Ar-condicionado", icon: "wind" },
  churrasqueira: { label: "Churrasqueira a carvão", icon: "flame" },
  geladeira: { label: "Geladeira / Freezer", icon: "inbox" },
  cozinha: { label: "Cozinha completa", icon: "coffee" },
  mesas: { label: "Mesas e cadeiras", icon: "grid" },
  cadeiras: { label: "Cadeiras extras", icon: "grid" },
  tv: { label: "Smart TV / Monitor", icon: "tv" },
  projetor: { label: "Projetor multimídia", icon: "tv" },
  banheiro: { label: "Sanitários privativos", icon: "droplet" },
  acessibilidade: { label: "Acessibilidade PCD", icon: "shield" },
  iluminacao: { label: "Iluminação em LED", icon: "sun" },
  vestiario: { label: "Vestiários", icon: "user" },
  brinquedos: { label: "Brinquedoteca", icon: "sparkles" },
  som: { label: "Som ambiente", icon: "megaphone" },
  cafe: { label: "Máquina de café", icon: "coffee" },
  tomadas: { label: "Tomadas 110V / 220V", icon: "zap" },
  ducha: { label: "Ducha externa", icon: "droplet" },
  espreguicadeiras: { label: "Espreguiçadeiras", icon: "sun" },
};

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function SpaceDetailsModal({
  space,
  initialAction = "details",
  reservations,
  blocks,
  currentUser,
  onClose,
  onSuccess,
}: SpaceDetailsModalProps) {
  const [viewMode, setViewMode] = useState<"details" | "reserve">(initialAction);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Reservation Wizard State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isoDate(tomorrow);
  });
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("14:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [guests, setGuests] = useState<number>(10);
  const [guestList, setGuestList] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [rulesAccepted, setRulesAccepted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<{ id?: number; status: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  if (!space) return null;

  const images = useMemo(() => {
    if (space.images && space.images.length > 0) return space.images;
    const lower = space.name.toLowerCase();
    if (lower.includes("churrasq")) return ["/amenities/churrasqueira.jpg"];
    if (lower.includes("coworking") || lower.includes("reuni")) return ["/amenities/coworking.jpg"];
    if (lower.includes("quadra") || lower.includes("esporte")) return ["/amenities/quadra.jpg"];
    if (lower.includes("festa") || lower.includes("salao") || lower.includes("salão")) return ["/amenities/salao-festas.jpg"];
    if (lower.includes("piscina")) return ["/amenities/piscina.jpg"];
    if (lower.includes("academia")) return ["/amenities/academia.jpg"];
    return ["/amenities/salao-festas.jpg"];
  }, [space]);

  const openTime = space.openTime?.slice(0, 5) || "08:00";
  const closeTime = space.closeTime?.slice(0, 5) || "22:00";
  const isFree = !space.feeCents || space.feeCents === 0;

  // Compute Active Reservations for this Space & Date
  const dateReservations = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.amenityId === space.id &&
        r.date === selectedDate &&
        r.status !== "cancelada" &&
        r.status !== "rejeitada"
    );
  }, [reservations, space.id, selectedDate]);

  // Compute Blocked status for dates
  const isDateBlocked = (dateStr: string) => {
    return blocks.some(
      (b) =>
        (b.amenityId === null || b.amenityId === space.id) &&
        b.startDate <= dateStr &&
        b.endDate >= dateStr &&
        !b.startTime &&
        !b.endTime
    );
  };

  // Generate Slots for Slot-Fixo model
  const fixedSlots = useMemo(() => {
    const slots: { start: string; end: string; available: boolean; conflictReason?: string }[] = [];
    const openM = timeToMins(openTime);
    const closeM = timeToMins(closeTime);
    const duration = space.slotDurationMinutes || 120;
    const buffer = space.intervalMinutes || 0;

    let current = openM;
    while (current + duration <= closeM) {
      const sStart = minsToTime(current);
      const sEnd = minsToTime(current + duration);

      const hasConflict = dateReservations.some((r) => {
        const rStart = timeToMins(r.startTime);
        const rEnd = timeToMins(r.endTime) + buffer;
        const curEnd = timeToMins(sEnd) + buffer;
        return !(timeToMins(sEnd) <= rStart || timeToMins(sStart) >= rEnd);
      });

      slots.push({
        start: sStart,
        end: sEnd,
        available: !hasConflict,
        conflictReason: hasConflict ? "Já reservado" : undefined,
      });

      current += duration + buffer;
    }
    return slots;
  }, [openTime, closeTime, space.slotDurationMinutes, space.intervalMinutes, dateReservations]);

  // Handle Calendar Days Generation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isPast: boolean; isBlocked: boolean; isToday: boolean }[] = [];

    const todayStr = isoDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dateStr: "", dayNum: 0, isPast: true, isBlocked: false, isToday: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr: dStr,
        dayNum: d,
        isPast: dStr < todayStr,
        isBlocked: isDateBlocked(dStr),
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [calendarMonth, isDateBlocked]);

  // Submit Reservation Handler
  const handleConfirmReservation = () => {
    setErrorMessage(null);
    if (!rulesAccepted) {
      setErrorMessage("É obrigatório concordar com o regulamento de uso antes de confirmar.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("amenityId", String(space.id));
      formData.set("date", selectedDate);
      formData.set("startTime", startTime);
      formData.set("endTime", endTime);
      formData.set("guests", String(guests));
      formData.set("notes", notes);
      formData.set("guestList", guestList);
      formData.set("rulesAccepted", "true");

      const res = await createReservationAction(formData);
      if (res.success) {
        setConfirmedReservation({ id: res.id, status: res.status || "pendente" });
        setStep(4);
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao processar a reserva. Tente novamente.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">{space.name}</h2>
            {space.requiresApproval ? (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                Aprovação prévia
              </span>
            ) : (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-300">
                Confirmação direta
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* =========================================================================
            VIEW MODE: DETAILS (Gallery + Info + Rules)
            ========================================================================= */}
        {viewMode === "details" && (
          <div className="max-h-[80vh] overflow-y-auto p-5 space-y-5">
            {/* Gallery Section */}
            <div className="space-y-2">
              <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                <Image
                  src={images[selectedPhotoIndex] || images[0]}
                  alt={space.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedPhotoIndex === idx ? "border-[#0055D4] shadow-xs" : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Capacidade</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Icon name="users" size={15} className="text-[#0055D4]" />
                  <span>{space.capacity ? `Até ${space.capacity} pessoas` : "Livre"}</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Funcionamento</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Icon name="clock" size={15} className="text-[#0055D4]" />
                  <span>{openTime} – {closeTime}</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Taxa de Uso</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Icon name="wallet" size={15} className="text-[#0055D4]" />
                  <span>{isFree ? "Grátis" : money(space.feeCents)}</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Cancelamento</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Icon name="calendar" size={15} className="text-[#0055D4]" />
                  <span>Até {space.cancellationDeadlineHours || 24}h antes</span>
                </p>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sobre o Espaço</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {space.description}
                </p>
              </div>
            )}

            {/* Comodidades List */}
            {space.features && space.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recursos & Comodidades</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {space.features.map((f) => {
                    const feat = FEATURE_ICONS[f] || { label: f, icon: "check" as IconName };
                    return (
                      <div
                        key={f}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#0055D4]">
                          <Icon name={feat.icon} size={14} />
                        </div>
                        <span className="font-medium">{feat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rules */}
            {space.rules && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Regulamento de Uso</h4>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950 space-y-1.5 whitespace-pre-line leading-relaxed">
                  {space.rules}
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button type="button" onClick={onClose} className="btn-secondary">
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("reserve");
                  setStep(1);
                }}
                className="btn-primary inline-flex items-center gap-2 shadow-xs"
              >
                <Icon name="calendar" size={16} />
                <span>Reservar este espaço</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW MODE: RESERVE FLOW (Step 1 -> 2 -> 3 -> 4)
            ========================================================================= */}
        {viewMode === "reserve" && (
          <div className="max-h-[85vh] overflow-y-auto p-5 space-y-5">
            
            {/* Step Indicator Bar */}
            {step < 4 && (
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step >= 1 ? "bg-[#0055D4] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    1
                  </span>
                  <span className={`text-xs font-bold ${step === 1 ? "text-slate-900" : "text-slate-500"}`}>
                    Data
                  </span>
                  <span className="text-slate-300">/</span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step >= 2 ? "bg-[#0055D4] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    2
                  </span>
                  <span className={`text-xs font-bold ${step === 2 ? "text-slate-900" : "text-slate-500"}`}>
                    Horário
                  </span>
                  <span className="text-slate-300">/</span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step >= 3 ? "bg-[#0055D4] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    3
                  </span>
                  <span className={`text-xs font-bold ${step === 3 ? "text-slate-900" : "text-slate-500"}`}>
                    Confirmação
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode("details")}
                  className="text-xs font-semibold text-[#0055D4] hover:underline"
                >
                  Ver fotos e regras
                </button>
              </div>
            )}

            {/* STEP 1: DATE SELECTION */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Selecione a data da sua reserva
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(calendarMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarMonth(prev);
                      }}
                      className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-600"
                    >
                      <Icon name="chevron-left" size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-2 capitalize">
                      {calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(calendarMonth);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarMonth(next);
                      }}
                      className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-600"
                    >
                      <Icon name="chevron-right" size={16} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 py-1">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      if (!day.dateStr) {
                        return <div key={`empty-${idx}`} className="h-10 rounded-lg" />;
                      }

                      const isSelected = day.dateStr === selectedDate;
                      const disabled = day.isPast || day.isBlocked;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedDate(day.dateStr)}
                          className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-[#0055D4] text-white shadow-xs"
                              : disabled
                              ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                              : "text-slate-800 hover:bg-blue-50 hover:text-[#0055D4] border border-slate-100"
                          }`}
                        >
                          <span>{day.dayNum}</span>
                          {day.isToday && !isSelected && (
                            <span className="h-1 w-1 rounded-full bg-[#0055D4]" />
                          )}
                          {day.isBlocked && (
                            <span className="text-[9px] text-red-500 font-normal">Bloq.</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Summary & Next Step CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Data selecionada: <strong className="text-slate-900">{dateBR(selectedDate)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <span>Continuar</span>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TIME SLOT SELECTION */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Escolha o horário para {dateBR(selectedDate)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Horário de funcionamento: {openTime} às {closeTime}
                  </p>
                </div>

                {/* Model 1: Fixed Slots */}
                {space.reservationModel === "slot_fixo" && (
                  <div className="space-y-2">
                    <label className="label">Turnos / Horários Disponíveis</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {fixedSlots.map((slot, idx) => {
                        const isSelected = startTime === slot.start && endTime === slot.end;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => {
                              setStartTime(slot.start);
                              setEndTime(slot.end);
                            }}
                            className={`rounded-xl p-3 text-left border transition-all ${
                              isSelected
                                ? "border-[#0055D4] bg-blue-50 text-[#0055D4] font-bold shadow-xs"
                                : !slot.available
                                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                            }`}
                          >
                            <p className="text-xs font-bold">{slot.start} – {slot.end}</p>
                            <p className="text-[10px] mt-0.5">
                              {slot.available ? "Disponível" : slot.conflictReason || "Ocupado"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Model 2: Free Range or Whole Period */}
                {space.reservationModel !== "slot_fixo" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Início da Reserva *</label>
                        <input
                          type="time"
                          value={startTime}
                          min={openTime}
                          max={closeTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="input w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Término da Reserva *</label>
                        <input
                          type="time"
                          value={endTime}
                          min={openTime}
                          max={closeTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="input w-full"
                          required
                        />
                      </div>
                    </div>

                    {/* Existing active reservations alert */}
                    {dateReservations.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Icon name="clock" size={13} />
                          Horários já ocupados nesta data:
                        </p>
                        <ul className="list-disc list-inside text-amber-800 pl-1">
                          {dateReservations.map((r) => (
                            <li key={r.id}>
                              {r.startTime} às {r.endTime} ({r.userName || "Morador"})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Step Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs"
                  >
                    <Icon name="chevron-left" size={14} />
                    <span>Voltar à data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <span>Avançar para detalhes</span>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRMATION & RULES AGREEMENT */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirmação da Solicitação de Reserva
                  </h3>
                  <p className="text-xs text-slate-500">
                    Revise os dados antes de finalizar o agendamento.
                  </p>
                </div>

                {/* Error feedback */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <Icon name="alert" size={16} className="shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Summary Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Espaço</p>
                      <h4 className="text-base font-bold text-slate-900">{space.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">Valor</p>
                      <p className="text-base font-bold text-slate-900">
                        {isFree ? "Grátis" : money(space.feeCents)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-500">Data:</span> {dateBR(selectedDate)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Horário:</span> {startTime} às {endTime}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Unidade:</span> {currentUser.unitLabel || "Não vinculada"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Morador:</span> {currentUser.name}
                    </div>
                    {space.depositCents && space.depositCents > 0 ? (
                      <div className="col-span-2">
                        <span className="font-semibold text-slate-500">Caução de segurança:</span> {money(space.depositCents)} (estornável após vistoria)
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Guest count & Optional Guest list */}
                <div className="space-y-3">
                  <div>
                    <label className="label">Quantidade Estimada de Pessoas (Máx: {space.capacity || 20}) *</label>
                    <input
                      type="number"
                      value={guests}
                      min={1}
                      max={space.capacity || 100}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="input w-full"
                      required
                    />
                  </div>

                  {space.requestGuestList && (
                    <div>
                      <label className="label">Lista Prévia de Convidados (1 nome por linha)</label>
                      <textarea
                        value={guestList}
                        onChange={(e) => setGuestList(e.target.value)}
                        rows={3}
                        placeholder={"Nome do convidado 1\nNome do convidado 2"}
                        className="input w-full font-mono text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="label">Observações adicionais (opcional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Aniversário familiar, churrasco com amigos"
                      className="input w-full"
                    />
                  </div>
                </div>

                {/* Rules Checkbox */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesAccepted}
                      onChange={(e) => setRulesAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0055D4] focus:ring-[#0055D4]"
                    />
                    <div className="text-xs text-slate-700 leading-normal">
                      <strong className="text-slate-900">Li e concordo com o regulamento de uso</strong> deste espaço,
                      comprometendo-me a zelar pela conservação, respeitar os horários e normas de silêncio do condomínio.
                    </div>
                  </label>
                </div>

                {/* Final Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isPending}
                    className="btn-secondary text-xs"
                  >
                    Voltar aos horários
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmReservation}
                    disabled={isPending || !rulesAccepted}
                    className="btn-primary inline-flex items-center gap-2 shadow-sm font-bold"
                  >
                    {isPending ? (
                      <span>Processando reserva...</span>
                    ) : (
                      <>
                        <Icon name="check" size={16} />
                        <span>Confirmar reserva</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION STATE */}
            {step === 4 && (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon name="check-circle" size={32} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    {confirmedReservation?.status === "aprovada"
                      ? "Reserva Confirmada com Sucesso!"
                      : "Solicitação de Reserva Enviada!"}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {confirmedReservation?.status === "aprovada"
                      ? "Seu agendamento foi registrado e o espaço já está reservado para você."
                      : "A administração do condomínio recebeu sua solicitação e você será notificado assim que houver a aprovação."}
                  </p>
                </div>

                {/* Mini confirmation card */}
                <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left text-xs space-y-1">
                  <p className="font-bold text-slate-900">{space.name}</p>
                  <p className="text-slate-600">
                    {dateBR(selectedDate)} · das {startTime} às {endTime}
                  </p>
                  <p className="text-slate-500">Unidade: {currentUser.unitLabel || "302"}</p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSuccess(confirmedReservation?.id);
                    }}
                    className="btn-primary inline-flex items-center gap-1.5"
                  >
                    <Icon name="calendar" size={14} />
                    <span>Ver em Minhas Reservas</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Voltar aos Espaços
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
