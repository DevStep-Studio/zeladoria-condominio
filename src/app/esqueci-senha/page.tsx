"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 space-y-6 shadow-xl bg-white">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-[var(--color-ink)] mt-3">Recuperação de Senha</h1>
          <p className="text-xs text-[var(--color-muted)]">
            Informe seu e-mail cadastrado para enviarmos as instruções de redefinição de acesso.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-[14px] bg-teal-50 border border-teal-200 text-center space-y-3">
            <div className="flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9488] text-white">
                <Icon name="check" size={20} />
              </span>
            </div>
            <p className="text-sm font-bold text-teal-900">E-mail de recuperação enviado!</p>
            <p className="text-xs text-teal-700">
              Verifique sua caixa de entrada no e-mail <strong>{email}</strong> para criar sua nova senha.
            </p>
            <div className="pt-2">
              <Link href="/login" className="btn-primary w-full btn-sm">
                Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail Cadastrado *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
                className="input"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Enviar Link de Redefinição
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[#0D9488]">
                ← Lembra da sua senha? Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
