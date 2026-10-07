"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { subscribeNewsletterAction } from "@/lib/actions/newsletter";

export function NewsletterModal({
  autoOpenDelayMs = 1000,
}: {
  autoOpenDelayMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);

    // Checa se o usuário já dispensou anteriormente
    const seen = localStorage.getItem("zeladoria_newsletter_dismissed");
    if (!seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, autoOpenDelayMs);
      return () => clearTimeout(timer);
    }
  }, [autoOpenDelayMs]);

  // Listener para reabrir via evento ou atalho
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-newsletter", handleOpen);
    return () => window.removeEventListener("open-newsletter", handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("zeladoria_newsletter_dismissed", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Por favor, digite um e-mail válido.");
      return;
    }

    if (!agreed) {
      setStatus("error");
      setErrorMessage("Você precisa concordar com a política de privacidade.");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletterAction(email);
      if (res.ok) {
        setStatus("success");
        localStorage.setItem("zeladoria_newsletter_dismissed", "true");
      } else {
        setStatus("error");
        setErrorMessage(res.error || "Erro ao cadastrar.");
      }
    });
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("PRIMEIRACOMPRA30");
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Botão flutuante minimalista para reabrir a qualquer momento */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-2 text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer border border-blue-400/30"
          title="Ver oferta de 30% OFF"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD000] text-[#0F172A] text-[10px] font-black">
            %
          </span>
          <span className="hidden sm:inline">30% OFF Newsletter</span>
        </button>
      )}

      {/* Modal Principal (Sem Gradiente, 100% Sólido e Minimalista) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop Sólido Escuro */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={handleClose}
            aria-hidden
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
            {/* Botão Fechar (X) */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Fechar"
            >
              <Icon name="x" size={16} />
            </button>

            {/* LADO ESQUERDO: BANNER VISUAL (Sem gradiente, azul e amarelo sólidos) */}
            <div className="relative w-full md:w-5/12 bg-[#0055D4] flex items-center justify-center min-h-[200px] md:min-h-[420px] overflow-hidden shrink-0">
              <img
                src="/newsletter-banner.png"
                alt="30% OFF e Frete Grátis na primeira compra"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* LADO DIREITO: TEXTO E FORMULÁRIO MINIMALISTA */}
            <div className="flex-1 p-5 sm:p-7 md:p-8 flex flex-col justify-between space-y-4">
              {status === "success" ? (
                /* Estado de Sucesso */
                <div className="py-4 space-y-4 text-center my-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Icon name="check" size={28} strokeWidth={2.5} />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Inscrição Confirmada
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#0F172A] mt-1">
                      Seu cupom está liberado!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Use o cupom abaixo para garantir 30% de desconto no seu primeiro serviço ou pedido.
                    </p>
                  </div>

                  {/* Cupom em destaque sólido */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-dashed border-[#0055D4] max-w-xs mx-auto">
                    <div className="text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Código do Cupom
                      </span>
                      <strong className="text-base font-black text-[#0055D4] tracking-wider">
                        PRIMEIRACOMPRA30
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="px-3 py-1.5 rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedCoupon ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Aproveitar Desconto
                  </button>
                </div>
              ) : (
                /* Formulário de Inscrição */
                <>
                  <div className="space-y-2 pr-4">
                    {/* Header da Seção (Semelhante à referência) */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0055D4] block">
                      INSCREVA-SE EM NOSSA NEWSLETTER
                    </span>

                    <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight leading-tight">
                      Ganhe 30% OFF e Frete Grátis no seu primeiro pedido
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Fique por dentro das novidades, promoções e ofertas exclusivas diretamente em seu e-mail.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    {/* Input com botão na direita (exatamente como na referência) */}
                    <div>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (status === "error") setStatus("idle");
                          }}
                          placeholder="Seu e-mail para novidades"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-14 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                          title="Cadastrar"
                        >
                          {isPending ? (
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon name="arrow-right" size={16} />
                          )}
                        </button>
                      </div>

                      {status === "error" && errorMessage && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1.5">
                          {errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Checkbox de Política de Privacidade (como na referência) */}
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#0055D4] focus:ring-[#0055D4]"
                      />
                      <span>
                        Eu li e concordo com a{" "}
                        <span className="underline font-semibold text-slate-800 hover:text-[#0055D4]">
                          Política de privacidade
                        </span>
                        .
                      </span>
                    </label>

                    {/* Botão Secundário de Destaque */}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Garantir Meu Desconto de 30%</span>
                    </button>
                  </form>

                  {/* Rodapé de Confiança */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Icon name="shield" size={11} className="text-[#0055D4]" />
                      <span>Sem spam. Seus dados estão seguros.</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-slate-400 hover:text-slate-600 hover:underline"
                    >
                      Lembrar mais tarde
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
