import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, blocks, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { Badge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { dateBR } from "@/lib/utils";
import { blockOptions } from "@/lib/queries";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions/gestao";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  manutencao: "Manutenção",
  portaria: "Portaria",
  assembleia: "Assembleia",
  financeiro: "Financeiro",
};

const CATEGORY_ICONS: Record<string, IconName> = {
  geral: "megaphone",
  manutencao: "wrench",
  portaria: "shield",
  assembleia: "vote",
  financeiro: "wallet",
};

function labelFor(labels: Record<string, string>, value: string | null) {
  if (!value) return "Geral";
  return labels[value] ?? value;
}

function categoryIcon(category: string | null): IconName {
  return category ? (CATEGORY_ICONS[category] ?? "megaphone") : "megaphone";
}

export default async function ComunicadosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { session, condoId } = await requireCondo();
  const { status } = await searchParams;
  const currentStatus = status ?? "todos";
  const canPublish = [...ALL_STAFF, "porteiro"].includes(session.role);

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      priority: announcements.priority,
      audience: announcements.audience,
      pinned: announcements.pinned,
      publishedAt: announcements.publishedAt,
      expiresAt: announcements.expiresAt,
      author: users.name,
      block: blocks.name,
    })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .leftJoin(blocks, eq(blocks.id, announcements.blockId))
    .where(eq(announcements.condoId, condoId))
    .orderBy(desc(announcements.pinned), desc(announcements.publishedAt));

  const blockList = await blockOptions(condoId);
  const pinnedCount = rows.filter((item) => item.pinned).length;
  const highPriorityCount = rows.filter((item) => item.priority === "alta").length;
  const segmentedCount = rows.filter((item) => item.audience === "bloco").length;
  const tvCount = rows.filter((item) => item.audience === "todos" || item.pinned).length;

  let displayRows = rows;
  if (currentStatus === "fixados") {
    displayRows = rows.filter((item) => item.pinned);
  } else if (currentStatus === "alta") {
    displayRows = rows.filter((item) => item.priority === "alta");
  } else if (currentStatus === "segmentados") {
    displayRows = rows.filter((item) => item.audience === "bloco");
  }

  const filterTabs = [
    { key: "todos", label: "Todos", icon: "grid", count: rows.length },
    { key: "fixados", label: "Fixados", icon: "pin", count: pinnedCount },
    { key: "alta", label: "Alta prioridade", icon: "alert", count: highPriorityCount },
    { key: "segmentados", label: "Segmentados", icon: "building", count: segmentedCount },
  ];

  return (
    <>
      <PageHeader
        title="Comunicados"
        subtitle="Publicação segmentada por bloco, prioridade, validade e envio automático de notificações aos moradores."
        actions={
          <Link href="/mural" target="_blank" className="btn-ghost btn-sm">
            <Icon name="panel" size={15} />
            Mural para TV da recepção
          </Link>
        }
      />

      {/* 4 Cards de Resumo Minimalistas e Alinhados à Home */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/painel/comunicados?status=todos"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "todos"
              ? "border-[#0055D4] bg-blue-50/20 ring-2 ring-blue-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <Icon name="megaphone" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {rows.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
              Publicados
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Comunicados ativos
            </p>
          </div>
        </Link>

        <Link
          href="/painel/comunicados?status=fixados"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "fixados"
              ? "border-[#0055D4] bg-blue-50/20 ring-2 ring-blue-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] transition-transform group-hover:scale-110">
              <Icon name="pin" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {pinnedCount}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
              Fixados
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              No topo do mural
            </p>
          </div>
        </Link>

        <Link
          href="/painel/comunicados?status=alta"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "alta"
              ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <Icon name="alert" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {highPriorityCount}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-rose-600 transition-colors">
              Alta prioridade
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Exigem atenção
            </p>
          </div>
        </Link>

        <Link
          href="/painel/comunicados?status=segmentados"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "segmentados"
              ? "border-purple-500 bg-purple-50/20 ring-2 ring-purple-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
              <Icon name="building" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {segmentedCount}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-purple-600 transition-colors">
              Segmentados
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Por bloco específico
            </p>
          </div>
        </Link>
      </section>

      {/* Filter Tabs Capsule - Minimalista e Fluido */}
      <div className="mt-6 mb-4 inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] no-print overflow-x-auto max-w-full">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/painel/comunicados?status=${tab.key}`}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#0055D4] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                name={tab.icon as any}
                size={14}
                strokeWidth={2.2}
                className={isActive ? "text-white" : "text-slate-400"}
              />
              <span>{tab.label}</span>
              <span
                className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className={`grid gap-5 ${canPublish ? "xl:grid-cols-[minmax(0,1fr)_430px]" : ""}`}>
        <div className="space-y-4">
          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0055D4] shadow-xs border border-blue-100">
                <Icon name="bell" size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Central de avisos do condomínio</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {rows.length} comunicados publicados, {tvCount} prontos para o mural e {segmentedCount} segmentados por bloco.
                </p>
              </div>
            </div>
            <Link href="/mural" target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs shrink-0 mt-3 sm:mt-0">
              <Icon name="panel" size={14} />
              <span>Abrir mural para TV</span>
            </Link>
          </section>

          {displayRows.length === 0 ? (
            <EmptyState title="Nenhum comunicado encontrado nesta categoria" icon="megaphone" />
          ) : (
            displayRows.map((a) => (
              <article key={a.id} className="surface-hover overflow-hidden rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4]">
                      <Icon name={categoryIcon(a.category)} size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.pinned ? <Badge tone="primary">Fixado</Badge> : null}
                        <Badge tone={a.priority === "alta" ? "red" : "zinc"}>{a.priority === "alta" ? "Alta" : "Normal"}</Badge>
                        <Badge>{labelFor(CATEGORY_LABELS, a.category)}</Badge>
                        <Badge tone="primary">{a.audience === "bloco" ? `Bloco ${a.block ?? ""}` : "Todos"}</Badge>
                      </div>
                      <h2 className="mt-3 text-lg font-bold leading-tight tracking-tight text-slate-900">{a.title}</h2>
                      <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-600">{a.body}</p>
                    </div>
                  </div>

                  {["superadmin", "sindico"].includes(session.role) ? (
                    <form action={deleteAnnouncementAction} className="no-print sm:shrink-0">
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn-ghost btn-sm">
                        <Icon name="x" size={14} />
                        Remover
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-3">
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-medium">
                    <Icon name="clock" size={13} className="text-slate-400" />
                    {dateBR(a.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-medium">
                    <Icon name="users" size={13} className="text-slate-400" />
                    {a.author ?? "Administração"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-medium">
                    <Icon name="calendar" size={13} className="text-slate-400" />
                    {a.expiresAt ? `Até ${dateBR(a.expiresAt)}` : "Sem expiração"}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {canPublish ? (
          <aside className="card-flat h-fit overflow-hidden xl:sticky xl:top-6">
            <div className="border-b border-[var(--color-primary-hover)] bg-[var(--color-primary)] p-5 text-[var(--color-ink)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-white/85 text-[var(--color-primary-dark)]">
                  <Icon name="send" size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Novo comunicado</h2>
                  <p className="mt-1 text-sm leading-6">Publique no app, segmente o público e mantenha o mural atualizado.</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <form action={createAnnouncementAction} className="space-y-4">
                <label className="block">
                  <span className="label">Título</span>
                  <input name="title" className="input" required />
                </label>
                <label className="block">
                  <span className="label">Mensagem</span>
                  <textarea name="body" rows={7} className="input" required />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Categoria</span>
                    <select name="category" className="input">
                      <option value="geral">Geral</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="portaria">Portaria</option>
                      <option value="assembleia">Assembleia</option>
                      <option value="financeiro">Financeiro</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Prioridade</span>
                    <select name="priority" className="input">
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Público</span>
                    <select name="audience" className="input">
                      <option value="todos">Todos</option>
                      <option value="bloco">Bloco específico</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Bloco</span>
                    <select name="blockId" className="input">
                      <option value="">-</option>
                      {blockList.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="label">Expira em</span>
                  <input type="date" name="expiresAt" className="input" />
                </label>
                <div className="rounded-[10px] border border-[#dce9b3] bg-[var(--color-primary-soft)] p-3">
                  <div className="mb-3 flex items-start gap-2 text-sm leading-6 text-[var(--color-muted)]">
                    <Icon name="bell" size={16} className="mt-1 shrink-0 text-[var(--color-primary-dark)]" />
                    <p>Use as opções abaixo para dar destaque e controlar a exibição no mural da recepção.</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                    <input type="checkbox" name="pinned" className="h-4 w-4 accent-[var(--color-primary)]" /> Fixar no topo
                  </label>
                  <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                    <input type="checkbox" name="showOnTv" defaultChecked className="h-4 w-4 accent-[var(--color-primary)]" /> Exibir no mural da TV
                  </label>
                </div>
                <button className="btn-primary w-full">
                  <Icon name="send" size={16} />
                  Publicar e notificar
                </button>
              </form>
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
