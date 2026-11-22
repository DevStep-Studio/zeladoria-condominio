import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireCondo } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { Icon, type IconName } from "@/components/icon";
import {
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
  type InternalTone,
} from "@/components/internal/internal-ui";
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
  assembleia: "users",
  tecnico: "wrench",
  contrato: "briefcase",
  geral: "file-text",
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
  return category ? (CATEGORY_ICONS[category] ?? "file-text") : "file-text";
}

function visibilityTone(visibility: string): InternalTone {
  if (visibility === "administrativo") return "red";
  if (visibility === "publico") return "green";
  return "blue";
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

  const rows = await domainRequest<any[]>("/painel/documentos", { query: { condoId } });

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
    <InternalPageLayout>
      {/* 1. Cabeçalho Padrão Biblioteca Condominial */}
      <InternalPageHeader
        icon="folder"
        title="Documentos"
        description="Biblioteca oficial do condomínio com convenção, regimento, atas, laudos e prestações de contas."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Documentos" },
        ]}
        badge={<InternalStatusBadge tone="blue">{visible.length} arquivos</InternalStatusBadge>}
        actions={
          canUpload ? (
            <a href="#publicar-documento" className={INTERNAL_BTN_PRIMARY_CLS}>
              <Icon name="plus" size={15} />
              <span>Publicar documento</span>
            </a>
          ) : null
        }
      />

      {/* 2. Indicadores Compactos */}
      <InternalStatGrid columns={4}>
        <InternalStatCard
          label="Documentos"
          value={visible.length}
          hint="no acervo"
          icon="folder"
          tone="blue"
          href="/painel/documentos?categoria=todos"
          active={currentCategory === "todos"}
        />
        <InternalStatCard
          label="Categorias"
          value={categories.length}
          hint="organizadas"
          icon="layers"
          tone="navy"
        />
        <InternalStatCard
          label="Restritos"
          value={administrativeCount}
          hint="acesso gestão"
          icon="lock"
          tone="red"
        />
        <InternalStatCard
          label="Armazenamento"
          value={formatSize(totalSizeKb)}
          hint="indexado"
          icon="file-text"
          tone="green"
        />
      </InternalStatGrid>

      {/* 3. Barra de Busca e Filtros por Categoria */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-4 shadow-[0_2px_8px_rgba(7,26,56,0.03)] space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-1 overflow-x-auto max-w-full">
            {filterTabs.map((tab) => {
              const isActive = currentCategory === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/painel/documentos?categoria=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#1455FF] text-white shadow-2xs"
                      : "text-[#526079] hover:text-[#101828] hover:bg-white/80"
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={14}
                    className={isActive ? "text-white shrink-0" : "text-[#526079] shrink-0"}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold tabular-nums ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-[#526079] border border-[#E2E8F0]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </div>

          <form className="flex items-center gap-2 w-full lg:w-auto">
            {currentCategory !== "todos" && (
              <input type="hidden" name="categoria" value={currentCategory} />
            )}
            <div className="relative flex-1 lg:w-72">
              <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8996A9]" />
              <input
                id="document-search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar ata, regimento, arquivo..."
                className="h-9.5 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs sm:text-sm text-[#101828] placeholder:text-[#8996A9] outline-none focus:border-[#1455FF]"
              />
            </div>
            <button type="submit" className={INTERNAL_BTN_PRIMARY_CLS}>
              <span>Buscar</span>
            </button>
          </form>
        </div>

        {q && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1455FF]/20 bg-[#EAF1FF] px-4 py-2.5 text-xs text-[#081A37]">
            <p className="font-medium leading-relaxed">
              {list.length > 0
                ? `Encontrei ${list.length} documento(s) relacionados a "${q}". Resumo: ${summarize(list[0].title + " - " + (list[0].description ?? "documento oficial do condomínio"), 140)}`
                : `Nenhum documento corresponde a "${q}". Tente termos mais amplos ou limpe a busca.`}
            </p>
            <Link
              href={`/painel/documentos?categoria=${currentCategory}`}
              className="font-bold text-[#1455FF] hover:underline shrink-0"
            >
              Limpar busca
            </Link>
          </div>
        )}
      </section>

      {/* 4. Biblioteca de Arquivos + Upload / Governança */}
      <div className="grid gap-5 items-start xl:grid-cols-[minmax(0,1fr)_390px]">
        <InternalSectionCard
          title="Acervo de documentos"
          subtitle={`${list.length} arquivos visíveis para este perfil${latest ? ` · Última publicação: ${latest.title}` : ""}`}
          icon="folder"
          tone="blue"
          actions={<InternalStatusBadge tone="blue">{residentCount} para moradores</InternalStatusBadge>}
        >
          {list.length === 0 ? (
            <InternalEmptyState
              title="Nenhum documento encontrado"
              description="Ajuste a categoria selecionada ou os termos de busca para localizar arquivos do condomínio."
              icon="folder"
              action={
                (q || currentCategory !== "todos") ? (
                  <Link href="/painel/documentos" className={INTERNAL_BTN_SECONDARY_CLS}>
                    Ver toda a biblioteca
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2">
              {list.map((d) => {
                const ext = d.fileName ? String(d.fileName).split(".").pop()?.toUpperCase() : "PDF";
                const downloadHref =
                  d.fileUrl ||
                  `data:text/plain;charset=utf-8,${encodeURIComponent(
                    `Documento: ${d.title}\nCategoria: ${d.category}\nVersão: ${d.version}\nData: ${dateBR(d.createdAt)}\nDescrição: ${d.description || "Documento oficial do condomínio."}`
                  )}`;
                const fileNameDownload =
                  d.fileName || `${d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;

                return (
                  <article
                    key={d.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 hover:border-[#1455FF]/40 hover:shadow-[0_6px_16px_rgba(7,26,56,0.05)] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                          <Icon name={categoryIcon(d.category)} size={18} />
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <InternalStatusBadge tone="neutral">
                            {labelFor(CATEGORY_LABELS, d.category)}
                          </InternalStatusBadge>
                          <InternalStatusBadge tone={visibilityTone(d.visibility)}>
                            {labelFor(VISIBILITY_LABELS, d.visibility)}
                          </InternalStatusBadge>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-snug line-clamp-2">
                          {d.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#526079] leading-relaxed line-clamp-2">
                          {d.description ?? "Documento oficial arquivado para consulta condominial."}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#EDF1F7] bg-[#F5F8FC] p-2.5 text-[11px]">
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase text-[#8996A9]">Arquivo</span>
                          <span className="font-mono font-semibold text-[#101828] truncate block">
                            {d.fileName || "documento.pdf"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-[#8996A9]">Versão</span>
                          <span className="font-bold text-[#101828]">v{d.version || "1.0"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-[#8996A9]">Tamanho</span>
                          <span className="font-bold text-[#101828]">{formatSize(d.sizeKb)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EDF1F7] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-[#526079] space-y-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Icon name="calendar" size={12} className="text-[#8996A9]" />
                          <span>{dateBR(d.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#8996A9]">
                          <Icon name="user" size={12} />
                          <span>{d.author ?? "Administração"}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={downloadHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F8FC] px-3 text-xs font-bold text-[#101828] transition-colors"
                          title="Visualizar arquivo"
                        >
                          <Icon name="eye" size={13} />
                          <span>Abrir</span>
                        </a>
                        <a
                          href={downloadHref}
                          download={fileNameDownload}
                          className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-[#EAF1FF] hover:bg-[#1455FF] text-[#1455FF] hover:text-white px-3 text-xs font-bold transition-colors"
                        >
                          <Icon name="download" size={13} />
                          <span>Baixar {ext}</span>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </InternalSectionCard>

        <aside className="space-y-4">
          {canUpload && (
            <div id="publicar-documento">
              <InternalSectionCard
                title="Publicar documento"
                subtitle="Cadastre versões e visibilidade na biblioteca oficial."
                icon="plus-circle"
                tone="blue"
              >
                <form action={createDocumentAction} className="space-y-4">
                  <InternalFormField label="Título" required>
                    <input
                      name="title"
                      placeholder="Ex.: Ata da Assembleia Geral 2026"
                      className={INTERNAL_INPUT_CLS}
                      required
                    />
                  </InternalFormField>

                  <InternalFormField label="Descrição">
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Resumo do conteúdo do arquivo..."
                      className={INTERNAL_TEXTAREA_CLS}
                    />
                  </InternalFormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InternalFormField label="Categoria">
                      <select name="category" className={INTERNAL_SELECT_CLS}>
                        <option value="juridico">Jurídico</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="assembleia">Assembleia</option>
                        <option value="tecnico">Técnico</option>
                        <option value="contrato">Contrato</option>
                        <option value="geral">Geral</option>
                      </select>
                    </InternalFormField>

                    <InternalFormField label="Visibilidade">
                      <select name="visibility" className={INTERNAL_SELECT_CLS}>
                        <option value="moradores">Moradores</option>
                        <option value="publico">Público</option>
                        <option value="administrativo">Administrativo</option>
                      </select>
                    </InternalFormField>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InternalFormField label="Nome do arquivo">
                      <input name="fileName" className={INTERNAL_INPUT_CLS} placeholder="ata-2026.pdf" />
                    </InternalFormField>

                    <InternalFormField label="Versão">
                      <input name="version" className={INTERNAL_INPUT_CLS} defaultValue="1.0" />
                    </InternalFormField>
                  </div>

                  <button type="submit" className={`${INTERNAL_BTN_PRIMARY_CLS} w-full`}>
                    <Icon name="send" size={15} />
                    <span>Publicar na biblioteca</span>
                  </button>
                </form>
              </InternalSectionCard>
            </div>
          )}

          <InternalSectionCard
            title="Governança documental"
            subtitle="Regras de controle de acesso e rastreabilidade"
            icon="shield"
            tone="navy"
          >
            <div className="space-y-2.5 text-xs text-[#526079]">
              <p className="leading-relaxed">
                Arquivos marcados como <strong className="text-[#101828]">Administrativo</strong> ficam visíveis somente para síndico, conselho e gestão autorizada.
              </p>
              <div className="grid gap-2 pt-1">
                <div className="flex items-center gap-2 rounded-xl border border-[#EDF1F7] bg-[#F5F8FC] px-3 py-2 font-semibold text-[#101828]">
                  <Icon name="lock" size={14} className="text-[#1455FF]" />
                  <span>Acesso segmentado por perfil</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#EDF1F7] bg-[#F5F8FC] px-3 py-2 font-semibold text-[#101828]">
                  <Icon name="download" size={14} className="text-[#1455FF]" />
                  <span>Downloads auditados por data</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#EDF1F7] bg-[#F5F8FC] px-3 py-2 font-semibold text-[#101828]">
                  <Icon name="refresh" size={14} className="text-[#1455FF]" />
                  <span>Histórico de versões preservado</span>
                </div>
              </div>
            </div>
          </InternalSectionCard>
        </aside>
      </div>
    </InternalPageLayout>
  );
}
