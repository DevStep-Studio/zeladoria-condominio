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
      {/* 3-Icon Bubble Pill Container (Matching reference: Apple, Google, ID) */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className="inline-flex items-center gap-6 px-6 py-2.5 rounded-full bg-[#F3F4F6] text-slate-700 shadow-2xs transition-all">
          {/* Apple Icon */}
          <button
            type="button"
            onClick={() => selectDemo(demos[2])} // Morador demo shortcut
            title="Acesso rápido com Apple / Morador"
            className="text-slate-800 hover:text-black hover:scale-115 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.7-7.85-12-14.34-5.77-8.63-10.3-18.42-13.6-29.36-3.3-10.95-4.95-21.2-4.95-30.77 0-14.12 3.5-26 10.5-35.63 7-9.63 16.02-14.58 27.06-14.85 4.9 0 10.42 1.34 16.56 4.03 6.13 2.68 10.05 4.09 11.75 4.22 1.48-.13 5.48-1.57 12-4.32 6.53-2.74 12.05-4.01 16.56-3.8 12.33.64 22.37 5.34 30.13 14.1-10.74 6.5-16.02 15.53-15.82 27.08.21 9.07 3.63 16.71 10.27 22.92 6.64 6.22 14.47 9.8 23.5 10.75-2.02 6.07-4.49 12.18-7.41 18.32zM119.22 31.84c0-7.22 2.61-13.9 7.82-20.03 5.22-6.14 11.53-10.08 18.94-11.81.42 1.48.64 2.96.64 4.43 0 7.32-2.73 14.24-8.19 20.76-5.46 6.52-12.03 10.4-19.72 11.64-.1-1.69-.15-3.35-.15-4.99z" />
            </svg>
          </button>

          {/* Google Icon */}
          <button
            type="button"
            onClick={() => selectDemo(demos[0])} // Síndica demo shortcut
            title="Acesso rápido com Google / Síndica"
            className="hover:scale-115 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </button>

          {/* Condomínio ID / Shield Icon */}
          <button
            type="button"
            onClick={() => selectDemo(demos[1])} // Portaria demo shortcut
            title="Acesso rápido com ID Portaria"
            className="text-slate-800 hover:text-[#0055D4] hover:scale-115 transition-all duration-200 cursor-pointer"
          >
            <Icon name="shield" size={17} />
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium tracking-wide">ou</span>
      </div>

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
