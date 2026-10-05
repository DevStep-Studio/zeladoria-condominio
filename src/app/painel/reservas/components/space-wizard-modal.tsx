"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Icon, type IconName } from "@/components/icon";
import { money } from "@/lib/utils";
import { saveAmenityAction } from "@/lib/actions/reservas";
import type { Amenity } from "../types";

interface SpaceWizardModalProps {
  space?: Amenity | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "churrasqueira", label: "Churrasqueira", icon: "flame" as IconName },
  { id: "salao", label: "Salão de Festas", icon: "wine" as IconName },
  { id: "quadra", label: "Quadra Esportiva", icon: "activity" as IconName },
  { id: "piscina", label: "Piscina", icon: "sun" as IconName },
  { id: "coworking", label: "Coworking & Reuniões", icon: "coffee" as IconName },
  { id: "playground", label: "Playground & Kids", icon: "sparkles" as IconName },
  { id: "outro", label: "Outro Espaço", icon: "grid" as IconName },
];

const AVAILABLE_FEATURES = [
  { id: "wifi", label: "Wi-Fi dedicado" },
  { id: "ar_condicionado", label: "Ar-condicionado" },
  { id: "churrasqueira", label: "Churrasqueira a carvão" },
  { id: "geladeira", label: "Geladeira / Freezer" },
  { id: "cozinha", label: "Cozinha completa" },
  { id: "mesas", label: "Mesas e cadeiras" },
  { id: "cadeiras", label: "Cadeiras extras" },
  { id: "tv", label: "Smart TV" },
  { id: "projetor", label: "Projetor multimídia" },
  { id: "banheiro", label: "Sanitários privativos" },
  { id: "acessibilidade", label: "Acessibilidade PCD" },
  { id: "iluminacao", label: "Iluminação em LED" },
  { id: "vestiario", label: "Vestiários" },
  { id: "brinquedos", label: "Brinquedos infantis" },
  { id: "som", label: "Som ambiente" },
];

