"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { createOccurrenceAction } from "@/lib/actions/ocorrencias";
import {
  CATEGORIES_CATALOG,
  detectEmergency,
  generateSuggestedTitle,
  inferCategory,
  inferSeverity,
  type CategoryDefinition,
} from "@/lib/services/occurrence-inference";

import { CategoryPickerSheet } from "./components/category-picker-sheet";
import { EmergencyModal } from "./components/emergency-modal";
import { StepDescricaoFotos } from "./components/step-descricao-fotos";
import { StepLocalizacao, type LocationType } from "./components/step-localizacao";
import { StepRevisao } from "./components/step-revisao";
import { SuccessScreen } from "./components/success-screen";

const DRAFT_STORAGE_KEY = "zeladoria_ocorrencia_draft_v1";

interface UserUnitInfo {
  unitId: number;
  unitNumber: string;
  blockName: string | null;
  condoName: string;
}

interface CondoBlock {
  id: number;
  name: string;
  floors: number;
}

interface CondoAmenity {
  id: number;
  name: string;
}

interface NovaOcorrenciaFlowProps {
  userUnit: UserUnitInfo | null;
  condoName: string;
  blocks: CondoBlock[];
  amenities: CondoAmenity[];
  userName: string;
}

export function NovaOcorrenciaFlow({
  userUnit,
  condoName,
  blocks,
  amenities,
}: NovaOcorrenciaFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();

  // Campos do formulário
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState<CategoryDefinition>(CATEGORIES_CATALOG[0]);
  const [isCategoryManual, setIsCategoryManual] = useState(false);

  const [title, setTitle] = useState("");
  const [isTitleManual, setIsTitleManual] = useState(false);

  const [locationType, setLocationType] = useState<LocationType>(
    userUnit ? "unidade" : "area_comum"
  );
  const [locationString, setLocationString] = useState(
    userUnit
      ? `${userUnit.blockName ? `${userUnit.blockName} • ` : ""}Unidade ${userUnit.unitNumber}`
      : "Hall de Entrada"
  );
  const [locationDetail, setLocationDetail] = useState("");

  // Modais auxiliares
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Estados de erro e sucesso
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProtocol, setCreatedProtocol] = useState<string>("OC-00000");
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  const initialMountRef = useRef(false);

  // 1. Carregar rascunho do localStorage na inicialização
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.description || (parsed.photos && parsed.photos.length > 0)) {
          if (parsed.description) setDescription(parsed.description);
          if (parsed.photos && Array.isArray(parsed.photos)) setPhotos(parsed.photos);
          if (parsed.categoryKey) {
            const found = CATEGORIES_CATALOG.find((c) => c.key === parsed.categoryKey);
            if (found) {
              setCategory(found);
              setIsCategoryManual(true);
            }
          }
          if (parsed.title) {
            setTitle(parsed.title);
            setIsTitleManual(true);
          }
          if (parsed.locationType) setLocationType(parsed.locationType);
          if (parsed.locationString) setLocationString(parsed.locationString);
          if (parsed.locationDetail) setLocationDetail(parsed.locationDetail);
          setHasDraftNotice(true);
        }
      }
    } catch {
      // Ignora erro de JSON corrompido
    }
    initialMountRef.current = true;
  }, []);

  // 2. Salvar rascunho no localStorage automaticamente
  useEffect(() => {
    if (!initialMountRef.current || currentStep === 4) return;
    try {
      if (description.trim() || photos.length > 0) {
        const payload = {
          description,
          photos,
          categoryKey: category.key,
          title,
          locationType,
          locationString,
          locationDetail,
          updatedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // QuotaExceeded ou modo anônimo estrito
    }
  }, [
    description,
    photos,
    category,
    title,
    locationType,
    locationString,
    locationDetail,
    currentStep,
  ]);

  // 3. Inferência de Categoria e Emergência em tempo real
  useEffect(() => {
    if (!isCategoryManual && description.trim().length > 3) {
      const inferred = inferCategory(description);
      setCategory(inferred);
    }
  }, [description, isCategoryManual]);

  // 4. Inferência de Título automático a partir da descrição
  useEffect(() => {
    if (!isTitleManual && description.trim().length > 3) {
      const suggested = generateSuggestedTitle(description, category.label);
      setTitle(suggested);
    }
  }, [description, category.label, isTitleManual]);

  const emergencySignal = useMemo(() => {
    return detectEmergency(description);
  }, [description]);

  const severity = useMemo(() => {
    return inferSeverity(description);
  }, [description]);

  const handleSelectCategoryManual = (chosen: CategoryDefinition) => {
    setCategory(chosen);
    setIsCategoryManual(true);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDescription("");
      setPhotos([]);
      setTitle("");
      setIsCategoryManual(false);
      setIsTitleManual(false);
      setHasDraftNotice(false);
      if (userUnit) {
        setLocationType("unidade");
        setLocationString(`${userUnit.blockName ? `${userUnit.blockName} • ` : ""}Unidade ${userUnit.unitNumber}`);
      } else {
        setLocationType("area_comum");
        setLocationString("Hall de Entrada");
      }
      setLocationDetail("");
    } catch {
      // Ignora erro de storage
    }
  };

  const handleFinalSubmit = () => {
    setSubmitError(null);

    const effectiveTitle = title.trim() || generateSuggestedTitle(description, category.label);
    if (!description.trim()) {
      setSubmitError("Por favor, descreva o que aconteceu.");
      setCurrentStep(1);
      return;
    }
    if (!locationString.trim()) {
      setSubmitError("Por favor, informe onde o problema aconteceu.");
      setCurrentStep(2);
      return;
    }

    const exactLocationFormatted = locationDetail.trim()
      ? `${locationString} (${locationDetail.trim()})`
      : locationString;

    const formData = new FormData();
    formData.set("title", effectiveTitle);
    formData.set("description", description.trim());
    formData.set("exactLocation", exactLocationFormatted);
    formData.set("category", category.key);
    formData.set("severity", severity);
    formData.set("attachments", JSON.stringify(photos));

    startTransition(async () => {
      try {
        const res = await createOccurrenceAction(formData);
        if (res?.success) {
          // Limpa rascunho
          try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          } catch {
            // Ignora
          }
          setCreatedProtocol(res.code || "OC-00000");
          setCurrentStep(4);
        } else {
          setSubmitError(res?.error || "Erro ao registrar ocorrência. Tente novamente.");
        }
      } catch {
        setSubmitError("Erro de comunicação ao registrar ocorrência. Verifique sua conexão e tente novamente.");
      }
    });
  };

  const resetAll = () => {
    setDescription("");
    setPhotos([]);
    setTitle("");
    setIsCategoryManual(false);
    setIsTitleManual(false);
    setSubmitError(null);
    setCurrentStep(1);
  };

  const locationSummaryDisplay = locationDetail.trim()
    ? `${locationString} (${locationDetail.trim()})`
    : locationString;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header Padronizado */}
      <PageHeader
        icon="plus"
        title="Registrar Ocorrência"
        description="Conte o que aconteceu. O Zeladoria organiza o restante para você."
        actions={
          <Link
            href="/painel/ocorrencias"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors shadow-2xs"
          >
            <Icon name="arrow-left" size={13} />
            <span>Voltar para ocorrências</span>
          </Link>
        }
      />

      {/* Aviso Discreto de Rascunho Recuperado */}
      {hasDraftNotice && currentStep !== 4 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0055D4]">
          <div className="flex items-center gap-2">
            <Icon name="file-text" size={15} />
            <span>Seu rascunho anterior foi recuperado automaticamente.</span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="font-bold text-red-600 hover:text-red-700 hover:underline shrink-0"
          >
            Descartar rascunho
          </button>
        </div>
      )}

      {/* Barra de Progresso em 3 Etapas */}
      {currentStep !== 4 && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 1
                  ? "bg-[#0070F3] text-white shadow-2xs"
                  : currentStep > 1
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span
              className={`font-bold ${
                currentStep === 1 ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Problema
            </span>
          </div>

          <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 2
                  ? "bg-[#0070F3] text-white shadow-2xs"
                  : currentStep > 2
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStep > 2 ? "✓" : "2"}
            </span>
            <span
              className={`font-bold ${
                currentStep === 2 ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Local
            </span>
          </div>

          <div className="h-0.5 w-8 sm:w-16 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 3
                  ? "bg-[#0070F3] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </span>
            <span
              className={`font-bold ${
                currentStep === 3 ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Confirmar
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo das Etapas */}
      {currentStep === 1 && (
        <StepDescricaoFotos
          description={description}
          onChangeDescription={setDescription}
          category={category}
          onOpenCategoryPicker={() => setIsCategoryPickerOpen(true)}
          photos={photos}
          onAddPhotos={(newPhotos) => setPhotos((prev) => [...prev, ...newPhotos])}
          onRemovePhoto={(idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
          emergency={emergencySignal}
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <StepLocalizacao
          locationType={locationType}
          onChangeLocationType={setLocationType}
          locationString={locationString}
          onChangeLocationString={setLocationString}
          locationDetail={locationDetail}
          onChangeLocationDetail={setLocationDetail}
          userUnit={userUnit}
          blocks={blocks}
          amenities={amenities}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 3 && (
        <StepRevisao
          title={title || generateSuggestedTitle(description, category.label)}
          onChangeTitle={(val) => {
            setTitle(val);
            setIsTitleManual(true);
          }}
          description={description}
          category={category}
          locationSummary={locationSummaryDisplay}
          photos={photos}
          severity={severity}
          isSubmitting={isPending}
          submitError={submitError}
          onEditStep1={() => setCurrentStep(1)}
          onEditStep2={() => setCurrentStep(2)}
          onSubmit={handleFinalSubmit}
        />
      )}

      {currentStep === 4 && (
        <SuccessScreen
          code={createdProtocol}
          title={title || "Ocorrência registrada"}
          location={locationSummaryDisplay}
          categoryLabel={category.label}
          onReset={resetAll}
        />
      )}

      {/* Modal / Seletor de Categoria */}
      <CategoryPickerSheet
        isOpen={isCategoryPickerOpen}
        selectedKey={category.key}
        onSelect={handleSelectCategoryManual}
        onClose={() => setIsCategoryPickerOpen(false)}
      />

      {/* Modal de Emergência */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        reason={emergencySignal.reason}
      />
    </div>
  );
}
