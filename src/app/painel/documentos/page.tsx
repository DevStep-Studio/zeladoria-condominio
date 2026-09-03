import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { Badge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { dateBR } from "@/lib/utils";
import { createDocumentAction } from "@/lib/actions/gestao";
import { rankByQuery, summarize } from "@/lib/ai";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  juridico: "Jurídico",
  financeiro: "Financeiro",
  assembleia: "Assembleia",
  tecnico: "Técnico",
  contrato: "Contrato",
  geral: "Geral",
};

const CATEGORY_ICONS: Record<string, IconName> = {
  juridico: "scale",
  financeiro: "wallet",
  assembleia: "vote",
  tecnico: "wrench",
  contrato: "briefcase",
  geral: "file",
};

const VISIBILITY_LABELS: Record<string, string> = {
  publico: "Público",
  moradores: "Moradores",
  administrativo: "Administrativo",
};

function labelFor(labels: Record<string, string>, value: string | null) {
  if (!value) return "Geral";
  return labels[value] ?? value;
}

function categoryIcon(category: string | null): IconName {
  return category ? (CATEGORY_ICONS[category] ?? "file") : "file";
}

function visibilityTone(visibility: string) {
  if (visibility === "administrativo") return "red";
  if (visibility === "publico") return "green";
  return "primary";
}

