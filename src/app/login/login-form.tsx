"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/session";
import { Icon } from "@/components/icon";

type Demo = { email: string; label: string; desc: string };

export function LoginForm({ demos }: { demos: Demo[] }) {
  const [email, setEmail] = useState(demos[0]?.email ?? "");
  const [password, setPassword] = useState("demo1234");
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
        {/* Email Field with internal icon */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink)]">
            E-mail <span className="text-[#0070F3]">*</span>
          </label>
          <div className="flex min-h-[48px] items-center gap-2.5 rounded-[10px] border border-[var(--color-line)] bg-white px-3.5 text-[var(--color-muted)] transition-all focus-within:border-[#0070F3] focus-within:ring-2 focus-within:ring-blue-100">
            <Icon name="mail" size={16} className="text-[#94A3B8]" />
            <input
              name="email"
              type="email"
              className="w-full bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-subtle)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
        </div>

        {/* Password Field with lock & eye toggle */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink)]">
            Senha <span className="text-[#0070F3]">*</span>
          </label>
          <div className="flex min-h-[48px] items-center gap-2.5 rounded-[10px] border border-[var(--color-line)] bg-white px-3.5 text-[var(--color-muted)] transition-all focus-within:border-[#0070F3] focus-within:ring-2 focus-within:ring-blue-100">
            <Icon name="lock" size={16} className="text-[#94A3B8]" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-subtle)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-ink)] focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              <Icon name="eye" size={16} className="text-[#94A3B8]" />
            </button>
          </div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <label className="flex items-center gap-2 text-[var(--color-ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded accent-[#0070F3] cursor-pointer"
            />
            <span>Lembrar de mim</span>
          </label>
          <a
            href="mailto:suporte@zeladoriacondominio.com.br?subject=Recuperar%20Acesso"
            className="text-[#0070F3] hover:underline font-bold"
          >
            Esqueci a senha
          </a>
        </div>

        {/* Error message if any */}
        {error ? (
          <p className="rounded-[10px] border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        {/* Main Action Button */}
        <button
          type="submit"
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#0070F3] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,112,243,0.25)] transition-all hover:bg-[#005FD6] hover:shadow-[0_6px_20px_rgba(0,112,243,0.35)] active:scale-[0.99] disabled:opacity-50 cursor-pointer focus:outline-none"
          disabled={pending}
        >
          <span>{pending ? "Entrando..." : "Entrar na conta"}</span>
          <Icon name="arrow-right" size={16} strokeWidth={2.5} />
        </button>
      </form>

      {/* Não tem conta? Criar conta grátis */}
      <div className="text-center text-xs text-[var(--color-muted)] font-medium pt-1">
        <span>Não tem conta? </span>
        <a href="mailto:contato@zeladoriacondominio.com.br?subject=Criar%20Conta" className="font-bold text-[#0070F3] hover:underline">
          Criar conta grátis
        </a>
      </div>

      {/* Divider "ou" */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-[var(--color-line)]" />
        <span className="absolute bg-white px-3 text-[11px] font-semibold text-[var(--color-subtle)] uppercase">
          ou
        </span>
      </div>

      {/* Button: Preencher Dados de Demonstração */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDemoPicker((v) => !v)}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--color-line)] bg-white px-4 text-xs font-bold text-[var(--color-ink)] shadow-xs transition-all hover:border-[#0070F3]/40 hover:bg-[#EFF6FF] hover:text-[#0070F3] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <Icon name="users" size={16} className="text-[#0070F3]" />
          <span>Preencher Dados de Demonstração</span>
          <Icon name="chevron-down" size={13} className={`transition-transform ${showDemoPicker ? "rotate-180" : ""}`} />
        </button>

        {/* Demo profiles picker dropdown */}
        {showDemoPicker ? (
          <div className="mt-2 rounded-[14px] border border-[var(--color-line)] bg-white p-2 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => selectDemo(demo)}
                className="flex w-full items-center justify-between rounded-[10px] p-2.5 text-left text-xs transition-colors hover:bg-[#EFF6FF] focus:outline-none cursor-pointer group"
              >
                <div>
                  <p className="font-bold text-[var(--color-ink)] group-hover:text-[#0070F3] transition-colors">{demo.label}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{demo.desc}</p>
                </div>
                <span className="chip bg-blue-50 text-[#0070F3] text-[10px] font-bold group-hover:bg-[#0070F3] group-hover:text-white transition-colors">
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
