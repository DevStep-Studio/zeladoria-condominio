import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, isIconName, type IconName } from "@/components/icon";

/* ==========================================================================
   TOKENS & CLASS HELPERS PARA PÁGINAS INTERNAS (ZERO GRADIENTES)
   Alinhado integralmente à identidade visual aprovada da Home.
   OBS: Este arquivo NÃO deve ter "use client" para permanecer 100% compatível
   com Server Components do Next.js App Router.
   ========================================================================== */

export const INTERNAL_INPUT_CLS =
  "h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#101828] placeholder:text-[#8996A9] outline-none transition-colors focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const INTERNAL_TEXTAREA_CLS =
  "min-h-[88px] w-full rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-sm leading-relaxed text-[#101828] placeholder:text-[#8996A9] outline-none transition-colors focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const INTERNAL_SELECT_CLS =
  "h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-3.5 pr-9 text-sm font-medium text-[#101828] outline-none transition-colors focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/15 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50";

export const INTERNAL_BTN_PRIMARY_CLS =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#1455FF] hover:bg-[#0048E8] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const INTERNAL_BTN_SECONDARY_CLS =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F8FC] hover:border-[#CBD5E1] px-4 py-2 text-xs sm:text-sm font-bold text-[#101828] shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const INTERNAL_BTN_NAVY_CLS =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#081A37] hover:bg-[#0D2854] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const INTERNAL_BTN_DANGER_CLS =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#EF4444] hover:bg-red-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export type InternalTone = "blue" | "green" | "amber" | "red" | "navy" | "purple" | "neutral" | "orange";
export type InternalToneInput = InternalTone | "emerald" | "slate";

export function resolveInternalTone(tone?: InternalToneInput): InternalTone {
  if (tone === "emerald") return "green";
  if (tone === "slate") return "neutral";
  return tone ?? "blue";
}

export const INTERNAL_TONE_STYLES: Record<
  InternalTone,
  {
    iconBox: string;
    badge: string;
    dot: string;
    ringActive: string;
    valueText: string;
  }
