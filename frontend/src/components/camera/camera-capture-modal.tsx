"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

export type CaptureMode = "document_front" | "document_back" | "document_pdf" | "selfie";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CaptureMode;
  onConfirm: (dataUrl: string, fileType?: string) => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  mode,
  onConfirm,
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(
    mode === "selfie" ? "user" : "environment"
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Câmera não suportada neste dispositivo. Utilize o envio de arquivo.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        "Não foi possível acessar a câmera (permissão negada ou dispositivo indisponível). Use o envio de arquivo."
      );
    }
  }, [cameraFacing, stopCamera]);

  // Iniciar câmera quando o modal abrir
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing, mode, startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Se câmera frontal, espelhar para selfie natural
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onConfirm(capturedImage, "image/jpeg");
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo selecionado deve ter no máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onConfirm(result, file.type);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const titleMap: Record<CaptureMode, string> = {
    document_front: "Frente do Documento (CNH ou RG)",
    document_back: "Verso do Documento",
    document_pdf: "Envio de Documento Digital (PDF)",
    selfie: "Selfie de Confirmação do Titular",
  };

  const instructionsMap: Record<CaptureMode, string> = {
    document_front: "Posicione a frente do documento dentro da moldura retangular. Evite sombras e reflexos.",
    document_back: "Posicione o verso do documento mostrando os dados e o número de registro.",
    document_pdf: "Envie a CNH ou RG digital exportado diretamente do aplicativo Gov.br em formato PDF.",
    selfie: "Mantenha o rosto centralizado no círculo. Retire óculos, bonés ou acessórios e olhe para a câmera.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
              <Icon name={mode === "selfie" ? "user" : "camera"} size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900">{titleMap[mode]}</h3>
              <p className="text-[10px] text-slate-500">Zeladoria Protege · Verificação Segura</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            title="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body Viewport */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
            <Icon name="alert-triangle" size={14} className="shrink-0 text-[#1355FF] mt-0.5" />
            <span>{instructionsMap[mode]}</span>
          </p>

          <div className="relative aspect-4/3 w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
            {capturedImage ? (
              // Preview da Foto Capturada
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-contain"
              />
            ) : cameraError ? (
              // Erro / Câmera Indisponível
              <div className="text-center p-6 space-y-3">
                <Icon name="alert-triangle" size={28} className="mx-auto text-amber-400" />
                <p className="text-xs text-slate-200 max-w-xs mx-auto leading-relaxed">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Icon name="folder" size={14} />
                  <span>Selecionar Arquivo do Dispositivo</span>
                </button>
              </div>
            ) : (
              // Câmera ao Vivo com Guias Visuais
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraFacing === "user" ? "scale-x-[-1]" : ""
                  }`}
                />

                {/* Guia Visual Sobreposta */}
                {mode === "selfie" ? (
                  // Guia Oval / Circular para Rosto
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-56 w-44 rounded-full border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full mt-36">
                        Centralize o rosto
                      </span>
                    </div>
                  </div>
                ) : (
                  // Guia Retangular para Documento
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-52 w-80 max-w-[85%] rounded-xl border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-0.5 rounded-full">
                        Enquadre o documento
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hidden File Input para alternativa */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Controles de Ação */}
          <div className="flex items-center justify-between pt-1 gap-2">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="folder" size={14} />
                  <span className="hidden sm:inline">Enviar</span> Arquivo
                </button>

                <div className="flex items-center gap-2">
                  {/* Botão de Alternar Câmera */}
                  <button
                    type="button"
                    onClick={() =>
                      setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))
                    }
                    className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Alternar Câmera"
                  >
                    <Icon name="refresh" size={14} />
                  </button>

                  {/* Botão Principal de Disparo */}
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={!!cameraError}
                    className="h-10 px-5 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Icon name="camera" size={16} />
                    <span>Fotografar</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="refresh" size={14} />
                  <span>Repetir Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="h-10 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Icon name="check" size={16} />
                  <span>Confirmar e Usar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
