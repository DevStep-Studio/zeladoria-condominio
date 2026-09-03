"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { createOccurrenceAction } from "@/lib/actions/ocorrencias";

const CATEGORIES = [
  "Elétrica",
  "Hidráulica",
  "Iluminação",
  "Elevador",
  "Portão",
  "Garagem",
  "Limpeza",
  "Segurança",
  "Piscina",
  "Jardinagem",
  "Estrutura",
  "Vazamento",
  "Infiltração",
  "Ruído",
  "Outros",
];

export default function NovaOcorrenciaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Iluminação");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-[8px] border px-3 py-2 text-xs font-semibold text-left transition-all ${
                  category === cat
                    ? "border-[#0070F3] bg-blue-50/80 text-[#0070F3] font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Upload de Fotos com Preview e Remoção */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Fotos (opcional)
          </label>

          {previewUrl ? (
            <div className="relative inline-block mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview da ocorrência"
                className="h-32 w-32 rounded-[10px] object-cover border border-slate-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700 transition-colors"
                title="Remover foto"
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center cursor-pointer hover:bg-slate-100/60 hover:border-[#0070F3] transition-colors">
              <Icon name="camera" size={24} className="text-slate-400 mb-1.5" />
              <span className="text-xs font-bold text-[#0070F3]">
                Clique para selecionar uma foto
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG ou WEBP de até 5MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
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
            disabled={isPending}
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
