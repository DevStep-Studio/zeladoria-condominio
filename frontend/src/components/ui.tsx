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
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 mb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0">
            <Icon name={resolvedIcon} size={15} />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {badge}
          </h1>
        </div>
        {textDescription ? (
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            {textDescription}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end no-print">
          {actions}
        </div>
      ) : null}
    </div>
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
    <section className={`rounded-lg border border-slate-200/90 bg-white shadow-2xs ${accent ? "border-l-4 border-l-[#1355FF]" : ""} ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h2>
            {description ? <p className="mt-0.5 max-w-3xl text-xs text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  zinc: "border-slate-200 bg-slate-100 text-slate-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  primary: "border-blue-200 bg-blue-50 text-blue-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TONES | string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 ${TONES[tone] ?? TONES.neutral}`}>{children}</span>;
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
      ? "bg-amber-50 text-amber-700"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "purple"
          ? "bg-indigo-50 text-indigo-700"
          : "bg-blue-50 text-[#1355FF]";

  const body = (
    <div className="flex h-full min-h-[84px] items-start gap-3 rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs transition-colors hover:border-slate-300">
      {icon ? (
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconBox}`}>
          <Icon name={icon} size={15} strokeWidth={2} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] font-normal text-slate-400 truncate">{hint}</p> : null}
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon name={known ? (icon as IconName) : "inbox"} size={18} />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p> : null}
      {action ? <div className="mt-3.5">{action}</div> : null}
    </div>
  );
}

export function TableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-[8px] border border-[var(--color-line)] -webkit-overflow-scrolling-touch ${className}`}>
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

