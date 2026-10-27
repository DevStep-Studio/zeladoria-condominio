import { domainRequest } from "@/lib/api/server";
import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { dateTimeBR, money } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  SUBCATEGORIES_BY_CATEGORY,
  categoryLabel,
  getCategorySubcategories,
  normalizeServiceCategory,
} from "@/lib/services/providers-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Admin · Gestão de Prestadores & Catálogo",
  description: "Aprovações, categorias, serviços, avaliações e publicidade do marketplace.",
};

function safeCategoryIcon(key: string): IconName {
  const iconMap: Record<string, IconName> = {
    eletrica: "zap",
    hidraulica: "wrench",
    climatizacao: "sun",
    pintura: "pencil",
    marcenaria: "wrench",
    carpintaria: "wrench",
    seguranca: "shield",
    limpeza: "sparkles",
    jardinagem: "sparkles",
    elevadores: "building",
    portoes: "shield",
    servicos: "briefcase",
  };
  return iconMap[key] ?? "briefcase";
}

export default async function AdminMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireSession();
  const params = (await searchParams) ?? {};
  const { tab = "prestadores" } = params;

  const res = await domainRequest<{
    allVendors?: any[];
    reviewsList?: any[];
  }>("/painel/admin/marketplace").catch(() => ({ allVendors: [], reviewsList: [] }));

  const allVendors = Array.isArray(res?.allVendors) ? res.allVendors : [];
  const reviewsList = Array.isArray(res?.reviewsList) ? res.reviewsList : [];

  const servicesList = allVendors.flatMap((v) =>
    (v.services ?? []).map((s: any) => ({
      id: `${v.id}-${s.id}`,
      name: s.name,
      vendorName: v.name || v.companyName || "Prestador",
      priceFromCents: s.priceFromCents,
      priceType: s.priceType ?? "sob_consulta",
      description: s.description,
    }))
  );

  const pendingApprovals = allVendors.filter((v) => !v.active);

  // Mapeamento e agregação de categorias
  const categoriesMap = new Map<string, { label: string; count: number; subcategories: string[] }>();
  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    categoriesMap.set(key, {
      label,
      count: 0,
      subcategories: SUBCATEGORIES_BY_CATEGORY[key] ?? [],
    });
  }

  for (const v of allVendors) {
    const rawCat = v.category || "servicos";
    const norm = normalizeServiceCategory(rawCat);
    const existing = categoriesMap.get(norm);
    if (existing) {
      existing.count += 1;
    } else {
      categoriesMap.set(norm, {
        label: categoryLabel(norm),
        count: 1,
        subcategories: getCategorySubcategories(norm),
      });
    }
  }

  const categoriesList = Array.from(categoriesMap.entries()).map(([key, data]) => ({
    key,
    label: data.label,
    count: data.count,
    subcategories: data.subcategories,
    icon: safeCategoryIcon(key),
  }));

  const tabs = [
    { id: "prestadores", label: "Prestadores", count: allVendors.length },
    { id: "aprovacoes", label: "Aprovações", count: pendingApprovals.length },
    { id: "categorias", label: "Categorias", count: categoriesList.length },
    { id: "servicos", label: "Serviços", count: servicesList.length },
    { id: "avaliacoes", label: "Avaliações", count: reviewsList.length },
    { id: "patrocinados", label: "Patrocinados / Destaques" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/painel/admin" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Marketplace</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Administração do Marketplace
          </h1>
          <p className="text-xs text-slate-500">
            Controle de catálogo, aprovação de profissionais e qualidade do serviço.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/painel/admin/marketplace/destaques"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold hover:bg-amber-100/70 transition-colors"
          >
            <Icon name="sparkles" size={13} />
            <span>Planos de Destaque</span>
          </Link>
          <Link
            href="/painel/admin/marketplace/taxas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-50 text-[#1355FF] border border-blue-200/80 text-xs font-bold hover:bg-blue-100/70 transition-colors"
          >
            <Icon name="chart" size={13} />
            <span>Comissões & Taxas</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/painel/admin/marketplace?tab=${t.id}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#1355FF] text-[#1355FF]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? "bg-blue-100 text-[#1355FF]" : "bg-slate-100 text-slate-600"
                }`}>
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      {tab === "prestadores" && (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Prestador</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Disponibilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-[11px] text-slate-400">{v.companyName || "Autônomo"}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1355FF] text-[10px] font-bold">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-600">
                    ★ {v.rating ? Number(v.rating).toFixed(1) : "5.0"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {v.active ? "Ativo" : "Pendente"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {v.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "aprovacoes" && (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs p-6 text-center">
          {pendingApprovals.length === 0 ? (
            <div className="py-8 space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Icon name="check" size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Nenhum prestador pendente de aprovação</h3>
              <p className="text-xs text-slate-500">Todos os profissionais cadastrados já foram revisados.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-left">
              {pendingApprovals.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.category} · {v.phone}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 text-amber-800 text-xs font-bold">
                    Aguardando Moderação
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "categorias" && (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Catálogo de Categorias & Especialidades</h2>
              <p className="text-xs text-slate-500">
                Segmentação de serviços disponíveis para contratação pelos condomínios e moradores.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1355FF] text-xs font-bold w-fit">
              <Icon name="grid" size={13} />
              <span>{categoriesList.length} categorias ativas</span>
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Profissionais</th>
                <th className="py-3 px-4">Especialidades & Subcategorias</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoriesList.map((cat) => (
                <tr key={cat.key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1355FF]">
                        <Icon name={cat.icon} size={15} />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{cat.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono">id: {cat.key}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        cat.count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {cat.count} {cat.count === 1 ? "prestador" : "prestadores"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <span
                            key={sub}
                            className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Especialidades gerais</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href="/painel/admin/marketplace?tab=prestadores"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1355FF] hover:underline"
                    >
                      <span>Ver prestadores</span>
                      <Icon name="arrow-right" size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "servicos" && (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Serviço</th>
                <th className="py-3 px-4">Prestador</th>
                <th className="py-3 px-4">Preço Base</th>
                <th className="py-3 px-4">Modalidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {servicesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Nenhum serviço catalogado.
                  </td>
                </tr>
              ) : (
                servicesList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">{s.vendorName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.priceFromCents ? money(s.priceFromCents) : "Sob consulta"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 capitalize">{s.priceType.replace("_", " ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "avaliacoes" && (
        <div className="rounded-[12px] bg-white border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {reviewsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma avaliação cadastrada até o momento.
            </div>
          ) : (
            reviewsList.map((r) => (
              <div key={r.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mb-1">
                    {"★".repeat(r.rating || 5)}
                    <span className="text-slate-400 text-[10px] ml-1">({r.rating} / 5)</span>
                  </div>
                  <p className="text-xs text-slate-700 italic">&ldquo;{r.comment || "Sem comentário por escrito."}&rdquo;</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Data: {dateTimeBR(r.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "patrocinados" && (
        <div className="rounded-[12px] bg-white border border-slate-200 p-6 shadow-2xs text-center space-y-3">
          <p className="text-xs text-slate-600">
            Gerencie planos de publicidade, campanhas ativas e patrocínios no portal de destaques.
          </p>
          <Link
            href="/painel/admin/marketplace/destaques"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6]"
          >
            <Icon name="sparkles" size={14} />
            <span>Abrir Painel de Destaques & Patrocinados</span>
          </Link>
        </div>
      )}
    </div>
  );
}
