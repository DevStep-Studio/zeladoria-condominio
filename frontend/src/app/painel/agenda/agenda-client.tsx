"use client";

import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { dateBR, dateTimeBR, isoDate } from "@/lib/utils";
import { createAgendaEventAction, deleteAgendaEventAction } from "@/lib/actions/agenda";

type AgendaEvent = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  responsible: string | null;
  audienceScope: string;
  reminder: string | null;
  recurrence: string | null;
  status: string;
  amenityId: number | null;
};

type Amenity = {
  id: number;
  name: string;
};

type ReservationItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  guests: number | null;
  amenityName: string | null;
};

const CATEGORIES: { key: string; label: string; color: string; icon: IconName }[] = [
  { key: "todas", label: "Todas", color: "bg-slate-100 text-slate-800", icon: "calendar" },
  { key: "reuniao", label: "Reunião", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "users" },
  { key: "assembleia", label: "Assembleia", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "scale" },
  { key: "manutencao", label: "Manutenção", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "wrench" },
  { key: "inspecao", label: "Inspeção", color: "bg-orange-50 text-orange-700 border-orange-200", icon: "shield" },
  { key: "evento", label: "Evento", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "sparkles" },
  { key: "aviso", label: "Aviso", color: "bg-rose-50 text-rose-700 border-rose-200", icon: "alert" },
];

export function AgendaClient({
  events,
  amenities,
  reservations,
  isStaff,
  role,
  userId,
}: {
  events: AgendaEvent[];
  amenities: Amenity[];
  reservations: ReservationItem[];
  isStaff: boolean;
  role: string;
  userId: number;
}) {
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia" | "lista">("mes");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (selectedCategory === "todas") return true;
    return e.category === selectedCategory;
  });

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createAgendaEventAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Compromisso agendado com sucesso na Agenda!" });
        setShowCreateModal(false);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao agendar compromisso." });
      }
    });
  };

  const handleDeleteEvent = (id: number) => {
    if (!confirm("Deseja realmente remover este compromisso da agenda?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      const res = await deleteAgendaEventAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Compromisso removido com sucesso." });
        setSelectedEvent(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao remover compromisso." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] flex items-center gap-2.5">
            <Icon name="calendar" size={28} className="text-[#0D9488]" />
            Agenda Condominial
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Calendário oficial de reuniões, assembleias, vistorias, manutenções e eventos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-sm"
          >
            <Icon name="plus" size={16} />
            Novo Compromisso
          </button>
        </div>
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

      {/* Control bar: Views & Category Pills */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View switchers */}
          <div className="tabbar">
            <button
              type="button"
              onClick={() => setViewMode("mes")}
              className={`tab ${viewMode === "mes" ? "tab-active" : ""}`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode("semana")}
              className={`tab ${viewMode === "semana" ? "tab-active" : ""}`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dia")}
              className={`tab ${viewMode === "dia" ? "tab-active" : ""}`}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => setViewMode("lista")}
              className={`tab ${viewMode === "lista" ? "tab-active" : ""}`}
            >
              Lista Completa
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`chip cursor-pointer text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted)] hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List / Calendar View */}
      {viewMode === "lista" ? (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              Lista de Compromissos ({filteredEvents.length})
            </h2>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              Nenhum compromisso encontrado para a categoria selecionada.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {filteredEvents.map((ev) => {
                const catObj = CATEGORIES.find((c) => c.key === ev.category) ?? CATEGORIES[0];
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`p-2.5 rounded-[10px] shrink-0 border ${catObj.color}`}>
                        <Icon name={catObj.icon} size={20} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${catObj.color}`}>{catObj.label}</span>
                          <span className="text-xs font-bold text-[var(--color-muted)]">
                            {dateBR(ev.date)} · {ev.startTime} às {ev.endTime}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--color-ink)] mt-1">{ev.title}</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          {ev.location || "Área Comum"} {ev.responsible ? `· Resp: ${ev.responsible}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <span className="text-xs font-bold text-[#0D9488]">Detalhes →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Grid / Calendar Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((ev) => {
            const catObj = CATEGORIES.find((c) => c.key === ev.category) ?? CATEGORIES[0];
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="card p-5 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`chip ${catObj.color}`}>{catObj.label}</span>
                    <span className="text-xs font-bold text-[var(--color-muted)]">{dateBR(ev.date)}</span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-ink)] leading-snug">{ev.title}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-2 line-clamp-2">
                    {ev.description || "Sem descrição adicional informada."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-line)] flex items-center justify-between text-xs text-[var(--color-muted)] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" size={14} className="text-[#0D9488]" />
                    {ev.startTime} - {ev.endTime}
                  </span>
                  <span className="truncate max-w-[120px]">{ev.location || "Área comum"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="calendar" size={20} className="text-[#0D9488]" />
                Novo Compromisso na Agenda
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="label">Título do Evento *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Assembleia Geral / Manutenção dos Portões"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={isoDate()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Categoria *</label>
                  <select name="category" className="input" defaultValue="evento">
                    <option value="reuniao">Reunião</option>
                    <option value="assembleia">Assembleia</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="inspecao">Inspeção</option>
                    <option value="evento">Evento</option>
                    <option value="aviso">Aviso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hora Inicial *</label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    defaultValue="09:00"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Hora Final *</label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    defaultValue="11:00"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Local / Espaço</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Ex: Salão de Festas / Sala de Reunião"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Vincular a Área Comum (Checagem Anti-Conflito)</label>
                <select name="amenityId" className="input" defaultValue="">
                  <option value="">Nenhuma área comum reservada</option>
                  {amenities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Responsável</label>
                  <input
                    type="text"
                    name="responsible"
                    placeholder="Nome do responsável"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Público Alvo</label>
                  <select name="audienceScope" className="input" defaultValue="todos">
                    <option value="todos">Todos os moradores</option>
                    <option value="proprietarios">Apenas proprietários</option>
                    <option value="inquilinos">Apenas inquilinos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Descrição e Detalhes</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Informações adicionais para os condôminos..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Agendando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* View Event Detail Modal */}
      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div>
                <span className="chip bg-teal-50 text-[#0D9488] uppercase tracking-wider text-[10px]">
                  {selectedEvent.category}
                </span>
                <h2 className="text-xl font-bold text-[var(--color-ink)] mt-1">{selectedEvent.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                <Icon name="calendar" size={16} className="text-[#0D9488]" />
                <span className="font-semibold text-[var(--color-ink)]">{dateBR(selectedEvent.date)}</span>
                <span>das {selectedEvent.startTime} às {selectedEvent.endTime}</span>
              </div>

              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                <Icon name="building" size={16} className="text-[#0D9488]" />
                <span>Local: <strong className="text-[var(--color-ink)]">{selectedEvent.location || "Área comum"}</strong></span>
              </div>

              {selectedEvent.responsible ? (
                <div className="flex items-center gap-2 text-[var(--color-muted)]">
                  <Icon name="user" size={16} className="text-[#0D9488]" />
                  <span>Responsável: <strong className="text-[var(--color-ink)]">{selectedEvent.responsible}</strong></span>
                </div>
              ) : null}

              <div className="p-3.5 rounded-[12px] bg-[var(--color-surface-muted)] text-[var(--color-ink)] text-sm leading-relaxed mt-3">
                {selectedEvent.description || "Nenhum detalhe adicional cadastrado para este compromisso."}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)]">
              {isStaff ? (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={isPending}
                  className="btn-danger btn-sm"
                >
                  Excluir da Agenda
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="btn-ghost btn-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
