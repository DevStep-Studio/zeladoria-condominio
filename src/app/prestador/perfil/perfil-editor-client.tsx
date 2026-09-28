"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { updateProviderStorefrontAction } from "@/lib/actions/prestador";

export function ProviderPerfilEditorClient({ vendor }: { vendor: any }) {
  const [description, setDescription] = useState(vendor.description || "");
  const [phone, setPhone] = useState(vendor.phone || "");
  const [whatsapp, setWhatsapp] = useState(vendor.whatsapp || vendor.phone || "");
  const [serviceArea, setServiceArea] = useState(vendor.serviceArea || "");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(vendor.serviceRadiusKm || 15);
  const [workingHours, setWorkingHours] = useState(vendor.workingHours || "Seg a Sex 08:00 - 18:00");
  const [photoUrl, setPhotoUrl] = useState(vendor.photoUrl || "");
  const [coverUrl, setCoverUrl] = useState(vendor.coverUrl || "");

  const initialPortfolio = Array.isArray(vendor.portfolio) ? vendor.portfolio : [];
  const [portfolio, setPortfolio] = useState<any[]>(initialPortfolio);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const addPortfolio = () => {
    if (!newPhotoUrl.trim()) return;
    setPortfolio((prev) => [
      ...prev,
      { url: newPhotoUrl.trim(), caption: newPhotoCaption.trim() || "Trabalho realizado" },
    ]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
  };

  const removePortfolio = (index: number) => {
    setPortfolio((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateProviderStorefrontAction({
        description,
        phone,
        whatsapp,
        serviceArea,
        serviceRadiusKm,
        workingHours,
        photoUrl,
        coverUrl,
        portfolio,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Meu Perfil & Loja no Marketplace
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Esta é a apresentação que os moradores de condomínios visualizam ao buscar serviços.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {vendor.slug && (
            <Link
              href={`/servicos/${vendor.slug}`}
              target="_blank"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="external-link" size={13} />
              <span>Ver Vitrine Pública</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="check" size={14} />
            <span>{isPending ? "Salvando..." : savedSuccess ? "Salvo!" : "Salvar Loja"}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Icon name="check-circle" size={15} className="text-emerald-600" />
          <span>Perfil da loja atualizado com sucesso no marketplace!</span>
        </div>
      )}

      {/* Main Details Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Dados de Apresentação e Contato
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foto de Perfil ou Logo (URL)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Imagem de Capa da Loja (URL)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://exemplo.com/banner-capa.jpg"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Telefone Profissional
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WhatsApp Profissional
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bio / Apresentação Profissional
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bairros / Cidades Atendidas
            </label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Horários de Atendimento
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Ex: Seg a Sex 08:00 - 18:00"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Editor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Galeria de Trabalhos Realizados ({portfolio.length})
        </h2>

        {/* Current list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {portfolio.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 space-y-1"
            >
              <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-200">
                <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-slate-700 truncate">{item.caption}</span>
                <button
                  type="button"
                  onClick={() => removePortfolio(index)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add photo */}
        <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
          <span className="text-xs font-bold text-slate-700 block">+ Adicionar Nova Foto</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              placeholder="URL da imagem (ex: https://...)"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none"
            />
            <input
              type="text"
              placeholder="Legenda do trabalho"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addPortfolio}
              className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Adicionar ao Portfólio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
