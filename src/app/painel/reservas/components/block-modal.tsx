"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { isoDate } from "@/lib/utils";
import { createBlockAction } from "@/lib/actions/reservas";
import type { Amenity } from "../types";

interface BlockModalProps {
  amenities: Amenity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BlockModal({ amenities, onClose, onSuccess }: BlockModalProps) {
  const [amenityId, setAmenityId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(isoDate());
  const [endDate, setEndDate] = useState<string>(isoDate());
  const [isFullDay, setIsFullDay] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [reason, setReason] = useState<string>("Manutenção preventiva / Limpeza programada");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      if (amenityId !== "all") formData.set("amenityId", amenityId);
      formData.set("startDate", startDate);
      formData.set("endDate", endDate);
      if (!isFullDay) {
        formData.set("startTime", startTime);
        formData.set("endTime", endTime);
      }
      formData.set("reason", reason);

      const res = await createBlockAction(formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao criar o bloqueio.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bloquear Espaço / Manutenção</h3>
            <p className="text-xs text-slate-500">Impede novos agendamentos durante o período selecionado.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveBlock} className="space-y-3 text-xs">
          <div>
            <label className="label">Espaço Afetado *</label>
            <select
              value={amenityId}
              onChange={(e) => setAmenityId(e.target.value)}
              className="input w-full text-xs"
            >
              <option value="all">Todos os espaços comuns</option>
              {amenities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data Início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="label">Data Término *</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={isFullDay}
                onChange={(e) => setIsFullDay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0055D4]"
              />
              <span className="text-xs font-semibold text-slate-700">Bloquear o dia inteiro</span>
            </label>
          </div>

          {!isFullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Horário Inicial</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="label">Horário Final</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Motivo do Bloqueio *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ex: Manutenção elétrica periódica, limpeza e pintura..."
              className="input w-full text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs"
            >
              {isPending ? "Bloqueando..." : "Confirmar Bloqueio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
