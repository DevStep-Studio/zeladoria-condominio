"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  toggleProviderAvailableNowAction,
  updateProviderStorefrontAction,
} from "@/lib/actions/prestador";

export function DisponibilidadeClient({ vendor }: { vendor: any }) {
  const [isAvailable, setIsAvailable] = useState<boolean>(vendor?.availableNow ?? true);
  const [workingHours, setWorkingHours] = useState<string>(
    vendor?.workingHours || "Seg a Sex 08:00 - 18:00"
  );
  const [serviceArea, setServiceArea] = useState<string>(vendor?.serviceArea || "São Paulo");
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(
    vendor?.serviceRadiusKm || 15
  );
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleAvailable = () => {
    startTransition(async () => {
      const res = await toggleProviderAvailableNowAction();
      if (res.success && res.availableNow !== undefined) {
        setIsAvailable(res.availableNow);
        setSuccessMsg(
          res.availableNow
            ? "Status atualizado: Você está aparecendo como DISPONÍVEL AGORA para os moradores!"
            : "Status atualizado: Você está OFFLINE para chamados imediatos (continua visível nas buscas normais)."
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateProviderStorefrontAction({
        workingHours,
        serviceArea,
        serviceRadiusKm,
      });
      setSuccessMsg("Configurações de horários e área de atendimento salvas com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Disponibilidade & Horários
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Controle quando você está pronto para aceitar novos chamados e defina sua região de cobertura.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cartão de Ação Rápida: Estou disponível agora */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <h2 className="text-base font-bold text-slate-900">
              Estou disponível agora
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            {isAvailable
              ? "Seu perfil exibe o selo verde 'Disponível agora' no marketplace para os moradores do condomínio."
              : "Desativado. Seu perfil não aparecerá com o selo de atendimento imediato, mas continuará visível nas buscas convencionais."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleAvailable}
          disabled={isPending}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-[8px] font-bold text-xs transition-all shadow-2xs cursor-pointer ${
            isAvailable
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-slate-200 hover:bg-slate-300 text-slate-800"
          }`}
        >
          <span>{isAvailable ? "LIGADO (ON)" : "DESLIGADO (OFF)"}</span>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              isAvailable ? "bg-white text-emerald-700" : "bg-slate-400 text-white"
            }`}
          >
            {isAvailable ? "✓" : "✕"}
          </span>
        </button>
      </div>

      {/* Formulário de Horários e Área */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-[16px] border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5"
      >
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Horários de Atendimento & Cobertura
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Dias e Horários de Trabalho
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Ex.: Seg a Sex 08:00 - 18:00 | Sáb 08:00 - 13:00"
              className="w-full rounded-[8px] border border-slate-200/80 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Informação visível no seu perfil público para os moradores.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Raio de Atendimento
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="flex-1 accent-[#0055D4]"
              />
              <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2.5 py-1 rounded-[6px] border border-blue-200/60">
                Até {serviceRadiusKm} km
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Distância máxima que você se desloca para atender.
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Cidades e Bairros Atendidos
          </label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Ex.: São Paulo, Jardins, Pinheiros, Itaim Bibi, Vila Mariana"
            className="w-full rounded-[8px] border border-slate-200/80 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
          />
          <span className="text-[11px] text-slate-400 block mt-1">
            Separe as regiões por vírgulas.
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
