"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

// 1. MODAL: PRESTADOR RESPONDE VISTORIA (GRATUITA OU PAGA)
export function ProviderInspectionResponseModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (data: {
    type: "gratuita" | "paga";
    priceCents: number;
    estimatedDurationMinutes: number;
    notes: string;
    availableSlots: { date: string; time: string; label?: string }[];
  }) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState<"gratuita" | "paga">("paga");
  const [priceVal, setPriceVal] = useState("80.00");
  const [duration, setDuration] = useState(40);
  const [notes, setNotes] = useState("Vistoria técnica para diagnóstico e levantamento de materiais.");
  
  // 3 slots default preenchidos
  const [slots, setSlots] = useState<{ date: string; time: string }[]>([
    { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], time: "09:00" },
    { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], time: "14:00" },
    { date: new Date(Date.now() + 172800000).toISOString().split("T")[0], time: "10:00" },
  ]);

  if (!isOpen || !request) return null;

  const handleAddSlot = () => {
    setSlots([...slots, { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], time: "11:00" }]);
  };

  const handleUpdateSlot = (idx: number, field: "date" | "time", val: string) => {
    const updated = [...slots];
    updated[idx][field] = val;
    setSlots(updated);
  };

  const handleRemoveSlot = (idx: number) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = type === "gratuita" ? 0 : Math.round(parseFloat(priceVal || "0") * 100);
    onSubmit({
      type,
      priceCents,
      estimatedDurationMinutes: duration,
      notes,
      availableSlots: slots.map((s) => ({
        date: s.date,
        time: s.time,
        label: `${s.date.split("-").reverse().slice(0, 2).join("/")} às ${s.time}`,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Propor Vistoria Técnica</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chamado #{request.code} — {request.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Seletor Gratuita vs Paga */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Tipo de Vistoria</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("gratuita")}
                className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  type === "gratuita"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="text-sm">Vistoria Gratuita</div>
                <div className="text-[10px] font-normal text-emerald-700 mt-0.5">Sem custo para o morador</div>
              </button>

              <button
                type="button"
                onClick={() => setType("paga")}
                className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  type === "paga"
                    ? "border-[#0055D4] bg-blue-50 text-[#0055D4] shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="text-sm">Vistoria Paga</div>
                <div className="text-[10px] font-normal text-blue-700 mt-0.5">Remunera visita e laudo</div>
              </button>
            </div>
          </div>

          {/* Se paga: Valor e Duração */}
          {type === "paga" && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Valor da Vistoria (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="150"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    required
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 outline-none focus:border-[#0055D4]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Exemplo: R$ 80,00</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duração Estimada</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 40)}
                    required
                    className="w-full h-9 px-3 pr-12 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 outline-none focus:border-[#0055D4]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">min</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Exemplo: 40 minutos</p>
              </div>
            </div>
          )}

          {/* Horários Disponíveis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Horários Disponíveis para o Morador Escolher</label>
              <button
                type="button"
                onClick={handleAddSlot}
                className="text-[11px] font-bold text-[#0055D4] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Icon name="plus" size={12} />
                <span>Adicionar horário</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {slots.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={s.date}
                    onChange={(e) => handleUpdateSlot(idx, "date", e.target.value)}
                    required
                    className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs flex-1"
                  />
                  <input
                    type="time"
                    value={s.time}
                    onChange={(e) => handleUpdateSlot(idx, "time", e.target.value)}
                    required
                    className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs w-28"
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Observações / Instruções para o Morador</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs outline-none focus:border-[#0055D4]"
              placeholder="Ex: Por favor manter o registro de água acessível..."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Enviando..." : "Enviar Proposta de Vistoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. MODAL: MORADOR FAZ O CHECKOUT DA VISTORIA PAGA (COM RESUMO E HOLD DE 10 MIN)
export function CustomerInspectionCheckoutModal({
  isOpen,
  onClose,
  checkoutData,
  onSimulatePay,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  checkoutData: {
    orderCode: string;
    amountCents: number;
    vendorName: string;
    slot: { date: string; time: string };
    holdExpiresAt?: string | Date;
    holdMinutes?: number;
    pixCopiaECola?: string;
    pixQrCode?: string;
  } | null;
  onSimulatePay: (orderCode: string) => void;
  isPending: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 min em segundos

  useEffect(() => {
    if (!checkoutData?.holdExpiresAt) return;
    const expiry = new Date(checkoutData.holdExpiresAt).getTime();

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [checkoutData]);

  if (!isOpen || !checkoutData) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleCopy = () => {
    if (checkoutData.pixCopiaECola) {
      navigator.clipboard.writeText(checkoutData.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-blue-50 text-[#0055D4] flex items-center justify-center font-black">
              <Icon name="calendar" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Resumo da Vistoria</h2>
              <p className="text-[11px] text-slate-500">Pagamento antecipado com horário garantido</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Card Resumo conforme exigido no prompt */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Prestador:</span>
            <strong className="text-slate-900 font-bold">{checkoutData.vendorName}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Data da Visita:</span>
            <strong className="text-slate-900">{checkoutData.slot.date}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Horário:</span>
            <strong className="text-slate-900">{checkoutData.slot.time}</strong>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-700">Valor da Vistoria:</span>
            <span className="text-base font-black text-[#0055D4]">
              R$ {(checkoutData.amountCents / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Alerta de Reserva Temporária (Slot Hold) */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-amber-900 text-xs">
          <Icon name="clock" size={16} className="text-amber-700 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Horário reservado temporariamente: </span>
            <span>{timeFormatted} restantes</span>
            <p className="text-[10px] text-amber-800/80 mt-0.5">
              Se o pagamento não for concluído, o horário será liberado automaticamente.
            </p>
          </div>
        </div>

        {/* QR Code Pix */}
        <div className="text-center space-y-3">
          <div className="inline-block p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            {checkoutData.pixQrCode ? (
              <img
                src={checkoutData.pixQrCode}
                alt="QR Code Pix"
                className="w-44 h-44 mx-auto object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                QR Code Pix
              </div>
            )}
          </div>

          {/* Pix Copia e Cola */}
          {checkoutData.pixCopiaECola && (
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-600">Código Pix Copia e Cola:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={checkoutData.pixCopiaECola}
                  className="h-8 w-full px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 truncate font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg bg-[#0055D4] text-white font-bold text-xs shrink-0 cursor-pointer hover:bg-[#0047BA] transition-colors"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé / Confirmação Segura */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {process.env.NODE_ENV !== "production" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onSimulatePay(checkoutData.orderCode)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="check-circle" size={14} />
              <span>{isPending ? "Processando..." : "[Sandbox/Dev] Simular Compensação Pix Webhook"}</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0055D4] flex items-center justify-center gap-2 font-medium">
              <Icon name="clock" size={15} className="text-[#0055D4] shrink-0" />
              <span>Aguardando detecção do Pix pelo Asaas PSP...</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Fechar Janela (Acompanhar no Painel)
          </button>
          <p className="text-[10px] text-center text-slate-400">
            Ambiente seguro homologado com Asaas PSP · Zeladoria Pay
          </p>
        </div>
      </div>
    </div>
  );
}

// 3. MODAL: PRESTADOR REGISTRA DIAGNÓSTICO DA VISTORIA
export function ProviderDiagnosisModal({
  isOpen,
  onClose,
  inspection,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
  onSubmit: (data: { diagnosticReport: string; evidencePhotos?: string[] }) => void;
  isPending: boolean;
}) {
  const [report, setReport] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  if (!isOpen || !inspection) return null;

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return;
    setPhotos([...photos, photoUrl.trim()]);
    setPhotoUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ diagnosticReport: report, evidencePhotos: photos });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Registrar Diagnóstico Técnico</h2>
            <p className="text-xs text-slate-500">Laudo da vistoria presencial realizada no imóvel</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Diagnóstico do Problema e Necessidades</label>
            <textarea
              rows={4}
              value={report}
              onChange={(e) => setReport(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs outline-none focus:border-[#0055D4]"
              placeholder="Descreva detalhadamente o que foi identificado na visita (ex: Luva de 3/4 com trinca interna, necessidade de troca do reparo e vedação da bancada)..."
            />
          </div>

          {/* Fotos de Evidência */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Fotos de Evidência do Problema (Antes)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="URL da foto (ex: https://...)"
                className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs"
              >
                Anexar
              </button>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-1">
                {photos.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-[10px] text-slate-700">
                    Foto {i + 1}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Salvando..." : "Salvar Diagnóstico e Avançar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. MODAL: PRESTADOR ENVIA PROPOSTA DIGITAL (MÃO DE OBRA + PEÇAS + GARANTIA CDC)
export function ProviderDigitalProposalModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (data: {
    laborCents: number;
    materialsCents: number;
    estimatedDays: number;
    warrantyDays: number;
    description: string;
  }) => void;
  isPending: boolean;
}) {
  const [laborVal, setLaborVal] = useState("250.00");
  const [materialsVal, setMaterialsVal] = useState("90.00");
  const [days, setDays] = useState(1);
  const [warrantyDays, setWarrantyDays] = useState(90);
  const [desc, setDesc] = useState("Execução completa do reparo hidráulico com substituição das peças danificadas.");

  if (!isOpen || !request) return null;

  const laborCents = Math.round(parseFloat(laborVal || "0") * 100);
  const materialsCents = Math.round(parseFloat(materialsVal || "0") * 100);
  const totalCents = laborCents + materialsCents;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      laborCents,
      materialsCents,
      estimatedDays: days,
      warrantyDays,
      description: desc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Enviar Proposta Digital</h2>
            <p className="text-xs text-slate-500">Com proteção contratual Zeladoria Protege</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mão de Obra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={laborVal}
                onChange={(e) => setLaborVal(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Materiais / Peças (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={materialsVal}
                onChange={(e) => setMaterialsVal(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prazo Estimado (dias)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Garantia Informada (dias)</label>
              <input
                type="number"
                min="30"
                max="365"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(parseInt(e.target.value) || 90)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Mínimo legal CDC: 90 dias</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Detalhamento dos Serviços e Materiais</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs"
            />
          </div>

          {/* Resumo do Total */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-between">
            <span className="font-bold text-blue-900 text-xs">Valor Total da Proposta:</span>
            <span className="text-lg font-black text-[#0055D4]">R$ {(totalCents / 100).toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Enviando..." : "Enviar Proposta ao Morador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. MODAL: MORADOR FAZ O CHECKOUT DO SERVIÇO PRINCIPAL (PAGAMENTO B - ZELADORIA PROTEGE)
export function CustomerServiceCheckoutModal({
  isOpen,
  onClose,
  checkoutData,
  onSimulatePay,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  checkoutData: {
    orderCode: string;
    totalCents: number;
    platformFeeCents: number;
    netVendorCents: number;
    vendorName: string;
    warrantyDays?: number;
    contractHash?: string;
    pixCopiaECola?: string;
    pixQrCode?: string;
  } | null;
  onSimulatePay: (orderCode: string) => void;
  isPending: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !checkoutData) return null;

  const handleCopy = () => {
    if (checkoutData.pixCopiaECola) {
      navigator.clipboard.writeText(checkoutData.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
              <Icon name="shield" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Zeladoria Protege</h2>
              <p className="text-[11px] text-slate-500">Pagamento protegido com repasse após conclusão</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Resumo Financeiro */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Profissional:</span>
            <strong className="text-slate-900 font-bold">{checkoutData.vendorName}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Garantia Informada:</span>
            <strong className="text-emerald-700 font-bold">{checkoutData.warrantyDays || 90} dias (CDC)</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Contrato Digital:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
              {checkoutData.contractHash || "REGISTRADO"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-700">Valor Total do Serviço:</span>
            <span className="text-lg font-black text-emerald-700">
              R$ {(checkoutData.totalCents / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Selo Zeladoria Protege */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-emerald-900 text-xs">
          <Icon name="shield" size={16} className="text-emerald-700 shrink-0" />
          <p className="text-[11px]">
            <strong>Repasse condicionado:</strong> O valor fica retido no parceiro financeiro e só será transferido ao profissional após você confirmar que o serviço foi finalizado com sucesso.
          </p>
        </div>

        {/* QR Code Pix */}
        <div className="text-center space-y-3">
          <div className="inline-block p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            {checkoutData.pixQrCode ? (
              <img src={checkoutData.pixQrCode} alt="QR Code Pix" className="w-44 h-44 mx-auto object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                QR Code Pix
              </div>
            )}
          </div>

          {checkoutData.pixCopiaECola && (
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-600">Código Pix Copia e Cola:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={checkoutData.pixCopiaECola}
                  className="h-8 w-full px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-600 truncate font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0 cursor-pointer hover:bg-emerald-700"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé / Confirmação Segura */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {process.env.NODE_ENV !== "production" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onSimulatePay(checkoutData.orderCode)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="check-circle" size={14} />
              <span>{isPending ? "Processando..." : "[Sandbox/Dev] Simular Compensação Pix Webhook"}</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0055D4] flex items-center justify-center gap-2 font-medium">
              <Icon name="clock" size={15} className="text-[#0055D4] shrink-0" />
              <span>Aguardando detecção do Pix pelo Asaas PSP...</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Fechar Janela (Acompanhar no Painel)
          </button>
          <p className="text-[10px] text-center text-slate-400">
            Processado via Asaas PSP com Split Automatizado · Sem custódia informal
          </p>
        </div>
      </div>
    </div>
  );
}

// 6. MODAL: MORADOR ABRE CONTESTAÇÃO (MEDIAÇÃO)
export function CustomerDisputeModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (data: { reason: string; description: string }) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("Serviço incompleto");
  const [desc, setDesc] = useState("");

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSubmit({ reason, description: desc });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Icon name="alert" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Contestar Serviço</h2>
              <p className="text-xs text-slate-500">Zeladoria Protege: Mediação e Retenção</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Motivo da Contestação</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="Serviço incompleto">Serviço incompleto</option>
              <option value="Problema não resolvido">Problema não resolvido</option>
              <option value="Dano à unidade ou condomínio">Dano à unidade ou condomínio</option>
              <option value="Divergência de materiais">Divergência de materiais</option>
              <option value="Outro">Outro motivo</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Detalhes do Ocorrido</label>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              placeholder="Explique o que ocorreu para que a administração do condomínio possa mediar..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            Ao contestar, o repasse ao prestador é <strong>imediatamente bloqueado</strong> até que a administração ou síndico conclua a mediação com base nas evidências.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Abrindo contestação..." : "Confirmar Contestação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 7. MODAL: PRESTADOR REGISTRA FOTOS DE EVIDÊNCIA (ANTES, DURANTE, DEPOIS - Cláusula 36)
export function ProviderEvidenceModal({
  isOpen,
  onClose,
  requestId,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  onSubmit: (data: { stage: "ANTES" | "DURANTE" | "DEPOIS"; fileUrl: string; caption?: string }) => void;
  isPending: boolean;
}) {
  const [stage, setStage] = useState<"ANTES" | "DURANTE" | "DEPOIS">("ANTES");
  const [fileUrl, setFileUrl] = useState("");
  const [caption, setCaption] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;
    onSubmit({ stage, fileUrl, caption });
    setFileUrl("");
    setCaption("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-blue-50 text-[#0055D4] flex items-center justify-center font-black">
              <Icon name="camera" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Registrar Evidência Técnica</h2>
              <p className="text-[11px] text-slate-500">Fotos do serviço sob Zeladoria Protege</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Estágio da Foto</label>
            <div className="grid grid-cols-3 gap-2">
              {(["ANTES", "DURANTE", "DEPOIS"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`py-2 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                    stage === s
                      ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">URL da Imagem / Foto</label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
              placeholder="https://... ou caminho da foto no sistema"
              className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Legenda Técnica (Opcional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex: Fiação antiga antes da substituição"
              className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !fileUrl.trim()}
              className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Salvando..." : "Salvar Evidência"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 8. MODAL: PRESTADOR FINALIZA O SERVIÇO (PROVIDER_COMPLETED - Cláusula 39)
export function ProviderFinalizeModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (data: { finalNotes: string; finalPhotos?: string[]; warrantyDays?: number }) => void;
  isPending: boolean;
}) {
  const [finalNotes, setFinalNotes] = useState("Serviço executado conforme proposta técnica e testes operacionais realizados.");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [warrantyDays, setWarrantyDays] = useState(90);

  if (!isOpen || !request) return null;

  const handleAddPhoto = () => {
    if (photoUrl.trim()) {
      setPhotosList([...photosList, photoUrl.trim()]);
      setPhotoUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalNotes.trim()) return;
    onSubmit({
      finalNotes,
      finalPhotos: photosList,
      warrantyDays,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
              <Icon name="check-circle" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Finalizar Serviço</h2>
              <p className="text-[11px] text-slate-500">Chamado #{request.code} — {request.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Resumo do que foi executado</label>
            <textarea
              rows={3}
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              required
              placeholder="Descreva as tarefas concluídas, peças substituídas e testes..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Garantia Informada (Dias)</label>
            <select
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
            >
              <option value={90}>90 dias (Garantia Legal CDC Art. 26)</option>
              <option value={180}>180 dias (6 meses)</option>
              <option value={365}>365 dias (1 ano)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Fotos Finais da Entrega</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Cole a URL da foto de entrega..."
                className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
              >
                + Adicionar
              </button>
            </div>
            {photosList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {photosList.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] text-slate-700 font-medium truncate max-w-[200px]">
                    {p}
                    <button type="button" onClick={() => setPhotosList(photosList.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900">
            Ao finalizar, o morador será notificado para inspecionar o trabalho e clicar em <strong>"Tudo Certo!"</strong>, momento em que o repasse do split financeiro é liberado.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isPending || !finalNotes.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Finalizando..." : "Concluir Entrega do Serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 9. MODAL: COMPROVANTE OFICIAL DE CONTRATAÇÃO (Cláusula 53 - NÃO CHAMAR DE NOTA FISCAL)
export function CustomerContractReceiptModal({
  isOpen,
  onClose,
  receipt,
}: {
  isOpen: boolean;
  onClose: () => void;
  receipt: any;
}) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#0055D4] text-white flex items-center justify-center font-black">
              <Icon name="file-text" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">{receipt.receiptType}</h2>
              <p className="text-[10px] text-slate-500 font-mono">Código: {receipt.code}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Informações Oficiais */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Contratante (Morador)</span>
              <strong className="text-slate-900">{receipt.customer?.name}</strong>
              <span className="text-[11px] text-slate-500 block">{receipt.customer?.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Prestador Verificado</span>
              <strong className="text-slate-900">{receipt.provider?.name}</strong>
              <span className="text-[11px] text-slate-500 block">Doc: {receipt.provider?.cnpjOrCpf || "Cadastrado"}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Serviço:</span>
              <strong className="text-slate-900">{receipt.serviceTitle}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mão de Obra:</span>
              <span>R$ {((receipt.financial?.laborCents || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Materiais:</span>
              <span>R$ {((receipt.financial?.materialsCents || 0) / 100).toFixed(2)}</span>
            </div>
            {receipt.financial?.inspectionDiscountCents > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Crédito da Vistoria:</span>
                <span>- R$ {((receipt.financial?.inspectionDiscountCents || 0) / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>Valor Total Pago:</span>
              <span className="text-[#0055D4]">R$ {((receipt.financial?.totalCents || 0) / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
            <span>Garantia Contratual Ativa:</span>
            <strong className="font-black">{receipt.warranty?.days || 90} dias (CDC)</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 text-[10px] text-slate-500 leading-normal font-mono">
            Hash SHA-256: {receipt.contractHash || "N/A"}
          </div>

          <p className="text-[10px] text-slate-400 italic text-center">
            {receipt.receiptNotice}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="file-text" size={14} />
            <span>Imprimir / Salvar PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0055D4] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// 10. MODAL: MORADOR SOLICITA SUPORTE EM GARANTIA (Cláusula 50-51)
export function CustomerWarrantyRequestModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (description: string) => void;
  isPending: boolean;
}) {
  const [desc, setDesc] = useState("");

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSubmit(desc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
              <Icon name="shield" size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Solicitar Suporte em Garantia</h2>
              <p className="text-[11px] text-slate-500">Chamado #{request.code} — Zeladoria Protege</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Descreva o problema observado</label>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              placeholder="Explique o que ocorreu após a entrega do serviço para que o prestador realize o retorno sem custo adicional..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950">
            A garantia cobre defeitos decorrentes da mão de obra ou divergências de instalação pelo período contratado. O prestador será notificado para agendar o retorno técnico.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !desc.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
            >
              {isPending ? "Enviando..." : "Abrir Chamado de Garantia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
