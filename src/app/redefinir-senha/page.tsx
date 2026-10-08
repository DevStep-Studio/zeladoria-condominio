"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasMatch = password.length > 0 && password === confirm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength) {
      setError("A senha deve conter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("A confirmação de senha não confere com a nova senha digitada.");
      return;
    }
    setError("");

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
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

      {/* Main Card */}
      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[20px] border border-slate-200 shadow-sm space-y-6">
          {done ? (
            <div className="text-center space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                  <Icon name="check-circle" size={32} />
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Senha alterada com sucesso!
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  Sua nova senha de acesso foi salva. Você já pode acessar sua conta com as novas credenciais.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Fazer Login Agora</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 text-[#0055D4] border border-blue-100">
                  <Icon name="key" size={22} />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Criar Nova Senha
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  Crie uma nova senha segura para o seu usuário.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <Icon name="alert-triangle" size={14} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Nova Senha */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Icon
                      name="lock"
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <Icon name={showPassword ? "eye" : "eye-off"} size={16} />
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Icon
                      name="lock"
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <Icon name={showConfirm ? "eye" : "eye-off"} size={16} />
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-700">Critérios de segurança:</p>
                  <div className="flex items-center gap-2">
                    <Icon
                      name={hasMinLength ? "check" : "x"}
                      size={12}
                      className={hasMinLength ? "text-emerald-600" : "text-slate-400"}
                    />
                    <span className={hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                      Pelo menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      name={hasNumber ? "check" : "x"}
                      size={12}
                      className={hasNumber ? "text-emerald-600" : "text-slate-400"}
                    />
                    <span className={hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                      Contém números
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      name={hasMatch ? "check" : "x"}
                      size={12}
                      className={hasMatch ? "text-emerald-600" : "text-slate-400"}
                    />
                    <span className={hasMatch ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                      As senhas coincidem
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !hasMinLength || !hasMatch}
                  className="w-full h-12 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar Nova Senha</span>
                      <Icon name="arrow-right" size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
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
