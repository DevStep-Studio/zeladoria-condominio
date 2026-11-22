import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, isIconName, type IconName } from "@/components/icon";

const DEFAULT_TITLE_ICONS: Array<[RegExp, IconName]> = [
  [/serviço|prestador/i, "briefcase"],
  [/ocorrência|chamado/i, "clipboard"],
  [/reserva|espaço/i, "calendar"],
  [/encomenda|correspondência/i, "package"],
  [/visitante/i, "users"],
  [/comunicado|notícia/i, "mail"],
  [/assembleia|edital/i, "scale"],
  [/documento/i, "folder"],
  [/sugestão|reivindicação/i, "megaphone"],
  [/ordem/i, "wrench"],
  [/manutenção|preventiva/i, "shield"],
  [/financeiro|dre|caixa/i, "wallet"],
  [/auditoria|log/i, "lock"],
  [/relatório/i, "chart"],
  [/morador|unidade/i, "users"],
  [/portaria|acesso/i, "shield"],
  [/mudança/i, "truck"],
  [/achado/i, "search"],
  [/enquete/i, "vote"],
  [/configuraç|ajuste/i, "settings"],
  [/perfil|conta/i, "user"],
  [/ajuda|suporte/i, "help"],
  [/livro/i, "book"],
  [/agenda/i, "calendar"],
  [/fornecedor/i, "truck"],
  [/implantação|onboarding/i, "grid"],
  [/turno/i, "clock"],
  [/adoção|pet/i, "heart"],
  [/notificaç/i, "bell"],
];

function resolvePageIcon(icon?: IconName, title?: ReactNode): IconName {
  if (icon) return icon;
  if (typeof title === "string") {
    for (const [regex, matchedIcon] of DEFAULT_TITLE_ICONS) {
      if (regex.test(title)) return matchedIcon;
    }
  }
  return "grid";
}

