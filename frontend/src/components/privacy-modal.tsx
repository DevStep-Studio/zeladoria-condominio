"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icon";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-5 focus:outline-none animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1355FF] border border-blue-100">
              <Icon name="shield" size={20} />
            </span>
            <div>
              <h2 id="privacy-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                Privacidade & Proteção de Dados
              </h2>
              <p className="text-xs text-slate-500">Zeladoria Condomínio · Conformidade LGPD</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-xs text-slate-600 space-y-3.5 leading-relaxed">
          <p>
            O <strong>Zeladoria Condomínio</strong> valoriza a sua privacidade e atua em estrita conformidade com a
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1">1. Finalidade da Coleta</h3>
            <p>
              Os dados fornecidos no formulário comercial (nome, condomínio/empresa, e-mail e telefone) são
              utilizados exclusivamente para retornar o seu contato, tirar dúvidas, apresentar as soluções da plataforma e
              elaborar propostas sob medida.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1">2. Não Compartilhamento</h3>
            <p>
              Não comercializamos, alugamos ou compartilhamos suas informações com terceiros para fins de marketing não autorizado.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1">3. Segurança e Armazenamento</h3>
            <p>
              Suas informações são armazenadas em servidores protegidos com criptografia e trilha de auditoria restrita
              à equipe administrativa autorizada.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1">4. Seus Direitos</h3>
            <p>
              Você pode solicitar a confirmação, correção ou exclusão dos seus dados de contato a qualquer momento pelo
              e-mail <span className="text-[#1355FF] font-semibold">privacidade@zeladoriacondominio.com.br</span>.
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
