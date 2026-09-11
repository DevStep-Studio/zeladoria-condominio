"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { createOccurrenceAction } from "@/lib/actions/ocorrencias";

const CATEGORIES: { label: string; icon: IconName }[] = [
  { label: "Elétrica", icon: "zap" },
  { label: "Hidráulica", icon: "droplet" },
  { label: "Iluminação", icon: "sun" },
  { label: "Elevador", icon: "panel" },
  { label: "Portão", icon: "lock" },
  { label: "Garagem", icon: "truck" },
  { label: "Limpeza", icon: "sparkles" },
  { label: "Segurança", icon: "shield" },
  { label: "Piscina", icon: "activity" },
  { label: "Jardinagem", icon: "globe" },
  { label: "Estrutura", icon: "building" },
  { label: "Vazamento", icon: "droplet" },
  { label: "Infiltração", icon: "droplet" },
  { label: "Ruído", icon: "bell" },
  { label: "Outros", icon: "more" },
];

const MAX_PHOTOS = 4;

// Reduz a imagem no cliente antes de enviar (evita payloads grandes).
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
      resolve(canvas.toDataURL("image/jpeg", 0.62));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function NovaOcorrenciaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Iluminação");

  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const chosen = Array.from(files).slice(0, room);
      const encoded: string[] = [];
      for (const file of chosen) {
        if (!file.type.startsWith("image/")) continue;
        encoded.push(await compressImage(file));
      }
      if (encoded.length) {
        setPhotos((prev) => [...prev, ...encoded]);
      }
    } catch {
      setErrors((prev) => ({ ...prev, photos: "Não foi possível processar a imagem." }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "O título é obrigatório.";
    }
    if (!description.trim()) {
      newErrors.description = "A descrição detalhada é obrigatória.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("exactLocation", location);
    formData.set("category", category.toLowerCase());
    formData.set("severity", "media");
    formData.set("attachments", JSON.stringify(photos));

    startTransition(async () => {
      const res = await createOccurrenceAction(formData);
      if (res?.success) {
        setSuccessMessage("Ocorrência registrada com sucesso!");
        setTimeout(() => {
          router.push("/painel/ocorrencias");
          router.refresh();
        }, 1200);
      } else {
        setErrors({ form: res?.error || "Erro ao registrar ocorrência. Tente novamente." });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/painel/ocorrencias"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0070F3] hover:underline mb-2"
          >
            <Icon name="arrow-left" size={14} />
            <span>Voltar para ocorrências</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Nova ocorrência
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Descreva o problema. Nossa IA vai sugerir categoria e prioridade.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecionando...</span>
        </div>
      )}

      {/* Form Error Notification */}
      {errors.form && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 flex items-center gap-2">
          <Icon name="alert-triangle" size={16} className="text-red-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Main Card Form */}
      <form onSubmit={handleSubmit} className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        {/* Título */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder="Ex.: Lâmpada queimada no corredor"
            className={`w-full rounded-[10px] border px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition-colors ${
              errors.title ? "border-red-500 bg-red-50/30" : "border-slate-200 focus:border-[#0070F3]"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Descrição <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder="Detalhe o problema, quando começou, etc."
            className={`w-full rounded-[10px] border px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition-colors leading-relaxed ${
              errors.description ? "border-red-500 bg-red-50/30" : "border-slate-200 focus:border-[#0070F3]"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Localização */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Localização
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex.: 3º andar, corredor da torre A"
            className="w-full rounded-[10px] border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3] transition-colors"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Categoria <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`flex items-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "border-[#0070F3] bg-blue-50/80 text-[#0070F3] font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    name={cat.icon}
                    size={15}
                    strokeWidth={2}
                    className={`shrink-0 ${active ? "text-[#0070F3]" : "text-slate-400"}`}
                  />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload de Fotos: câmera do celular + galeria, com múltiplas imagens */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Fotos (opcional)
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((src, idx) => (
                <div key={idx} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Foto ${idx + 1} da ocorrência`}
                    className="h-full w-full rounded-[10px] object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700 transition-colors"
                    title="Remover foto"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={photoBusy}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:bg-slate-100/60 hover:border-[#0070F3] transition-colors disabled:opacity-60"
              >
                <Icon name="camera" size={22} className="text-[#0070F3]" />
                <span className="text-xs font-bold text-[#0070F3]">Tirar foto</span>
                <span className="text-[11px] text-slate-400">Abre a câmera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={photoBusy}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:bg-slate-100/60 hover:border-[#0070F3] transition-colors disabled:opacity-60"
              >
                <Icon name="folder" size={22} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Galeria</span>
                <span className="text-[11px] text-slate-400">PNG ou JPG</span>
              </button>
            </div>
          )}

          {photoBusy && (
            <p className="mt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
              Processando imagem...
            </p>
          )}
          {errors.photos && (
            <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.photos}</p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {photos.length}/{MAX_PHOTOS} fotos adicionadas
          </p>

          <input
            ref={cameraInputRef}
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
            ref={galleryInputRef}
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

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/painel/ocorrencias"
            className="rounded-[10px] border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending || photoBusy}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0070F3] hover:bg-[#005FD6] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrar ocorrência</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
