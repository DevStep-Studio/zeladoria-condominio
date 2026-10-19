"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { updateProviderDocumentsAction } from "@/lib/actions/prestador";
import { CameraCaptureModal, type CaptureMode } from "@/components/camera/camera-capture-modal";

interface IdentityVerificationData {
  documentType?: "cnh" | "rg";
  frontUrl?: string;
  backUrl?: string;
  selfieUrl?: string;
  status?: "pendente" | "em_analise" | "aprovado" | "rejeitado" | "reenvio_solicitado";
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export function ProviderDocumentosClient({ vendor }: { vendor: any }) {
  const existingVerification: IdentityVerificationData =
    typeof vendor?.identity_verification === "string"
      ? JSON.parse(vendor.identity_verification || "{}")
      : vendor?.identity_verification || {};

  const isVerified = Boolean(vendor?.verified);
  const currentStatus =
    existingVerification.status ||
    (isVerified ? "aprovado" : vendor?.onboarding_status === "em_analise" ? "em_analise" : "pendente");

  const [documentType, setDocumentType] = useState<"cnh" | "rg">(
    existingVerification.documentType || "cnh"
  );
  const [docFrontUrl, setDocFrontUrl] = useState<string>(existingVerification.frontUrl || "");
  const [docBackUrl, setDocBackUrl] = useState<string>(existingVerification.backUrl || "");
  const [selfieUrl, setSelfieUrl] = useState<string>(existingVerification.selfieUrl || "");

  const [activeCameraModal, setActiveCameraModal] = useState<CaptureMode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (target === "front") setDocFrontUrl(result);
      if (target === "back") setDocBackUrl(result);
      if (target === "selfie") setSelfieUrl(result);
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!docFrontUrl && !selfieUrl) {
      setSaveError("Anexe ao menos a frente do documento ou sua selfie para enviar à moderação.");
      return;
    }

