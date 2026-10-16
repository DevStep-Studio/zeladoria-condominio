"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { createMarketplaceRequestAction } from "@/lib/actions/marketplace";
import { inferCategory } from "@/lib/services/occurrence-inference";
import type { MarketplaceProvider } from "@/lib/services/providers-data";

const CATEGORY_ICONS: Record<string, IconName> = {
  hidraulica: "droplet",
  vazamento: "droplet",
  eletrica: "zap",
  iluminacao: "zap",
  climatizacao: "wind",
  pintura: "pencil",
  marcenaria: "wrench",
  limpeza: "sparkles",
  seguranca: "shield",
  portao: "key",
  portoes: "key",
  jardinagem: "sparkles",
  servicos: "briefcase",
  outros: "briefcase",
};

const AVAILABLE_CATEGORIES = [
  { id: "hidraulica", name: "Hidráulica", icon: "droplet" as IconName },
  { id: "eletrica", name: "Elétrica", icon: "zap" as IconName },
  { id: "climatizacao", name: "Climatização", icon: "wind" as IconName },
  { id: "pintura", name: "Pintura", icon: "pencil" as IconName },
  { id: "marcenaria", name: "Marcenaria", icon: "wrench" as IconName },
  { id: "limpeza", name: "Limpeza", icon: "sparkles" as IconName },
  { id: "seguranca", name: "Segurança", icon: "shield" as IconName },
  { id: "portoes", name: "Portões & Acessos", icon: "key" as IconName },
  { id: "jardinagem", name: "Jardinagem", icon: "sparkles" as IconName },
  { id: "servicos", name: "Outros Serviços", icon: "briefcase" as IconName },
];

