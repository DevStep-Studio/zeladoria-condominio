"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import {
  CATEGORIES_LIST,
  type ItemCategory,
  type ItemType,
  type LostAndFoundItem,
} from "@/types/lost-and-found";

interface RegisterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<LostAndFoundItem, "id" | "status">) => void;
  currentUserName: string;
  currentUserUnit?: string;
}

export function RegisterItemModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserName,
  currentUserUnit,
}: RegisterItemModalProps) {
  const [type, setType] = useState<ItemType>("FOUND");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Chaves");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll lock and ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setType("FOUND");
      setTitle("");
      setCategory("Chaves");
      setDate(new Date().toISOString().split("T")[0]);
      setLocation("");
      setDescription("");
      setImageUrl("");
      setImagePreview(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("A imagem selecionada excede o limite máximo de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Por favor, informe o título ou nome do item.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Por favor, especifique o local onde foi encontrado ou visto pela última vez.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Por favor, descreva as características do item com detalhes.");
      return;
    }

    setIsSubmitting(true);

    // Formata a data para formato amigável (DD/MM/AAAA)
    let formattedDate = date;
    if (date.includes("-")) {
      const parts = date.split("-");
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    try {
      onSubmit({
        type,
        title: title.trim(),
        category,
        date: formattedDate,
        location: location.trim(),
        description: description.trim(),
        imageUrl: imagePreview || imageUrl || undefined,
        reportedBy: currentUserName || "Morador",
        unit: currentUserUnit || "Condomínio",
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-100 my-8">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0070F3] border border-blue-100">
              <Icon name="tag" size={18} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Registrar Item
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Achados e Perdidos do Condomínio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Fechar (Esc)"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <Icon name="alert-triangle" size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Seletor de Tipo (Radio Buttons visuais) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Tipo de Registro *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  type === "FOUND"
                    ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="FOUND"
                  checked={type === "FOUND"}
                  onChange={() => setType("FOUND")}
                  className="sr-only"
                />
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    type === "FOUND"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon name="check-circle" size={16} />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Achei um item
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    Item encontrado
                  </span>
                </div>
              </label>

              <label
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  type === "LOST"
                    ? "border-amber-500 bg-amber-50/50 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="LOST"
                  checked={type === "LOST"}
                  onChange={() => setType("LOST")}
                  className="sr-only"
                />
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    type === "LOST"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon name="search" size={16} />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Perdi um item
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    Procurando pertence
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Título do Item */}
          <div>
            <label
              htmlFor="title"
              className="text-xs font-bold text-slate-700 block mb-1.5"
            >
              Título do Item *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chave do carro, Óculos de sol, Fone sem fio..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Categoria e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="category"
                className="text-xs font-bold text-slate-700 block mb-1.5"
              >
                Categoria *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="date"
                className="text-xs font-bold text-slate-700 block mb-1.5"
              >
                Data {type === "FOUND" ? "que foi achado" : "que foi perdido"} *
              </label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label
              htmlFor="location"
              className="text-xs font-bold text-slate-700 block mb-1.5"
            >
              Local onde foi {type === "FOUND" ? "encontrado" : "visto por último"} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Icon name="map-pin" size={15} />
              </span>
              <input
                id="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Piscina, Elevador Social Bloco A, Garagem G1 vaga 32..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label
              htmlFor="description"
              className="text-xs font-bold text-slate-700 block mb-1.5"
            >
              Descrição detalhada *
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes como cor, marca, marcas de uso, chaveiros ou particularidades que ajudem na identificação inequívoca..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Upload de Foto */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Foto do Item (Opcional)
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Imagem anexada
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Pronta para visualização pública
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-[#0070F3] hover:bg-blue-50/30 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="sr-only"
                />
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 group-hover:text-[#0070F3] transition-colors">
                  <Icon name="camera" size={18} />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-700">
                  Clique para enviar ou arraste a foto aqui
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG ou WEBP até 5MB
                </p>
              </div>
            )}
          </div>

          {/* Dica / Aviso Institucional */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-[11px] text-blue-800 leading-relaxed flex items-start gap-2">
            <Icon name="help" size={15} className="shrink-0 text-blue-600 mt-0.5" />
            <div>
              {type === "FOUND" ? (
                <span>
                  <strong>Atenção:</strong> Por favor, encaminhe o objeto encontrado à <strong>portaria ou zeladoria</strong> para custódia segura e devolução assistida ao dono.
                </span>
              ) : (
                <span>
                  <strong>Dica:</strong> Seu registro ficará visível para a portaria, zeladoria e demais moradores, facilitando o contato assim que for localizado.
                </span>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Icon name="check" size={15} />
              <span>{isSubmitting ? "Registrando..." : "Registrar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

