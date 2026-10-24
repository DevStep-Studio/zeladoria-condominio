"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { PrivacyModal } from "@/components/privacy-modal";
import {
  COMMERCIAL_SUBJECTS,
  getCommercialWhatsAppInfo,
  type CommercialSubject,
} from "@/lib/commercial-utils";
import { submitCommercialLeadAction } from "@/lib/actions/commercial";

interface CommercialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommercialModal({ isOpen, onClose }: CommercialModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState<CommercialSubject | "">("");
  const [honeypot, setHoneypot] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [whatsappAlert, setWhatsappAlert] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Informações do WhatsApp comercial oficial
  const whatsappInfo = getCommercialWhatsAppInfo();

  // Bloqueio de scroll do body e foco no primeiro campo ao abrir
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPrivacy) {
          setShowPrivacy(false);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, showPrivacy]);

  const handleClose = () => {
    setFieldErrors({});
    setGeneralError(null);
    setWhatsappAlert(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 2) {
      clientErrors.nome = "Informe seu nome completo.";
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      clientErrors.email = "Informe um endereço de e-mail válido.";
    }
    if (!assunto) {
      clientErrors.assunto = "Selecione o assunto.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitCommercialLeadAction({
          nome,
          email,
          assunto,
          empresa_website: honeypot,
        });

        if (result.success) {
          setIsSuccess(true);
        } else {
          if (result.errors) {
            setFieldErrors(result.errors);
          }
          setGeneralError(result.message || "Não foi possível enviar a solicitação. Tente novamente.");
        }
      } catch (err) {
        console.error("Erro na submissão comercial:", err);
        setGeneralError("Houve uma instabilidade temporária na conexão. Por favor, tente novamente.");
      }
    });
  };

  const handleWhatsAppClick = () => {
    if (whatsappInfo.configured && whatsappInfo.url) {
      window.open(whatsappInfo.url, "_blank", "noopener,noreferrer");
    } else {
      setWhatsappAlert(
        "O canal comercial direto via WhatsApp está em fase final de homologação técnica pela administração. Por favor, envie sua solicitação pelo formulário para atendimento imediato."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commercial-modal-title"
        aria-describedby="commercial-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs transition-opacity duration-300 font-sans antialiased"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isPending) {
            handleClose();
          }
        }}
      >
        <div
          ref={modalContainerRef}
          className="relative w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col focus:outline-none animate-in zoom-in-95 duration-200"
        >
          {/* Botão de Fechar no canto superior */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Fechar modal"
          >
            <Icon name="x" size={20} />
          </button>

          {/* ESTADO DE SUCESSO */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1355FF] border border-blue-100 shadow-2xs">
                  <Icon name="check-circle" size={36} strokeWidth={2.2} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                  Solicitação enviada com sucesso!
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.
                </p>
              </div>

              {/* Card Resumo do Envio */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left text-xs space-y-2.5 text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">Nome:</span>
                  <span className="font-bold text-slate-900">{nome}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">E-mail:</span>
                  <span className="font-bold text-slate-900 font-mono">{email}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-400 font-medium">Assunto:</span>
                  <span className="font-bold text-[#1355FF]">{assunto}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-13 rounded-2xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-sm font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  Concluir e voltar ao Login
                </button>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO COMERCIAL REORGANIZADO */
            <div className="space-y-5">
              {/* Cabeçalho */}
              <div className="pr-8 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#1355FF] text-[11px] font-bold">
                  <Icon name="sparkles" size={12} />
                  <span>Atendimento Comercial</span>
                </div>
                <h2
                  id="commercial-modal-title"
                  className="text-xl sm:text-[24px] font-black text-[#0F172A] tracking-tight leading-snug"
                >
                  Vamos conversar sobre seu condomínio?
                </h2>
                <p
                  id="commercial-modal-desc"
                  className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed"
                >
                  Conheça nossas soluções para gestão condominial, controle de acessos, portaria e serviços de zeladoria.
                  Nossa equipe está pronta para ajudar.
                </p>
              </div>

              {/* Alerta de erro geral */}
              {generalError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-in fade-in"
                >
                  <Icon name="alert-triangle" size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{generalError}</span>
                </div>
              )}

              {/* Alerta informativo de WhatsApp quando não configurado */}
              {whatsappAlert && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900 animate-in fade-in"
                >
                  <Icon name="help" size={16} className="text-[#1355FF] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">Configuração de Canal Oficial</p>
                    <p className="leading-relaxed text-slate-600">{whatsappAlert}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
                {/* Campo Honeypot invisível (anti-spam para bots) */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
                  <label htmlFor="empresa_website">Não preencha este campo</label>
                  <input
                    id="empresa_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* 1. Nome Completo */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="commercial-name"
                    className="block text-xs font-bold text-slate-700 tracking-tight"
                  >
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center rounded-2xl bg-[#F3F4F6] transition-all duration-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1355FF]/10 focus-within:border-slate-300 border ${
                      fieldErrors.nome ? "border-red-400 bg-red-50/20" : "border-transparent"
                    }`}
                  >
                    <input
                      ref={firstInputRef}
                      id="commercial-name"
                      name="nome"
                      type="text"
                      required
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.nome}
                      aria-describedby={fieldErrors.nome ? "commercial-name-error" : undefined}
                      placeholder="Ex: Roberto Silva"
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value);
                        if (fieldErrors.nome) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.nome;
                            return next;
                          });
                        }
                      }}
                      className="h-13 w-full rounded-2xl bg-transparent px-4 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  {fieldErrors.nome && (
                    <p id="commercial-name-error" className="text-[11px] font-medium text-red-600 pl-1">
                      {fieldErrors.nome}
                    </p>
                  )}
                </div>

                {/* 2. E-mail (Largura Completa) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="commercial-email"
                    className="block text-xs font-bold text-slate-700 tracking-tight"
                  >
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center rounded-2xl bg-[#F3F4F6] transition-all duration-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1355FF]/10 focus-within:border-slate-300 border ${
                      fieldErrors.email ? "border-red-400 bg-red-50/20" : "border-transparent"
                    }`}
                  >
                    <input
                      id="commercial-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "commercial-email-error" : undefined}
                      placeholder="seu.email@exemplo.com.br"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.email;
                            return next;
                          });
                        }
                      }}
                      className="h-13 w-full rounded-2xl bg-transparent px-4 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p id="commercial-email-error" className="text-[11px] font-medium text-red-600 pl-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* 3. Assunto (Largura Completa) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="commercial-subject"
                    className="block text-xs font-bold text-slate-700 tracking-tight"
                  >
                    Assunto <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative flex items-center rounded-2xl bg-[#F3F4F6] transition-all duration-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1355FF]/10 focus-within:border-slate-300 border ${
                      fieldErrors.assunto ? "border-red-400 bg-red-50/20" : "border-transparent"
                    }`}
                  >
                    <select
                      id="commercial-subject"
                      name="assunto"
                      required
                      aria-required="true"
                      aria-invalid={!!fieldErrors.assunto}
                      aria-describedby={fieldErrors.assunto ? "commercial-subject-error" : undefined}
                      value={assunto}
                      onChange={(e) => {
                        setAssunto(e.target.value as CommercialSubject);
                        if (fieldErrors.assunto) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.assunto;
                            return next;
                          });
                        }
                      }}
                      className="h-13 w-full appearance-none rounded-2xl bg-transparent pl-4 pr-10 text-xs sm:text-sm text-slate-900 outline-none font-medium cursor-pointer"
                    >
                      <option value="" disabled className="text-slate-400">
                        Selecione o assunto do seu interesse
                      </option>
                      {COMMERCIAL_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub} className="text-slate-900">
                          {sub}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className="absolute right-4 text-slate-400 pointer-events-none"
                    />
                  </div>
                  {fieldErrors.assunto && (
                    <p id="commercial-subject-error" className="text-[11px] font-medium text-red-600 pl-1">
                      {fieldErrors.assunto}
                    </p>
                  )}
                </div>

                {/* Aviso de privacidade & link */}
                <div className="pt-1 text-center">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ao enviar, você concorda com o contato comercial conforme a nossa{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-[#1355FF] underline hover:text-[#0D47E6] font-semibold transition-colors cursor-pointer"
                    >
                      Política de Privacidade
                    </button>
                    .
                  </p>
                </div>

                {/* Botão Principal: Solicitar atendimento → */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="group relative flex h-13 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1355FF] hover:bg-[#0D47E6] px-6 text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Enviando solicitação...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Solicitar atendimento</span>
                      <Icon
                        name="arrow-right"
                        size={16}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </div>
                  )}
                </button>

                {/* Opção Secundária: Conversar pelo WhatsApp com número oficial (17) 98126-2803 */}
                <div className="pt-0.5">
                  <a
                    href={whatsappInfo.url || "#"}
                    target={whatsappInfo.url ? "_blank" : undefined}
                    rel={whatsappInfo.url ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      if (!whatsappInfo.configured || !whatsappInfo.url) {
                        e.preventDefault();
                        handleWhatsAppClick();
                      }
                    }}
                    className="flex h-12 sm:h-13 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 text-xs sm:text-sm font-bold transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {/* Ícone oficial SVG do WhatsApp */}
                    <svg
                      className="h-4 w-4 text-emerald-600 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span>Conversar pelo WhatsApp</span>
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal Independente de Política de Privacidade */}
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
}
