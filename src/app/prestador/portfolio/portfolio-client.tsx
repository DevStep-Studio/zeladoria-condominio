"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { updateProviderStorefrontAction } from "@/lib/actions/prestador";

interface PortfolioItem {
  url: string;
  caption: string;
  title?: string;
  category?: string;
  date?: string;
}

export function PortfolioClient({ vendor }: { vendor: any }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    Array.isArray(vendor?.portfolio) ? vendor.portfolio : []
  );
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de Adicionar Foto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newCategory, setNewCategory] = useState(vendor?.category || "Geral");
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            } else {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    setIsCompressing(true);
    try {
      const dataUrl = await compressFile(file);
      setNewUrl(dataUrl);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      alert("Falha ao processar e comprimir a imagem.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveItem = () => {
    if (!newUrl) {
      alert("Por favor, selecione uma foto.");
      return;
    }

    const newItem: PortfolioItem = {
      url: newUrl,
      title: newTitle.trim() || "Trabalho Realizado",
      caption: newCaption.trim() || newTitle.trim() || "Serviço finalizado com garantia",
      category: newCategory,
      date: new Date().toLocaleDateString("pt-BR"),
    };

    const updated = [newItem, ...portfolio];
    setPortfolio(updated);
    setIsAddModalOpen(false);
    setNewUrl("");
    setNewTitle("");
    setNewCaption("");

    startTransition(async () => {
      await updateProviderStorefrontAction({ portfolio: updated });
      setSuccessMsg("Novo trabalho adicionado ao portfólio com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!confirm("Deseja remover esta foto do seu portfólio?")) return;
    const updated = portfolio.filter((_, i) => i !== index);
    setPortfolio(updated);

    startTransition(async () => {
      await updateProviderStorefrontAction({ portfolio: updated });
      setSuccessMsg("Trabalho removido do portfólio.");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  const handleSetCover = (url: string) => {
    startTransition(async () => {
      await updateProviderStorefrontAction({ coverUrl: url });
      setSuccessMsg("Foto de capa do perfil atualizada!");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Portfólio de Trabalhos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Adicione fotos reais de serviços executados para aumentar a credibilidade e confiança dos moradores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Icon name="plus" size={15} />
          <span>Adicionar Trabalho</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid de Trabalhos */}
      {portfolio.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-[#0055D4] flex items-center justify-center mx-auto">
            <Icon name="camera" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Nenhum trabalho cadastrado ainda</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Perfis com fotos de trabalhos reais recebem mais atenção dos moradores. Clique no botão abaixo para adicionar suas primeiras fotos.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0055D4] text-white text-xs font-bold hover:bg-[#0047BA] shadow-xs"
          >
            Adicionar primeira foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-colors flex flex-col"
            >
              <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.title || item.caption}
                  className="w-full h-full object-cover"
                />
                {item.category && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                    {item.category}
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {item.title || item.caption}
                  </h4>
                  {item.caption && item.caption !== item.title && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                  {item.date && (
                    <span className="text-[11px] text-slate-400 block mt-2">
                      Concluído em: {item.date}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSetCover(item.url)}
                    className="text-[11px] font-bold text-[#0055D4] hover:underline"
                  >
                    Definir como capa
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Excluir trabalho"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar Trabalho */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Adicionar Trabalho ao Portfólio
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Foto Preview & Upload */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Foto do Trabalho
                </label>
                {newUrl ? (
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewUrl("")}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors shadow-xs"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-[#0070F3] rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-600 hover:bg-slate-100/50 transition-colors"
                  >
                    <Icon name="camera" size={24} className="text-[#0055D4]" />
                    <span className="text-xs font-bold text-slate-800">
                      {isCompressing ? "Otimizando imagem..." : "Selecionar foto da galeria"}
                    </span>
                    <span className="text-[11px] text-slate-400">JPG, PNG ou WebP</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Título do Trabalho
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Instalação de quadro de distribuição com DR"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              {/* Descrição Curta */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Ex.: Substituição completa de fiação e disjuntores antigos com teste de carga."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex.: Elétrica, Iluminação, Hidráulica"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={!newUrl || isPending}
                className="px-4 py-2 text-xs font-bold bg-[#0055D4] hover:bg-[#0047BA] text-white rounded-xl shadow-xs transition-colors disabled:opacity-40"
              >
                Salvar no portfólio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