function formatSize(sizeKb: number | null) {
  const kb = Number(sizeKb ?? 0);
  if (kb < 1024) return `${kb} KB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

export default async function DocumentosPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string }> }) {
  const { session, condoId } = await requireCondo();
  const { q, categoria } = await searchParams;
  const currentCategory = categoria ?? "todos";
  const canUpload = ALL_STAFF.includes(session.role);
  const scopes = session.role === "morador" ? ["publico", "moradores"] : ["publico", "moradores", "administrativo"];

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      category: documents.category,
      description: documents.description,
      fileName: documents.fileName,
      sizeKb: documents.sizeKb,
      visibility: documents.visibility,
      version: documents.version,
      createdAt: documents.createdAt,
      author: users.name,
    })
    .from(documents)
    .leftJoin(users, eq(users.id, documents.uploadedById))
    .where(eq(documents.condoId, condoId))
    .orderBy(desc(documents.createdAt));

  const visible = rows.filter((r) => scopes.includes(r.visibility));
  const categories = [...new Set(visible.map((v) => v.category))].sort();
  const administrativeCount = visible.filter((item) => item.visibility === "administrativo").length;
  const residentCount = visible.filter((item) => item.visibility === "moradores").length;
  const totalSizeKb = visible.reduce((total, item) => total + Number(item.sizeKb ?? 0), 0);
  const latest = visible[0];

  const categoryCounts: Record<string, number> = {};
  for (const doc of visible) {
    categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
  }

  let filtered = visible;
  if (currentCategory !== "todos") {
    filtered = filtered.filter((d) => d.category === currentCategory);
  }
  const list = q ? rankByQuery(filtered, ["title", "description", "category", "fileName"], q) : filtered;

  const filterTabs = [
    { key: "todos", label: "Todos", icon: "grid" as IconName, count: visible.length },
    ...categories.map((cat) => ({
      key: cat,
      label: labelFor(CATEGORY_LABELS, cat),
      icon: categoryIcon(cat),
      count: categoryCounts[cat] || 0,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Convenção, regimento, atas, laudos e prestações de contas com controle de visibilidade e versão."
        actions={
          canUpload ? (
            <a href="#publicar-documento" className="inline-flex items-center gap-2 rounded-xl bg-[#0055D4] hover:bg-[#0043A8] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs">
              <Icon name="plus" size={15} />
              Novo documento
            </a>
          ) : null
        }
      />

      {/* 4 Cards de Resumo Minimalistas e Alinhados à Home */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/painel/documentos?categoria=todos"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentCategory === "todos"
              ? "border-[#0055D4] bg-blue-50/20 ring-2 ring-blue-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <Icon name="folder" size={18} strokeWidth={2.2} />
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
              {visible.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
              Documentos
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Na biblioteca
            </p>
          </div>
        </Link>

        <div className="group relative flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <Icon name="lock" size={18} strokeWidth={2.2} />
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
              {administrativeCount}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-rose-600 transition-colors">
              Restritos
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Acesso administrativo
            </p>
          </div>
        </div>

        <div className="group relative flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] transition-transform group-hover:scale-110">
              <Icon name="grid" size={18} strokeWidth={2.2} />
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
              {categories.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
              Categorias
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Organizadas no acervo
            </p>
          </div>
        </div>

        <div className="group relative flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <Icon name="file" size={18} strokeWidth={2.2} />
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
              {formatSize(totalSizeKb)}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
              Tamanho total
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Indexado na biblioteca
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter Tabs Capsule - Minimalista e Fluido */}
      <div className="mt-6 mb-4 inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] no-print overflow-x-auto max-w-full">
        {filterTabs.map((tab) => {
          const isActive = currentCategory === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/painel/documentos?categoria=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="space-y-5">
          <section className="rounded-[20px] border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-5 sm:flex sm:items-start sm:justify-between sm:gap-5">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4]">
                  <Icon name="search" size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-slate-900">Busca assistida</h2>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Encontre documentos por palavra-chave, categoria, arquivo ou descrição e receba um resumo do melhor resultado.
                  </p>
                </div>
              </div>
              {latest ? (
                <div className="mt-3 sm:mt-0 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-slate-700 sm:w-56 shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0055D4]">Última publicação</p>
                  <p className="mt-0.5 font-bold text-slate-900 truncate">{latest.title}</p>
                </div>
              ) : null}
            </div>
            <div className="p-5">
              <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label htmlFor="document-search" className="sr-only">Buscar documentos</label>
                <input
                  id="document-search"
                  name="q"
                  defaultValue={q ?? ""}
                  className="input"
                  placeholder="ex.: ata assembleia fachada"
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0055D4] hover:bg-[#0043A8] text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all">
                  <Icon name="search" size={15} />
                  Buscar
                </button>
              </form>
              {q ? (
                <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-xs font-medium leading-relaxed text-slate-700">
                  {list.length > 0
                    ? `Encontrei ${list.length} documento(s) relacionados a "${q}". Sugestão: ${summarize(list[0].title + " - " + (list[0].description ?? "documento oficial do condomínio"), 150)}`
                    : `Nenhum documento corresponde a "${q}". Refine os termos ou peça ajuda ao suporte.`}
                </p>
              ) : null}
              {categories.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/painel/documentos?categoria=${category}`}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                        currentCategory === category
                          ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                          : "border-slate-200/80 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon name={categoryIcon(category)} size={13} />
                      {labelFor(CATEGORY_LABELS, category)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="card-flat overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">Biblioteca</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{list.length} documentos disponíveis para este perfil.</p>
              </div>
              <Badge tone="primary">{residentCount} para moradores</Badge>
            </header>
            <div className="p-4 sm:p-5">
              {list.length === 0 ? (
                <EmptyState title="Nenhum documento" icon="folder" />
              ) : (
                <div className="grid gap-3">
                  {list.map((d) => (
                    <article key={d.id} className="surface-hover rounded-[12px] border border-[var(--color-line)] bg-white p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]">
                            <Icon name={categoryIcon(d.category)} size={18} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge>{labelFor(CATEGORY_LABELS, d.category)}</Badge>
                              <Badge tone={visibilityTone(d.visibility)}>{labelFor(VISIBILITY_LABELS, d.visibility)}</Badge>
                            </div>
                            <h3 className="mt-3 text-lg font-semibold leading-tight text-[var(--color-ink)]">{d.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{d.description ?? "Documento oficial do condomínio."}</p>
                            <p className="mt-2 font-mono text-xs text-[var(--color-subtle)]">
                              {d.fileName} - {formatSize(d.sizeKb)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:w-44 md:shrink-0">
                          <div className="rounded-[8px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Versão</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{d.version}</p>
                          </div>
                          <div className="rounded-[8px] border border-[#dce9b3] bg-[var(--color-primary-soft)] px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary-dark)]">Status</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--color-primary-dark)]">Atual</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-muted)] sm:grid-cols-3">
                        <span className="flex items-center gap-2 rounded-[8px] bg-[var(--color-surface-muted)] px-3 py-2">
                          <Icon name="calendar" size={14} />
                          {dateBR(d.createdAt)}
                        </span>
                        <span className="flex items-center gap-2 rounded-[8px] bg-[var(--color-surface-muted)] px-3 py-2">
                          <Icon name="users" size={14} />
                          {d.author ?? "Administração"}
                        </span>
                        <span className="flex items-center gap-2 rounded-[8px] bg-[var(--color-surface-muted)] px-3 py-2">
                          <Icon name={d.visibility === "administrativo" ? "lock" : "download"} size={14} />
                          {d.visibility === "administrativo" ? "Restrito" : "Disponível"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {canUpload ? (
            <section id="publicar-documento" className="card-flat h-fit overflow-hidden xl:sticky xl:top-6">
              <div className="border-b border-[var(--color-primary-hover)] bg-[var(--color-primary)] p-5 text-[var(--color-ink)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-white/85 text-[var(--color-primary-dark)]">
                    <Icon name="file" size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Publicar documento</h2>
                    <p className="mt-1 text-sm leading-6">Cadastre versões, visibilidade e rastreabilidade para a biblioteca.</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <form action={createDocumentAction} className="space-y-4">
                  <label className="block">
                    <span className="label">Título</span>
                    <input name="title" className="input" required />
                  </label>
                  <label className="block">
                    <span className="label">Descrição</span>
                    <textarea name="description" rows={3} className="input" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">Categoria</span>
                      <select name="category" className="input">
                        <option value="juridico">Jurídico</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="assembleia">Assembleia</option>
                        <option value="tecnico">Técnico</option>
                        <option value="contrato">Contrato</option>
                        <option value="geral">Geral</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="label">Visibilidade</span>
                      <select name="visibility" className="input">
                        <option value="moradores">Moradores</option>
                        <option value="publico">Público</option>
                        <option value="administrativo">Administrativo</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">Arquivo</span>
                      <input name="fileName" className="input" placeholder="ata-2026.pdf" />
                    </label>
                    <label className="block">
                      <span className="label">Versão</span>
                      <input name="version" className="input" defaultValue="1.0" />
                    </label>
                  </div>
                  <button className="btn-primary w-full">
                    <Icon name="send" size={16} />
                    Publicar
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          <section className="rounded-[12px] border border-[#dce9b3] bg-[var(--color-primary-soft)] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-primary)] text-[var(--color-ink)]">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">Governança documental</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  Documentos administrativos ficam restritos a síndico, conselho e super administrador.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
              <div className="flex items-center gap-2 rounded-[8px] bg-white px-3 py-2">
                <Icon name="lock" size={14} />
                Acesso controlado por perfil
              </div>
              <div className="flex items-center gap-2 rounded-[8px] bg-white px-3 py-2">
                <Icon name="download" size={14} />
                Downloads registrados na auditoria
              </div>
              <div className="flex items-center gap-2 rounded-[8px] bg-white px-3 py-2">
                <Icon name="refresh" size={14} />
                Versões preservadas na biblioteca
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
