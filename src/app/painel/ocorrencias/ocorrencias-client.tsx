"use client";

import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";
import {
  createOccurrenceAction,
  updateOccurrenceStatusAction,
  addOccurrenceCommentAction,
  rateOccurrenceAction,
} from "@/lib/actions/ocorrencias";

type OccurrenceItem = {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  visibility: string;
  status: string;
  exactLocation: string | null;
  actionsTaken: string | null;
  residentRating: number | null;
  residentComment: string | null;
  createdAt: Date | null;
  occurredAt: Date | null;
  resolvedAt: Date | null;
  reportedById: number | null;
  reporterName: string | null;
  unitNumber: string | null;
  blockName: string | null;
};

type CommentItem = {
  id: number;
  occurrenceId: number;
  body: string;
  createdAt: Date | null;
  userName: string | null;
  userId: number | null;
};

const CATEGORIES: { key: string; label: string; icon: IconName }[] = [
  { key: "todas", label: "Todas", icon: "book" },
  { key: "ruido", label: "Barulho / Ruído", icon: "megaphone" },
  { key: "vazamento", label: "Vazamento / Hidráulica", icon: "wrench" },
  { key: "infiltracao", label: "Infiltração", icon: "building" },
  { key: "elevador", label: "Elevador", icon: "building" },
  { key: "portao", label: "Portão / Garagem", icon: "shield" },
  { key: "limpeza", label: "Limpeza", icon: "sparkles" },
  { key: "seguranca", label: "Segurança", icon: "shield" },
  { key: "area_comum", label: "Área Comum / Piscina", icon: "sparkles" },
  { key: "iluminacao", label: "Iluminação", icon: "wrench" },
  { key: "jardinagem", label: "Jardinagem", icon: "sparkles" },
  { key: "obras", label: "Obras / Reformas", icon: "truck" },
  { key: "outros", label: "Outros", icon: "book" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  recebida: { label: "Recebida", color: "bg-slate-100 text-slate-700 border-slate-200" },
  em_analise: { label: "Em Análise", color: "bg-amber-50 text-amber-700 border-amber-200" },
  em_execucao: { label: "Em Execução", color: "bg-blue-50 text-blue-700 border-blue-200" },
  aguardando_morador: { label: "Aguardando Morador", color: "bg-purple-50 text-purple-700 border-purple-200" },
  resolvida: { label: "Resolvida", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-slate-100 text-slate-700" },
  media: { label: "Média", color: "bg-blue-50 text-blue-700 border-blue-200" },
  alta: { label: "Alta", color: "bg-amber-50 text-amber-700 border-amber-200" },
  urgente: { label: "Urgente", color: "bg-rose-50 text-rose-700 border-rose-200 font-bold" },
};

export function OcorrenciasClient({
  occurrences,
  comments,
  role,
  currentUserId,
}: {
  occurrences: OccurrenceItem[];
  comments: CommentItem[];
  role: string;
  currentUserId: number;
}) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedStatus, setSelectedStatus] = useState("todas");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeOccurrence, setActiveOccurrence] = useState<OccurrenceItem | null>(null);
  const [showRateModal, setShowRateModal] = useState<OccurrenceItem | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [newCommentText, setNewCommentText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = occurrences.filter((occ) => {
    if (selectedCategory !== "todas" && occ.category !== selectedCategory) return false;
    if (selectedStatus !== "todas" && occ.status !== selectedStatus) return false;
    if (
      search &&
      !occ.title.toLowerCase().includes(search.toLowerCase()) &&
      !occ.code.toLowerCase().includes(search.toLowerCase()) &&
      !occ.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateOccurrence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createOccurrenceAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Ocorrência registrada com sucesso!" });
        setShowCreateModal(false);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao registrar ocorrência." });
      }
    });
  };

  const handleUpdateStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeOccurrence) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", String(activeOccurrence.id));

    startTransition(async () => {
      const res = await updateOccurrenceStatusAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Ocorrência atualizada com sucesso!" });
        setActiveOccurrence(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao atualizar ocorrência." });
      }
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOccurrence || !newCommentText.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("occurrenceId", String(activeOccurrence.id));
      formData.set("body", newCommentText);
      const res = await addOccurrenceCommentAction(formData);
      if (res?.success) {
        setNewCommentText("");
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao enviar mensagem." });
      }
    });
  };

  const handleRateOccurrence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showRateModal) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", String(showRateModal.id));
    formData.set("rating", String(ratingValue));

    startTransition(async () => {
      const res = await rateOccurrenceAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Avaliação registrada com sucesso!" });
        setShowRateModal(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao enviar avaliação." });
      }
    });
  };

  const occurrenceCommentsList = activeOccurrence
    ? comments.filter((c) => c.occurrenceId === activeOccurrence.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] flex items-center gap-2.5">
            <Icon name="book" size={28} className="text-amber-500" />
            Livro de Ocorrências
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Registro formal de incidentes, problemas prediais, sugestões e linha do tempo de resolução.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary btn-sm self-start sm:self-auto"
        >
          <Icon name="plus" size={16} />
          Registrar Ocorrência
        </button>
      </div>

      {/* Feedback banner */}
      {feedback ? (
        <div
          className={`p-4 rounded-[12px] text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-75"
          >
            Fechar
          </button>
        </div>
      ) : null}

      {/* Control bar: Categories and Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`chip cursor-pointer text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted)] hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle)]" />
            <input
              type="text"
              placeholder="Buscar por protocolo, título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[var(--color-line)] bg-white pl-8 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:border-[#0D9488] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Occurrences List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <h2 className="text-base font-bold text-[var(--color-ink)]">
            Ocorrências Registradas ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-muted)]">
            Nenhuma ocorrência encontrada para os filtros informados.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {filtered.map((occ) => {
              const statusObj = STATUS_MAP[occ.status] ?? STATUS_MAP.recebida;
              const severityObj = SEVERITY_MAP[occ.severity] ?? SEVERITY_MAP.media;

              return (
                <div
                  key={occ.id}
                  onClick={() => setActiveOccurrence(occ)}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] cursor-pointer transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0D9488]">{occ.code}</span>
                      <span className={`chip text-[11px] ${statusObj.color}`}>{statusObj.label}</span>
                      <span className={`chip text-[11px] ${severityObj.color}`}>{severityObj.label}</span>
                      {occ.visibility === "sigilosa" ? (
                        <span className="chip bg-purple-50 text-purple-700 border-purple-200 text-[11px]">
                          Sigilosa
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-base font-bold text-[var(--color-ink)]">{occ.title}</h3>
                    <p className="text-xs text-[var(--color-muted)] line-clamp-2">{occ.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-subtle)] pt-1">
                      <span>Local: <strong className="text-[var(--color-ink)]">{occ.exactLocation || "Área comum"}</strong></span>
                      <span>Registrado por: <strong className="text-[var(--color-ink)]">{occ.reporterName ?? "Morador"} {occ.unitNumber ? `(Unid. ${occ.unitNumber})` : ""}</strong></span>
                      <span>{occ.createdAt ? dateTimeBR(occ.createdAt) : "Hoje"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {occ.status === "resolvida" && occ.reportedById === currentUserId && !occ.residentRating ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRateModal(occ);
                        }}
                        className="btn-yellow btn-sm"
                      >
                        <Icon name="sparkles" size={14} />
                        Avaliar Resolução
                      </button>
                    ) : null}

                    {occ.residentRating ? (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-[8px] border border-amber-200 text-xs font-bold">
                        <span>★ {occ.residentRating}.0</span>
                      </div>
                    ) : null}

                    <span className="text-xs font-bold text-[#0D9488]">Linha do Tempo →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Occurrence Modal */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="book" size={20} className="text-amber-500" />
                Registrar Nova Ocorrência
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOccurrence} className="space-y-4">
              <div>
                <label className="label">Título / Assunto da Ocorrência *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Barulho excessivo após às 22h / Vazamento no teto da garagem"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria *</label>
                  <select name="category" className="input" defaultValue="ruido">
                    <option value="ruido">Barulho / Ruído</option>
                    <option value="vazamento">Vazamento / Hidráulica</option>
                    <option value="infiltracao">Infiltração</option>
                    <option value="elevador">Elevador</option>
                    <option value="portao">Portão / Garagem</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="seguranca">Segurança</option>
                    <option value="area_comum">Área Comum / Piscina</option>
                    <option value="iluminacao">Iluminação</option>
                    <option value="jardinagem">Jardinagem</option>
                    <option value="obras">Obras / Reformas</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="label">Nível de Urgência *</label>
                  <select name="severity" className="input" defaultValue="media">
                    <option value="baixa">Baixa (Sugestão/Reclamação leve)</option>
                    <option value="media">Média (Padrão)</option>
                    <option value="alta">Alta (Problema relevante)</option>
                    <option value="urgente">Urgente (Dano grave / Risco)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Localização Exata no Condomínio</label>
                <input
                  type="text"
                  name="exactLocation"
                  placeholder="Ex: Bloco B, Corredor do 4º Andar ou Vaga 12"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Visibilidade / Sigilo</label>
                <select name="visibility" className="input" defaultValue="publica">
                  <option value="publica">Pública (Visível no painel geral do condomínio)</option>
                  <option value="sigilosa">Sigilosa (Visível apenas para você e a administração)</option>
                </select>
              </div>

              <div>
                <label className="label">Descrição Detalhada do Fato *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Descreva detalhadamente o ocorrido..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Registrando..." : "Registrar Ocorrência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Occurrence Timeline & Details Modal */}
      {activeOccurrence ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setActiveOccurrence(null)}
          />
          <div className="relative w-full max-w-2xl rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0D9488]">{activeOccurrence.code}</span>
                  <span className={`chip text-[10px] ${STATUS_MAP[activeOccurrence.status]?.color}`}>
                    {STATUS_MAP[activeOccurrence.status]?.label}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--color-ink)] mt-1">{activeOccurrence.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveOccurrence(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Occurrence summary info */}
            <div className="p-4 rounded-[12px] bg-[var(--color-surface-muted)] space-y-2 text-xs">
              <p className="text-[var(--color-ink)] text-sm">{activeOccurrence.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-line)] text-[var(--color-muted)]">
                <p>Local: <strong className="text-[var(--color-ink)]">{activeOccurrence.exactLocation || "Área comum"}</strong></p>
                <p>Registrado em: <strong className="text-[var(--color-ink)]">{activeOccurrence.createdAt ? dateTimeBR(activeOccurrence.createdAt) : "Hoje"}</strong></p>
                {activeOccurrence.actionsTaken ? (
                  <p className="col-span-2 text-[#0D9488]">Ações tomadas: <strong>{activeOccurrence.actionsTaken}</strong></p>
                ) : null}
              </div>
            </div>

            {/* Staff Status Update Form */}
            {isStaff ? (
              <form onSubmit={handleUpdateStatus} className="p-4 rounded-[12px] border border-teal-200 bg-teal-50/50 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Ações da Administração</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Alterar Status</label>
                    <select name="status" className="input" defaultValue={activeOccurrence.status}>
                      <option value="recebida">Recebida</option>
                      <option value="em_analise">Em Análise</option>
                      <option value="em_execucao">Em Execução</option>
                      <option value="aguardando_morador">Aguardando Morador</option>
                      <option value="resolvida">Resolvida</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Ações Tomadas / Resolução</label>
                    <input
                      type="text"
                      name="actionsTaken"
                      defaultValue={activeOccurrence.actionsTaken ?? ""}
                      placeholder="Ex: Zelador vistoriou e notificou o condômino."
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                    {isPending ? "Atualizando..." : "Salvar Status"}
                  </button>
                </div>
              </form>
            ) : null}

            {/* Timeline Comments */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="clock" size={16} className="text-[#0D9488]" />
                Linha do Tempo de Atendimento ({occurrenceCommentsList.length})
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {occurrenceCommentsList.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)] italic">Nenhum comentário ou atualização registrado ainda.</p>
                ) : (
                  occurrenceCommentsList.map((comm) => (
                    <div key={comm.id} className="p-3 rounded-[10px] bg-slate-50 border border-[var(--color-line)] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[var(--color-muted)]">
                        <strong className="text-[var(--color-ink)]">{comm.userName ?? "Condômino"}</strong>
                        <span>{comm.createdAt ? dateTimeBR(comm.createdAt) : "Agora"}</span>
                      </div>
                      <p className="text-[var(--color-ink)]">{comm.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escreva uma mensagem na linha do tempo..."
                  className="input text-xs"
                />
                <button type="submit" disabled={isPending || !newCommentText.trim()} className="btn-primary btn-sm shrink-0">
                  <Icon name="send" size={14} />
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resident Rating Modal */}
      {showRateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowRateModal(null)}
          />
          <div className="relative w-full max-w-md rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="sparkles" size={20} className="text-amber-500" />
                Avaliar Resolução da Ocorrência
              </h2>
              <button
                type="button"
                onClick={() => setShowRateModal(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleRateOccurrence} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">{showRateModal.title}</p>
                <p className="text-xs text-[var(--color-muted)]">Protocolo: {showRateModal.code}</p>
              </div>

              <div>
                <label className="label">Nota de Resolução (1 a 5 Estrelas)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className={`h-11 w-11 rounded-[10px] text-lg font-black border transition-all ${
                        ratingValue >= star
                          ? "bg-amber-400 text-slate-900 border-amber-500 shadow-xs"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Feedback para o Síndico</label>
                <textarea
                  name="residentComment"
                  rows={3}
                  placeholder="O problema foi resolvido satisfatoriamente? Ficou satisfeito com o prazo?"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(null)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-yellow"
                >
                  {isPending ? "Enviando..." : "Enviar Avaliação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