    startTransition(async () => {
      const res = await updateProviderDocumentsAction({
        documentType,
        frontUrl: docFrontUrl.trim() || undefined,
        backUrl: docBackUrl.trim() || undefined,
        selfieUrl: selfieUrl.trim() || undefined,
      });

      if (!res.success) {
        setSaveError(res.error || "Erro ao salvar documentação.");
        return;
      }

      setSaveSuccess(true);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Icon name="shield" size={24} className="text-[#1355FF]" />
          <span>Documentos & Verificação de Identidade</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gerencie seus documentos cadastrais para validação e obtenção do selo de profissional verificado.
        </p>
      </div>

      {/* Banner de Status */}
      {isVerified || currentStatus === "aprovado" ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
            <Icon name="check-circle" size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-emerald-950">Cadastro Verificado e Aprovado</h2>
            <p className="text-xs text-emerald-800">
              Sua identidade foi verificada pela moderação da Zeladoria. Seu perfil exibe o selo de verificação para todos os moradores e síndicos.
            </p>
          </div>
        </div>
      ) : currentStatus === "em_analise" ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
            <Icon name="clock" size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-950">Documentos em Análise</h2>
            <p className="text-xs text-amber-800">
              Nossa equipe de segurança e moderação está analisando os arquivos enviados. Esse processo costuma levar até 24 horas úteis.
            </p>
          </div>
        </div>
      ) : currentStatus === "rejeitado" ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
            <Icon name="x-circle" size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-rose-950">Pendência na Documentação</h2>
            <p className="text-xs text-rose-800">
              {existingVerification.rejectionReason ||
                "Um ou mais documentos estavam ilegíveis ou divergentes. Por favor, tire fotos nítidas e reenvie para nova análise."}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#1355FF] text-white shrink-0 mt-0.5">
            <Icon name="shield" size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-blue-950">Envio de Documentos Pendente</h2>
            <p className="text-xs text-blue-800">
              Envie a foto do seu documento e sua selfie para receber o selo de profissional verificado e aumentar a preferência dos moradores.
            </p>
          </div>
        </div>
      )}

      {/* Tipo de Documento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">Tipo de Documento</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="documentType"
                checked={documentType === "cnh"}
                onChange={() => setDocumentType("cnh")}
              />
              <span>CNH (Carteira Nacional de Habilitação)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="documentType"
                checked={documentType === "rg"}
                onChange={() => setDocumentType("rg")}
              />
              <span>RG com CPF</span>
            </label>
          </div>
        </div>

        {/* 3 Cards de Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Frente */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Icon name="file-text" size={14} className="text-[#1355FF]" />
                <span>Frente do Documento (ou PDF)</span>
              </label>
              {docFrontUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Carregado
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">Pendente</span>
              )}
            </div>

            {docFrontUrl ? (
              <div className="space-y-2">
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                  {docFrontUrl.startsWith("data:image/") || docFrontUrl.startsWith("http") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={docFrontUrl}
                      alt="Frente do Documento"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="p-3 text-xs font-mono text-slate-600 truncate">
                      Documento PDF / Arquivo carregado
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("document_front")}
                    className="text-[#1355FF] hover:underline font-semibold cursor-pointer"
                  >
                    Tirar nova foto
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setDocFrontUrl("")}
                    className="text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("document_front")}
                    className="flex-1 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1355FF] border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Icon name="camera" size={14} />
                    <span>Usar Câmera</span>
                  </button>
                  <label className="flex-1 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <Icon name="file" size={14} />
                    <span>Arquivo / PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, "front")}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Certifique-se de que o nome e números estejam nítidos.</p>
              </div>
            )}
          </div>

          {/* Card 2: Verso */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Icon name="file-text" size={14} className="text-[#1355FF]" />
                <span>Verso do Documento</span>
              </label>
              {docBackUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Carregado
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">Opcional</span>
              )}
            </div>

            {docBackUrl ? (
              <div className="space-y-2">
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                  {docBackUrl.startsWith("data:image/") || docBackUrl.startsWith("http") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={docBackUrl}
                      alt="Verso do Documento"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="p-3 text-xs font-mono text-slate-600 truncate">
                      Documento PDF / Arquivo carregado
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("document_back")}
                    className="text-[#1355FF] hover:underline font-semibold cursor-pointer"
                  >
                    Tirar nova foto
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setDocBackUrl("")}
                    className="text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("document_back")}
                    className="flex-1 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1355FF] border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Icon name="camera" size={14} />
                    <span>Usar Câmera</span>
                  </button>
                  <label className="flex-1 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <Icon name="file" size={14} />
                    <span>Arquivo / PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, "back")}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Onde constam os números de registro e filiação.</p>
              </div>
            )}
          </div>

          {/* Card 3: Selfie com Documento */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Icon name="user" size={14} className="text-[#1355FF]" />
                <span>Selfie Segurando o Documento</span>
              </label>
              {selfieUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Carregado
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">Pendente</span>
              )}
            </div>

            {selfieUrl ? (
              <div className="space-y-2 text-center">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-white border-2 border-[#1355FF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selfieUrl}
                    alt="Selfie com Documento"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("selfie")}
                    className="text-[#1355FF] hover:underline font-semibold cursor-pointer"
                  >
                    Tirar outra selfie
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSelfieUrl("")}
                    className="text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveCameraModal("selfie")}
                    className="flex-1 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1355FF] border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Icon name="camera" size={14} />
                    <span>Abrir Câmera Frontal</span>
                  </button>
                  <label className="flex-1 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <Icon name="file" size={14} />
                    <span>Carregar Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "selfie")}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Segure o documento ao lado do rosto em ambiente claro para comprovação facial.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {saveError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Icon name="alert-triangle" size={14} className="shrink-0 text-rose-600" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Icon name="check-circle" size={14} className="shrink-0 text-emerald-600" />
            <span>Documentos salvos com sucesso e enviados para análise da moderação!</span>
          </div>
        )}

        {/* Botão de Salvar */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <span>Enviando documentos...</span>
            ) : (
              <>
                <Icon name="check" size={14} />
                <span>Salvar e Enviar para Análise</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Câmera */}
      {activeCameraModal && (
        <CameraCaptureModal
          isOpen={true}
          mode={activeCameraModal}
          onClose={() => setActiveCameraModal(null)}
          onConfirm={(dataUrl: string) => {
            if (activeCameraModal === "document_front") setDocFrontUrl(dataUrl);
            if (activeCameraModal === "document_back") setDocBackUrl(dataUrl);
            if (activeCameraModal === "selfie") setSelfieUrl(dataUrl);
            setActiveCameraModal(null);
            setSaveSuccess(false);
          }}
        />
      )}
    </div>
  );
}
