"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { createServiceRequestAction } from "@/lib/actions/servicos";
import type { MarketplaceProvider, ServiceOffering } from "@/lib/services/providers-data";

export function ServiceRequestWizard({
  provider,
  initialService,
  onClose,
  onSuccess,
}: {
  provider: MarketplaceProvider;
  initialService?: ServiceOffering;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialService ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService?.id || "");
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"baixa" | "media" | "alta" | "urgente">("media");
  const [location, setLocation] = useState("Minha Unidade (Apto)");
  const [preferredTime, setPreferredTime] = useState("Qualquer horário");
  const [preferredDate, setPreferredDate] = useState("O quanto antes");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedService = provider.servicesOffered.find((s) => s.id === selectedServiceId);
  const serviceTitle =
    selectedService?.name ||
    customServiceName.trim() ||
    `Serviço geral de ${provider.category}`;

  const handleSubmit = () => {
    if (!description.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", `${serviceTitle} (${provider.name})`);
      formData.set(
        "description",
        `${description.trim()}\n\n[Preferência: ${preferredDate} - ${preferredTime}]\n[Local: ${location}]`
      );
      formData.set("category", provider.category.toLowerCase());
      formData.set("priority", priority);
      formData.set("location", location);
      formData.set("preferredTime", `${preferredDate} · ${preferredTime}`);
      formData.set("vendorId", String(provider.id));

      const res = await createServiceRequestAction(formData);
      if (res?.success) {
        setIsSuccess(true);
        onSuccess?.();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0055D4]">
                Solicitar Orçamento
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-bold text-slate-500">
                Etapa {step} de 4
              </span>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
              {provider.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {provider.company} ({provider.category})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Progress Bar (4 steps) */}
        {!isSuccess && (
          <div className="grid grid-cols-4 gap-1.5">
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

        {/* SUCCESS STATE */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
              <Icon name="check-circle" size={32} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Solicitação Enviada com Sucesso!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              O síndico foi notificado e encaminhará os detalhes do seu pedido para{" "}
              <strong className="text-[#0F172A]">{provider.name}</strong>. Acompanhe o andamento em &quot;Minhas Contratações&quot;.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ETAPA 1: ESCOLHER SERVIÇO */}
            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#0F172A]">
                  1. Qual serviço você precisa?
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {provider.servicesOffered.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => {
                        setSelectedServiceId(svc.id);
                        setCustomServiceName("");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedServiceId === svc.id
                          ? "border-[#0055D4] bg-blue-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <h5 className="text-xs font-bold text-[#0F172A]">{svc.name}</h5>
                        <p className="text-[11px] text-slate-500">{svc.description}</p>
                      </div>
                      <span className="text-xs font-black text-[#0055D4] shrink-0 ml-2">
                        {svc.priceFromCents != null ? `A partir de R$ ${(svc.priceFromCents / 100).toFixed(0)}` : "Sob consulta"}
                      </span>
                    </div>
                  ))}

                  {/* Custom Option */}
                  <div
                    onClick={() => {
                      setSelectedServiceId("custom");
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedServiceId === "custom"
                        ? "border-[#0055D4] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="pencil" size={14} className="text-[#0055D4]" />
                      <h5 className="text-xs font-bold text-[#0F172A]">
                        Outro serviço / Diagnóstico sob medida
                      </h5>
                    </div>
                    {selectedServiceId === "custom" && (
                      <input
                        type="text"
                        placeholder="Ex: Instalar fita de LED no armário da cozinha..."
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: DESCREVER O PROBLEMA */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    2. Descreva os detalhes do serviço
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Obrigatório</span>
                </div>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que está ocorrendo, marcas, cômodo ou peças que já possui. Ex: O disjuntor do chuveiro começou a desarmar após 10 minutos de banho."
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] leading-relaxed resize-none"
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
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
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
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          preferredDate === dt
                            ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
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
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          preferredTime === turno
                            ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
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
                    <span className="text-slate-500 font-medium">Serviço:</span>
                    <span className="font-bold text-[#0F172A] text-right">{serviceTitle}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Profissional:</span>
                    <span className="font-bold text-[#0F172A]">{provider.name}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Local:</span>
                    <span className="font-bold text-[#0F172A]">{location}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Agendamento sugerido:</span>
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

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-[#0055D4]">
                  <Icon name="clock" size={14} className="shrink-0" />
                  <span>
                    Sua solicitação será enviada ao síndico, que vai agendar o atendimento com o prestador. Você receberá notificações no painel.
                  </span>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
                    (step === 1 && !selectedServiceId) ||
                    (step === 2 && !description.trim())
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
                      <Icon name="clock" size={13} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Confirmar e Enviar</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
