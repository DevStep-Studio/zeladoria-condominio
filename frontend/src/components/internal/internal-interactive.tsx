"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  INTERNAL_TONE_STYLES,
  resolveInternalTone,
  type InternalToneInput,
} from "./internal-ui";

/* ==========================================================================
   COMPONENTES INTERATIVOS INTERNOS (CLIENT-ONLY, ZERO GRADIENTES)
   ========================================================================== */

/* 1. InternalStatFilterCard (Botão KPI interativo clicável para filtragem) */
export function InternalStatFilterCard({
  label,
  value,
  hint,
  icon,
  tone,
  accent,
  active = false,
  onClick,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tone?: InternalToneInput;
  accent?: InternalToneInput;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const palette = INTERNAL_TONE_STYLES[resolveInternalTone(tone ?? accent ?? "blue")];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] transition-all cursor-pointer ${
        active
          ? palette.ringActive
          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(7,26,56,0.06)]"
      } ${className}`}
    >
      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${palette.iconBox}`}
        >
          <Icon name={icon} size={18} strokeWidth={2.1} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#526079] truncate">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
          <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight leading-none ${palette.valueText}`}>
            {value}
          </span>
          {hint && <span className="text-[11px] font-medium text-[#8996A9] truncate">{hint}</span>}
        </div>
      </div>
    </button>
  );
}

/* 2. InternalTabStrip (Abas padronizadas por Link ou Button) */
export interface InternalTabItem {
  key?: string;
  id?: string;
  label: string;
  count?: number;
  icon?: IconName;
  href?: string;
}

export function InternalTabStrip({
  tabs,
  items,
  activeKey,
  activeId,
  onChange,
  className = "",
}: {
  tabs?: InternalTabItem[];
  items?: InternalTabItem[];
  activeKey?: string;
  activeId?: string;
  onChange?: (key: string) => void;
  className?: string;
}) {
  const list = tabs ?? items ?? [];
  const currentActive = activeKey ?? activeId ?? "";
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-1 overflow-x-auto max-w-full ${className}`}
      role="tablist"
    >
      {list.map((tab) => {
        const tabKey = tab.key ?? tab.id ?? tab.label;
        const active = currentActive === tabKey;
        const inner = (
          <>
            {tab.icon && (
              <Icon
                name={tab.icon}
                size={14}
                strokeWidth={2.1}
                className={active ? "text-white shrink-0" : "text-[#526079] shrink-0"}
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold tabular-nums ${
                  active ? "bg-white/20 text-white" : "bg-white text-[#526079] border border-[#E2E8F0]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </>
        );

        const cls = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
          active
            ? "bg-[#1455FF] text-white shadow-2xs"
            : "text-[#526079] hover:text-[#101828] hover:bg-white/80"
        }`;

        if (tab.href) {
          return (
            <Link key={tabKey} href={tab.href} className={cls}>
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tabKey)}
            className={cls}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

/* 3. InternalSearchInput */
export function InternalSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <Icon
        name="search"
        size={15}
        strokeWidth={2.1}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8996A9]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-9.5 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-8 text-xs sm:text-sm text-[#101828] placeholder:text-[#8996A9] outline-none transition-colors focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8996A9] hover:bg-slate-100 hover:text-[#101828] cursor-pointer"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
}

/* 4. InternalFilterBar (Organiza tabs, busca e ações sem poluição visual) */
export function InternalFilterBar({
  left,
  right,
  bottom,
  className = "",
}: {
  left?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#E2E8F0] bg-white p-3 sm:p-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] space-y-3 no-print ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {left ? <div className="flex items-center gap-2 overflow-x-auto max-w-full min-w-0">{left}</div> : null}
        {right ? <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">{right}</div> : null}
      </div>
      {bottom && <div className="border-t border-[#EDF1F7] pt-3">{bottom}</div>}
    </section>
  );
}

/* 5. InternalViewToggle */
export function InternalViewToggle({
  value,
  onChange,
  options = [
    { key: "cards", label: "Cards", icon: "grid" },
    { key: "lista", label: "Lista", icon: "menu" },
  ],
}: {
  value: string;
  onChange: (key: any) => void;
  options?: { key: string; label: string; icon: IconName }[];
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-0.5 shrink-0">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            title={opt.label}
            aria-label={opt.label}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              active
                ? "bg-white text-[#1455FF] shadow-2xs border border-[#E2E8F0]/70"
                : "text-[#526079] hover:text-[#101828]"
            }`}
          >
            <Icon name={opt.icon} size={14} strokeWidth={2.2} />
            <span className="hidden md:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* 6. InternalModal */
export function InternalModal({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  icon,
  maxWidth = "md",
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const modalDesc = description ?? subtitle;
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthCls = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081A37]/45 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${widthCls} rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EDF1F7] bg-white px-5 py-4 sm:px-6 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                <Icon name={icon} size={18} strokeWidth={2.1} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[#101828] leading-snug">
                {title}
              </h3>
              {modalDesc && (
                <p className="mt-0.5 text-xs text-[#526079] leading-relaxed">{modalDesc}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#8996A9] hover:bg-slate-100 hover:text-[#101828] transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EDF1F7] bg-[#F5F8FC]/60 px-5 py-3.5 sm:px-6 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* 7. InternalDrawer / InternalDetailPanel */
export function InternalDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badges,
  size = "xl",
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeCls = {
    md: "sm:max-w-md",
    lg: "sm:max-w-xl",
    xl: "sm:max-w-2xl",
    "2xl": "sm:max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[#081A37]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`absolute inset-y-0 right-0 w-full ${sizeCls} bg-white shadow-2xl border-l border-[#E2E8F0] flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] bg-white px-5 py-4 sm:px-6 shrink-0">
          <div className="min-w-0 space-y-1.5">
            {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
            <h2 className="text-base sm:text-xl font-extrabold text-[#101828] leading-snug break-words">
              {title}
            </h2>
            {subtitle && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#526079]">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#8996A9] hover:bg-slate-100 hover:text-[#101828] transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#F5F8FC]/45 p-5 sm:p-6">{children}</div>

        {footer && (
          <footer className="border-t border-[#E2E8F0] bg-white px-5 py-3.5 sm:px-6 shrink-0">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

/* 8. InternalDetailPanel (Layout estruturado 2 colunas para telas de detalhes) */
export function InternalDetailPanel({
  main,
  sidebar,
}: {
  main: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
      <div className="space-y-4 min-w-0">{main}</div>
      <aside className="space-y-4 min-w-0">{sidebar}</aside>
    </div>
  );
}

/* 9. InternalPagination */
export function InternalPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-xs text-[#526079]">
      <span className="font-medium">
        Página <strong className="text-[#101828]">{page}</strong> de{" "}
        <strong className="text-[#101828]">{totalPages}</strong> · {totalItems}{" "}
        {totalItems === 1 ? "registro" : "registros"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 font-bold text-[#101828] hover:bg-[#F5F8FC] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <Icon name="chevron-left" size={14} />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 font-bold text-[#101828] hover:bg-[#F5F8FC] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Próxima</span>
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
}
