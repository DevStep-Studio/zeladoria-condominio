"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icon";
import { dateBR, money } from "@/lib/utils";
import { approveReservationAction, rejectReservationAction } from "@/lib/actions/reservas";
import type { ReservationItem } from "../types";

interface AdminRequestsProps {
  requests: ReservationItem[];
}

export function AdminRequests({ requests }: AdminRequestsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await approveReservationAction(formData);
    });
  };

  const handleReject = (id: number) => {
    const reason = window.prompt("Informe o motivo da recusa (será enviado ao morador):") || "Horário indisponível";
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("reason", reason);
      await rejectReservationAction(formData);
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon name="check-circle" size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Tudo em dia!</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Não há nenhuma solicitação de reserva pendente de aprovação no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Solicitações Aguardando Aprovação ({requests.length})
        </h3>
        <span className="text-xs text-slate-500">
          Responda com agilidade para liberar a data para o condômino.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {requests.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-amber-300 bg-amber-50/30 p-4 shadow-xs space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2 border-b border-amber-200/60 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.userName || "Morador"}
                  </h4>
                  <p className="text-xs font-semibold text-[#0055D4]">
                    {item.unitNumber ? `Apto ${item.unitNumber}` : "Unidade vinculada"}
                    {item.blockName ? ` (${item.blockName})` : ""}
                  </p>
                </div>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  Pendente
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
    </div>
  );
}
