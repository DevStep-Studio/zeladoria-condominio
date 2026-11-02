"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icon";

interface EmergencySosProps {
  condoName?: string;
  condoAddress?: string;
}

export function EmergencySos({
  condoName = "Residencial Parque das Águas",
  condoAddress = "Curitiba - PR",
}: EmergencySosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Escuta evento global para permitir abertura de qualquer botão na página (ex: header do dashboard)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-emergency-sos", handleOpen);
    return () => window.removeEventListener("open-emergency-sos", handleOpen);
  }, []);

  // Fechar com a tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCopyPhone = (phone: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2500);
    }
  };

  return (
    <>
      {/* Botão Flutuante de SOS — Visível em Celular e Desktop */}
      <aside aria-label="Ações de emergência e segurança">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-20 z-40 lg:bottom-6 lg:right-6 flex items-center justify-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xl hover:shadow-red-600/30 border border-white/25 transition-all duration-200 active:scale-95 cursor-pointer px-3.5 py-2.5 sm:px-4 sm:py-2.5 group select-none"
          aria-label="Abrir Central de Emergência e SOS 24h"
          title="Central de Emergência e SOS 24h"
        >
          {/* Indicador de pulso luminoso */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>

          <Icon name="siren" size={17} className="animate-pulse shrink-0 text-white" />

          <span className="font-black text-xs tracking-wider uppercase">SOS</span>
          <span className="hidden sm:inline font-bold text-xs text-red-100 group-hover:text-white transition-colors">
            24h
          </span>
        </button>
      </aside>

      {/* Modal Central de Emergência e SOS */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop com blur suave */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Central de Emergência e Telefones Úteis 24h"
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            {/* Header Vermelho Sólido de Emergência */}
            <div className="flex items-center justify-between px-5 py-4 bg-red-600 text-white select-none">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                  <Icon name="siren" size={18} className="animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Central de Emergência & SOS 24h
                  </h3>
                  <p className="text-[11px] text-red-100 font-medium">
                    Telefones públicos de resgate, guarita e apoio predial
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-100 bg-red-700/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Alerta de Risco Imediato */}
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-950">
                <Icon name="alert-triangle" size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold text-red-950 block text-xs sm:text-[13px]">
                    Risco Imediato à Vida, Incêndio ou Invasão:
                  </strong>
                  Ligue diretamente para os telefones públicos gratuitos:{" "}
                  <strong className="text-red-700 font-black">193 (Bombeiros)</strong>,{" "}
                  <strong className="text-red-700 font-black">192 (SAMU)</strong> ou{" "}
                  <strong className="text-red-700 font-black">190 (Polícia)</strong>. As chamadas funcionam de qualquer celular mesmo sem créditos.
                </div>
              </div>

              {/* 1. Atendimento Interno do Condomínio */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Atendimento Interno do Condomínio
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Portaria */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">Portaria Central</h5>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded-md">
                          Ramal 100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-1">
                        Guarita, controle de acessos, portões e emergências locais. Plantão 24h.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="tel:1134567890"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-2 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <Icon name="phone" size={13} />
                        <span>Ligar (11) 3456-7890</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone("(11) 3456-7890")}
                        className="flex items-center justify-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        title="Copiar número"
                        aria-label="Copiar número da portaria"
                      >
                        {copiedPhone === "(11) 3456-7890" ? (
                          <span className="text-emerald-600 text-[11px] font-bold">Copiado!</span>
                        ) : (
                          <Icon name="copy" size={13} className="text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Síndico / Zeladoria */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">Síndico(a) & Zeladoria</h5>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded-md">
                          Operações
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-1">
                        Falhas de água/gás, elevadores e apoio técnico predial urgente.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="tel:11987654321"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-2 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <Icon name="phone" size={13} />
                        <span>Ligar (11) 98765-4321</span>
                      </a>
                      <a
                        href="https://wa.me/5511987654321?text=Ol%C3%A1%2C%20preciso%20de%20apoio%20urgente%20no%20condom%C3%ADnio."
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 text-xs font-bold transition-colors shadow-2xs"
                        title="WhatsApp"
                      >
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Serviços Públicos Gratuitos */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Serviços Públicos de Urgência (Gratuito)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "SAMU", phone: "192", desc: "Emergência médica e ambulância", badge: "Saúde" },
                    { name: "Bombeiros", phone: "193", desc: "Incêndio, gás e resgates", badge: "Resgate" },
                    { name: "Polícia Militar", phone: "190", desc: "Segurança e ocorrências graves", badge: "Segurança" },
                    { name: "Defesa Civil", phone: "199", desc: "Tempestades e risco estrutural", badge: "Prevenção" },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{service.name}</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                            {service.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{service.desc}</p>
                      </div>

                      <a
                        href={`tel:${service.phone}`}
                        className="flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs shrink-0"
                      >
                        <Icon name="phone" size={12} />
                        <span>Ligar {service.phone}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500 font-medium truncate">
                {condoName} · {condoAddress}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
