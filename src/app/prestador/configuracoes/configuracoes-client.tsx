"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { updateProviderStorefrontAction } from "@/lib/actions/prestador";
import { logoutAction } from "@/lib/actions/session";

export function ConfiguracoesClient({
  vendor,
  user,
}: {
  vendor: any;
  user: any;
}) {
  const [phone, setPhone] = useState(vendor?.phone || user?.phone || "");
  const [whatsapp, setWhatsapp] = useState(vendor?.whatsapp || user?.phone || "");
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateProviderStorefrontAction({ phone, whatsapp });
      setSuccessMsg("Dados de contato atualizados com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Configurações da Conta
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Gerencie seus dados de acesso, contatos comerciais e preferências.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dados Principais */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
          Contatos e Identificação
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Nome Cadastrado
            </label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              E-mail de Acesso
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Telefone Comercial
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                WhatsApp de Atendimento
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0070F3]"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Sair da Conta */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-rose-900">Encerrar Sessão</h4>
          <p className="text-xs text-rose-700">Desconectar seu login de prestador deste dispositivo.</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
