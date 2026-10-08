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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
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
              className="rounded-[8px] border border-slate-200/80 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Icon name="external-link" size={13} />
              <span>Ver Vitrine Pública</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="check" size={14} />
            <span>{isPending ? "Salvando..." : savedSuccess ? "Salvo!" : "Salvar Loja"}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check-circle" size={15} className="text-emerald-600" />
          <span>Perfil da loja atualizado com sucesso no marketplace!</span>
        </div>
      )}

      {/* SECTION: MEU PERFIL PÚBLICO & COMPLETUDE */}
      {(() => {
        const hasPhoto = Boolean(photoUrl.trim());
        const hasCover = Boolean(coverUrl.trim());
        const hasBio = Boolean(description.trim());
        const hasPortfolio = portfolio.length > 0;
        const hasServices = Array.isArray(vendor.services) && vendor.services.length > 0;
        const hasPrice = vendor.priceFromCents != null;

        const items = [
          { label: "Foto do perfil", ok: hasPhoto, weight: 20 },
          { label: "Foto de capa", ok: hasCover, weight: 10 },
          { label: "Apresentação / Bio", ok: hasBio, weight: 20 },
          { label: "Portfólio de trabalhos", ok: hasPortfolio, weight: 25 },
          { label: "Serviços cadastrados", ok: hasServices, weight: 15 },
          { label: "Preços de referência", ok: hasPrice, weight: 10 },
        ];

        const completeness = items.reduce((acc, item) => (item.ok ? acc + item.weight : acc), 0);
        const missing = items.filter((i) => !i.ok);

        return (
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Meu Perfil Público
                </span>
                <h2 className="text-base font-black text-slate-900 mt-0.5">
                  Completude do Perfil: {completeness}%
                </h2>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-[6px] ${
                  completeness >= 80
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : "bg-amber-50 text-amber-800 border border-amber-200/80"
                }`}
              >
                {completeness >= 80 ? "Perfil Altamente Atrativo" : "Complete seu Perfil"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#0055D4] transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>

            {/* Missing elements checklist */}
            {missing.length > 0 && (
              <div className="text-xs space-y-1.5">
                <span className="font-bold text-slate-700">Faltando completar:</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {missing.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-[6px] text-xs font-medium"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo & Portfolio Incentive Callout */}
            {(!hasPhoto || !hasPortfolio) && (
              <div className="p-3.5 rounded-[12px] bg-blue-50 border border-blue-200/80 text-[#0055D4] text-xs font-medium flex items-center gap-3">
                <Icon name="camera" size={20} className="shrink-0 text-[#0055D4]" />
                <p>
                  <strong>Dica de visibilidade:</strong> Perfis com fotos dos trabalhos ajudam moradores a conhecer melhor seu serviço e aumentam a confiança na contratação.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Details Form */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
            className="w-full rounded-[8px] border border-slate-200/80 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
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
              className="h-10 w-full rounded-[8px] border border-slate-200/80 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Editor */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Galeria de Trabalhos Realizados ({portfolio.length})
        </h2>

        {/* Current list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {portfolio.map((item, index) => (
            <div
              key={index}
              className="rounded-[12px] border border-slate-200/80 overflow-hidden bg-slate-50 p-2 space-y-1 shadow-2xs"
            >
              <div className="h-28 w-full rounded-[8px] overflow-hidden bg-slate-200">
                <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-slate-700 truncate">{item.caption}</span>
                <button
                  type="button"
                  onClick={() => removePortfolio(index)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-[4px] cursor-pointer"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add photo */}
        <div className="p-3.5 rounded-[12px] border border-dashed border-slate-300 bg-slate-50 space-y-2">
          <span className="text-xs font-bold text-slate-700 block">+ Adicionar Nova Foto</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              placeholder="URL da imagem (ex: https://...)"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              className="h-9 rounded-[8px] border border-slate-200/80 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
            <input
              type="text"
              placeholder="Legenda do trabalho"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              className="h-9 rounded-[8px] border border-slate-200/80 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addPortfolio}
              className="h-9 px-3.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Adicionar ao Portfólio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
