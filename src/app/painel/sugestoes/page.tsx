"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";

type SuggestionStatus = "recebida" | "em_analise" | "aceita" | "recusada" | "concluida";

type Suggestion = {
  id: number;
  title: string;
  category: string;
  description: string;
  status: SuggestionStatus;
  date: string;
  unit: string;
  upvotes: number;
  feedbackAdmin?: string;
};

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    title: "Instalação de ponto de recarga para carros elétricos",
    category: "Sustentabilidade",
    description: "Proponho a instalação de 2 estações de recarga compartilhada na garagem do subsolo com medição individualizada por tag.",
    status: "em_analise",
    date: "28/08/2026",
    unit: "Torre A · Apto 302",
    upvotes: 24,
    feedbackAdmin: "Orçamento preliminar solicitado para a assembleia de outubro.",
  },
  {
    id: 2,
    title: "Lixeira seletiva orgânica na praça central",
    category: "Melhorias",
    description: "Colocar lixeiras diferenciadas próximas aos bancos da praça central para incentivar o descarte correto.",
    status: "aceita",
    date: "15/08/2026",
    unit: "Torre B · Apto 104",
    upvotes: 18,
    feedbackAdmin: "Aprovado pela administração. Pedido em processo de compra.",
  },
  {
    id: 3,
    title: "Horta comunitária com composteira",
    category: "Áreas Comuns",
    description: "Aproveitar o canteiro desocupado ao lado do parquinho para criar uma horta com ervas e temperos para os moradores.",
    status: "concluida",
    date: "02/08/2026",
    unit: "Torre A · Apto 501",
    upvotes: 35,
    feedbackAdmin: "Horta implantada com auxílio da equipe de jardinagem!",
  },
];

const CATEGORIES = [
  "Melhorias",
  "Sustentabilidade",
  "Convivência",
  "Segurança",
  "Áreas Comuns",
  "Outros",
];

const STATUS_MAP: Record<SuggestionStatus, { label: string; bg: string; text: string; border: string }> = {
  recebida: { label: "Recebida", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  em_analise: { label: "Em análise", bg: "bg-blue-50", text: "text-[#0070F3]", border: "border-blue-200" },
  aceita: { label: "Aceita", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  recusada: { label: "Recusada", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  concluida: { label: "Concluída", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export default function SugestoesPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [filterStatus, setFilterStatus] = useState<string>("todas");
  const [showNewModal, setShowNewModal] = useState(false);

  // New suggestion form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Melhorias");
  const [description, setDescription] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filtered = suggestions.filter((s) => {
    if (filterStatus !== "todas" && s.status !== filterStatus) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newSug: Suggestion = {
      id: Date.now(),
      title,
      category,
      description,
      status: "recebida",
      date: "Hoje",
      unit: "Minha Unidade",
      upvotes: 1,
    };

    setSuggestions([newSug, ...suggestions]);
    setTitle("");
    setDescription("");
    setShowNewModal(false);
    setFeedbackMsg("Sugestão enviada com sucesso! O síndico e o conselho foram notificados.");
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleUpvote = (id: number) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Sugestões & Melhorias
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Participe ativamente da gestão sugerindo ideias para o condomínio
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#0070F3] hover:bg-[#005FD6] text-white px-4 py-2 text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Icon name="plus" size={14} />
          <span>Nova sugestão</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="font-bold underline">
            OK
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {[
          { key: "todas", label: "Todas" },
          { key: "recebida", label: "Recebidas" },
          { key: "em_analise", label: "Em análise" },
          { key: "aceita", label: "Aceitas" },
          { key: "concluida", label: "Concluídas" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterStatus(f.key)}
            className={`rounded-[8px] px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === f.key
                ? "bg-[#0070F3] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((sug) => {
          const st = STATUS_MAP[sug.status];

          return (
            <div
              key={sug.id}
              className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {sug.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sug.date} · {sug.unit}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                    {sug.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sug.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                    {st.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpvote(sug.id)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition-colors"
                    title="Apoiar esta sugestão"
                  >
                    <span>👍</span>
                    <span>{sug.upvotes}</span>
                  </button>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Evolução da Sugestão:
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  {["Recebida", "Em análise", "Aceita", "Concluída"].map((step, idx) => {
                    const stepKey = step.toLowerCase().replace(" ", "_");
                    const isDone =
                      (sug.status === "concluida") ||
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
                        <span className={isDone ? "font-bold text-slate-800" : "text-slate-400"}>
                          {step}
                        </span>
                        {idx < 3 && <span className="text-slate-300">→</span>}
                      </div>
                    );
                  })}
                </div>

                {sug.feedbackAdmin && (
                  <div className="mt-2.5 rounded-[8px] bg-blue-50/50 p-2.5 border border-blue-100 text-xs text-slate-700">
                    <span className="font-bold text-[#0070F3] block text-[11px]">Retorno da Administração:</span>
                    {sug.feedbackAdmin}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Suggestion Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowNewModal(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0F172A]">
                Enviar Sugestão
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100"
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
                  placeholder="Ex.: Instalação de bicicletário no subsolo"
                  required
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
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
                  placeholder="Explique o motivo, benefícios e como a melhoria pode ser implementada..."
                  required
                  className="w-full rounded-[8px] border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0070F3] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-ghost btn-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                >
                  Enviar sugestão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
