"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { createCondominiumAction } from "@/lib/actions/admin";

export function CreateCondoModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await createCondominiumAction(formData);
        if (res && !res.success) {
          setError(res.error || "Erro ao cadastrar condomínio.");
        } else {
          setOpen(false);
        }
      } catch (err: any) {
        setError(err.message || "Erro inesperado ao cadastrar.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-2xs cursor-pointer"
      >
        <Icon name="plus" size={14} />
        <span>Novo Condomínio</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1355FF] border border-blue-200">
                  <Icon name="building" size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Condomínio</h3>
                  <p className="text-[11px] text-slate-500">Adicione um novo empreendimento à plataforma</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <Icon name="alert-triangle" size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Dados Principais */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Dados do Empreendimento
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Condomínio *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Ex: Residencial Parque das Águas"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CNPJ (opcional)
                    </label>
                    <input
                      name="cnpj"
                      placeholder="00.000.000/0000-00"
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plano SaaS
                    </label>
                    <select
                      name="plan"
                      defaultValue="pro"
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15 bg-white cursor-pointer"
                    >
                      <option value="basico">Básico (Gestão simples)</option>
                      <option value="pro">Profissional (Portaria + Zeladoria)</option>
                      <option value="enterprise">Enterprise (Multi-torres + Zeladoria Pay)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço
                  </label>
                  <input
                    name="address"
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cidade
                    </label>
                    <input
                      name="city"
                      defaultValue="São Paulo"
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      name="state"
                      defaultValue="SP"
                      maxLength={2}
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs uppercase outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>
                </div>
              </div>

              {/* Estrutura Inicial Automática */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Estrutura Inicial de Unidades
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantidade de Blocos/Torres
                    </label>
                    <input
                      type="number"
                      name="initialBlocks"
                      defaultValue={1}
                      min={0}
                      max={10}
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Cria Bloco A, Bloco B, etc.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unidades por Bloco
                    </label>
                    <input
                      type="number"
                      name="unitsPerBlock"
                      defaultValue={16}
                      min={0}
                      max={40}
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gera numeração 101, 102...</p>
                  </div>
                </div>
              </div>

              {/* Síndico Responsável Inicial */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Síndico Responsável (Acesso Inicial)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome do Síndico
                    </label>
                    <input
                      name="sindicoName"
                      placeholder="Ex: Carlos Silva"
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail do Síndico
                    </label>
                    <input
                      type="email"
                      name="sindicoEmail"
                      placeholder="sindico@condominio.com"
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={14} />
                      <span>Salvar Condomínio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
