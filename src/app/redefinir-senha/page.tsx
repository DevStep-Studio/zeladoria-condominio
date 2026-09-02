"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha deve conter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("A confirmação de senha não confere.");
      return;
    }
    setError("");
    setDone(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 space-y-6 shadow-xl bg-white">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-[var(--color-ink)] mt-3">Criar Nova Senha</h1>
          <p className="text-xs text-[var(--color-muted)]">
            Digite sua nova senha segura para acessar a plataforma.
          </p>
        </div>

        {error ? (
          <div className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {done ? (
          <div className="p-4 rounded-[14px] bg-teal-50 border border-teal-200 text-center space-y-3">
            <div className="flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9488] text-white">
                <Icon name="check" size={20} />
              </span>
            </div>
            <p className="text-sm font-bold text-teal-900">Senha redefinida com sucesso!</p>
            <p className="text-xs text-teal-700">
              Você já pode fazer login na plataforma utilizando a sua nova senha.
            </p>
            <div className="pt-2">
              <Link href="/login" className="btn-primary w-full btn-sm">
                Fazer Login Agora
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nova Senha *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="input"
              />
            </div>

            <div>
              <label className="label">Confirmar Nova Senha *</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                className="input"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Salvar Nova Senha
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
