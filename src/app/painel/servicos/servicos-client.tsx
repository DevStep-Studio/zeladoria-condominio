"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { createServiceRequestAction } from "@/lib/actions/servicos";

export type VendorItem = {
  id: number;
  name: string;
  company: string;
  category: string;
  rating: number;
  reviewsCount: number;
  isSponsored?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  fastResponse?: boolean;
  isNew?: boolean;
  availableToday?: boolean;
  responseTime: string;
  experienceYears: number;
  completionRate: number;
  phone?: string;
  bio?: string;
};

const SAMPLE_PROVIDERS: VendorItem[] = [
  // Sponsored Providers
  {
    id: 1,
    name: "Carlos Eduardo Silva",
    company: "Volt & Luz Soluções Elétricas",
    category: "Elétrica",
    rating: 4.9,
    reviewsCount: 128,
    isSponsored: true,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    responseTime: "15 min",
    experienceYears: 12,
    completionRate: 99,
    phone: "(11) 98765-4321",
    bio: "Especialista em quadros de distribuição, fiações residenciais, curto-circuitos e iluminação LED de alta eficiência.",
  },
  {
    id: 2,
    name: "AquaFix Manutenções",
    company: "AquaFix Engenharia Hidráulica",
    category: "Hidráulica",
    rating: 4.8,
    reviewsCount: 94,
    isSponsored: true,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    responseTime: "20 min",
    experienceYears: 9,
    completionRate: 98,
    phone: "(11) 97654-3210",
    bio: "Desentupimentos, caça-vazamentos não destrutivos, troca de colunas, registros e reparos de caixas acopladas.",
  },
  // Recommended / Organic Providers
  {
    id: 3,
    name: "Roberto Marcenaria",
    company: "Arte em Madeira",
    category: "Marcenaria",
    rating: 5.0,
    reviewsCount: 67,
    isVerified: true,
    availableToday: false,
    responseTime: "1h",
    experienceYears: 16,
    completionRate: 100,
    phone: "(11) 96543-2109",
    bio: "Restauração de móveis, ajustes de portas e dobradiças, armários sob medida e marcenaria fina residencial.",
  },
  {
    id: 4,
    name: "ClimaPrime Ar Condicionado",
    company: "ClimaPrime Engenharia Térmica",
    category: "Climatização",
    rating: 4.9,
    reviewsCount: 82,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    responseTime: "30 min",
    experienceYears: 8,
    completionRate: 97,
    phone: "(11) 95432-1098",
    bio: "Higienização profunda bactericida, recarga de gás ecológico, instalação e conserto de sistemas multi-split e VRF.",
  },
  {
    id: 5,
    name: "Diego Pinturas & Texturas",
    company: "Color Master",
    category: "Pintura",
    rating: 4.8,
    reviewsCount: 53,
    isVerified: true,
    isNew: false,
    availableToday: true,
    responseTime: "45 min",
    experienceYears: 7,
    completionRate: 96,
    phone: "(11) 94321-0987",
    bio: "Pintura residencial fina, tratamento de umidade e bolor, aplicação de massa corrida e pintura lavável.",
  },
  {
    id: 6,
    name: "SegurMax Portaria & CFTV",
    company: "SegurMax Soluções em Segurança",
    category: "Segurança",
    rating: 4.9,
    reviewsCount: 45,
    isPremium: true,
    isVerified: true,
    availableToday: true,
    responseTime: "25 min",
    experienceYears: 10,
    completionRate: 99,
    phone: "(11) 93210-9876",
    bio: "Configuração de fechaduras digitais, interfonia inteligente, automação de portões e manutenção de câmeras de segurança.",
  },
  {
    id: 7,
    name: "Julio Carpintaria",
    company: "Mestre da Madeira",
    category: "Carpintaria",
    rating: 4.7,
    reviewsCount: 31,
    isVerified: false,
    isNew: true,
    availableToday: false,
    responseTime: "2h",
    experienceYears: 5,
    completionRate: 95,
    phone: "(11) 92109-8765",
    bio: "Decks para varanda gourmet, pergolados, piso laminado e estruturas em madeira de lei.",
  },
];

const CATEGORIES = [
  "Todas",
  "Elétrica",
  "Hidráulica",
  "Marcenaria",
  "Carpintaria",
  "Pintura",
  "Climatização",
  "Segurança",
];

