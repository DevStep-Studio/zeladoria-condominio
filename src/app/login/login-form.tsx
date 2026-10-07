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
  const [showDemoPicker, setShowDemoPicker] = useState(false);
  const [error, formAction, pending] = useActionState(loginAction, null);

  function selectDemo(demo: Demo) {
    setEmail(demo.email);
    setPassword("demo1234");
    setShowDemoPicker(false);
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {/* E-mail Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs sm:text-[13px] font-semibold text-slate-700"
          >
            E-mail
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 transition-all duration-150 focus-within:bg-white focus-within:border-[#0055D4] focus-within:ring-2 focus-within:ring-[#0055D4]/15 hover:border-slate-300">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 group-focus-within:text-[#0055D4] transition-colors">
              <Icon name="mail" size={16} />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-11 sm:h-12 w-full rounded-xl bg-transparent pl-10 pr-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>
        </div>

        {/* Senha Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs sm:text-[13px] font-semibold text-slate-700"
          >
            Senha
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 transition-all duration-150 focus-within:bg-white focus-within:border-[#0055D4] focus-within:ring-2 focus-within:ring-[#0055D4]/15 hover:border-slate-300">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 group-focus-within:text-[#0055D4] transition-colors">
              <Icon name="lock" size={16} />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 sm:h-12 w-full rounded-xl bg-transparent pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055D4]/30 cursor-pointer"
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
          className="group relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0055D4] px-4 text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#0047BA] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055D4] focus-visible:ring-offset-2"
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
                className="transition-transform duration-150 group-hover:translate-x-0.5"
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
      <div className="relative flex items-center justify-center my-3">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          ou
        </span>
      </div>

      {/* Acesso rápido com dados de demonstração */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDemoPicker((v) => !v)}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 hover:border-slate-300 hover:bg-slate-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055D4]/20 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon name="users" size={15} className="text-[#0055D4]" />
            <span>Preencher dados de demonstração</span>
          </div>
          <Icon
            name="chevron-down"
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              showDemoPicker ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Demo profiles dropdown */}
        {showDemoPicker ? (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => selectDemo(demo)}
                className="group flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs transition-colors hover:bg-blue-50/60 focus:bg-blue-50/60 focus:outline-none cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-800 transition-colors group-hover:text-[#0055D4]">
                    {demo.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{demo.desc}</p>
                </div>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0055D4] transition-colors group-hover:bg-[#0055D4] group-hover:text-white">
                  Usar perfil
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
