"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { AppModal, AppButton, AppEmptyState, AppSearch } from "@/components/app-ui";
import { setVendorOnboardingStatusAction } from "@/lib/actions/admin";

type Vendor = {
  id: number;
  name: string;
  companyName?: string | null;
  category?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  isOnline?: boolean;
  rating?: number | null;
  onboardingStatus?: string | null;
  verified?: boolean;
};

export function AdminPrestadoresClient({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (filter === "ativos" && !v.active) return false;
      if (filter === "inativos" && v.active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = v.name.toLowerCase();
        const comp = (v.companyName || "").toLowerCase();
        const cat = (v.category || "").toLowerCase();
        return name.includes(q) || comp.includes(q) || cat.includes(q);
      }
      return true;
    });
  }, [vendors, filter, search]);

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("status", newStatus);
      try {
        await setVendorOnboardingStatusAction(fd);
        setVendors((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, onboardingStatus: newStatus, active: newStatus === "aprovado" } : v
          )
        );
        setFeedback({
          type: "success",
          text: `Status do prestador atualizado para "${newStatus}" com sucesso!`,
        });
        setSelectedVendor(null);
      } catch (err) {
        setFeedback({
          type: "error",
          text: "Erro ao atualizar status do prestador.",
        });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Prestadores</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Gestão de Prestadores & Parceiros
          </h1>
          <p className="text-xs text-slate-500">
            Catálogo profissional de prestadores habilitados no ecossistema Zeladoria.
          </p>
        </div>

        <Link
          href="/painel/admin/marketplace"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors"
        >
          <Icon name="sparkles" size={14} />
          <span>Marketplace & Configurações</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-[8px] text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(["todos", "ativos", "inativos"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-[8px] capitalize transition-colors ${
                filter === tab
                  ? "bg-[#1355FF] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <AppSearch
            placeholder="Buscar por profissional ou empresa..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        </div>
      </div>

      {/* Vendors Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[12px] bg-white border border-slate-200 p-8">
          <AppEmptyState
            icon="users"
            title="Nenhum prestador encontrado"
            description="Não há prestadores que correspondam aos filtros de busca."
          />
        </div>
      ) : (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Profissional / Empresa</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Avaliação</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{v.name}</p>
                      <p className="text-[11px] text-slate-500">{v.companyName || "Profissional Autônomo"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#1355FF] font-bold text-[10px] capitalize">
                        {v.category || "Geral"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                        <Icon name="star" size={12} className="fill-amber-400 text-amber-500" />
                        {v.rating ? Number(v.rating).toFixed(1) : "5.0"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      <p>{v.phone || "—"}</p>
                      <p className="text-[10px] text-slate-400">{v.email || ""}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          v.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {v.active ? "Habilitado" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedVendor(v)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1355FF] hover:underline"
                      >
                        <Icon name="shield" size={13} />
                        <span>Moderar / KYC</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KYC / Moderation Modal */}
      {selectedVendor && (
        <AppModal
          isOpen={true}
          onClose={() => setSelectedVendor(null)}
          title={`Moderação de Prestador · ${selectedVendor.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-[10px] border border-slate-200 space-y-1.5">
              <p className="text-slate-500">Nome / Razão: <strong className="text-slate-800">{selectedVendor.name}</strong></p>
              <p className="text-slate-500">Empresa: <strong className="text-slate-800">{selectedVendor.companyName || "Profissional Autônomo"}</strong></p>
              <p className="text-slate-500">Categoria: <strong className="text-slate-800 capitalize">{selectedVendor.category || "Geral"}</strong></p>
              <p className="text-slate-500">Telefone: <strong className="text-slate-800 font-mono">{selectedVendor.phone || "Não informado"}</strong></p>
              <p className="text-slate-500">E-mail: <strong className="text-slate-800">{selectedVendor.email || "Não informado"}</strong></p>
            </div>

            <div className="bg-blue-50/50 p-3.5 rounded-[10px] border border-blue-100">
              <h4 className="font-bold text-[#1355FF] mb-1">Diretrizes de Credenciamento</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                A aprovação habilita o profissional a receber chamados diretos de moradores, enviar propostas orçamentárias e transacionar via Zeladoria Pay com custódia e taxa de 10%.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <AppButton variant="secondary" onClick={() => setSelectedVendor(null)}>
                Fechar
              </AppButton>
              {selectedVendor.active ? (
                <AppButton
                  variant="danger"
                  isLoading={isPending}
                  onClick={() => handleUpdateStatus(selectedVendor.id, "rejeitado")}
                >
                  Suspender Credenciamento
                </AppButton>
              ) : (
                <AppButton
                  variant="primary"
                  isLoading={isPending}
                  onClick={() => handleUpdateStatus(selectedVendor.id, "aprovado")}
                >
                  Aprovar & Habilitar
                </AppButton>
              )}
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
