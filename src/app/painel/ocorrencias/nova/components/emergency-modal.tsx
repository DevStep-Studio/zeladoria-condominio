"use client";

import { Icon } from "@/components/icon";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function EmergencyModal({ isOpen, onClose, reason }: EmergencyModalProps) {
  if (!isOpen) return null;

  const contacts = [
    { name: "Corpo de Bombeiros", number: "193", desc: "Incêndio, vazamento grave de gás, resgates", primary: true },
    { name: "SAMU", number: "192", desc: "Urgências e emergências médicas de saúde", primary: true },
    { name: "Polícia Militar", number: "190", desc: "Crimes em andamento, invasão, violência", primary: false },
    { name: "Portaria do Condomínio", number: "Ramal 94", desc: "Avisar imediatamente o porteiro ou zelador de plantão", primary: false },
    { name: "Defesa Civil", number: "199", desc: "Risco estrutural, alagamentos e desabamentos", primary: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
            <Icon name="alert-triangle" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Possível situação de emergência
            </h3>
            {reason && (
              <p className="mt-0.5 text-xs font-semibold text-red-600">
                {reason}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              O Zeladoria apoia a gestão, mas para riscos à vida ou emergências ativas, contate imediatamente as autoridades ou a portaria.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {contacts.map((c) => (
            <div
              key={c.name}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                c.primary
                  ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                  : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/70"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{c.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.desc}</p>
              </div>
              <a
                href={c.number.startsWith("Ramal") ? undefined : `tel:${c.number}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  c.primary
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon name="phone" size={13} />
                <span>{c.number}</span>
              </a>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Você pode continuar o registro normalmente após avisar.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
          >
            Continuar preenchendo
          </button>
        </div>
      </div>
    </div>
  );
}
