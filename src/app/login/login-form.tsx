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
      <form action={formAction} className="space-y-3.5">
        {/* E-mail / Identificação */}
        <div className="space-y-1">
          <div className="group relative flex items-center rounded-2xl bg-[#F3F4F6] transition-all duration-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0055D4]/10 focus-within:border-slate-300 border border-transparent">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-13 sm:h-14 w-full rounded-2xl bg-transparent px-5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="E-mail ou identificação"
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-1">
          <div className="group relative flex items-center rounded-2xl bg-[#F3F4F6] transition-all duration-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0055D4]/10 focus-within:border-slate-300 border border-transparent">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-13 sm:h-14 w-full rounded-2xl bg-transparent pl-5 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>

        {/* Opções: Lembrar de mim & Esqueci senha */}
        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded-md border-slate-300 accent-[#0055D4] cursor-pointer"
            />
            <span>Lembrar de mim</span>
          </label>
          <Link
            href="/esqueci-senha"
            className="font-semibold text-slate-500 hover:text-[#0055D4] transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {/* Erro de autenticação */}
        {error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-150">
            <Icon name="alert-triangle" size={15} className="text-red-500 shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        ) : null}

        {/* Botão de Entrar (Pill minimalista sem gradiente) */}
        <button
          type="submit"
          disabled={pending}
          className="group relative flex h-13 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0055D4] hover:bg-[#0047BA] px-6 text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? (
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
              <span>Acessando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Entrar</span>
              <Icon
                name="arrow-right"
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </div>
          )}
        </button>
      </form>

      {/* Acesso rápido Demo (Minimalista e elegante) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span className="font-semibold uppercase tracking-wider">Acesso rápido para demonstração</span>
          <span className="text-[10px]">1 clique para preencher</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {demos.map((d) => {
            const isSelected = activeDemo === d.email || email === d.email;
            return (
              <button
                key={d.email}
                type="button"
                onClick={() => selectDemo(d)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all duration-150 cursor-pointer border ${
                  isSelected
                    ? "bg-blue-50 border-[#0055D4] text-[#0055D4] shadow-2xs font-bold"
                    : "bg-[#F8F9FA] border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium"
                }`}
              >
                <span className="text-xs">{d.label}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-full">
                  {d.label === "Síndica" ? "Admin" : d.label === "Portaria" ? "Portaria" : d.label === "Morador" ? "Apto 302" : "Multi"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rodapé do Form */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          É um prestador de serviços parceiro?{" "}
          <Link
            href="/prestador/login"
            className="font-bold text-[#0055D4] hover:underline"
          >
            Área do Prestador
          </Link>
        </p>
      </div>
    </div>
  );
}
