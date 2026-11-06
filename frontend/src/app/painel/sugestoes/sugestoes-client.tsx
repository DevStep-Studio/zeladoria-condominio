"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icon";
import type { SuggestionItem, SuggestionStatus } from "@/lib/services/sugestoes-storage";

const CATEGORIES = [
  "Melhorias",
  "Sustentabilidade",
  "Convivência",
  "Segurança",
  "Áreas Comuns",
  "Outros",
];

const STATUS_MAP: Record<
  SuggestionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  recebida: {
    label: "Recebida",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  em_analise: {
    label: "Em análise",
    bg: "bg-blue-50",
    text: "text-[#0070F3]",
    border: "border-blue-200",
  },
  aceita: {
    label: "Aceita",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  recusada: {
    label: "Recusada",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  concluida: {
    label: "Concluída",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

interface SugestoesClientProps {
  initialSuggestions: SuggestionItem[];
  userRole?: string;
  userName?: string;
  userUnit?: string;
}

export function SugestoesClient({
  initialSuggestions,
  userRole = "morador",
  userName = "Eduarda Lima",
  userUnit = "Torre A · Apto 302",
}: SugestoesClientProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [filterStatus, setFilterStatus] = useState<string>("todas");
  const [showNewModal, setShowNewModal] = useState(false);
  const [managingItem, setManagingItem] = useState<SuggestionItem | null>(null);

  // Role ativo (com seletor para teste/demonstração imediata)
  const [activeRole, setActiveRole] = useState(userRole.toLowerCase());

  // Form de nova sugestão
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Melhorias");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form de gestão (para Zelador / Síndico)
  const [newStatus, setNewStatus] = useState<SuggestionStatus>("em_analise");
  const [feedbackText, setFeedbackText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Mensagem de feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

  const isStaff = [
    "zelador",
    "sindico",
    "porteiro",
    "superadmin",
    "admin",
    "conselho",
  ].includes(activeRole);

  // Sincronização periódica com API / localStorage
  useEffect(() => {
    async function loadLatest() {
      try {
        const res = await fetch("/api/sugestoes");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setSuggestions(json.data);
            try {
              localStorage.setItem("zc-sugestoes-cache", JSON.stringify(json.data));
            } catch {}
          }
        }
      } catch {
        // Fallback para cache local se offline
        try {
          const cached = localStorage.getItem("zc-sugestoes-cache");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setSuggestions(parsed);
          }
        } catch {}
      }
    }

    loadLatest();
  }, []);

  // Scroll lock and Escape key listener
  useEffect(() => {
    if (!showNewModal && !managingItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNewModal(false);
        setManagingItem(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [showNewModal, managingItem]);

  const filtered = suggestions.filter((s) => {
    if (filterStatus !== "todas" && s.status !== filterStatus) return false;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

    const localNewSug: SuggestionItem = {
      id: Date.now(),
      title: title.trim(),
      category,
      description: description.trim(),
      status: "recebida",
      date: dateStr,
      unit: userUnit,
      upvotes: 1,
      authorName: userName,
    };

    // Atualização otimista imediata
    const updated = [localNewSug, ...suggestions];
    setSuggestions(updated);
    try {
      localStorage.setItem("zc-sugestoes-cache", JSON.stringify(updated));
    } catch {}

    try {
      const res = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSuggestions((prev) => [
            json.data,
            ...prev.filter((i) => i.id !== localNewSug.id),
          ]);
        }
      }
    } catch (err) {
      console.error("Falha ao salvar sugestão no servidor:", err);
    } finally {
      setIsSubmitting(false);
      setTitle("");
      setDescription("");
      setShowNewModal(false);
      setFeedbackMsg({
        text: "Sugestão enviada com sucesso! A zeladoria, o síndico e o conselho foram notificados.",
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleUpvote = async (id: number) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s))
    );

    try {
      await fetch("/api/sugestoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isUpvote: true }),
      });
    } catch {}
  };

  const handleOpenManageModal = (sug: SuggestionItem) => {
    setManagingItem(sug);
    setNewStatus(sug.status);
    setFeedbackText(sug.feedbackAdmin || "");
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingItem) return;

    setIsUpdatingStatus(true);
    const authorLabel = activeRole === "zelador" ? "Zeladoria Predial" : "Administração / Síndico";

    const updatedSug: SuggestionItem = {
      ...managingItem,
      status: newStatus,
      feedbackAdmin: feedbackText.trim() || undefined,
      feedbackAuthor: authorLabel,
      feedbackDate: "Hoje",
    };

    setSuggestions((prev) =>
      prev.map((s) => (s.id === managingItem.id ? updatedSug : s))
    );

    try {
      await fetch("/api/sugestoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: managingItem.id,
          status: newStatus,
          feedbackAdmin: feedbackText.trim(),
        }),
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setIsUpdatingStatus(false);
      setManagingItem(null);
      setFeedbackMsg({
        text: `Sugestão atualizada para "${STATUS_MAP[newStatus].label}" com o retorno da zeladoria registrado!`,
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0070F3] border border-blue-100 shadow-2xs">
              <Icon name="megaphone" size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Sugestões & Melhorias
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Participe ativamente da gestão sugerindo ideias para o condomínio
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Seletor Rápido de Perfil para Teste/Demonstração */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400">Visão:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="font-bold text-slate-700 bg-transparent outline-none cursor-pointer text-xs"
            >
              <option value="morador">Morador</option>
              <option value="zelador">Zelador (Operação)</option>
              <option value="sindico">Síndico / Admin</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            <Icon name="plus" size={15} />
            <span>Nova sugestão</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
              <Icon name="check" size={12} />
            </span>
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* Destaque para o Zelador / Síndico quando logado */}
      {isStaff && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0070F3] text-white shadow-xs shrink-0">
              <Icon name="wrench" size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-blue-950">
                Painel da Zeladoria & Gestão Ativa
              </p>
              <p className="text-[11px] sm:text-xs text-blue-700 font-medium">
                Você tem permissão para responder, atualizar o status e planejar a execução das melhorias sugeridas pelos moradores.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100/80 text-[11px] font-bold text-blue-800 self-start sm:self-auto">
            <Icon name="check-circle" size={13} />
            <span>{suggestions.filter((s) => s.status === "recebida" || s.status === "em_analise").length} aguardando análise</span>
          </span>
        </div>
      )}

      {/* Filters - Minimalista e Fluido */}
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] overflow-x-auto max-w-full">
        {[
          { key: "todas", label: "Todas", count: suggestions.length },
          {
            key: "recebida",
            label: "Recebidas",
            count: suggestions.filter((s) => s.status === "recebida").length,
          },
          {
            key: "em_analise",
            label: "Em análise",
            count: suggestions.filter((s) => s.status === "em_analise").length,
          },
          {
            key: "aceita",
            label: "Aceitas",
            count: suggestions.filter((s) => s.status === "aceita").length,
          },
          {
            key: "concluida",
            label: "Concluídas",
            count: suggestions.filter((s) => s.status === "concluida").length,
          },
        ].map((f) => {
          const isActive = filterStatus === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#1355FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listagem de Sugestões */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0070F3] mb-3">
              <Icon name="megaphone" size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Nenhuma sugestão encontrada
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Não há sugestões com o filtro selecionado no momento.
            </p>
          </div>
        ) : (
          filtered.map((sug) => {
            const st = STATUS_MAP[sug.status];

            return (
              <div
                key={sug.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {sug.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {sug.date} · {sug.unit}
                      </span>
                      {sug.authorName && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          por {sug.authorName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug">
                      {sug.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {sug.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}
                    >
                      {st.label}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Botão de Apoiar (Upvote) */}
                      <button
                        type="button"
                        onClick={() => handleUpvote(sug.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        title="Apoiar esta sugestão"
                      >
                        <Icon name="check" size={13} className="text-emerald-600" />
                        <span>{sug.upvotes}</span>
                      </button>

                      {/* Botão exclusivo para Zelador / Síndico: Gerenciar & Responder */}
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => handleOpenManageModal(sug)}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0070F3] px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
                          title="Atualizar status ou dar retorno da zeladoria"
                        >
                          <Icon name="pencil" size={12} />
                          <span>Responder</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Evolução da Sugestão:
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {["Recebida", "Em análise", "Aceita", "Concluída"].map(
                      (step, idx) => {
                        const isDone =
                          sug.status === "concluida" ||
                          (sug.status === "aceita" && idx <= 2) ||
                          (sug.status === "em_analise" && idx <= 1) ||
                          (sug.status === "recebida" && idx === 0);

                        return (
                          <div key={step} className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isDone ? "bg-[#0070F3]" : "bg-slate-200"
                              }`}
                            />
                            <span
                              className={
                                isDone
                                  ? "font-bold text-slate-800"
                                  : "text-slate-400"
                              }
                            >
                              {step}
                            </span>
                            {idx < 3 && (
                              <span className="text-slate-300">→</span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {sug.feedbackAdmin && (
                    <div className="mt-3 rounded-xl bg-blue-50/70 p-3 border border-blue-100 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0070F3] text-[11px] flex items-center gap-1">
                          <Icon name="check-circle" size={13} />
                          <span>
                            Retorno da {sug.feedbackAuthor || "Zeladoria / Administração"}:
                          </span>
                        </span>
                        {sug.feedbackDate && (
                          <span className="text-[10px] text-slate-400">
                            {sug.feedbackDate}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed font-medium">
                        {sug.feedbackAdmin}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Enviar Sugestão (Morador / Usuários) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0070F3]">
                  <Icon name="megaphone" size={16} />
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Enviar Sugestão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Título da sugestão <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Instalação de ponto de recarga, horta, lixeira..."
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium outline-none focus:border-[#0070F3] cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Descrição detalhada <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o motivo, benefícios para a comunidade e sugestão prática de como implementar..."
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 font-medium outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-blue-100 leading-relaxed resize-none"
                />
              </div>

              <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-[11px] text-blue-800 leading-relaxed flex items-start gap-2">
                <Icon name="help" size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Sua sugestão será enviada diretamente à <strong>equipe de zeladoria e administração</strong> para avaliação de viabilidade técnica e financeira.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Enviando..." : "Enviar sugestão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar e Responder (Zelador / Síndico) */}
      {managingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0070F3]">
                  <Icon name="wrench" size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Retorno da Zeladoria & Gestão
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Atualize a evolução desta sugestão para os moradores
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sugestão do Morador:
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {managingItem.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {managingItem.unit} · {managingItem.category}
              </p>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  Atualizar Status da Sugestão *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SuggestionStatus)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-bold outline-none focus:border-[#0070F3] cursor-pointer"
                >
                  <option value="recebida">Recebida (Aguardando avaliação)</option>
                  <option value="em_analise">Em análise (Zeladoria avaliando viabilidade técnica)</option>
                  <option value="aceita">Aceita (Aprovada para compra/execução)</option>
                  <option value="concluida">Concluída (Implementada com sucesso)</option>
                  <option value="recusada">Recusada (Inviabilidade técnica/financeira)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  Retorno Oficial para os Moradores
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Ex: A equipe de zeladoria já realizou a cotação e o levantamento elétrico no subsolo..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 font-medium outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManagingItem(null)}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isUpdatingStatus ? "Salvando..." : "Salvar e Publicar Retorno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

