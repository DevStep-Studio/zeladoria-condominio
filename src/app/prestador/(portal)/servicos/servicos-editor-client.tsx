"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { updateProviderStorefrontAction } from "@/lib/actions/prestador";

export function ProviderServicosEditorClient({ vendor }: { vendor: any }) {
  const initialServices = Array.isArray(vendor.services) ? vendor.services : [];
  const [services, setServices] = useState<any[]>(initialServices);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"a_partir" | "fixo" | "por_hora" | "sob_consulta">("a_partir");
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const addService = () => {
    if (!name.trim()) return;
    const priceFromCents = price ? Math.round(parseFloat(price) * 100) : null;
    const nextList = [
      ...services,
      {
        id: `svc-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || "Serviço profissional especializado",
        priceFromCents,
        priceType,
      },
    ];
    setServices(nextList);
    setName("");
    setDescription("");
    setPrice("");
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateProviderStorefrontAction({ services });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Catálogo de Serviços & Tabela de Preços
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Defina os serviços que você presta e as faixas de valores para que moradores possam orçar com clareza.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Icon name="check" size={14} />
          <span>{isPending ? "Salvando..." : savedSuccess ? "Salvo com Sucesso!" : "Salvar Alterações"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Icon name="check-circle" size={15} className="text-emerald-600" />
          <span>Catálogo de serviços atualizado com sucesso na sua vitrine do marketplace!</span>
        </div>
      )}

      {/* Add New Service Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          + Adicionar Serviço ao Catálogo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Serviço <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Instalação de Chuveiro, Troca de Tomada..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo de Preço
            </label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            >
              <option value="a_partir">A partir de (Estimativa inicial)</option>
              <option value="fixo">Preço Fixo</option>
              <option value="por_hora">Por Hora Trabalhada</option>
              <option value="sob_consulta">Sob Consulta (Orçamento no local)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor de Referência (R$)
            </label>
            <input
              type="number"
              placeholder="Ex: 90.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceType === "sob_consulta"}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4] disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição Curta do que está incluso
            </label>
            <input
              type="text"
              placeholder="Ex: Substituição completa e conferência de segurança da fiação"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={addService}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            Adicionar à Lista
          </button>
        </div>
      </div>

      {/* Services List in Store */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#0F172A]">
          Serviços Ativos no seu Catálogo ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Você ainda não adicionou nenhum serviço ao catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0F172A]">{svc.name}</h3>
                    <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 capitalize">
                      {svc.priceType === "a_partir" ? "A partir de" : svc.priceType?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-sm font-black text-[#0055D4]">
                    {svc.priceFromCents
                      ? `R$ ${(svc.priceFromCents / 100).toFixed(2)}`
                      : "Sob consulta"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remover serviço"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