/* Minimalist SaaS page title block. */
export function PageHeader({
  icon,
  title,
  subtitle,
  description,
  badge,
  actions,
  className = "",
}: {
  icon?: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const resolvedIcon = resolvePageIcon(icon, title);
  const textDescription = description || subtitle;

  return (
    <header className={`rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-[0_2px_10px_rgba(7,26,56,0.035)] mb-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Lado Esquerdo: Ícone + Título + Badge + Descrição */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {resolvedIcon && (
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF1FF] text-[#1455FF] shrink-0 border border-[#1455FF]/15">
              <Icon name={resolvedIcon} size={20} strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-[24px] font-extrabold text-[#101828] tracking-[-0.015em] leading-tight">
                {title}
              </h1>
              {badge}
            </div>
            {textDescription && (
              <p className="text-xs sm:text-sm text-[#526079] font-normal leading-relaxed mt-1 max-w-3xl">
                {textDescription}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 no-print">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  accent,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(7,26,56,0.035)] ${accent ? "border-l-4 border-l-[#1455FF]" : ""} ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6 border-b border-[#EDF1F7]">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-[#101828]">{title}</h2>
            {description ? <p className="mt-0.5 max-w-3xl text-xs text-[#526079]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  zinc: "border-[#E2E8F0] bg-slate-100 text-[#526079]",
  neutral: "border-[#E2E8F0] bg-slate-100 text-[#526079]",
  primary: "border-[#1455FF]/20 bg-[#EAF1FF] text-[#0D47FF]",
  blue: "border-[#1455FF]/20 bg-[#EAF1FF] text-[#0D47FF]",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
  green: "border-emerald-200 bg-emerald-50 text-[#16A34A]",
  red: "border-rose-200 bg-[#FDECEC] text-[#D92D20]",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TONES | string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-4 whitespace-nowrap ${TONES[tone] ?? TONES.neutral}`}>{children}</span>;
}

export function statusTone(status?: string | null) {
  if (!status || typeof status !== "string") return "neutral";
  const s = status.toLowerCase().replace(/_/g, " ");
  if (["autorizado", "aprovada", "aprovado", "entregue", "concluida", "concluido", "pago", "paga", "ativo", "vigente", "operacional", "retirado", "finalizado", "fechado", "devolvido", "presente", "respondido", "encerrado"].includes(s))
    return "green";
  if (["pendente", "aguardando", "programada", "aberta", "aberto", "convocada", "em andamento", "guardado", "em análise", "em analise", "solicitado", "agendado", "convidado"].includes(s)) return "yellow";
  if (["negado", "bloqueado", "vencido", "vencida", "atrasado", "cancelado", "rejeitada", "rejeitado", "inativo", "falha", "descartado"].includes(s)) return "red";
  if (["dentro", "em visita"].includes(s)) return "primary";
  return "neutral";
}

export function statusLabel(status?: string | null) {
  if (!status || typeof status !== "string") return "";
  return status.replace(/_/g, " ");
}

/* Dashboard indicator — modern summary card used at the top of data screens. */
export function StatCard({
  label,
  value,
  icon,
  hint,
  href,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  hint?: string;
  href?: string;
  tone?: "blue" | "yellow" | "green" | "purple";
}) {
  const iconBox =
    tone === "yellow"
      ? "bg-amber-50 text-amber-700 border border-amber-200/80"
      : tone === "green"
        ? "bg-emerald-50 text-[#16A34A] border border-emerald-200/70"
        : tone === "purple"
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/75"
          : "bg-[#EAF1FF] text-[#1455FF] border border-[#1455FF]/15";

  const body = (
    <div className="flex h-full items-center gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] transition-all hover:shadow-[0_4px_12px_rgba(7,26,56,0.06)] hover:border-[#1455FF]/40">
      {icon ? (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${iconBox}`}>
          <Icon name={icon} size={18} strokeWidth={2.1} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#526079] truncate">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
          <p className="text-xl sm:text-2xl font-black tabular-nums tracking-tight leading-none text-[#101828]">{value}</p>
          {hint ? <p className="text-[11px] font-medium text-[#8996A9] truncate">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block group">
      {body}
    </Link>
  ) : (
    body
  );
}

/* Kept for backward compatibility with existing pages — renders in the exact same modern card style */
export function Stat({
  label,
  value,
  hint,
  tone = "blue",
  icon,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: string;
  icon?: IconName;
  href?: string;
}) {
  const isYellow = tone === "yellow";
  return (
    <StatCard
      label={label}
      value={value}
      hint={hint}
      icon={icon}
      href={href}
      tone={isYellow ? "yellow" : "blue"}
    />
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  action,
}: {
  title: string;
  description?: string;
  icon?: IconName | string;
  action?: ReactNode;
}) {
  const known = typeof icon === "string" && isIconName(icon);
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] border border-[#1455FF]/15">
        <Icon name={known ? (icon as IconName) : "inbox"} size={20} />
      </span>
      <p className="mt-3 text-sm font-extrabold text-[#101828]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#526079]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white -webkit-overflow-scrolling-touch ${className}`}>
      <table className="table min-w-full">{children}</table>
    </div>
  );
}

/* Collapsible section. Renders as a subtle link, content in a card. */
export function Panel({
  summary,
  children,
  tone = "ghost",
  open = false,
}: {
  summary: string;
  children: ReactNode;
  tone?: "primary" | "ghost" | "dark";
  open?: boolean;
}) {
  const primary = tone === "primary" || tone === "dark";
  const summaryCls = tone === "dark" ? "btn-dark" : primary ? "btn-primary" : "btn-ghost";
  const cleanSummary = summary.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  return (
    <details className="group no-print" open={open}>
      <summary
        className={`list-none select-none ${summaryCls} w-full justify-between`}
      >
        <span className="flex items-center gap-2">
          <Icon name="plus" size={15} className="transition-transform group-open:rotate-45" />
          {cleanSummary}
        </span>
      </summary>
      <div className="panel-surface mt-3 p-5">{children}</div>
    </details>
  );
}

export function Progress({ value, tone }: { value: number; tone?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
      <div className={`h-full ${tone ?? "bg-[var(--color-primary)]"}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/* Subtle inline note. Neutral by default; warn/danger only when needed. */
export function InfoNote({
  children,
  tone = "neutral",
  icon = "sparkles",
}: {
  children: ReactNode;
  tone?: "neutral" | "warn" | "danger" | "amber" | "blue";
  icon?: IconName;
}) {
  const isWarn = tone === "warn" || tone === "amber";
  const isDanger = tone === "danger";
  const cls = isWarn
    ? "border-[#f0d8a8] bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
    : isDanger
      ? "border-[#efc9c9] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
      : "border-[var(--color-line)] bg-white text-[var(--color-muted)]";
  return (
    <div className={`flex items-start gap-3 rounded-[8px] border px-4 py-3.5 text-sm leading-relaxed ${cls}`}>
      <Icon name={icon} size={15} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/* Activity row used in the dashboard timeline. */
export function ActivityRow({
  icon,
  iconTone = "primary",
  title,
  meta,
  right,
}: {
  icon: IconName;
  iconTone?: "primary" | "green" | "amber" | "red" | "neutral";
  title: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
}) {
  const toneCls = {
    primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]",
    green: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    amber: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
    red: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    neutral: "bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
  }[iconTone];
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${toneCls}`}>
        <Icon name={icon} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-ink)]">{title}</p>
        {meta ? <p className="truncate text-xs text-[var(--color-muted)]">{meta}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export { Drawer } from "@/components/drawer";