export function ServiceRequestWizard({
  provider,
  availableProviders = [],
  onClose,
  onSuccess,
}: {
  provider?: MarketplaceProvider | null;
  availableProviders?: MarketplaceProvider[];
  initialService?: any;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  // 1. O que está acontecendo?
  const [description, setDescription] = useState("");

  // 2. Categoria (com inferência automática)
  const inferred = useMemo(() => inferCategory(description), [description]);
  const [overrideCategory, setOverrideCategory] = useState<string | null>(null);
  const [isChangingCategory, setIsChangingCategory] = useState(false);

  const activeCategoryKey = overrideCategory || inferred.key || (provider?.category?.toLowerCase()) || "servicos";
  const activeCategoryLabel =
    AVAILABLE_CATEGORIES.find((c) => c.id === activeCategoryKey)?.name ||
    inferred.label ||
    "Serviços Gerais";

  // 3. Fotos
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState("");
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);

  // 4. Local (Contexto do condomínio)
  const [locationType, setLocationType] = useState<"minha_unidade" | "area_comum" | "outro">("minha_unidade");
  const [customLocation, setCustomLocation] = useState("");

  // 5. Quando você precisa? (Agora, Hoje, Agendar)
  const [urgency, setUrgency] = useState<"agora" | "hoje" | "agendar">("hoje");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [scheduledTime, setScheduledTime] = useState("09:00 - 12:00");

  // Status de Envio e Sucesso
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotos([...photos, photoInput.trim()]);
    setPhotoInput("");
    setShowPhotoUrlInput(false);
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock data URL para visualização instantânea de preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos([...photos, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const finalLocation =
    locationType === "minha_unidade"
      ? "Minha Unidade (Apto)"
      : locationType === "area_comum"
      ? "Área Comum do Condomínio"
      : customLocation.trim() || "Outro local autorizado";

  const isFormValid = description.trim().length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const title =
          description.trim().length > 60
            ? `${description.trim().slice(0, 57)}...`
            : description.trim();

        const res = await createMarketplaceRequestAction({
          vendorId: provider?.id || null,
          mode: urgency === "agora" ? "on_demand" : "quote",
          category: activeCategoryKey,
          title,
          description: description.trim(),
          urgency,
          scheduledDate: urgency === "agendar" ? scheduledDate : undefined,
          scheduledTimeSlot: urgency === "agendar" ? scheduledTime : undefined,
          location: finalLocation,
          attachments: photos,
        });

        if (res?.success) {
          setIsSuccess(true);
          setCreatedCode(res.code || "");
          onSuccess?.();
        } else {
          setErrorMessage(res?.error || "Não foi possível registrar o chamado. Tente novamente.");
        }
      } catch (err: any) {
        console.error("Erro ao registrar chamado:", err);
        setErrorMessage(err?.message || "Erro de conexão ao registrar o chamado.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1355FF]">
              Zeladoria Serviços · Solicitação de Atendimento
            </span>
            <h3 className="text-base font-black text-[#0F172A] mt-0.5">
              {provider ? `Solicitar orçamento com ${provider.name}` : "Encontrar Profissionais"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Descreva o problema e receba propostas de prestadores compatíveis.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
          {/* TELA DE SUCESSO */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 text-[#1355FF] flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <Icon name="check-circle" size={32} />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Chamado Criado
                </span>
                <h4 className="text-lg font-black text-[#0F172A] mt-2">
                  Estamos buscando profissionais
                </h4>
                {createdCode && (
                  <div className="inline-block mt-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800">
                    Solicitação #{createdCode}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 text-left max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Categoria:</span>
                  <strong className="text-slate-800">{activeCategoryLabel}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Local:</span>
                  <strong className="text-slate-800">{finalLocation}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quando precisa:</span>
                  <strong className="text-slate-800 capitalize">{urgency}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Os prestadores credenciados e compatíveis da sua região já foram notificados. Assim que enviarem orçamentos, você poderá comparar valores e escolher o melhor.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white py-3 text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  Acompanhar Chamados
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Icon name="alert-triangle" size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. PERGUNTA PRINCIPAL: O QUE ESTÁ ACONTECENDO? */}
              <div className="space-y-1.5">
                <label className="font-black text-[#0F172A] text-sm block">
                  O que está acontecendo?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exemplo: A pia da cozinha está vazando bastante por baixo e precisa de reparo no sifão."
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs placeholder:text-slate-400 outline-none focus:border-[#1355FF] focus:ring-1 focus:ring-[#1355FF] transition-all resize-none shadow-2xs"
                />
                <span className="text-[11px] text-slate-400">
                  Descreva o problema com suas palavras para os profissionais entenderem o serviço.
                </span>
              </div>

              {/* 2. SUGESTÃO INTELIGENTE DE CATEGORIA */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg bg-[#1355FF] text-white flex items-center justify-center shrink-0">
                    <Icon name={CATEGORY_ICONS[activeCategoryKey] || "briefcase"} size={16} />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Categoria identificada
                    </span>
                    <strong className="text-xs text-[#0F172A] font-black">
                      {activeCategoryLabel}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangingCategory(!isChangingCategory)}
                  className="text-xs font-bold text-[#1355FF] hover:underline px-2 py-1 rounded cursor-pointer"
                >
                  {isChangingCategory ? "Fechar" : "Alterar"}
                </button>
              </div>

              {/* Seletor de Categoria se clicou em alterar */}
              {isChangingCategory && (
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setOverrideCategory(cat.id);
                        setIsChangingCategory(false);
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-left transition-colors cursor-pointer text-[11px] font-bold ${
                        activeCategoryKey === cat.id
                          ? "bg-[#1355FF] text-white shadow-xs"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      <Icon name={cat.icon} size={13} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 3. FOTOS DO PROBLEMA */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Fotos (Opcional, ajuda no orçamento)
                </label>

                {photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {photos.map((url, idx) => (
                      <div key={idx} className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer transition-colors text-[11px]">
                    <Icon name="camera" size={13} />
                    <span>Tirar / Enviar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadMock}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPhotoUrlInput(!showPhotoUrlInput)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-2 cursor-pointer"
                  >
                    Adicionar link
                  </button>
                </div>

                {showPhotoUrlInput && (
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={photoInput}
                      onChange={(e) => setPhotoInput(e.target.value)}
                      className="flex-1 h-8 px-2.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-3 h-8 bg-[#1355FF] text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Inserir
                    </button>
                  </div>
                )}
              </div>

              {/* 4. LOCALIZAÇÃO */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Local do serviço</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLocationType("minha_unidade")}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] cursor-pointer transition-all ${
                      locationType === "minha_unidade"
                        ? "border-[#1355FF] bg-blue-50 text-[#1355FF] shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Minha Unidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("area_comum")}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] cursor-pointer transition-all ${
                      locationType === "area_comum"
                        ? "border-[#1355FF] bg-blue-50 text-[#1355FF] shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Área Comum
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("outro")}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] cursor-pointer transition-all ${
                      locationType === "outro"
                        ? "border-[#1355FF] bg-blue-50 text-[#1355FF] shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Outro Local
                  </button>
                </div>

                {locationType === "outro" && (
                  <input
                    type="text"
                    placeholder="Ex: Garagem Bloco B, Vaga 12"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs mt-1"
                  />
                )}
              </div>

              {/* 5. QUANDO VOCÊ PRECISA? (Urgência simples) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Quando você precisa?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency("agora")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      urgency === "agora"
                        ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-black flex items-center justify-center gap-1">
                      <Icon name="zap" size={12} className="text-amber-600" />
                      <span>Agora</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Urgente</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency("hoje")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      urgency === "hoje"
                        ? "border-[#1355FF] bg-blue-50 text-[#1355FF] shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-black">Hoje</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Durante o dia</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency("agendar")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      urgency === "agendar"
                        ? "border-[#1355FF] bg-blue-50 text-[#1355FF] shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-black">Agendar</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Outro dia</div>
                  </button>
                </div>

                {urgency === "agendar" && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-300 text-xs"
                    />
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="Manhã (08h às 12h)">Manhã (08h às 12h)</option>
                      <option value="Tarde (13h às 18h)">Tarde (13h às 18h)</option>
                      <option value="Noite (18h às 21h)">Noite (18h às 21h)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* RESUMO & CTA DOMINANTE (SEÇÃO 10) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isPending}
                  className="w-full h-11 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99]"
                >
                  {isPending ? (
                    <span>Buscando profissionais...</span>
                  ) : (
                    <>
                      <Icon name="search" size={16} />
                      <span>Encontrar profissionais</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  Protegido por Zeladoria Protege · Sem compromisso
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
