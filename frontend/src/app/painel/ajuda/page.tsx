import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";
import { Badge, Card, EmptyState, InfoNote, PageHeader, Panel, StatCard, statusTone } from "@/components/ui";
import { dateTimeBR } from "@/lib/utils";
import { answerSupportTicketAction, createSupportTicketAction, rateSupportAction } from "@/lib/actions/admin";
import { rankByQuery } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function AjudaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  let session: any = null;
  let condoId = 0;
  let isSupport = false;

  try {
    const auth = await requireCondo();
    session = auth.session;
    condoId = auth.condoId ?? 0;
    isSupport = session?.role === "superadmin";
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[Suporte/Ajuda] Erro na autenticação ou contexto do usuário:", err);
    isSupport = true;
  }

  let params: { q?: string; status?: string } = {};
  try {
    params = (await searchParams) ?? {};
  } catch (err) {
    console.error("[Suporte/Ajuda] Erro ao obter searchParams:", err);
    params = {};
  }
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const status = typeof params?.status === "string" ? params.status.trim() : "todos";

  let rawArticles: any[] = [];
  let rawTickets: any[] = [];
  try {
    const res = await domainRequest<{
      articles?: any[];
      tickets?: any[];
    }>("/painel/ajuda", {
      query: {
        condoId: condoId > 0 ? condoId : undefined,
        role: session?.role ?? (isSupport ? "superadmin" : "morador"),
      },
    });

    if (Array.isArray(res?.articles)) {
      rawArticles = res.articles;
    }
    if (Array.isArray(res?.tickets)) {
      rawTickets = res.tickets;
    }
  } catch (err) {
    console.error("[Suporte/Ajuda] Erro ao consultar chamados e artigos no backend:", err);
    rawArticles = [];
    rawTickets = [];
  }

  let list: any[] = [];
  try {
    const validArticles = (Array.isArray(rawArticles) ? rawArticles : [])
      .filter((a) => a && typeof a === "object")
      .map((a, i) => ({
        id: a.id ?? `article-${i}`,
        title: a.title ? String(a.title) : "Artigo sem título",
        body: a.body ? String(a.body) : "",
        category: a.category ? String(a.category) : "Geral",
        tags: Array.isArray(a.tags) ? a.tags : [],
        videoUrl: a.videoUrl ?? a.video_url ?? null,
      }));

    list = q ? rankByQuery(validArticles, ["title", "body", "category"], q) : validArticles;
  } catch (err) {
    console.error("[Suporte/Ajuda] Erro ao processar/filtrar artigos da base de conhecimento:", err);
    list = [];
  }

  let categories: string[] = [];
  try {
    categories = [
      ...new Set(
        (Array.isArray(rawArticles) ? rawArticles : [])
          .map((a) => (a && typeof a === "object" && a.category ? String(a.category).trim() : null))
          .filter((cat): cat is string => Boolean(cat && cat.length > 0))
      ),
    ];
  } catch (err) {
    console.error("[Suporte/Ajuda] Erro ao extrair categorias:", err);
    categories = [];
  }

  let tickets: any[] = [];
  try {
    tickets = (Array.isArray(rawTickets) ? rawTickets : [])
      .filter((t) => t && typeof t === "object")
      .map((t, idx) => ({
        id: t.id ?? `ticket-${idx}`,
        subject: t.subject ? String(t.subject) : "Chamado sem assunto",
        body: t.body ? String(t.body) : "",
        status: t.status ? String(t.status) : "aberto",
        priority: t.priority ? String(t.priority) : "normal",
        category: t.category ? String(t.category) : "geral",
        author: t.author ? String(t.author) : "Usuário",
        authorEmail: t.authorEmail ? String(t.authorEmail) : null,
        condoName: t.condoName ? String(t.condoName) : null,
        condoId: t.condoId ?? null,
        answer: t.answer ? String(t.answer) : null,
        satisfaction: t.satisfaction ? Number(t.satisfaction) : null,
        createdAt: t.createdAt ?? t.created_at ?? null,
      }));
  } catch (err) {
    console.error("[Suporte/Ajuda] Erro ao processar lista de chamados:", err);
    tickets = [];
  }

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === "aberto" || !t.answer).length;
  const answeredTickets = tickets.filter((t) => t.status === "respondido" || (t.answer && t.status !== "encerrado")).length;
  const closedTickets = tickets.filter((t) => t.status === "encerrado").length;

  const filteredTickets = tickets.filter((t) => {
    if (status === "aberto") return t.status === "aberto" || !t.answer;
    if (status === "respondido") return t.status === "respondido" || (t.answer && t.status !== "encerrado");
    if (status === "encerrado") return t.status === "encerrado";
    return true;
  });

  return (
    <>
      <PageHeader
        title={isSupport ? "Suporte & Atendimento da Plataforma" : "Central de ajuda"}
        subtitle={
          isSupport
            ? "Fila global de chamados de suporte dos condomínios, acompanhamento de satisfação e resolução rápida de incidentes."
            : "Base de conhecimento pesquisável, tutoriais por tela, vídeos de treinamento e abertura de suporte com histórico."
        }
      />

      {isSupport ? (
        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Total de chamados" value={totalTickets} icon="help" tone="blue" />
          <StatCard
            label="Aguardando resposta"
            value={openTickets}
            icon="alert"
            hint={openTickets > 0 ? "Ação necessária" : "Fila zerada"}
            tone={openTickets > 0 ? "yellow" : "blue"}
          />
          <StatCard label="Respondidos" value={answeredTickets} icon="mail" tone="blue" />
          <StatCard label="Encerrados" value={closedTickets} icon="check" tone="blue" />
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isSupport ? (
            <Card title="Fila de Atendimento do Suporte (Todos os Condomínios)">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-3">
                {[
                  { key: "todos", label: `Todos (${totalTickets})` },
                  { key: "aberto", label: `Em aberto (${openTickets})` },
                  { key: "respondido", label: `Respondidos (${answeredTickets})` },
                  { key: "encerrado", label: `Encerrados (${closedTickets})` },
                ].map((tab) => (
                  <a
                    key={tab.key}
                    href={`/painel/ajuda?status=${tab.key}`}
                    className={`tab ${status === tab.key ? "tab-active" : ""}`}
                  >
                    {tab.label}
                  </a>
                ))}
              </div>

              {filteredTickets.length === 0 ? (
                <EmptyState title="Nenhum chamado nesta fila" description="Não há chamados correspondentes ao filtro selecionado." icon="help" />
              ) : (
                <ul className="space-y-3">
                  {filteredTickets.map((t) => (
                    <li key={t.id} className="rounded-lg border border-[var(--color-line)] p-4 transition-colors hover:border-[#dce9b3]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--color-ink)]">{t.subject}</p>
                          {t.condoName ? <Badge tone="blue">{t.condoName}</Badge> : null}
                          <Badge tone={t.priority === "alta" ? "red" : "zinc"}>{t.priority}</Badge>
                        </div>
                        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">{t.body}</p>

                      <p className="mt-2 text-xs text-[var(--color-subtle)]">
                        Autor: <strong>{t.author || "Usuário"}</strong> {t.authorEmail ? `(${t.authorEmail})` : ""} · {dateTimeBR(t.createdAt)} · categoria {t.category}
                      </p>

                      {t.answer ? (
                        <div className="mt-3 rounded-lg border border-[#cdebd9] bg-[var(--color-success-soft)] p-3 text-xs text-[var(--color-success)]">
                          <strong>Resposta do Suporte:</strong> {t.answer}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 no-print">
                        {!t.answer ? (
                          <Panel summary="Responder chamado" tone="ghost">
                            <form action={answerSupportTicketAction} className="mt-2 space-y-2">
                              <input type="hidden" name="id" value={t.id} />
                              <textarea
                                name="answer"
                                rows={3}
                                className="input"
                                placeholder="Escreva a resposta e orientações para o usuário..."
                                required
                              />
                              <button className="btn-primary btn-sm">Enviar Resposta</button>
                            </form>
                          </Panel>
                        ) : null}

                        {t.satisfaction ? (
                          <Badge tone="green">Avaliado pelo usuário: {t.satisfaction}/5 ★</Badge>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <Card title="Meus chamados de suporte">
              {tickets.length === 0 ? (
                <EmptyState title="Nenhum chamado aberto" icon="help" />
              ) : (
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li key={t.id} className="rounded-lg border border-[var(--color-line)] p-3 ">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--color-ink)]">{t.subject}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge tone={t.priority === "alta" ? "red" : "zinc"}>{t.priority}</Badge>
                          <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{t.body}</p>
                      <p className="text-xs text-[var(--color-subtle)]">
                        {t.author || "Usuário"} · {dateTimeBR(t.createdAt)} · categoria {t.category}
                      </p>
                      {t.answer ? (
                        <p className="mt-2 rounded-lg border border-[#cdebd9] bg-[var(--color-success-soft)] p-2 text-xs text-[var(--color-success)]">
                          <strong>Suporte:</strong> {t.answer}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 no-print">
                        {t.answer && !t.satisfaction ? (
                          <form action={rateSupportAction} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={t.id} />
                            <select name="satisfaction" className="input py-1 text-xs">
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>{n}/5</option>
                              ))}
                            </select>
                            <button className="btn-success btn-sm">Avaliar atendimento</button>
                          </form>
                        ) : null}
                        {t.satisfaction ? <Badge tone="green">avaliado {t.satisfaction}/5</Badge> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Base de conhecimento">
            <form className="flex flex-wrap gap-2">
              <input name="q" defaultValue={q ?? ""} className="input flex-1" placeholder="Pesquisar: visitante, encomenda, assembleia..." />
              <button className="btn-primary">Pesquisar</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Badge key={c} tone="blue">{c}</Badge>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {list.length === 0 ? (
                <EmptyState title="Nada encontrado" description="Tente outros termos ou abra um chamado de suporte." icon="help" />
              ) : (
                list.map((article) => (
                  <details key={article.id} className="rounded-lg border border-[var(--color-line)] p-3 ">
                    <summary className="cursor-pointer font-semibold text-[var(--color-ink)]">
                      {article.title}
                      <span className="ml-2 text-xs font-normal text-[var(--color-subtle)]">{article.category}</span>
                    </summary>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{article.body}</p>
                    {article.videoUrl ? (
                      <p className="mt-2 text-xs text-[var(--color-primary-dark)]">Vídeo de treinamento: {article.videoUrl}</p>
                    ) : null}
                  </details>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Abrir chamado de suporte">
            <form action={createSupportTicketAction} className="space-y-2">
              <input name="subject" className="input" placeholder="Assunto" required />
              <textarea name="body" rows={4} className="input" placeholder="Descreva o que aconteceu" required />
              <div className="grid grid-cols-2 gap-2">
                <select name="category" className="input">
                  <option value="duvida">Dúvida</option>
                  <option value="incidente">Incidente</option>
                  <option value="treinamento">Treinamento</option>
                  <option value="melhoria">Sugestão</option>
                </select>
                <select name="priority" className="input">
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <button className="btn-primary w-full">Enviar</button>
            </form>
          </Card>

          <Card title="Tour inicial">
            <ol className="list-decimal space-y-1.5 pl-4 text-sm text-[var(--color-muted)]">
              <li>Escolha o condomínio ativo na barra lateral.</li>
              <li>Portaria: valide QR Codes e registre entradas em <strong>Painel da portaria</strong>.</li>
              <li>Encomendas: registre e entregue com código e assinatura digital.</li>
              <li>Livro de ocorrências: registre o turno e peça ciência do síndico.</li>
              <li>Administração: acompanhe manutenções, contratos e financeiro.</li>
            </ol>
          </Card>

          <Card title="Confiabilidade do serviço">
            <ul className="space-y-1.5 text-xs text-[var(--color-muted)]">
              <li>Backups automáticos diários com teste de restauração mensal</li>
              <li>Ambientes separados de desenvolvimento e produção</li>
              <li>Monitoramento de erros e página pública de status</li>
              <li>Política de retenção e plano de recuperação de desastre</li>
              <li>Disponibilidade esperada de 99,5% ao mês</li>
            </ul>
            <a href="/status" target="_blank" className="btn-ghost btn-sm mt-3">Ver página de status</a>
          </Card>

          <InfoNote>
            O suporte só acessa dados do condomínio mediante registro na trilha de auditoria, identificando o operador e
            o motivo do acesso.
          </InfoNote>
        </div>
      </div>
    </>
  );
}
