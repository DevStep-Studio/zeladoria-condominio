"use client";

import { Icon } from "@/components/icon";

export function NextStepModal({
  isOpen,
  title = "Funcionalidade em desenvolvimento",
  description = "Esta funcionalidade será disponibilizada em uma próxima etapa do sistema.",
  onClose,
}: {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-[16px] border border-[var(--color-line)] bg-white p-6 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0070F3] mb-4">
          <Icon name="sparkles" size={22} />
        </div>
        <h3 className="text-base font-bold text-[var(--color-ink)]">{title}</h3>
        <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary btn-sm w-full"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
