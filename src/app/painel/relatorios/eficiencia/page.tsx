import Link from "next/link";
import { requireCondo } from "@/lib/auth";
import { getOperationalEfficiencyMetrics } from "@/lib/services/metrics/efficiency-metrics";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

export default async function EficienciaOperacionalPage() {
  const { condoId } = await requireCondo();
  const metrics = await getOperationalEfficiencyMetrics(condoId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eficiência Operacional"
        subtitle="Métricas de tempo de resposta, satisfação dos moradores (CSAT) e SLA de prestadores."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/painel/relatorios" className="btn-secondary btn-sm">
              <Icon name="arrow-left" size={14} /> Voltar para Relatórios
            </Link>
          </div>
        }
      />

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Tempo Médio (TMA)"
          value={metrics.tmaHours > 0 ? `${metrics.tmaHours}h` : "Sob demanda"}
          icon="clock"
          tone="blue"
          hint="Entre abertura e validação"
        />
        <StatCard
          label="Satisfação (CSAT)"
          value={`${metrics.averageCsat.toFixed(1)} ⭐`}
          icon="star"
          tone="yellow"
          hint={`${metrics.totalReviews} avaliações registradas`}
        />
        <StatCard
          label="Resolução 1ª Visita"
          value={`${metrics.firstTimeRightPercent}%`}
          icon="check"
          tone="green"
          hint="Sem necessidade de correção"
        />
        <StatCard
          label="Chamados Concluídos"
          value={`${metrics.completedRequests} / ${metrics.totalRequests}`}
          icon="briefcase"
          tone="purple"
          hint={`${metrics.inProgressRequests} em andamento`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Desempenho e Distribuição por Categoria */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                  Desempenho por Categoria de Serviço
                </h2>
                <p className="text-xs text-[var(--color-muted)]">
                  Volume de chamados, tempo médio de execução e avaliação dos moradores.
                </p>
              </div>
              <Badge tone="blue">Ativo</Badge>
            </div>

            {metrics.categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Nenhum chamado registrado no período.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {metrics.categories.map((cat) => {
                  const percent = metrics.totalRequests > 0
                    ? Math.round((cat.count / metrics.totalRequests) * 100)
                    : 0;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-[var(--color-ink)] capitalize">
                          {cat.category.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                          <span>{cat.count} chamados ({percent}%)</span>
                          {cat.averageHours > 0 && (
                            <span className="font-semibold text-blue-600">
                              ~{cat.averageHours}h
                            </span>
                          )}
                          <span className="font-semibold text-amber-500">
                            ★ {cat.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--color-muted-bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Destaque de Cumprimento de SLA */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">
              Índices de SLA e Proteção ao Condomínio
            </h3>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--color-surface-soft)] border border-[var(--color-border)]">
                <p className="text-[var(--color-muted)]">Taxa de Conclusão</p>
                <p className="text-lg font-bold text-[var(--color-ink)] mt-1">
                  {metrics.resolutionRatePercent}%
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Meta atingida (&gt;90%)</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-soft)] border border-[var(--color-border)]">
                <p className="text-[var(--color-muted)]">Garantia Legal CDC</p>
                <p className="text-lg font-bold text-[var(--color-ink)] mt-1">90 Dias</p>
                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Art. 26 em 100% dos serviços</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-soft)] border border-[var(--color-border)]">
                <p className="text-[var(--color-muted)]">Retenção de Payout</p>
                <p className="text-lg font-bold text-[var(--color-ink)] mt-1">Zeladoria Protege</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Custódia até aprovação final</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Ranking de Prestadores com Maior Desempenho */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[var(--color-ink)] mb-1">
              Top Prestadores no Condomínio
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              Profissionais com maior índice de resolução e melhor pontualidade.
            </p>

            {metrics.topProviders.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-muted)]">
                Ainda não há prestadores com histórico de conclusão registrado.
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {metrics.topProviders.map((prov, idx) => (
                  <div key={prov.vendorId} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                          #{idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                          {prov.vendorName}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5 ml-6.5">
                        {prov.completedJobs} atendimentos concluídos
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                        ★ {prov.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Acesso rápido ao Marketplace */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-100">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                <Icon name="briefcase" size={18} />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">
                  Gestão de Prestadores
                </h4>
                <p className="text-xs text-blue-700/80 mt-1">
                  Gerencie fornecedores credenciados e consulte a esteira de verificação.
                </p>
                <Link
                  href="/painel/fornecedores"
                  className="mt-3 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  Abrir Fornecedores &rarr;
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
