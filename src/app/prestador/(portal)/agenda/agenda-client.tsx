"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export function ProviderAgendaClient({
  vendor,
  appointments = [],
}: {
  vendor: any;
  appointments: any[];
}) {
  const [viewMode, setViewMode] = useState<"hoje" | "semana" | "mes">("hoje");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Minha Agenda
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Organize os horários de visitas técnicas, instalações e manutenções prediais.
          </p>
        </div>

        {/* View Switcher: Hoje, Semana, Mês */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[8px] shrink-0">
          {(["hoje", "semana", "mes"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold capitalize transition-all cursor-pointer ${
                viewMode === mode
                  ? "bg-white text-[#0055D4] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Serviços Agendados ({appointments.length})
        </h2>

        {appointments.length === 0 ? (
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-2xs">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="calendar" size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Nenhum serviço agendado para esta visualização</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Quando você aceitar novos chamados com agendamento de data e horário, eles serão organizados automaticamente nesta grade.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-[6px] border border-blue-200/60">
                    {app.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    {app.scheduledDate || "Data a combinar"} · {app.scheduledTimeSlot || "Manhã"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{app.title}</h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong className="text-slate-700">{app.customerName}</strong> · Local: <strong className="text-slate-700">{app.location}</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Working Hours Info Box */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-start gap-3">
        <div className="p-2 rounded-[8px] bg-blue-50 text-[#0055D4] shrink-0 border border-blue-200/60">
          <Icon name="clock" size={18} />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-slate-900">Seu Horário de Atendimento Configurado</div>
          <p className="text-slate-600">
            {vendor.workingHours || "Segunda a Sexta, das 08:00 às 18:00"}.
          </p>
          <p className="text-[11px] text-slate-400">
            Para alterar seus turnos ou pausas de atendimento, acesse a aba <strong>Meu Perfil & Loja</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