export function ServicosClient({
  services = [],
  vendors = [],
  staff = [],
  role = "morador",
  currentUserId = 1,
}: {
  services?: any[];
  vendors?: any[];
  staff?: any[];
  role?: string;
  currentUserId?: number;
} = {}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "response">("rating");

  const [selectedProfileVendor, setSelectedProfileVendor] = useState<VendorItem | null>(null);
  const [budgetVendor, setBudgetVendor] = useState<VendorItem | null>(null);
  const [budgetDescription, setBudgetDescription] = useState("");
  const [budgetSuccess, setBudgetSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("solicitar") === "true") {
      setBudgetVendor(SAMPLE_PROVIDERS[0]);
    }
  }, [searchParams]);

  // Filter and sort logic
  const filteredVendors = useMemo(() => {
    return SAMPLE_PROVIDERS.filter((v) => {
      // Category filter
      if (selectedCategory !== "Todas" && v.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesCompany = v.company.toLowerCase().includes(q);
        const matchesCategory = v.category.toLowerCase().includes(q);
        const matchesBio = v.bio?.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesCategory && !matchesBio) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "experience") return b.experienceYears - a.experienceYears;
      if (sortBy === "response") return parseInt(a.responseTime) - parseInt(b.responseTime);
      return 0;
    });
  }, [search, selectedCategory, sortBy]);

  const sponsoredList = useMemo(() => {
    return filteredVendors.filter((v) => v.isSponsored);
  }, [filteredVendors]);

  const organicList = useMemo(() => {
    return filteredVendors.filter((v) => !v.isSponsored);
  }, [filteredVendors]);

  const handleSendBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetVendor || !budgetDescription.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", `Orçamento com ${budgetVendor.name} (${budgetVendor.category})`);
      formData.set("description", budgetDescription);
      formData.set("category", budgetVendor.category.toLowerCase());
      formData.set("priority", "media");

      await createServiceRequestAction(formData);
      setBudgetSuccess(true);
      setTimeout(() => {
        setBudgetVendor(null);
        setBudgetSuccess(false);
        setBudgetDescription("");
      }, 1500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Zeladoria Serviços
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Marketplace inteligente de prestadores
        </p>
      </div>

      {/* Search, Sort and Category Filters */}
      <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar: eletricista, encanador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-slate-200 bg-slate-50 pl-9.5 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0070F3] focus:bg-white transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-400">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-[8px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="rating">Melhor avaliação</option>
              <option value="experience">Mais experiente</option>
              <option value="response">Mais rápido</option>
            </select>
          </div>
        </div>

        {/* Horizontal Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#0070F3] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SEÇÃO 1: PATROCINADOS (Distinção visual transparente) */}
      {sponsoredList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Patrocinados
            </h2>
            <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider">
              Anúncio
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsoredList.map((vendor) => (
              <ProviderCard
                key={vendor.id}
                vendor={vendor}
                onViewProfile={() => setSelectedProfileVendor(vendor)}
                onRequestBudget={() => setBudgetVendor(vendor)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: RECOMENDADOS / MELHORES AVALIADOS */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Recomendados & Melhores Avaliados
        </h2>

        {organicList.length === 0 ? (
          <div className="rounded-[14px] border border-slate-200 bg-white p-12 text-center">
            <Icon name="briefcase" size={28} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-[#0F172A]">Nenhum prestador encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente buscar por outro termo ou categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organicList.map((vendor) => (
              <ProviderCard
                key={vendor.id}
                vendor={vendor}
                onViewProfile={() => setSelectedProfileVendor(vendor)}
                onRequestBudget={() => setBudgetVendor(vendor)}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Ver Perfil */}
      {selectedProfileVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSelectedProfileVendor(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0070F3] text-base font-bold">
                  {selectedProfileVendor.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-[#0F172A]">
                      {selectedProfileVendor.name}
                    </h3>
                    {selectedProfileVendor.isVerified && (
                      <Icon name="check-circle" size={15} className="text-[#0070F3]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedProfileVendor.company} · {selectedProfileVendor.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfileVendor(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-[8px]"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-[10px] text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avaliação</span>
                <p className="text-sm font-black text-[#0F172A] flex items-center justify-center gap-1 mt-0.5">
                  <Icon name="star" size={12} className="text-[#FAB800] fill-[#FAB800]" />
                  <span>{selectedProfileVendor.rating.toFixed(1)}</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Experiência</span>
                <p className="text-sm font-black text-[#0F172A] mt-0.5">
                  {selectedProfileVendor.experienceYears} anos
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Concluídos</span>
                <p className="text-sm font-black text-[#0070F3] mt-0.5">
                  {selectedProfileVendor.completionRate}%
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Sobre o prestador
              </span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                {selectedProfileVendor.bio}
              </p>
            </div>

            {/* Contact row */}
            {selectedProfileVendor.phone && (
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-emerald-50/50 border border-emerald-100 text-xs">
                <span className="font-bold text-emerald-800">WhatsApp / Telefone:</span>
                <a
                  href={`https://wa.me/55${selectedProfileVendor.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Icon name="phone" size={12} />
                  <span>{selectedProfileVendor.phone}</span>
                </a>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProfileVendor(null)}
                className="btn-ghost btn-sm"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setBudgetVendor(selectedProfileVendor);
                  setSelectedProfileVendor(null);
                }}
                className="btn-primary btn-sm"
              >
                Solicitar orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Solicitar Orçamento */}
      {budgetVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setBudgetVendor(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0070F3]">
                  Solicitar Orçamento
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {budgetVendor.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {budgetVendor.company} ({budgetVendor.category})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBudgetVendor(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-[8px]"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {budgetSuccess ? (
              <div className="py-8 text-center space-y-2">
                <Icon name="check-circle" size={32} className="text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-[#0F172A]">Solicitação Enviada!</h4>
                <p className="text-xs text-slate-500">
                  O prestador responderá em breve através do seu contato.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBudget} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Descreva o serviço que você precisa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={budgetDescription}
                    onChange={(e) => setBudgetDescription(e.target.value)}
                    placeholder="Ex.: Troca de disjuntor do chuveiro e instalação de duas tomadas novas no quarto."
                    required
                    className="w-full rounded-[8px] border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-[#0070F3] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBudgetVendor(null)}
                    className="btn-ghost btn-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !budgetDescription.trim()}
                    className="btn-primary btn-sm disabled:opacity-50"
                  >
                    {isPending ? "Enviando..." : "Enviar solicitação"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  vendor,
  onViewProfile,
  onRequestBudget,
}: {
  vendor: VendorItem;
  onViewProfile: () => void;
  onRequestBudget: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="space-y-3">
        {/* Header with Avatar, Name, Category and Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0070F3] text-sm font-bold">
              {vendor.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {vendor.name}
                </h3>
                {vendor.isVerified && (
                  <span title="Verificado pelo condomínio">
                    <Icon name="check-circle" size={13} className="text-[#0070F3] shrink-0" />
                  </span>
                )}
                {vendor.isPremium && (
                  <span className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 text-[9px] font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {vendor.category} · {vendor.company}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
            <Icon name="star" size={11} className="text-[#FAB800] fill-[#FAB800]" />
            <span>{vendor.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 font-normal">({vendor.reviewsCount})</span>
          </div>
        </div>

        {/* Feature Tags (Fast response, Available today, etc.) */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-slate-600">
          {vendor.availableToday && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5">
              Disponível hoje
            </span>
          )}
          {vendor.fastResponse && (
            <span className="rounded-full bg-blue-50 border border-blue-200 text-[#0070F3] px-2 py-0.5">
              Resposta rápida (~{vendor.responseTime})
            </span>
          )}
          {vendor.isNew && (
            <span className="rounded-full bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5">
              Novo no Zeladoria
            </span>
          )}
          <span className="rounded-full bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5">
            {vendor.experienceYears} anos de exp.
          </span>
          <span className="rounded-full bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5">
            {vendor.completionRate}% concluídos
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onViewProfile}
          className="rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 py-1.5 text-xs font-bold text-slate-700 transition-colors"
        >
          Ver perfil
        </button>
        <button
          type="button"
          onClick={onRequestBudget}
          className="rounded-[8px] bg-[#0070F3] hover:bg-[#005FD6] py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
        >
          Solicitar orçamento
        </button>
      </div>
    </div>
  );
}
