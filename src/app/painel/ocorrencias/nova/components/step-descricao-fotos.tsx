"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import type { CategoryDefinition, EmergencySignal } from "@/lib/services/occurrence-inference";

const MAX_PHOTOS = 4;

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1120;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) {
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
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface StepDescricaoFotosProps {
  description: string;
  onChangeDescription: (val: string) => void;
  category: CategoryDefinition;
  onOpenCategoryPicker: () => void;
  photos: string[];
  onAddPhotos: (newPhotos: string[]) => void;
  onRemovePhoto: (index: number) => void;
  emergency: EmergencySignal;
  onOpenEmergencyModal: () => void;
  onNext: () => void;
}

export function StepDescricaoFotos({
  description,
  onChangeDescription,
  category,
  onOpenCategoryPicker,
  photos,
  onAddPhotos,
  onRemovePhoto,
  emergency,
  onOpenEmergencyModal,
  onNext,
}: StepDescricaoFotosProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const availableSlots = MAX_PHOTOS - photos.length;
      if (availableSlots <= 0) return;
      const selected = Array.from(files).slice(0, availableSlots);
      const encoded: string[] = [];

      for (const f of selected) {
        if (!f.type.startsWith("image/")) continue;
        const compressed = await compressImage(f);
        encoded.push(compressed);
      }

      if (encoded.length > 0) {
        onAddPhotos(encoded);
      }
    } catch {
      setPhotoError("Erro ao processar as fotos selecionadas.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const canProceed = description.trim().length >= 4 || photos.length > 0;

  return (
    <div className="space-y-6">
      {/* Banner de Emergência Não-bloqueante */}
      {emergency.isEmergency && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
              <Icon name="alert-triangle" size={18} />
            </span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Isso pode ser uma emergência
              </p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {emergency.reason ? `${emergency.reason}. ` : ""}
                Se houver perigo imediato, acione a portaria ou autoridades competentes.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenEmergencyModal}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  Ver contatos de emergência
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pergunta Principal: O que aconteceu? */}
      <div>
        <label
          htmlFor="ocorrencia-desc"
          className="block text-sm sm:text-base font-bold text-slate-900 mb-1"
        >
          O que aconteceu?
        </label>
        <p className="text-xs text-slate-500 mb-2.5">
          Conte o problema com suas palavras. O Zeladoria organiza o restante para você.
        </p>

        <textarea
          id="ocorrencia-desc"
          rows={5}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Ex.: A lâmpada do corredor está queimada desde ontem e o local está muito escuro."
          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0070F3] transition-colors leading-relaxed shadow-2xs resize-y"
          autoFocus
        />
      </div>

      {/* Categoria Sugerida (Discreta, sem dominar a tela) */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Categoria sugerida:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0055D4] shadow-2xs truncate">
            <Icon name={category.icon as IconName} size={14} className="text-[#0055D4]" />
            <span>{category.label}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCategoryPicker}
          className="text-xs font-bold text-[#0070F3] hover:text-[#0055D4] hover:underline px-2 py-1 shrink-0 transition-colors"
        >
          Alterar
        </button>
      </div>

      {/* Upload de Fotos com Destaque */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800">
            Adicionar foto (opcional)
          </label>
          <span className="text-[11px] text-slate-400">
            {photos.length}/{MAX_PHOTOS} adicionadas
          </span>
        </div>

        {/* Thumbnails das Fotos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            {photos.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-xs"
                  title="Remover foto"
                >
                  <Icon name="x" size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botões de Ação para Fotos */}
        {photos.length < MAX_PHOTOS && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={photoBusy}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            >
              <Icon name="camera" size={18} className="text-[#0055D4]" />
              <span>Tirar foto</span>
            </button>

            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={photoBusy}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            >
              <Icon name="folder" size={18} className="text-slate-500" />
              <span>Escolher da galeria</span>
            </button>
          </div>
        )}

        {photoBusy && (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-[#0070F3] border-t-transparent animate-spin" />
            Otimizando imagem...
          </p>
        )}
        {photoError && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">{photoError}</p>
        )}

        {/* Inputs Ocultos */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* Botão de Avanço */}
      <div className="pt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || photoBusy}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>Continuar para localização</span>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
