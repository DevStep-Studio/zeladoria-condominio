"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { createMarketplaceRequestAction } from "@/lib/actions/marketplace";
import type { MarketplaceProvider, ServiceOffering } from "@/lib/services/providers-data";

const POPULAR_CATEGORIES: { id: string; name: string; icon: IconName; description: string }[] = [
  { id: "eletrica", name: "Elétrica", icon: "zap", description: "Chuveiros, disjuntores, fiação e tomadas" },
  { id: "hidraulica", name: "Hidráulica", icon: "droplet", description: "Vazamentos, registros, pias e ralos" },
  { id: "climatizacao", name: "Climatização", icon: "wind", description: "Ar-condicionado, limpeza e recarga de gás" },
  { id: "pintura", name: "Pintura", icon: "pencil", description: "Paredes, tetos, portas e acabamentos" },
  { id: "marcenaria", name: "Marcenaria", icon: "wrench", description: "Armários, portas, ajustes e móveis sob medida" },
  { id: "limpeza", name: "Limpeza", icon: "sparkles", description: "Faxina pós-obra, estofados e vidros" },
  { id: "seguranca", name: "Segurança", icon: "shield", description: "Câmeras, alarmes e extintores" },
  { id: "portoes", name: "Portões & Acessos", icon: "key", description: "Motores, fechaduras e controles" },
  { id: "jardinagem", name: "Jardinagem", icon: "sparkles", description: "Poda, paisagismo e manutenção verde" },
  { id: "servicos", name: "Outros Serviços", icon: "briefcase", description: "Pequenos reparos e serviços gerais" },
];

const QUICK_SERVICE_SUGGESTIONS: Record<string, string[]> = {
  eletrica: ["Chuveiro queimou", "Disjuntor desarmando", "Instalação de tomada", "Troca de luminária / LED", "Quadro de força"],
  hidraulica: ["Vazamento na pia", "Troca de registro", "Válvula de descarga", "Desentupimento de ralo", "Instalação de torneira"],
  climatizacao: ["Ar-condicionado não gela", "Higienização / Limpeza", "Instalação de Split", "Recarga de gás"],
  pintura: ["Pintura de quarto / sala", "Retoque de manchas", "Pintura de portas", "Massa corrida e lixamento"],
  marcenaria: ["Regulagem de dobradiças", "Troca de puxadores", "Montagem de móveis", "Ajuste de porta"],
  limpeza: ["Limpeza pesada / pós-obra", "Higienização de sofá", "Limpeza de vidros"],
  seguranca: ["Instalação de câmera", "Fechadura digital", "Sensor de presença"],
  portoes: ["Fechadura emperrada", "Controle de portão", "Troca de miolo"],
  jardinagem: ["Poda de plantas", "Adubação e corte de grama"],
  servicos: ["Instalação de varal / cortina", "Fixação de suporte de TV", "Pequenos consertos"],
};