export function SpaceWizardModal({ space, onClose, onSuccess }: SpaceWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(space?.name || "");
  const [category, setCategory] = useState(space?.category || "churrasqueira");
  const [description, setDescription] = useState(space?.description || "");
  const [capacity, setCapacity] = useState<number>(space?.capacity || 25);

  const [coverImage, setCoverImage] = useState(
    space?.images?.[0] || "/amenities/churrasqueira.jpg"
  );
  const [gallery, setGallery] = useState(
    space?.images && space.images.length > 1 ? space.images.slice(1).join("\n") : ""
  );

  const [openTime, setOpenTime] = useState(space?.openTime?.slice(0, 5) || "08:00");
  const [closeTime, setCloseTime] = useState(space?.closeTime?.slice(0, 5) || "22:00");

  const [reservationModel, setReservationModel] = useState(
    space?.reservationModel || "horario_livre"
  );
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(
    space?.slotDurationMinutes || 120
  );

  const [pricingType, setPricingType] = useState(space?.pricingType || "gratis");
  const [feeCents, setFeeCents] = useState(
    space?.feeCents ? (space.feeCents / 100).toFixed(2).replace(".", ",") : "0,00"
  );
  const [depositCents, setDepositCents] = useState(
    space?.depositCents ? (space.depositCents / 100).toFixed(2).replace(".", ",") : "0,00"
  );

  const [requiresApproval, setRequiresApproval] = useState<boolean>(
    space?.requiresApproval ?? true
  );

  const [minAdvanceHours, setMinAdvanceHours] = useState<number>(space?.minAdvanceHours ?? 2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(space?.maxAdvanceDays ?? 60);
  const [limitPerUnit, setLimitPerUnit] = useState<number>(space?.limitPerUnit ?? 2);
  const [limitInterval, setLimitInterval] = useState(space?.limitInterval || "mes");
  const [intervalMinutes, setIntervalMinutes] = useState<number>(space?.intervalMinutes ?? 30);
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState<number>(
    space?.cancellationDeadlineHours ?? 24
  );
  const [requestGuestList, setRequestGuestList] = useState<boolean>(
    space?.requestGuestList ?? false
  );

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    space?.features || ["wifi", "banheiro", "acessibilidade"]
  );

  const [rules, setRules] = useState(
    space?.rules ||
      "• Permitido som moderado até as 22h.\n• Deixar o espaço limpo e recolher o lixo após o uso.\n• Respeitar a capacidade máxima de pessoas."
  );

  const [isPending, startTransition] = useTransition();

  const toggleFeature = (featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
  };

  const handleSave = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage("Por favor, preencha o nome do espaço.");
      setCurrentStep(1);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (space?.id) formData.set("id", String(space.id));
      formData.set("name", name);
      formData.set("category", category);
      formData.set("description", description);
      formData.set("capacity", String(capacity));
      formData.set("coverImage", coverImage);
      formData.set("gallery", gallery);
      formData.set("openTime", openTime);
      formData.set("closeTime", closeTime);
      formData.set("reservationModel", reservationModel);
      formData.set("slotDurationMinutes", String(slotDurationMinutes));
      formData.set("pricingType", pricingType);
      formData.set("feeCents", feeCents);
      formData.set("depositCents", depositCents);
      formData.set("requiresApproval", requiresApproval ? "true" : "false");
      formData.set("minAdvanceHours", String(minAdvanceHours));
      formData.set("maxAdvanceDays", String(maxAdvanceDays));
      formData.set("limitPerUnit", String(limitPerUnit));
      formData.set("limitInterval", limitInterval);
      formData.set("intervalMinutes", String(intervalMinutes));
      formData.set("cancellationDeadlineHours", String(cancellationDeadlineHours));
      formData.set("requestGuestList", requestGuestList ? "true" : "false");
      formData.set("features", selectedFeatures.join(","));
      formData.set("rules", rules);

      const res = await saveAmenityAction(formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao salvar o espaço.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
        
        {/* Wizard Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {space ? `Editar Espaço: ${space.name}` : "Cadastrar Novo Espaço Comum"}
            </h2>
            <p className="text-xs text-slate-500">
              Etapa {currentStep} de 9 · {
                currentStep === 1 ? "Informações Básicas" :
                currentStep === 2 ? "Fotos & Capa" :
                currentStep === 3 ? "Horários de Funcionamento" :
                currentStep === 4 ? "Modelo de Agendamento" :
                currentStep === 5 ? "Preço & Caução" :
                currentStep === 6 ? "Aprovação" :
                currentStep === 7 ? "Regras Operacionais" :
                currentStep === 8 ? "Regulamento & Recursos" :
                "Revisão & Publicação"
              }
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: INFORMAÇÕES */}
          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="label">Nome do Espaço *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Salão de Festas Gourmet, Quadra de Tênis..."
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="label">Categoria do Espaço</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        category === cat.id
                          ? "border-[#0055D4] bg-blue-50 text-[#0055D4] shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon name={cat.icon} size={15} />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Capacidade Máxima de Pessoas</label>
                <input
                  type="number"
                  value={capacity}
                  min={1}
                  max={500}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Descrição Curta para os Moradores</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Descreva o ambiente, principais atrativos e recomendações de uso..."
                  className="input w-full text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: FOTOS */}
          {currentStep === 2 && (
            <div className="space-y-3.5">
              <div>
                <label className="label">Foto Principal (Capa)</label>
                <select
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="input w-full text-xs"
                >
                  <option value="/amenities/churrasqueira.jpg">Churrasqueira Gourmet</option>
                  <option value="/amenities/salao-festas.jpg">Salão de Festas Nobre</option>
                  <option value="/amenities/quadra.jpg">Quadra Poliesportiva</option>
                  <option value="/amenities/coworking.jpg">Espaço Coworking & Reuniões</option>
                  <option value="/amenities/piscina.jpg">Piscina & Deck</option>
                  <option value="/amenities/academia.jpg">Academia & Fitness</option>
                </select>
              </div>

              {/* Cover Preview */}
              <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <Image src={coverImage} alt="Preview" fill className="object-cover" />
              </div>

              <div>
                <label className="label">Outras Fotos da Galeria (1 link por linha)</label>
                <textarea
                  value={gallery}
                  onChange={(e) => setGallery(e.target.value)}
                  rows={2}
                  placeholder="/amenities/salao-festas.jpg"
                  className="input w-full font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 3: HORÁRIOS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Horário de Abertura *</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Horário de Fechamento *</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Aplicado de Segunda a Domingo</p>
                <p>Os condôminos só poderão selecionar períodos compreendidos entre {openTime} e {closeTime}.</p>
              </div>
            </div>
          )}

          {/* STEP 4: MODELO DE RESERVA */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <label className="label">Selecione o Modelo Operacional</label>
              
              <div className="space-y-2">
                {[
                  {
                    id: "horario_livre",
                    title: "Horário Livre",
                    desc: "O morador escolhe o horário de início e término livremente dentro da janela de funcionamento.",
                  },
                  {
                    id: "slot_fixo",
                    title: "Slots / Turnos Fixos",
                    desc: "O sistema divide o dia em blocos pré-definidos (ex: 2 em 2 horas).",
                  },
                  {
                    id: "periodo_unico",
                    title: "Período Fechado / Diária Única",
                    desc: "Uma única reserva por dia ocupa todo o período permitido (ideal para Salões de Festas).",
                  },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                      reservationModel === m.id
                        ? "border-[#0055D4] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reservationModel"
                      checked={reservationModel === m.id}
                      onChange={() => setReservationModel(m.id)}
                      className="mt-1 h-4 w-4 text-[#0055D4]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {reservationModel === "slot_fixo" && (
                <div>
                  <label className="label">Duração de Cada Slot (minutos)</label>
                  <input
                    type="number"
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                    className="input w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PREÇO & CAUÇÃO */}
          {currentStep === 5 && (
            <div className="space-y-3.5">
              <div>
                <label className="label">Tipo de Cobrança</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingType("gratis")}
                    className={`rounded-xl border p-3 text-xs font-bold ${
                      pricingType === "gratis"
                        ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    Uso Gratuito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType("fixo")}
                    className={`rounded-xl border p-3 text-xs font-bold ${
                      pricingType === "fixo"
                        ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    Taxa Fixa por Reserva
                  </button>
                </div>
              </div>

              {pricingType !== "gratis" && (
                <div>
                  <label className="label">Valor da Taxa de Uso (R$)</label>
                  <input
                    type="text"
                    value={feeCents}
                    onChange={(e) => setFeeCents(e.target.value)}
                    placeholder="80,00"
                    className="input w-full"
                  />
                </div>
              )}

              <div>
                <label className="label">Caução de Garantia / Vistoria (R$ - opcional)</label>
                <input
                  type="text"
                  value={depositCents}
                  onChange={(e) => setDepositCents(e.target.value)}
                  placeholder="0,00"
                  className="input w-full"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Valor estornável após a vistoria pós-evento.
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: APROVAÇÃO */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <label className="label">Modo de Aprovação</label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  !requiresApproval
                    ? "border-[#0055D4] bg-blue-50/50 shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="approval"
                  checked={!requiresApproval}
                  onChange={() => setRequiresApproval(false)}
                  className="mt-1 h-4 w-4 text-[#0055D4]"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Confirmação Automática Imediata</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Se o horário estiver disponível, o morador recebe confirmação instantânea.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  requiresApproval
                    ? "border-[#0055D4] bg-blue-50/50 shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="approval"
                  checked={requiresApproval}
                  onChange={() => setRequiresApproval(true)}
                  className="mt-1 h-4 w-4 text-[#0055D4]"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Exige Aprovação do Síndico / Gestão</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    A reserva entra como pendente e só é confirmada após validação da administração.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 7: REGRAS OPERACIONAIS */}
          {currentStep === 7 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Antecedência Mínima (horas)</label>
                  <input
                    type="number"
                    value={minAdvanceHours}
                    onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                    className="input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="label">Antecedência Máxima (dias)</label>
                  <input
                    type="number"
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Limite de Reservas / Unidade</label>
                  <input
                    type="number"
                    value={limitPerUnit}
                    onChange={(e) => setLimitPerUnit(Number(e.target.value))}
                    className="input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="label">Intervalo de Limpeza (min)</label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label">Prazo Limite para Cancelamento (horas antes)</label>
                <input
                  type="number"
                  value={cancellationDeadlineHours}
                  onChange={(e) => setCancellationDeadlineHours(Number(e.target.value))}
                  className="input w-full text-xs"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestGuestList}
                  onChange={(e) => setRequestGuestList(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0055D4]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Solicitar lista nominal de convidados na reserva
                </span>
              </label>
            </div>
          )}

          {/* STEP 8: REGULAMENTO & COMODIDADES */}
          {currentStep === 8 && (
            <div className="space-y-3.5">
              <div>
                <label className="label">Recursos & Comodidades Disponíveis</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                  {AVAILABLE_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.id);
                    return (
                      <button
                        key={feat.id}
                        type="button"
                        onClick={() => toggleFeature(feat.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-left transition-all ${
                          isChecked
                            ? "bg-blue-50 text-[#0055D4] font-bold"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon name={isChecked ? "check-circle" : "plus"} size={13} />
                        <span>{feat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">Regulamento Interno do Espaço</label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  rows={4}
                  placeholder="Descreva as regras de convivência, som, horários e conservação..."
                  className="input w-full text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 9: REVISÃO & PUBLICAR */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#0055D4]">
                      {category.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{name || "Nome do Espaço"}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900">
                      {pricingType === "gratis" ? "Grátis" : `R$ ${feeCents}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <p><strong>Capacidade:</strong> {capacity} pessoas</p>
                  <p><strong>Horário:</strong> {openTime} às {closeTime}</p>
                  <p><strong>Modelo:</strong> {reservationModel.replace("_", " ")}</p>
                  <p><strong>Aprovação:</strong> {requiresApproval ? "Sim (Síndico)" : "Automática"}</p>
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                    {selectedFeatures.map((f) => (
                      <span key={f} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center">
                Ao publicar, o espaço estará disponível imediatamente para todos os moradores autorizados.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Buttons */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 bg-slate-50">
          <button
            type="button"
            disabled={isPending || currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="btn-secondary text-xs disabled:opacity-40"
          >
            Voltar
          </button>

          {currentStep < 9 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(9, prev + 1))}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <span>Avançar</span>
              <Icon name="arrow-right" size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="btn-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Icon name="check" size={15} />
              <span>{isPending ? "Salvando..." : space ? "Salvar Alterações" : "Publicar Espaço"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
