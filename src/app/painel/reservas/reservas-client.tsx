"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { dateBR, isoDate } from "@/lib/utils";
import {
  createReservationAction,
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
} from "@/lib/actions/reservas";

export type Amenity = {
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

export type ReservationItem = {
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

const DEFAULT_AREAS: Amenity[] = [
  {
    id: 101,
    name: "Salão de Festas",
    capacity: 80,
    feeCents: 20000,
    rules: "Permitido som moderado até as 22h. Limpeza inclusa na taxa.",
    openTime: "10:00:00",
    closeTime: "23:00:00",
    intervalMinutes: 60,
    maxHours: 8,
    requiresApproval: true,
  },
  {
    id: 102,
    name: "Churrasqueira",
    capacity: 20,
    feeCents: 8000,
    rules: "Necessário retirar a chave na portaria e deixar o espaço limpo.",
    openTime: "11:00:00",
    closeTime: "22:00:00",
    intervalMinutes: 60,
    maxHours: 6,
    requiresApproval: false,
  },
  {
    id: 103,
    name: "Espaço Gourmet",
    capacity: 40,
    feeCents: 15000,
    rules: "Equipado com forno de pizza e adega climatizada.",
    openTime: "11:00:00",
    closeTime: "23:00:00",
    intervalMinutes: 60,
    maxHours: 6,
    requiresApproval: true,
  },
  {
    id: 104,
    name: "Academia",
    capacity: 15,
    feeCents: 0,
    rules: "Uso obrigatório de toalha e higienização dos aparelhos após o uso.",
    openTime: "06:00:00",
    closeTime: "22:00:00",
    intervalMinutes: 30,
    maxHours: 2,
    requiresApproval: false,
  },
  {
    id: 105,
    name: "Piscina",
    capacity: 30,
    feeCents: 0,
    rules: "Exame médico atualizado obrigatório. Proibido garrafas de vidro.",
    openTime: "08:00:00",
    closeTime: "20:00:00",
    intervalMinutes: 60,
    maxHours: 4,
    requiresApproval: false,
  },
];

const AMENITY_ICONS: Record<string, IconName> = {
  "salão de festas": "wine",
  churrasqueira: "flame",
  "espaço gourmet": "coffee",
  academia: "activity",
  piscina: "sun",
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
  const [activeTab, setActiveTab] = useState<"areas" | "minhas" | "todas">("areas");
  const [bookingAmenity, setBookingAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [guests, setGuests] = useState("10");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Combine DB amenities or fallback to prompt defaults
  const displayAmenities = useMemo(() => {
    if (amenities.length >= 3) return amenities;
    return DEFAULT_AREAS;
  }, [amenities]);

  const myReservations = useMemo(() => {
    return reservations.filter((r) => r.userId === currentUserId);
  }, [reservations, currentUserId]);

  const handleOpenBooking = (amenity: Amenity) => {
    setBookingAmenity(amenity);
    setStartTime(amenity.openTime?.slice(0, 5) || "12:00");
    setEndTime(amenity.closeTime?.slice(0, 5) || "18:00");
    setGuests(String(Math.min(amenity.capacity || 20, 15)));
    setNotes("");
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingAmenity) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("amenityId", String(bookingAmenity.id));
      formData.set("date", selectedDate);
      formData.set("startTime", startTime);
      formData.set("endTime", endTime);
      formData.set("guests", guests);
      formData.set("notes", notes);

      const res = await createReservationAction(formData);
      if (res?.success) {
        setFeedback({
          type: "success",
          msg: `Reserva para ${bookingAmenity.name} solicitada com sucesso!`,
        });
        setBookingAmenity(null);
      } else {
        setFeedback({
          type: "error",
          msg: res?.error || "Erro ao solicitar reserva. Verifique a disponibilidade.",
        });
      }
    });
  };

  const handleCancelReservation = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      const res = await cancelReservationAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Reserva cancelada com sucesso." });
      } else {
        setFeedback({ type: "error", msg: res?.error || "Erro ao cancelar reserva." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Reservas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Reserve áreas comuns do seu condomínio
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("areas")}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
              activeTab === "areas" ? "bg-white text-[#0070F3] shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Áreas disponíveis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("minhas")}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
              activeTab === "minhas" ? "bg-white text-[#0070F3] shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Minhas reservas ({myReservations.length})
          </button>
          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab("todas")}
              className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
                activeTab === "todas" ? "bg-white text-[#0070F3] shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Todas as reservas
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-[10px] text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button type="button" onClick={() => setFeedback(null)} className="underline text-[11px] font-bold">
            OK
          </button>
        </div>
      )}

      {/* TAB 1: Áreas Disponíveis */}
      {activeTab === "areas" && (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Áreas disponíveis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAmenities.map((amenity) => {
              const lower = amenity.name.toLowerCase();
              let iconName: IconName = "calendar";
              if (lower.includes("festa")) iconName = "wine";
              else if (lower.includes("churrasq")) iconName = "flame";
              else if (lower.includes("gourmet")) iconName = "coffee";
              else if (lower.includes("academia")) iconName = "activity";
              else if (lower.includes("piscina")) iconName = "sun";

              const isFree = !amenity.feeCents || amenity.feeCents === 0;
              const formattedPrice = isFree ? "Grátis" : `R$ ${(amenity.feeCents! / 100).toFixed(0)}`;

              return (
                <div
                  key={amenity.id}
                  className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 text-[#0070F3]">
                        <Icon name={iconName} size={20} />
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isFree ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-800"
                      }`}>
                        {formattedPrice}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">
                        {amenity.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Capacidade: {amenity.capacity || "Conforme regras"} pessoas
                      </p>
                    </div>

                    {amenity.rules && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-[8px] border border-slate-100">
                        {amenity.rules}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBooking(amenity)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0070F3] hover:bg-[#005FD6] text-white px-4 py-2 text-xs font-bold transition-colors shadow-xs"
                  >
                    <Icon name="calendar" size={14} />
                    <span>Reservar área</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Minhas Reservas */}
      {activeTab === "minhas" && (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Minhas reservas agendadas
          </h2>

          {myReservations.length === 0 ? (
            <div className="rounded-[14px] border border-slate-200 bg-white p-12 text-center">
              <Icon name="calendar" size={28} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma reserva agendada</h3>
              <p className="text-xs text-slate-500 mt-1">
                Você ainda não possui reservas ativas para os espaços comuns.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("areas")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-blue-50 text-[#0070F3] px-3.5 py-1.5 text-xs font-bold"
              >
                Ver áreas disponíveis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{res.amenityName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dateBR(res.date)} · {res.startTime.slice(0, 5)} às {res.endTime.slice(0, 5)}
                      </p>
                      {res.guests && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {res.guests} convidados
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-[#0070F3] capitalize">
                      {res.status}
                    </span>
                  </div>

                  {res.status !== "cancelada" && (
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleCancelReservation(res.id)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Cancelar reserva
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Todas as Reservas (Staff) */}
      {activeTab === "todas" && isStaff && (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Todas as reservas do condomínio
          </h2>

          <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Espaço</th>
                  <th className="p-3">Morador</th>
                  <th className="p-3">Data & Horário</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#0F172A]">{r.amenityName}</td>
                    <td className="p-3 text-slate-600">
                      {r.userName ?? "Condômino"} {r.unitNumber ? `(Unid. ${r.unitNumber})` : ""}
                    </td>
                    <td className="p-3 text-slate-600">
                      {dateBR(r.date)} · {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Drawer / Modal */}
      {bookingAmenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setBookingAmenity(null)}
            aria-hidden
          />

          <div className="relative w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0070F3]">
                  Nova Reserva
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {bookingAmenity.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingAmenity(null)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="mt-4 space-y-4 text-xs">
              {/* Data */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Data da reserva <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={isoDate(new Date())}
                  required
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              {/* Horário Início / Fim */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Término <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                  />
                </div>
              </div>

              {/* Convidados */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Quantidade estimada de pessoas
                </label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  max={bookingAmenity.capacity || 100}
                  min={1}
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Capacidade máxima: {bookingAmenity.capacity || 80} pessoas
                </span>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: Aniversário infantil com buffet"
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingAmenity(null)}
                  className="rounded-[8px] border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#0070F3] hover:bg-[#005FD6] px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Confirmando..." : "Confirmar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
