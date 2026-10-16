"use client";

import { Icon } from "@/components/icon";

export interface ZeladoriaProtegeProps {
  variant?: "full" | "compact" | "badge";
  warrantyDays?: number;
  contractHash?: string;
}

export function ZeladoriaProtegeCard({
  variant = "full",
  warrantyDays = 90,
  contractHash,
}: ZeladoriaProtegeProps) {
  if (variant === "badge") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0055D4] text-[11px] font-bold">
        <Icon name="shield" size={13} className="text-[#0055D4]" />
        <span>Zeladoria Protege</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-[#0055D4] text-white flex items-center justify-center font-bold">
              <Icon name="shield" size={13} />
            </span>
            <span className="text-xs font-black text-slate-900 tracking-tight">
              PROTEÇÃO ZELADORIA
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-100">
            Contratação Verificada
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Pagamento rastreável retido até a sua confirmação, proposta com snapshot imutável e mediação pelo condomínio.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-blue-200/90 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#0055D4] text-white flex items-center justify-center font-black shadow-xs">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                PROTEÇÃO ZELADORIA
              </h3>
              <span className="bg-[#EAB308]/20 text-[#A16207] text-[10px] font-black px-1.5 py-0.5 rounded-md">
                PROTEGE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Camada de confiança e segurança operacional da contratação
            </p>
          </div>
        </div>
      </div>

      {/* 7 Pilares de Confiança Operacional (Cláusula 18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Prestador verificado</span>
            <span className="text-[10px] text-slate-500">Documentação e identidade checadas</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Proposta registrada</span>
            <span className="text-[10px] text-slate-500">Escopo e materiais com versão congelada</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Histórico da contratação</span>
            <span className="text-[10px] text-slate-500">Trilha de auditoria das mensagens e etapas</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Pagamento rastreável</span>
            <span className="text-[10px] text-slate-500">Repasse condicionado à conclusão do serviço</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Evidências do serviço</span>
            <span className="text-[10px] text-slate-500">Fotos técnicas de antes, durante e depois</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div>
            <span className="font-bold text-slate-900 block">Canal de contestação</span>
            <span className="text-[10px] text-slate-500">Mediação direta e bloqueio de liberação em disputa</span>
          </div>
        </div>

        {warrantyDays > 0 && (
          <div className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
            <div>
              <span className="font-bold text-emerald-950 block">
                Garantia registrada: {warrantyDays} dias
              </span>
              <span className="text-[10px] text-emerald-800">
                Suporte em garantia disponível no painel caso ocorram problemas após a entrega.
              </span>
            </div>
          </div>
        )}
      </div>

      {contractHash && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Hash Digital do Contrato:</span>
          <span className="font-mono text-slate-600 truncate max-w-[200px]" title={contractHash}>
            {contractHash.slice(0, 16)}...{contractHash.slice(-8)}
          </span>
        </div>
      )}

      {/* Nota de conformidade jurídica */}
      <p className="text-[10px] text-slate-400 leading-normal italic">
        * A proteção Zeladoria Protege consiste no acompanhamento operacional, custódia e mediação de serviços contratados via plataforma, assegurando transparência e cumprimento das propostas acordadas.
      </p>
    </div>
  );
}
