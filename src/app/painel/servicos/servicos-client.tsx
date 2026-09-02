"use client";

import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { dateTimeBR, money } from "@/lib/utils";
import {
  createServiceRequestAction,
  updateServiceStatusAction,
  rateServiceAction,
} from "@/lib/actions/servicos";

type ServiceItem = {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string | null;
  preferredTime: string | null;
  vendorId: number | null;
  assignedToId: number | null;
  scheduledFor: string | null;
  costCents: number | null;
  report: string | null;
  rating: number | null;
  ratingComment: string | null;
  createdAt: Date | null;
  closedAt: Date | null;
  openedById: number | null;
  unitNumber: string | null;
  blockName: string | null;
  requesterName: string | null;
};

type Vendor = {
  id: number;
  name: string;
  category: string;
  phone: string | null;
};

type Staff = {
  id: number;
  name: string;
};

const CATEGORY_MAP: Record<string, { label: string; icon: IconName; color: string }> = {
  eletrica: { label: "Elétrica", icon: "wrench", color: "bg-amber-50 text-amber-700 border-amber-200" },
  hidraulica: { label: "Hidráulica", icon: "wrench", color: "bg-blue-50 text-blue-700 border-blue-200" },
  limpeza: { label: "Limpeza", icon: "sparkles", color: "bg-teal-50 text-teal-700 border-teal-200" },
  manutencao: { label: "Manutenção", icon: "wrench", color: "bg-slate-100 text-slate-700 border-slate-200" },
  seguranca: { label: "Segurança", icon: "shield", color: "bg-purple-50 text-purple-700 border-purple-200" },
  jardinagem: { label: "Jardinagem", icon: "sparkles", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pintura: { label: "Pintura", icon: "wrench", color: "bg-rose-50 text-rose-700 border-rose-200" },
  elevador: { label: "Elevador", icon: "building", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  portao: { label: "Portão", icon: "shield", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  estrutura: { label: "Estrutura", icon: "building", color: "bg-orange-50 text-orange-700 border-orange-200" },
  outros: { label: "Outros", icon: "wrench", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  solicitado: { label: "Solicitado", color: "bg-slate-100 text-slate-700 border-slate-200" },
  em_analise: { label: "Em Análise", color: "bg-amber-50 text-amber-700 border-amber-200" },
  aprovado: { label: "Aprovado", color: "bg-teal-50 text-teal-700 border-teal-200" },
  agendado: { label: "Agendado", color: "bg-blue-50 text-blue-700 border-blue-200" },
  em_execucao: { label: "Em Execução", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  concluido: { label: "Concluído", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelado: { label: "Cancelado", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function ServicosClient({
  services,
  vendors,
  staff,
  role,
  currentUserId,
}: {
  services: ServiceItem[];
  vendors: Vendor[];
  staff: Staff[];
  role: string;
  currentUserId: number;
}) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [search, setSearch] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<ServiceItem | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = services.filter((s) => {
    if (selectedStatus !== "todos" && s.status !== selectedStatus) return false;
    if (
      search &&
      !s.title.toLowerCase().includes(search.toLowerCase()) &&
      !s.code.toLowerCase().includes(search.toLowerCase()) &&
      !s.category.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleRequestService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createServiceRequestAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Solicitação de serviço enviada com sucesso!" });
        setShowRequestModal(false);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao solicitar serviço." });
      }
    });
  };

  const handleUpdateStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedService) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", String(selectedService.id));

    startTransition(async () => {
      const res = await updateServiceStatusAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Serviço atualizado com sucesso!" });
        setSelectedService(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao atualizar serviço." });
      }
    });
  };

  const handleRateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showRatingModal) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", String(showRatingModal.id));
    formData.set("rating", String(ratingValue));

    startTransition(async () => {
      const res = await rateServiceAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Avaliação registrada com sucesso!" });
        setShowRatingModal(null);
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao registrar avaliação." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] flex items-center gap-2.5">
            <Icon name="wrench" size={28} className="text-[#0D9488]" />
            Serviços & Manutenções
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Solicitação de reparos prediais, agendamento de prestadores e controle de atendimento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestModal(true)}
          className="btn-primary btn-sm self-start sm:self-auto"
        >
          <Icon name="plus" size={16} />
          Solicitar Serviço
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

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { key: "todos", label: "Todos" },
              { key: "solicitado", label: "Solicitados" },
              { key: "em_analise", label: "Em Análise" },
              { key: "agendado", label: "Agendados" },
              { key: "em_execucao", label: "Em Execução" },
              { key: "concluido", label: "Concluídos" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatus(tab.key)}
                className={`chip cursor-pointer text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === tab.key
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted)] hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle)]" />
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[var(--color-line)] bg-white pl-8 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:border-[#0D9488] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <h2 className="text-base font-bold text-[var(--color-ink)]">
            Ordens de Serviço ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-muted)]">
            Nenhuma ordem de serviço encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {filtered.map((srv) => {
              const catObj = CATEGORY_MAP[srv.category] ?? CATEGORY_MAP.outros;
              const statusObj = STATUS_BADGES[srv.status] ?? STATUS_BADGES.solicitado;

              return (
                <div
                  key={srv.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`p-2.5 rounded-[10px] shrink-0 border ${catObj.color}`}>
                      <Icon name={catObj.icon} size={20} />
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0D9488]">{srv.code}</span>
                        <span className={`chip text-[11px] ${catObj.color}`}>{catObj.label}</span>
                        <span className={`chip text-[11px] ${statusObj.color}`}>{statusObj.label}</span>
                      </div>

                      <h3 className="text-base font-bold text-[var(--color-ink)]">{srv.title}</h3>
                      <p className="text-xs text-[var(--color-muted)] line-clamp-2">{srv.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-subtle)] pt-1">
                        <span>Local: <strong className="text-[var(--color-ink)]">{srv.location || "Área comum"}</strong></span>
                        {srv.preferredTime ? (
                          <span>Horário preferencial: <strong className="text-[var(--color-ink)]">{srv.preferredTime}</strong></span>
                        ) : null}
                        {srv.scheduledFor ? (
                          <span>Agendado para: <strong className="text-[#0D9488]">{srv.scheduledFor}</strong></span>
                        ) : null}
                        {srv.costCents ? (
                          <span>Custo: <strong className="text-[var(--color-ink)]">{money(srv.costCents)}</strong></span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* If completed & opened by current user & not rated yet, show evaluate button */}
                    {srv.status === "concluido" && srv.openedById === currentUserId && !srv.rating ? (
                      <button
                        type="button"
                        onClick={() => setShowRatingModal(srv)}
                        className="btn-yellow btn-sm"
                      >
                        <Icon name="sparkles" size={14} />
                        Avaliar Atendimento
                      </button>
                    ) : null}

                    {srv.rating ? (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-[8px] border border-amber-200 text-xs font-bold">
                        <span>★ {srv.rating}.0</span>
                      </div>
                    ) : null}

                    {isStaff ? (
                      <button
                        type="button"
                        onClick={() => setSelectedService(srv)}
                        className="btn-ghost btn-sm"
                      >
                        Gerenciar Ordem
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Service Modal */}
      {showRequestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowRequestModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="wrench" size={20} className="text-[#0D9488]" />
                Nova Solicitação de Serviço
              </h2>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestService} className="space-y-4">
              <div>
                <label className="label">Título do Serviço / Reparo *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Troca de disjuntor / Vazamento no registro"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria *</label>
                  <select name="category" className="input" defaultValue="manutencao">
                    <option value="eletrica">Elétrica</option>
                    <option value="hidraulica">Hidráulica</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="seguranca">Segurança</option>
                    <option value="jardinagem">Jardinagem</option>
                    <option value="pintura">Pintura</option>
                    <option value="elevador">Elevador</option>
                    <option value="portao">Portão</option>
                    <option value="estrutura">Estrutura</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="label">Urgência *</label>
                  <select name="priority" className="input" defaultValue="media">
                    <option value="baixa">Baixa (Pode aguardar)</option>
                    <option value="media">Média (Padrão)</option>
                    <option value="alta">Alta (Prioritário)</option>
                    <option value="urgente">Urgente (Risco/Dano)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Local Exato no Condomínio</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Ex: Apto 302 - Banheiro da Suíte"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Melhor Horário para Atendimento</label>
                <input
                  type="text"
                  name="preferredTime"
                  placeholder="Ex: Segunda à tarde ou Sábado pela manhã"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Descrição Detalhada do Problema *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Explique o que precisa ser feito com o máximo de detalhes..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Enviando..." : "Enviar Solicitação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Manage Service Modal (Síndico / Staff) */}
      {selectedService ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedService(null)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#0D9488]">{selectedService.code}</span>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">{selectedService.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status Atual</label>
                  <select name="status" className="input" defaultValue={selectedService.status}>
                    <option value="solicitado">Solicitado</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="agendado">Agendado</option>
                    <option value="em_execucao">Em Execução</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="label">Prestador Credenciado</label>
                  <select name="vendorId" className="input" defaultValue={selectedService.vendorId ?? ""}>
                    <option value="">Nenhum / Interno</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Previsão / Data Agendada</label>
                  <input
                    type="date"
                    name="scheduledFor"
                    defaultValue={selectedService.scheduledFor ?? ""}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Custo Estimado (R$ em centavos)</label>
                  <input
                    type="number"
                    name="costCents"
                    defaultValue={selectedService.costCents ?? 0}
                    placeholder="Ex: 15000 para R$ 150,00"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Parecer Técnico / Relatório</label>
                <textarea
                  name="report"
                  rows={2}
                  defaultValue={selectedService.report ?? ""}
                  placeholder="Observações do técnico ou laudo de conclusão..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Mensagem para o Solicitante</label>
                <input
                  type="text"
                  name="comment"
                  placeholder="Ex: Técnico agendado para quinta às 14h."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Atualizando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Resident Rating Modal */}
      {showRatingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowRatingModal(null)}
          />
          <div className="relative w-full max-w-md rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="sparkles" size={20} className="text-amber-500" />
                Avaliar Atendimento do Serviço
              </h2>
              <button
                type="button"
                onClick={() => setShowRatingModal(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleRateService} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">{showRatingModal.title}</p>
                <p className="text-xs text-[var(--color-muted)]">Código: {showRatingModal.code}</p>
              </div>

              <div>
                <label className="label">Nota de Satisfação (1 a 5 Estrelas)</label>
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
                <label className="label">Comentário / Feedback</label>
                <textarea
                  name="ratingComment"
                  rows={3}
                  placeholder="Como foi o atendimento do profissional? Ficou satisfeito com o resultado?"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(null)}
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