> = {
  blue: {
    iconBox: "bg-[#EAF1FF] text-[#1455FF] border border-[#1455FF]/15",
    badge: "bg-[#EAF1FF] text-[#0D47FF] border border-[#1455FF]/20",
    dot: "bg-[#1455FF]",
    ringActive: "border-[#1455FF] bg-[#EAF1FF]/35 ring-2 ring-[#1455FF]/15",
    valueText: "text-[#101828]",
  },
  green: {
    iconBox: "bg-emerald-50 text-[#16A34A] border border-emerald-200/70",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-[#16A34A]",
    ringActive: "border-[#16A34A] bg-emerald-50/40 ring-2 ring-emerald-500/15",
    valueText: "text-[#101828]",
  },
  amber: {
    iconBox: "bg-amber-50 text-amber-700 border border-amber-200/80",
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
    dot: "bg-[#F59E0B]",
    ringActive: "border-[#F59E0B] bg-amber-50/45 ring-2 ring-amber-500/15",
    valueText: "text-[#101828]",
  },
  red: {
    iconBox: "bg-rose-50 text-[#EF4444] border border-rose-200/75",
    badge: "bg-[#FDECEC] text-[#D92D20] border border-rose-200",
    dot: "bg-[#EF4444]",
    ringActive: "border-[#EF4444] bg-rose-50/40 ring-2 ring-rose-500/15",
    valueText: "text-[#101828]",
  },
  navy: {
    iconBox: "bg-[#081A37]/8 text-[#081A37] border border-[#081A37]/15",
    badge: "bg-[#081A37] text-white border border-[#081A37]",
    dot: "bg-[#081A37]",
    ringActive: "border-[#081A37] bg-slate-100/80 ring-2 ring-[#081A37]/15",
    valueText: "text-[#081A37]",
  },
  purple: {
    iconBox: "bg-indigo-50 text-indigo-700 border border-indigo-200/75",
    badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    dot: "bg-indigo-600",
    ringActive: "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/15",
    valueText: "text-[#101828]",
  },
  orange: {
    iconBox: "bg-[#FFF7ED] text-[#FB6B01] border border-[#FB6B01]/20",
    badge: "bg-[#FFF7ED] text-[#C75400] border border-[#FB6B01]/25",
    dot: "bg-[#FB6B01]",
    ringActive: "border-[#FB6B01] bg-[#FFF7ED]/70 ring-2 ring-[#FB6B01]/15",
    valueText: "text-[#101828]",
  },
  neutral: {
    iconBox: "bg-slate-100 text-[#526079] border border-[#E2E8F0]",
    badge: "bg-slate-100 text-[#526079] border border-[#E2E8F0]",
    dot: "bg-slate-400",
    ringActive: "border-[#526079] bg-slate-50 ring-2 ring-slate-400/15",
    valueText: "text-[#101828]",
  },
};

/* ==========================================================================
   1. InternalPageLayout
   ========================================================================== */
export function InternalPageLayout({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-5 min-w-0 ${className}`}>{children}</div>;
}

/* ==========================================================================
   2. InternalPageHeader
   ========================================================================== */
export interface InternalBreadcrumbItem {
  label: string;
  href?: string;
}

export function InternalPageHeader({
  icon,
  title,
  description,
  subtitle,
  badge,
  meta,
  actions,
  breadcrumbs,
  brand = "zeladoria",
  className = "",
}: {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: InternalBreadcrumbItem[];
  brand?: "zeladoria" | "tiao";
  className?: string;
}) {
  const desc = description ?? subtitle;
  const iconCls =
    brand === "tiao" ? INTERNAL_TONE_STYLES.orange.iconBox : INTERNAL_TONE_STYLES.blue.iconBox;

  return (
    <header
      className={`rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-[0_2px_10px_rgba(7,26,56,0.035)] ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Caminho de navegação" className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#526079]">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && <Icon name="chevron-right" size={11} className="text-[#8996A9]" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[#1455FF] transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#101828]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {icon && (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${iconCls}`}
            >
              <Icon name={icon} size={21} strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-[24px] font-extrabold text-[#101828] tracking-[-0.015em] leading-tight">
                {title}
              </h1>
              {badge}
            </div>
            {desc && (
              <p className="mt-1 text-xs sm:text-sm text-[#526079] font-normal leading-relaxed max-w-3xl">
                {desc}
              </p>
            )}
            {meta && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#526079]">{meta}</div>}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 no-print">{actions}</div>
        )}
      </div>
    </header>
  );
}

/* ==========================================================================
   3. InternalStatCard & Grid
   Compacto, objetivo e fiel à hierarquia da Home.
   ========================================================================== */
export function InternalStatGrid({
  children,
  columns = 4,
  className = "",
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colsCls = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  }[columns];

  return <section className={`grid ${colsCls} gap-3 sm:gap-3.5 ${className}`}>{children}</section>;
}

export function InternalStatCard({
  label,
  value,
  hint,
  icon,
  tone,
  accent,
  href,
  active = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tone?: InternalToneInput;
  accent?: InternalToneInput;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const palette = INTERNAL_TONE_STYLES[resolveInternalTone(tone ?? accent ?? "blue")];

  const cardBody = (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] transition-all ${
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
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus-visible:outline-none">
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}

/* ==========================================================================
   4. InternalSectionCard & DataCard
   ========================================================================== */
export function InternalSectionCard({
  title,
  subtitle,
  icon,
  tone = "blue",
  actions,
  children,
  noPadding = false,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  tone?: InternalTone;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}) {
  const palette = INTERNAL_TONE_STYLES[tone];

  return (
    <section
      className={`rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(7,26,56,0.035)] overflow-hidden min-w-0 ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF1F7] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${palette.iconBox}`}>
                <Icon name={icon} size={17} strokeWidth={2.1} />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm sm:text-base font-extrabold text-[#101828] tracking-tight truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-[#526079] truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/* ==========================================================================
   5. InternalStatusBadge
   ========================================================================== */
export function InternalStatusBadge({
  children,
  label,
  tone = "neutral",
  showDot = false,
  icon,
  className = "",
}: {
  children?: ReactNode;
  label?: ReactNode;
  tone?: InternalToneInput;
  showDot?: boolean;
  icon?: IconName;
  className?: string;
}) {
  const palette = INTERNAL_TONE_STYLES[tone === "neutral" ? "neutral" : resolveInternalTone(tone)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-4 whitespace-nowrap ${palette.badge} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${palette.dot}`} />}
      {icon && <Icon name={icon} size={11} strokeWidth={2.3} className="shrink-0" />}
      <span>{children ?? label}</span>
    </span>
  );
}

/* ==========================================================================
   6. InternalDataTable
   ========================================================================== */
export function InternalDataTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-x-auto -webkit-overflow-scrolling-touch ${className}`}>
      <table className="w-full min-w-[640px] text-left text-xs sm:text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

/* ==========================================================================
   7. InternalTimeline
   Exibe apenas etapas reais do fluxo de cada módulo.
   ========================================================================== */
export interface InternalTimelineStep {
  id: string;
  label: string;
  meta?: string | null;
  description?: string | null;
  state: "done" | "current" | "pending" | "warning";
}

export function InternalTimeline({
  steps,
  className = "",
}: {
  steps: InternalTimelineStep[];
  className?: string;
}) {
  return (
    <ol className={`space-y-3 ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const indicatorCls =
          step.state === "done"
            ? "bg-[#1455FF] border-[#1455FF] text-white"
            : step.state === "current"
            ? "bg-[#EAF1FF] border-[#1455FF] text-[#1455FF] ring-4 ring-[#1455FF]/15"
            : step.state === "warning"
            ? "bg-amber-50 border-[#F59E0B] text-amber-700"
            : "bg-white border-[#CBD5E1] text-[#8996A9]";

        const titleCls =
          step.state === "done" || step.state === "current"
            ? "text-[#101828] font-bold"
            : step.state === "warning"
            ? "text-amber-800 font-bold"
            : "text-[#526079] font-medium";

        return (
          <li key={step.id} className="relative flex gap-3 pb-1 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-6 bottom-[-10px] w-0.5 ${
                  step.state === "done" ? "bg-[#1455FF]/40" : "bg-[#E2E8F0]"
                }`}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${indicatorCls}`}
            >
              {step.state === "done" ? (
                <Icon name="check" size={12} strokeWidth={3} />
              ) : step.state === "current" ? (
                <span className="h-2 w-2 rounded-full bg-[#1455FF]" />
              ) : step.state === "warning" ? (
                <Icon name="alert-triangle" size={11} strokeWidth={2.5} />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-xs sm:text-[13px] leading-snug ${titleCls}`}>{step.label}</p>
                {step.meta && (
                  <span className="text-[11px] font-medium text-[#8996A9] tabular-nums">
                    {step.meta}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="mt-0.5 text-xs text-[#526079] leading-relaxed">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ==========================================================================
   8. InternalEmptyState
   ========================================================================== */
export function InternalEmptyState({
  title,
  description,
  icon = "inbox",
  action,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: IconName | string;
  action?: ReactNode;
  className?: string;
}) {
  const iconName: IconName = typeof icon === "string" && isIconName(icon) ? icon : "inbox";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 sm:py-12 text-center shadow-[0_1px_4px_rgba(7,26,56,0.025)] ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1455FF] border border-[#1455FF]/15">
        <Icon name={iconName} size={22} strokeWidth={2} />
      </span>
      <h3 className="mt-3.5 text-sm sm:text-base font-extrabold text-[#101828]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs sm:text-sm leading-relaxed text-[#526079]">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   9. InternalFormField
   ========================================================================== */
export function InternalFormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-bold uppercase tracking-wider text-[#526079]"
      >
        {label}
        {required && <span className="ml-1 text-[#EF4444]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-semibold text-[#EF4444]">
          <Icon name="alert-triangle" size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[#8996A9] leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   10. InternalLoadingSkeleton
   ========================================================================== */
export function InternalLoadingSkeleton({
  statCount,
  stats,
  rowsCount,
  rows,
}: {
  statCount?: number;
  stats?: number;
  rowsCount?: number;
  rows?: number;
}) {
  const effectiveStatCount = statCount ?? stats ?? 4;
  const effectiveRowsCount = rowsCount ?? rows ?? 4;
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Carregando conteúdo">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-[13px] bg-slate-200/75 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-44 rounded-lg bg-slate-200/80" />
              <div className="h-3.5 w-64 max-w-[60vw] rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="hidden sm:block h-10 w-36 rounded-xl bg-slate-200/70" />
        </div>
      </div>

      {effectiveStatCount > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: effectiveStatCount }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 flex items-center gap-3.5"
            >
              <div className="h-10 w-10 rounded-[12px] bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-6 w-12 rounded bg-slate-200/80" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-3">
        {Array.from({ length: effectiveRowsCount }).map((_, idx) => (
          <div key={idx} className="h-16 w-full rounded-xl bg-slate-100/90" />
        ))}
      </div>
    </div>
  );
}
