"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/icon";

export function Drawer({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer-panel max-w-full sm:max-w-md w-full">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-4 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--color-ink)] truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
            aria-label="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-7rem)] pr-1">
          {children}
        </div>
      </div>
    </>
  );
}