export function ServiceRequestWizard({
  provider,
  availableProviders = [],
  initialService,
  onClose,
  onSuccess,
}: {
  provider?: MarketplaceProvider | null;
  availableProviders?: MarketplaceProvider[];
  initialService?: ServiceOffering;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialService ? 2 : 1);
  const [mode, setMode] = useState<"on_demand" | "quote">("on_demand");

  // Category and provider state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    provider?.category?.toLowerCase() || "eletrica"
  );
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(provider?.id ?? null);

  // Service selection
  const hasProviderServices = Boolean(provider?.servicesOffered && provider.servicesOffered.length > 0);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialService?.id || (hasProviderServices ? provider!.servicesOffered[0].id : "custom")
  );
  const [customServiceName, setCustomServiceName] = useState<string>(initialService?.name || "");

  // Step 2 & 3
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"baixa" | "media" | "alta" | "urgente">("media");
  const [location, setLocation] = useState("Minha Unidade (Apto)");
  const [preferredTime, setPreferredTime] = useState("Qualquer horário");
  const [preferredDate, setPreferredDate] = useState("O quanto antes");

  // Status
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active chosen vendor info
  const effectiveVendor = useMemo(() => {
    if (provider) return provider;
    if (selectedVendorId) {
      return availableProviders.find((p) => p.id === selectedVendorId) ?? null;
    }
    return null;
  }, [provider, selectedVendorId, availableProviders]);

  // Providers filtered by current category
  const categoryProviders = useMemo(() => {
    return availableProviders.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [availableProviders, selectedCategory]);

  const selectedService = effectiveVendor?.servicesOffered?.find((s) => s.id === selectedServiceId);
  const serviceTitle =
    selectedService?.name ||
    customServiceName.trim() ||
    `Serviço de ${effectiveVendor?.category || selectedCategory}`;

  const isStep1Valid = Boolean(
    (selectedServiceId && selectedServiceId !== "custom") ||
    customServiceName.trim().length > 0 ||
    !provider
  );

  const isStep2Valid = Boolean(description.trim().length >= 5);

  const handleSubmit = () => {
    if (!description.trim()) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await createMarketplaceRequestAction({
          vendorId: effectiveVendor?.id || null,
          mode,
          category: (effectiveVendor?.category || selectedCategory).toLowerCase(),
          title: effectiveVendor
            ? `${serviceTitle} (${effectiveVendor.name})`
            : `${customServiceName.trim() || `Serviço de ${selectedCategory}`}`,
          description: description.trim(),
          urgency: mode === "on_demand" ? "agora" : priority === "urgente" ? "urgente" : "hoje",
          scheduledDate: preferredDate,
          scheduledTimeSlot: preferredTime,
          location: location.trim() || "Minha Unidade",
        });

        if (res?.success) {
          setIsSuccess(true);
          setCreatedCode(res.code || "");
          onSuccess?.();
        } else {
          setErrorMessage(res?.error || "Não foi possível registrar a solicitação. Tente novamente.");
        }
      } catch (err: any) {
        console.error("Erro ao submeter chamado:", err);
        setErrorMessage(err?.message || "Ocorreu um erro de comunicação com o servidor.");
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0055D4]">
                {mode === "on_demand" ? "Atendimento Sob Demanda" : "Solicitar Orçamento"}
              </span>
              {!isSuccess && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-bold text-slate-500">
                    Etapa {step} de 4
                  </span>
                </>
              )}
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
              {effectiveVendor ? effectiveVendor.name : "Novo Pedido de Serviço"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {effectiveVendor
                ? `${effectiveVendor.company || effectiveVendor.name} (${effectiveVendor.category})`
                : "Receba propostas rápidas de profissionais credenciados"}
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

        {/* Progress Bar (4 steps) */}
        {!isSuccess && (
          <div className="grid grid-cols-4 gap-1.5 shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  step >= i ? "bg-[#0055D4]" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        )}

        {/* Modal Body with scrollable content */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
          {/* SUCCESS STATE */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                <Icon name="check-circle" size={32} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#0F172A]">
                Solicitação Enviada com Sucesso!
              </h4>
              {createdCode && (
                <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800">
                  Código: {createdCode}
                </div>
              )}
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {effectiveVendor ? (
                  <>
                    Os detalhes da sua solicitação foram enviados para{" "}
                    <strong className="text-[#0F172A]">{effectiveVendor.name}</strong>. Você será notificado assim que o prestador confirmar.
                  </>
                ) : (
                  <>
                    Sua solicitação foi registrada no condomínio. Os profissionais qualificados receberão os detalhes para enviar propostas.
                  </>
                )}
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Concluir e Acompanhar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ETAPA 1: ESCOLHER MODO E SERVIÇO */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* DOIS MODOS DE CONTRATAÇÃO */}
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Como deseja ser atendido?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("on_demand")}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          mode === "on_demand"
                            ? "border-[#0055D4] bg-blue-50/70 text-[#0055D4] shadow-xs ring-1 ring-[#0055D4]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Icon name="zap" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                          <span>Rápido / Sob Demanda</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Para consertos imediatos ou para hoje.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode("quote")}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          mode === "quote"
                            ? "border-[#0055D4] bg-blue-50/70 text-[#0055D4] shadow-xs ring-1 ring-[#0055D4]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Icon name="clipboard" size={13} className="text-[#0055D4]" />
                          <span>Orçamento & Propostas</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Para reformas ou comparar valores.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Se NÃO tiver prestador pré-definido, permite escolher Categoria */}
                  {!provider && (
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                        1. Selecione a Categoria do Serviço:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {POPULAR_CATEGORIES.map((cat) => {
                          const isCatSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setSelectedServiceId("custom");
                                setSelectedVendorId(null);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isCatSelected
                                  ? "border-[#0055D4] bg-blue-50 text-[#0055D4] font-bold shadow-2xs"
                                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Icon name={cat.icon} size={13} className={isCatSelected ? "text-[#0055D4]" : "text-slate-500"} />
                                <span className="text-xs truncate">{cat.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Se tiver prestador com serviços cadastrados */}
                  {effectiveVendor && effectiveVendor.servicesOffered && effectiveVendor.servicesOffered.length > 0 ? (
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                        Qual serviço de {effectiveVendor.name} você precisa?
                      </label>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {effectiveVendor.servicesOffered.map((svc) => (
                          <div
                            key={svc.id}
                            onClick={() => {
                              setSelectedServiceId(svc.id);
                              setCustomServiceName("");
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              selectedServiceId === svc.id
                                ? "border-[#0055D4] bg-blue-50/60 shadow-2xs font-semibold"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <h5 className="text-xs font-bold text-[#0F172A] truncate">{svc.name}</h5>
                              {svc.description && <p className="text-[10px] text-slate-500 truncate">{svc.description}</p>}
                            </div>
                            <span className="text-xs font-black text-[#0055D4] shrink-0">
                              {svc.priceFromCents != null
                                ? `R$ ${(svc.priceFromCents / 100).toFixed(0)}`
                                : "Sob consulta"}
                            </span>
                          </div>
                        ))}

                        {/* Custom Option */}
                        <div
                          onClick={() => setSelectedServiceId("custom")}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedServiceId === "custom"
                              ? "border-[#0055D4] bg-blue-50/60 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="pencil" size={13} className="text-[#0055D4]" />
                            <h5 className="text-xs font-bold text-[#0F172A]">
                              Outro serviço / Diagnóstico sob medida
                            </h5>
                          </div>
                          {selectedServiceId === "custom" && (
                            <input
                              type="text"
                              placeholder="Descreva o nome do serviço (ex: Troca de tomada, instalação de luminária...)"
                              value={customServiceName}
                              onChange={(e) => setCustomServiceName(e.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Sugestões e input de serviço livre */
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                        O que você precisa consertar ou instalar?
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Chuveiro desarmando disjuntor, torneira com vazamento..."
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                      />

                      {/* Quick chips */}
                      {QUICK_SERVICE_SUGGESTIONS[selectedCategory] && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                            Sugestões frequentes:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {QUICK_SERVICE_SUGGESTIONS[selectedCategory].map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setCustomServiceName(sug)}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Optional category provider picker if available */}
                      {categoryProviders.length > 0 && !provider && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Preferência de Prestador (Opcional):
                          </label>
                          <select
                            value={selectedVendorId ?? ""}
                            onChange={(e) => setSelectedVendorId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#0055D4]"
                          >
                            <option value="">Qualquer prestador disponível no condomínio</option>
                            {categoryProviders.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.company || p.category}) - ⭐ {p.rating.toFixed(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ETAPA 2: DESCREVER O PROBLEMA */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#0F172A]">
                      2. Descreva os detalhes do serviço
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Mínimo 5 caracteres</span>
                  </div>

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explique o que está ocorrendo, marcas, cômodo ou peças que já possui. Ex: O disjuntor do chuveiro começou a desarmar após 10 minutos de banho."
                    required
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] leading-relaxed resize-none shadow-2xs"
                  />

                  {/* Urgência */}
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Nível de urgência:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "baixa", label: "Normal (Sem pressa)" },
                        { id: "media", label: "Moderada (Esta semana)" },
                        { id: "urgente", label: "Urgente (Hoje / Rápido)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPriority(item.id as any)}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                            priority === item.id
                              ? "border-[#0055D4] bg-[#0055D4] text-white shadow-xs"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PREFERÊNCIA DE HORÁRIO E LOCAL */}
              {step === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      3. Local da execução
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                      placeholder="Ex: Apto 302 - Bloco A"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Quando prefere o atendimento?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Hoje mesmo", "Amanhã", "Final de semana", "O quanto antes"].map((dt) => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => setPreferredDate(dt)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            preferredDate === dt
                              ? "border-[#0055D4] bg-blue-50 text-[#0055D4] shadow-2xs"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {dt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Turno preferencial:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Manhã (08h-12h)", "Tarde (13h-18h)", "Qualquer horário"].map((turno) => (
                        <button
                          key={turno}
                          type="button"
                          onClick={() => setPreferredTime(turno)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            preferredTime === turno
                              ? "border-[#0055D4] bg-blue-50 text-[#0055D4] shadow-2xs"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {turno}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 4: REVISÃO & CONFIRMAÇÃO */}
              {step === 4 && (
                <div className="space-y-3 text-xs">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    4. Resumo da sua solicitação
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-medium">Modo:</span>
                      <span className="font-bold text-[#0055D4]">
                        {mode === "on_demand" ? "⚡ Atendimento Rápido / Sob Demanda" : "📋 Orçamento & Propostas"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-medium">Serviço:</span>
                      <span className="font-bold text-[#0F172A] text-right truncate max-w-[200px]">{serviceTitle}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-medium">Prestador:</span>
                      <span className="font-bold text-[#0F172A]">
                        {effectiveVendor ? effectiveVendor.name : "Qualquer prestador credenciado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-medium">Local:</span>
                      <span className="font-bold text-[#0F172A]">{location || "Minha Unidade"}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-medium">Agendamento:</span>
                      <span className="font-bold text-[#0F172A]">
                        {preferredDate} ({preferredTime})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block mb-1">Descrição:</span>
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                      <Icon name="alert-triangle" size={14} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-[#0055D4]">
                    <Icon name="clock" size={14} className="shrink-0" />
                    <span>
                      Sua solicitação ficará disponível na aba &quot;Minhas Contratações&quot; para acompanhamento em tempo real.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stepper Navigation Buttons */}
        {!isSuccess && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !isStep1Valid) ||
                  (step === 2 && !isStep2Valid)
                }
                onClick={() => setStep((s) => (s + 1) as any)}
                className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Avançar
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending || !description.trim()}
                onClick={handleSubmit}
                className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-6 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Icon name="refresh" size={13} className="animate-spin text-white" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Confirmar e Enviar</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
