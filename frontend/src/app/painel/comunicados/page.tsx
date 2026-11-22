import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireCondo } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { Icon, type IconName } from "@/components/icon";
import {
  INTERNAL_BTN_NAVY_CLS,
  INTERNAL_BTN_PRIMARY_CLS,
  INTERNAL_BTN_SECONDARY_CLS,
  INTERNAL_INPUT_CLS,
  INTERNAL_SELECT_CLS,
  INTERNAL_TEXTAREA_CLS,
  InternalEmptyState,
  InternalFormField,
  InternalPageHeader,
  InternalPageLayout,
  InternalSectionCard,
  InternalStatCard,
  InternalStatGrid,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";
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
  assembleia: "users",
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
  const canDelete = ["superadmin", "sindico"].includes(session.role);

  const rows = await domainRequest<any[]>("/painel/comunicados", { query: { condoId } });

  const blockList = await blockOptions(condoId);
  const pinnedRows = rows.filter((item) => item.pinned);
  const pinnedCount = pinnedRows.length;
  const highPriorityCount = rows.filter((item) => item.priority === "alta").length;
  const segmentedCount = rows.filter((item) => item.audience === "bloco").length;
  const tvCount = rows.filter((item) => item.audience === "todos" || item.pinned).length;

  let displayRows = rows;
  if (currentStatus === "fixados") {
    displayRows = pinnedRows;
  } else if (currentStatus === "alta") {
    displayRows = rows.filter((item) => item.priority === "alta");
  } else if (currentStatus === "segmentados") {
    displayRows = rows.filter((item) => item.audience === "bloco");
  }

  const showPinnedHighlight = currentStatus === "todos" && pinnedRows.length > 0;
  const regularRows = showPinnedHighlight
    ? displayRows.filter((item) => !item.pinned)
    : displayRows;

  const filterTabs = [
    { key: "todos", label: "Todos", icon: "grid" as IconName, count: rows.length },
    { key: "fixados", label: "Fixados", icon: "pin" as IconName, count: pinnedCount },
    { key: "alta", label: "Alta prioridade", icon: "alert-triangle" as IconName, count: highPriorityCount },
    { key: "segmentados", label: "Segmentados", icon: "building" as IconName, count: segmentedCount },
  ];

  return (
    <InternalPageLayout>
      {/* 1. Cabeçalho Padrão Interno */}
      <InternalPageHeader
        icon="megaphone"
        title="Comunicados"
        description="Novidades e avisos importantes do condomínio."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Comunicados" },
        ]}
        badge={<InternalStatusBadge tone="blue">{rows.length} publicados</InternalStatusBadge>}
        actions={
          <Link href="/mural" target="_blank" className={INTERNAL_BTN_NAVY_CLS}>
            <Icon name="tv" size={15} />
            <span>Mural para TV ({tvCount})</span>
          </Link>
        }
      />

      {/* 2. Indicadores Compactos */}
      <InternalStatGrid columns={4}>
        <InternalStatCard
          label="Publicados"
          value={rows.length}
          hint="no portal"
          icon="megaphone"
          tone="blue"
          href="/painel/comunicados?status=todos"
          active={currentStatus === "todos"}
        />
        <InternalStatCard
          label="Fixados"
          value={pinnedCount}
          hint="em destaque"
          icon="pin"
          tone="navy"
          href="/painel/comunicados?status=fixados"
          active={currentStatus === "fixados"}
        />
        <InternalStatCard
          label="Alta prioridade"
          value={highPriorityCount}
          hint="atenção imediata"
          icon="alert-triangle"
          tone="red"
          href="/painel/comunicados?status=alta"
          active={currentStatus === "alta"}
        />
        <InternalStatCard
          label="Segmentados"
          value={segmentedCount}
          hint="por bloco"
          icon="building"
          tone="purple"
          href="/painel/comunicados?status=segmentados"
          active={currentStatus === "segmentados"}
        />
      </InternalStatGrid>

      {/* 3. Barra de Filtros Organizada */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-3 sm:p-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-1 overflow-x-auto max-w-full">
          {filterTabs.map((tab) => {
            const isActive = currentStatus === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/painel/comunicados?status=${tab.key}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[#1455FF] text-white shadow-2xs"
                    : "text-[#526079] hover:text-[#101828] hover:bg-white/80"
                }`}
              >
                <Icon
                  name={tab.icon}
                  size={14}
                  strokeWidth={2.1}
                  className={isActive ? "text-white shrink-0" : "text-[#526079] shrink-0"}
                />
                <span>{tab.label}</span>
                <span
                  className={`inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#526079] border border-[#E2E8F0]"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/mural"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1455FF] hover:underline whitespace-nowrap shrink-0"
        >
          <Icon name="external-link" size={14} />
          <span>Abrir modo recepção / TV</span>
        </Link>
      </section>

      {/* 4. Área de Conteúdo + Painel de Publicação */}
      <div className={`grid gap-5 items-start ${canPublish ? "xl:grid-cols-[minmax(0,1fr)_400px]" : ""}`}>
        <div className="space-y-4 min-w-0">
          {/* Destaque discreto para Comunicados Fixados */}
          {showPinnedHighlight && (
            <section className="space-y-3 rounded-2xl border border-[#1455FF]/20 bg-[#EAF1FF]/55 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1455FF] text-white">
                    <Icon name="pin" size={14} />
                  </span>
                  <h2 className="text-sm font-extrabold text-[#101828]">
                    Comunicados fixados no topo
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[#1455FF]">
                  {pinnedRows.length} {pinnedRows.length === 1 ? "destaque" : "destaques"}
                </span>
              </div>

              <div className="space-y-3">
                {pinnedRows.map((a) => (
                  <article
                    key={`pinned-${a.id}`}
                    className="rounded-2xl border border-[#1455FF]/25 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(20,85,255,0.06)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                          <Icon name={categoryIcon(a.category)} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <InternalStatusBadge tone="blue" icon="pin">
                              Fixado
                            </InternalStatusBadge>
                            {a.priority === "alta" && (
                              <InternalStatusBadge tone="red" icon="alert-triangle">
                                Alta prioridade
                              </InternalStatusBadge>
                            )}
                            <InternalStatusBadge tone="neutral">
                              {labelFor(CATEGORY_LABELS, a.category)}
                            </InternalStatusBadge>
                            <InternalStatusBadge tone="navy">
                              {a.audience === "bloco" ? `Bloco ${a.block ?? ""}` : "Todos os blocos"}
                            </InternalStatusBadge>
                          </div>

                          <h3 className="mt-2.5 text-base sm:text-lg font-extrabold text-[#101828] leading-snug">
                            {a.title}
                          </h3>
                          <p className="mt-1.5 text-xs sm:text-sm text-[#526079] leading-relaxed line-clamp-3">
                            {a.body}
                          </p>
                        </div>
                      </div>

                      {canDelete && (
                        <form action={deleteAnnouncementAction} className="no-print shrink-0">
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className={INTERNAL_BTN_SECONDARY_CLS}>
                            <Icon name="trash" size={14} className="text-[#EF4444]" />
                            <span>Remover</span>
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-[#EDF1F7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#526079]">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="clock" size={13} className="text-[#8996A9]" />
                          <span>{dateBR(a.publishedAt)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="user" size={13} className="text-[#8996A9]" />
                          <span>{a.author ?? "Administração"}</span>
                        </span>
                        {a.expiresAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="calendar" size={13} className="text-[#8996A9]" />
                            <span>Validade: {dateBR(a.expiresAt)}</span>
                          </span>
                        )}
                      </div>

                      <details className="group">
                        <summary className="cursor-pointer font-bold text-[#1455FF] hover:underline select-none">
                          Ler comunicado completo
                        </summary>
                        <div className="mt-2.5 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3.5 text-xs sm:text-sm text-[#101828] whitespace-pre-line leading-relaxed">
                          {a.body}
                        </div>
                      </details>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Lista Principal de Comunicados */}
          {displayRows.length === 0 ? (
            <InternalEmptyState
              title="Nenhum comunicado encontrado nesta visualização"
              description="Quando a administração publicar comunicados ou convocações neste filtro, eles aparecerão organizados aqui."
              icon="megaphone"
              action={
                currentStatus !== "todos" ? (
                  <Link href="/painel/comunicados?status=todos" className={INTERNAL_BTN_SECONDARY_CLS}>
                    Ver todos os comunicados
                  </Link>
                ) : null
              }
            />
          ) : regularRows.length > 0 ? (
            <div className="space-y-3">
              {regularRows.map((a) => (
                <article
                  key={a.id}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(7,26,56,0.03)] hover:border-[#1455FF]/35 hover:shadow-[0_6px_16px_rgba(7,26,56,0.05)] transition-all"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                        <Icon name={categoryIcon(a.category)} size={18} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {a.pinned && (
                            <InternalStatusBadge tone="blue" icon="pin">
                              Fixado
                            </InternalStatusBadge>
                          )}
                          <InternalStatusBadge tone={a.priority === "alta" ? "red" : "neutral"}>
                            {a.priority === "alta" ? "Alta prioridade" : "Normal"}
                          </InternalStatusBadge>
                          <InternalStatusBadge tone="blue">
                            {labelFor(CATEGORY_LABELS, a.category)}
                          </InternalStatusBadge>
                          <InternalStatusBadge tone={a.audience === "bloco" ? "purple" : "neutral"}>
                            {a.audience === "bloco" ? `Bloco ${a.block ?? ""}` : "Todos"}
                          </InternalStatusBadge>
                        </div>

                        <h3 className="mt-2.5 text-base sm:text-lg font-extrabold text-[#101828] leading-snug tracking-tight">
                          {a.title}
                        </h3>
                        <p className="mt-1.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-[#526079]">
                          {a.body}
                        </p>
                      </div>
                    </div>

                    {canDelete && (
                      <form action={deleteAnnouncementAction} className="no-print shrink-0">
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className={INTERNAL_BTN_SECONDARY_CLS}>
                          <Icon name="trash" size={14} className="text-[#EF4444]" />
                          <span>Remover</span>
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#EDF1F7] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#526079]">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="clock" size={13} className="text-[#8996A9]" />
                      <span>Publicado em {dateBR(a.publishedAt)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="user" size={13} className="text-[#8996A9]" />
                      <span>{a.author ?? "Administração"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="calendar" size={13} className="text-[#8996A9]" />
                      <span>{a.expiresAt ? `Válido até ${dateBR(a.expiresAt)}` : "Sem validade definida"}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {/* Formulário de Novo Comunicado para Perfis Autorizados */}
        {canPublish && (
          <InternalSectionCard
            title="Novo comunicado"
            subtitle="Publique no portal e controle a exibição no mural da recepção."
            icon="send"
            tone="blue"
            className="xl:sticky xl:top-24"
          >
            <form action={createAnnouncementAction} className="space-y-4">
              <InternalFormField label="Título" required>
                <input
                  name="title"
                  placeholder="Ex.: Manutenção programada nos elevadores"
                  className={INTERNAL_INPUT_CLS}
                  required
                />
              </InternalFormField>

              <InternalFormField label="Mensagem" required>
                <textarea
                  name="body"
                  rows={5}
                  placeholder="Escreva os detalhes completos do comunicado..."
                  className={INTERNAL_TEXTAREA_CLS}
                  required
                />
              </InternalFormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <InternalFormField label="Categoria">
                  <select name="category" className={INTERNAL_SELECT_CLS}>
                    <option value="geral">Geral</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="portaria">Portaria</option>
                    <option value="assembleia">Assembleia</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </InternalFormField>

                <InternalFormField label="Prioridade">
                  <select name="priority" className={INTERNAL_SELECT_CLS}>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </InternalFormField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InternalFormField label="Público-alvo">
                  <select name="audience" className={INTERNAL_SELECT_CLS}>
                    <option value="todos">Todos os moradores</option>
                    <option value="bloco">Bloco específico</option>
                  </select>
                </InternalFormField>

                <InternalFormField label="Bloco de destino">
                  <select name="blockId" className={INTERNAL_SELECT_CLS}>
                    <option value="">Todos os blocos</option>
                    {blockList.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </InternalFormField>
              </div>

              <InternalFormField label="Data de expiração" hint="Opcional para avisos temporários">
                <input type="date" name="expiresAt" className={INTERNAL_INPUT_CLS} />
              </InternalFormField>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3.5 space-y-2.5">
                <p className="text-xs text-[#526079] leading-relaxed">
                  Defina destaque no portal e sincronização automática com o mural de TV da portaria.
                </p>
                <label className="flex items-center gap-2 text-xs font-bold text-[#101828] cursor-pointer">
                  <input type="checkbox" name="pinned" className="h-4 w-4 accent-[#1455FF]" />
                  <span>Fixar no topo dos comunicados</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[#101828] cursor-pointer">
                  <input type="checkbox" name="showOnTv" defaultChecked className="h-4 w-4 accent-[#1455FF]" />
                  <span>Exibir no mural para TV da recepção</span>
                </label>
              </div>

              <button type="submit" className={`${INTERNAL_BTN_PRIMARY_CLS} w-full`}>
                <Icon name="send" size={15} />
                <span>Publicar e notificar moradores</span>
              </button>
            </form>
          </InternalSectionCard>
        )}
      </div>
    </InternalPageLayout>
  );
}
