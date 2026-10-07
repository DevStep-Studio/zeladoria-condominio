"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";

interface SuccessScreenProps {
  code: string;
  title: string;
  location: string;
  categoryLabel: string;
  onReset: () => void;
}

export function SuccessScreen({
  code,
  title,
  location,
  categoryLabel,
  onReset,
}: SuccessScreenProps) {
  return (
    <div className="py-6 sm:py-10 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-200">
      {/* Ícone de Sucesso */}
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm mx-auto">
        <Icon name="check" size={38} strokeWidth={3} />
      </div>

      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <span>Status inicial:</span>
          <span className="font-extrabold uppercase">Recebida</span>
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Ocorrência registrada!
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Recebemos sua solicitação. O condomínio e a administração já foram notificados.
        </p>
      </div>

      {/* Cartão com o Protocolo e Detalhes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Protocolo gerado</span>
          <span className="text-sm font-extrabold text-[#0055D4] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-mono tracking-wide">
            {code}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Ocorrência
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{title}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Categoria</span>
            <span className="font-semibold text-slate-700">{categoryLabel}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Local</span>
            <span className="font-semibold text-slate-700 truncate block">{location}</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <Link
          href="/painel/ocorrencias"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <Icon name="clipboard" size={16} />
          <span>Acompanhar ocorrência</span>
        </Link>

        <Link
          href="/painel"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-colors"
        >
          <Icon name="home" size={16} />
          <span>Voltar ao início</span>
        </Link>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 sm:px-3"
        >
          Registrar outra
        </button>
      </div>
    </div>
  );
}
