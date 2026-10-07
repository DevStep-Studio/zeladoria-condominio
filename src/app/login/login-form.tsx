"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/session";
import { Icon } from "@/components/icon";

type Demo = { email: string; label: string; desc: string };

export function LoginForm({ demos }: { demos: Demo[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [error, formAction, pending] = useActionState(loginAction, null);

  function selectDemo(demo: Demo) {
    setEmail(demo.email);
    setPassword("demo1234");
    setActiveDemo(demo.email);
  }

  function handleEmailChange(val: string) {
    setEmail(val);
    if (activeDemo && val !== activeDemo) {
      setActiveDemo(null);
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {/* E-mail Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 tracking-wide"
          >
            E-mail
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs transition-all duration-150 focus-within:border-[#0055D4] focus-within:ring-4 focus-within:ring-[#0055D4]/10 hover:border-slate-300">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 group-focus-within:text-[#0055D4] transition-colors">
              <Icon name="mail" size={17} />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-12 w-full rounded-xl bg-transparent pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-normal"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>
        </div>

        {/* Senha Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 tracking-wide"
          >
            Senha
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs transition-all duration-150 focus-within:border-[#0055D4] focus-within:ring-4 focus-within:ring-[#0055D4]/10 hover:border-slate-300">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 group-focus-within:text-[#0055D4] transition-colors">
              <Icon name="lock" size={17} />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 w-full rounded-xl bg-transparent pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055D4]/30 cursor-pointer"
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
            </button>
          </div>
        </div>

        {/* Opções auxiliares: Lembrar de mim & Esqueci minha senha */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] pt-0.5">
          <label className="group flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 accent-[#0055D4] text-[#0055D4] cursor-pointer focus:ring-2 focus:ring-[#0055D4]/20"
            />
            <span className="group-hover:text-slate-900 transition-colors font-medium">
              Lembrar de mim
            </span>
          </label>
          <Link
            href="/esqueci-senha"
            className="font-semibold text-[#0055D4] transition-colors hover:text-[#0047BA] hover:underline focus:outline-none focus-visible:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        {/* Mensagem de Erro contextual */}
        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-150">
            <Icon name="alert-triangle" size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        ) : null}

        {/* Botão Principal ENTRAR */}
        <button
          type="submit"
          className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0055D4] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#0047BA] hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0055D4]/25"
          disabled={pending}
        >
          {pending ? (
            <>
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
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <span>Entrar na conta</span>
              <Icon
                name="arrow-right"
                size={16}
                strokeWidth={2.25}
                className="transition-transform duration-150 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      {/* Cadastro / Solicitação de Acesso */}
      <div className="text-center text-xs sm:text-[13px] text-slate-500 pt-0.5">
        <span>Ainda não tem uma conta? </span>
        <a
          href="mailto:contato@zeladoriacondominio.com.br?subject=Solicitar%20Acesso%20-%20Zeladoria%20Cidades"
          className="font-semibold text-[#0055D4] transition-colors hover:text-[#0047BA] hover:underline focus:outline-none focus-visible:underline"
        >
          Criar conta
        </a>
      </div>

      {/* Divisor "OU" */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          acesso rápido de demonstração
        </span>
      </div>

      {/* 4 Quick Demo Profile Chips */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {demos.map((demo) => {
            const isSelected = activeDemo === demo.email;
            return (
              <button
                key={demo.email}
                type="button"
                onClick={() => selectDemo(demo)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#0055D4] bg-[#0055D4]/10 text-[#0055D4] font-bold shadow-xs ring-1 ring-[#0055D4]"
                    : "border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-medium"
                }`}
              >
                <span className="text-xs">{demo.label}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-full mt-0.5">
                  {demo.label === "Síndica"
                    ? "Administração"
                    : demo.label === "Portaria"
                    ? "Controle"
                    : demo.label === "Morador"
                    ? "Condômino"
                    : "Super Admin"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
