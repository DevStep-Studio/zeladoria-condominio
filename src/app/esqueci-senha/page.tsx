"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sent && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [sent, countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    startTransition(async () => {
      // Simulação de envio com delay suave
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
      setCountdown(60);
      setCanResend(false);
    });
  };

  const handleResend = () => {
    if (!canResend || isPending) return;
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 500));
      setCountdown(60);
      setCanResend(false);
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#0F172A]">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <BrandLogo size="md" variant="default" />
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-[#0055D4] hover:text-[#0047BA] hover:underline flex items-center gap-1.5"
        >
          <Icon name="arrow-left" size={13} />
          <span>Voltar ao Login</span>
        </Link>
      </header>

      {/* Main Card Container */}
      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[20px] border border-slate-200 shadow-sm space-y-6">
          {sent ? (
            <div className="text-center space-y-5 animate-in fade-in-50 duration-200">
              {/* Success Badge */}
              <div className="flex justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0055D4] border border-blue-100 shadow-2xs">
                  <Icon name="mail" size={28} />
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Verifique seu e-mail
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  Enviamos as instruções e o link seguro para você redefinir sua senha no endereço:
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800">
                  <Icon name="user" size={13} className="text-[#0055D4]" />
                  <span>{email}</span>
                </div>
              </div>

              {/* Demo Action Helper */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0055D4]">
                  <Icon name="sparkles" size={14} />
                  <span>Ambiente de Testes / Demonstração</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Para testar o fluxo completo de troca de senha sem precisar abrir sua caixa de entrada:
                </p>
                <Link
                  href="/redefinir-senha"
                  className="inline-flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <span>Abrir Tela de Redefinição de Senha</span>
                  <Icon name="arrow-right" size={13} />
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs text-slate-500">
                  Não recebeu o e-mail?{" "}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isPending}
                      className="font-bold text-[#0055D4] hover:underline cursor-pointer"
                    >
                      {isPending ? "Reenviando..." : "Clique para reenviar"}
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Reenviar em <strong className="text-slate-600 font-mono">{countdown}s</strong>
                    </span>
                  )}
                </div>

                <div>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Voltar ao Login Principal
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2.5">
                <div className="flex justify-center pb-1">
                  <BrandLogo size="md" variant="default" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Recuperação de Senha
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  Informe o seu e-mail cadastrado. Enviaremos um link de uso único para redefinir sua senha com segurança.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Icon
                      name="mail"
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com.br"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Security info pill */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                  <Icon name="shield" size={15} className="text-[#0055D4] shrink-0 mt-0.5" />
                  <span>
                    Por motivos de segurança, o link expira em <strong>30 minutos</strong> e só pode ser utilizado uma única vez.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="w-full h-12 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gerando link de segurança...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Link de Redefinição</span>
                      <Icon name="arrow-right" size={15} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-slate-500 hover:text-[#0055D4] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Icon name="arrow-left" size={13} />
                    <span>Lembrou a senha? Voltar ao Login</span>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Support Help Note */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          Dificuldade para acessar? Contate o síndico ou a administração do condomínio.
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto pt-6 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>© 2026 Zeladoria Condomínio</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hover:text-[#0055D4] transition-colors">
            Acesso Moradores
          </Link>
          <span>·</span>
          <Link href="/prestador/login" className="hover:text-[#0055D4] transition-colors">
            Área do Prestador
          </Link>
        </div>
      </footer>
    </main>
  );
}
