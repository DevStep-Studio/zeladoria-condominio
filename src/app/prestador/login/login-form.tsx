"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { providerLoginAction } from "@/lib/actions/session";

export type ProviderDemo = {
  email: string;
  name: string;
  role: string;
  category: string;
};

export function ProviderLoginForm({ demos }: { demos: ProviderDemo[] }) {
  const [email, setEmail] = useState("carlos@eletrica.com.br");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>("carlos@eletrica.com.br");
  const [error, formAction, isPending] = useActionState(providerLoginAction, null);

  const selectDemo = (demo: ProviderDemo) => {
    setEmail(demo.email);
    setPassword("demo1234");
    setActiveDemo(demo.email);
  };

  return (
    <div className="space-y-5">
      {/* Demo Accounts Quick-Select */}
      {demos && demos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Acessos de Demonstração (1-Clique)
            </span>
            <span className="text-[10px] font-medium text-slate-400">Senha: demo1234</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demos.map((d) => {
              const isSelected = activeDemo === d.email;
              return (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => selectDemo(d)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#0055D4] bg-blue-50/70 shadow-xs ring-1 ring-[#0055D4]"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-900 truncate">{d.name}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 truncate">{d.category}</span>
                    <span className="text-[#0055D4] font-bold text-[10px]">{d.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
            <Icon name="alert-triangle" size={14} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="provider-email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
          >
            E-mail Profissional
          </label>
          <div className="relative">
            <Icon
              name="user"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="provider-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (activeDemo && e.target.value !== activeDemo) {
                  setActiveDemo(null);
                }
              }}
              placeholder="carlos@eletrica.com.br"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-1 focus:ring-[#0055D4] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="provider-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Senha de Acesso
            </label>
            <Link
              href="/esqueci-senha"
              className="text-[11px] font-semibold text-[#0055D4] hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Icon
              name="lock"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="provider-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-1 focus:ring-[#0055D4] transition-all"
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Acessando...</span>
            </>
          ) : (
            <>
              <span>Entrar na Área do Prestador</span>
              <Icon name="arrow-right" size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
