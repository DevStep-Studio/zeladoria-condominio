"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  buildCategoriesConfig,
  type MarketplaceProvider,
  type ServiceOffering,
} from "@/lib/services/providers-data";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/services/ranking";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { ProviderProfileModal } from "@/components/marketplace/provider-profile-modal";
import { ServiceRequestWizard } from "@/components/marketplace/service-request-wizard";
import { FilterBottomSheet, type FilterState } from "@/components/marketplace/filter-bottom-sheet";
import { rateServiceAction } from "@/lib/actions/servicos";

export function ServicosClient({
  services = [],
  vendors = [],
  providers = [],
  staff = [],
  role = "morador",
  currentUserId = 1,
}: {
  services?: any[];
  vendors?: any[];
  providers?: MarketplaceProvider[];
  staff?: any[];
  role?: string;
  currentUserId?: number;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state persistence
  const initialCategory = searchParams.get("categoria") || "Todas";
  const initialSearch = searchParams.get("busca") || "";
  const initialSort = (searchParams.get("ordem") as any) || "score";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<"score" | "rating" | "reviews" | "price_asc" | "response">(initialSort);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    minRating: 0,
    verifiedOnly: false,
    maxPrice: 50000,
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const categoriesConfig = useMemo(() => buildCategoriesConfig(providers), [providers]);

  // Favorites (persisted in localStorage)
  const [favorites, setFavorites] = useState<number[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zeladoria_favorite_providers");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      try {
        localStorage.setItem("zeladoria_favorite_providers", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Modals state
  const [selectedProfileVendor, setSelectedProfileVendor] = useState<MarketplaceProvider | null>(null);
  const [budgetVendor, setBudgetVendor] = useState<MarketplaceProvider | null>(null);
  const [budgetInitialService, setBudgetInitialService] = useState<ServiceOffering | undefined>(undefined);

  // Auto-open budget if ?solicitar=true in URL
  useEffect(() => {
    if (searchParams.get("solicitar") === "true" && providers.length > 0) {
      setBudgetVendor(providers[0]);
    }
  }, [searchParams, providers]);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => getSearchSuggestions(search), [search]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update URL search parameters smoothly
  const updateUrlParams = (cat: string, q: string, sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat && cat !== "Todas") params.set("categoria", cat);
    else params.delete("categoria");

    if (q.trim()) params.set("busca", q.trim());
    else params.delete("busca");

    if (sort && sort !== "score") params.set("ordem", sort);
    else params.delete("ordem");

    const queryStr = params.toString();
    const newPath = queryStr ? `/painel/servicos?${queryStr}` : `/painel/servicos`;
    window.history.replaceState(null, "", newPath);
  };

  // Sync category change
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setFilters((prev) => ({ ...prev, category: cat }));
    updateUrlParams(cat, search, sortBy);
  };

  // Sync search change
  const handleSearchChange = (q: string) => {
    setSearch(q);
    updateUrlParams(selectedCategory, q, sortBy);
  };

  // Sync sort change
  const handleSortChange = (newSort: any) => {
    setSortBy(newSort);
    updateUrlParams(selectedCategory, search, newSort);
  };

  // IDs of providers previously hired in this condo / user tickets
  const hiredProviderIds = useMemo(() => {
    return new Set(services.filter((t) => t.vendorId).map((t) => t.vendorId));
  }, [services]);

  // Filtered & Sorted Providers List
  const filteredVendors = useMemo(() => {
    return providers.filter((v) => {
      // Category filter
      const activeCategory = filters.category !== "Todas" ? filters.category : selectedCategory;
      if (activeCategory !== "Todas" && v.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      // Rating filter
      if (filters.minRating > 0 && v.rating < filters.minRating) {
        return false;
      }

      // Criteria filters
      if (filters.verifiedOnly && !v.isVerified) return false;
      if (v.startingPriceCents != null && v.startingPriceCents > filters.maxPrice) return false;

      // Search query (matches name, company, category, bio, or services offered)
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesCompany = v.company.toLowerCase().includes(q);
        const matchesCategory = v.category.toLowerCase().includes(q);
        const matchesBio = (v.bio ?? "").toLowerCase().includes(q);
        const matchesServices = v.servicesOffered.some(
          (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesCompany && !matchesCategory && !matchesBio && !matchesServices) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "reviews") return b.reviewsCount - a.reviewsCount;
      if (sortBy === "price_asc") return (a.startingPriceCents ?? Infinity) - (b.startingPriceCents ?? Infinity);
      return 0;
    });
  }, [providers, search, selectedCategory, filters, sortBy]);

  // Section 1: Sponsored Providers (Strictly marked as Ads)
  const sponsoredList = useMemo(() => {
    return filteredVendors.filter((v) => v.isSponsored);
  }, [filteredVendors]);

  // Section 2: Organic Providers
  const organicList = useMemo(() => {
    return filteredVendors.filter((v) => !v.isSponsored);
  }, [filteredVendors]);

  // Top 3 Organic in Region (Ranked strictly by ProviderScore)
  const topOrganicRegion = useMemo(() => {
    return [...providers]
      .filter((v) => (selectedCategory === "Todas" ? true : v.category.toLowerCase() === selectedCategory.toLowerCase()))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [providers, selectedCategory]);

  // View state: 'marketplace' or 'minhas-contratacoes'
  const [activeView, setActiveView] = useState<"marketplace" | "contratacoes">("marketplace");

  // Rate service state
  const [ratingTicketId, setRatingTicketId] = useState<number | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isRatingPending, startRatingTransition] = useTransition();

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTicketId) return;

    startRatingTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(ratingTicketId));
      fd.set("rating", String(ratingStars));
      fd.set("ratingComment", ratingComment);

      await rateServiceAction(fd);
      setRatingTicketId(null);
      setRatingComment("");
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0055D4] text-white shadow-xs">
              <Icon name="briefcase" size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Zeladoria Serviços
            </h1>
            <span className="rounded-full bg-blue-50 text-[#0055D4] border border-blue-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Marketplace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Encontre, compare e contrate os melhores prestadores verificados para seu condomínio
          </p>
        </div>

        {/* View Switcher: Marketplace vs Minhas Contratações */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveView("marketplace")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === "marketplace"
                ? "bg-white text-[#0055D4] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon name="grid" size={13} />
            <span>Explorar Serviços</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("contratacoes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === "contratacoes"
                ? "bg-white text-[#0055D4] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon name="clipboard" size={13} />
            <span>Minhas Contratações</span>
            {services.length > 0 && (
              <span className="rounded-full bg-[#0055D4] text-white px-1.5 py-0.2 text-[9px] font-bold">
                {services.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeView === "contratacoes" ? (
        /* MINHAS CONTRATAÇÕES / HISTÓRICO DE SERVIÇOS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
              Histórico de Solicitações e Serviços no Condomínio
            </h2>
            <button
              type="button"
              onClick={() => setActiveView("marketplace")}
              className="text-xs font-bold text-[#0055D4] hover:underline flex items-center gap-1"
            >
              <span>+ Solicitar novo serviço</span>
            </button>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-[#0055D4] flex items-center justify-center mx-auto">
                <Icon name="clipboard" size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma contratação registrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Você ainda não solicitou orçamentos ou serviços através do Zeladoria Serviços.
              </p>
              <button
                type="button"
                onClick={() => setActiveView("marketplace")}
                className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                Buscar Profissionais
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-md">
                        {ticket.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F172A]">{ticket.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ticket.status === "concluido"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ticket.status === "agendado"
                            ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                            : ticket.status === "cancelado"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Categoria:</span>{" "}
                      <strong className="text-slate-800 capitalize">{ticket.category}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Local:</span>{" "}
                      <strong className="text-slate-800">{ticket.location || "Unidade"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Data solicitada:</span>{" "}
                      <strong className="text-slate-800">
                        {ticket.preferredTime || new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {ticket.description}
                  </p>

                  {/* Rating Section if Completed */}
                  {ticket.status === "concluido" && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {ticket.rating ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-500">Sua avaliação:</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(ticket.rating)].map((_, i) => (
                              <Icon
                                key={i}
                                name="star"
                                size={12}
                                className="text-[#FFD000] fill-[#FFD000]"
                              />
                            ))}
                          </div>
                          {ticket.ratingComment && (
                            <span className="text-slate-400">&quot;{ticket.ratingComment}&quot;</span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRatingTicketId(ticket.id)}
                          className="rounded-lg bg-[#FFD000] hover:bg-[#F0C400] text-[#12162A] px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Icon name="star" size={12} />
                          <span>Avaliar serviço realizado</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MARKETPLACE DISCOVERY EXPERIENCE */
        <>
          {/* SECTION 1: HERO SEARCH BAR WITH AUTOCOMPLETE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div className="max-w-3xl mx-auto space-y-2">
              <label
                htmlFor="search-marketplace-input"
                className="block text-sm sm:text-base font-black text-[#0F172A] tracking-tight"
              >
                Qual serviço você precisa para o seu apartamento?
              </label>

              {/* Input with Autocomplete Container */}
              <div ref={searchContainerRef} className="relative">
                <div className="relative flex items-center">
                  <Icon
                    name="search"
                    size={18}
                    className="absolute left-4 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="search-marketplace-input"
                    type="text"
                    value={search}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      handleSearchChange(e.target.value);
                      setShowSuggestions(true);
                    }}
                    placeholder="Ex: chuveiro, vazamento, tomada, ar-condicionado, pintor..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0055D4] focus:bg-white transition-all shadow-xs"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 rounded-full"
                    >
                      <Icon name="x" size={15} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                      Sugestões de serviços rápidos
                    </span>
                    <div className="space-y-1">
                      {suggestions.map((sug) => (
                        <div
                          key={sug.query + sug.serviceTitle}
                          onClick={() => {
                            handleSearchChange(sug.query);
                            setSelectedCategory(sug.category);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon name="search" size={13} className="text-[#0055D4] shrink-0" />
                            <span className="font-bold text-[#0F172A] truncate">
                              {sug.serviceTitle}
                            </span>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              em {sug.category}
                            </span>
                          </div>

                          {sug.badge && (
                            <span className="rounded bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.2 shrink-0">
                              {sug.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Tags underneath search */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400">Populares:</span>
                {[
                  { tag: "Instalação de Chuveiro", cat: "eletrica", q: "chuveiro" },
                  { tag: "Caça-Vazamento", cat: "hidraulica", q: "vazamento" },
                  { tag: "Limpeza de Ar", cat: "climatizacao", q: "ar-condicionado" },
                  { tag: "Fechadura Digital", cat: "seguranca", q: "fechadura" },
                  { tag: "Ajuste de Portas", cat: "marcenaria", q: "porta" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      handleSearchChange(item.q);
                      setSelectedCategory(item.cat);
                    }}
                    className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0055D4] text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: CATEGORIES (GRID / CARROSSEL HORIZONTAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Navegar por Categoria
              </h2>
              {selectedCategory !== "Todas" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("Todas")}
                  className="text-xs font-bold text-[#0055D4] hover:underline"
                >
                  Ver todas as categorias
                </button>
              )}
            </div>

            {/* Horizontal scroll on mobile / flex wrap on desktop */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoriesConfig.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      isActive
                        ? "bg-[#0055D4] border-[#0055D4] text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      name={cat.icon as any}
                      size={15}
                      className={isActive ? "text-[#FFD000]" : "text-[#0055D4]"}
                    />
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] font-black rounded-full px-1.5 py-0.2 ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: MELHORES DA SUA REGIÃO (RANKING ORGÂNICO #1, #2, #3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD000] text-[#12162A] text-xs font-black">
                  ★
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Melhores da sua Região{" "}
                  {selectedCategory !== "Todas" ? `(${selectedCategory})` : ""}
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Ranking baseado em avaliações, pontualidade e histórico confiável
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {topOrganicRegion.map((vendor, index) => {
                const rankNum = index + 1;
                return (
                  <div
                    key={vendor.id}
                    className="relative flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs cursor-pointer"
                    onClick={() => setSelectedProfileVendor(vendor)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Medal Indicator */}
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          rankNum === 1
                            ? "bg-[#FFD000] text-[#12162A]"
                            : rankNum === 2
                            ? "bg-slate-200 text-slate-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        #{rankNum}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                            {vendor.name}
                          </h4>
                          {vendor.isVerified && (
                            <Icon name="check-circle" size={13} className="text-[#0055D4] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {vendor.category} · {vendor.company}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs mt-0.5">
                          {vendor.reviewsCount > 0 ? (
                            <>
                              <div className="flex items-center gap-0.5 font-black text-[#0F172A]">
                                <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                                <span>{vendor.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                ({vendor.reviewsCount} avaliações)
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">Ainda sem avaliações</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBudgetVendor(vendor);
                      }}
                      className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-2.5 py-1 text-[11px] font-bold shrink-0 shadow-xs"
                    >
                      Orçar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: PATROCINADOS (ANÚNCIOS CLARAMENTE IDENTIFICADOS) */}
          {sponsoredList.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Patrocinados
                </h2>
                <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider">
                  Anúncio
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsoredList.map((vendor) => (
                  <ProviderCard
                    key={vendor.id}
                    provider={vendor}
                    isFavorite={favorites.includes(vendor.id)}
                    hasHiredBefore={hiredProviderIds.has(vendor.id)}
                    onToggleFavorite={toggleFavorite}
                    onViewProfile={(p) => setSelectedProfileVendor(p)}
                    onRequestBudget={(p) => setBudgetVendor(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: TODOS OS PRESTADORES (VITRINE COM FILTROS E ORDENAÇÃO) */}
          <div className="space-y-4 pt-2">
            {/* Filter and Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Todos os Prestadores
                </h2>
                <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-black">
                  {filteredVendors.length}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {/* Mobile Filter Button (Bottom Sheet Trigger) */}
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Icon name="filter" size={13} className="text-[#0055D4]" />
                  <span>Filtros</span>
                  {(filters.minRating > 0 || filters.verifiedOnly) && (
                    <span className="h-2 w-2 rounded-full bg-[#0055D4]" />
                  )}
                </button>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold hidden sm:inline">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="score">Pontuação Geral (Score)</option>
                    <option value="rating">Melhor Avaliação</option>
                    <option value="reviews">Mais Avaliados</option>
                    <option value="price_asc">Menor Preço Inicial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {providers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Icon name="briefcase" size={22} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Nenhum prestador cadastrado ainda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  O síndico ou a administração ainda não cadastrou prestadores de serviço para este condomínio em{" "}
                  <strong>Fornecedores</strong>.
                </p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Icon name="search" size={22} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Nenhum prestador encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não encontramos nenhum profissional com os termos e filtros selecionados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("Todas");
                    setFilters({
                      category: "Todas",
                      minRating: 0,
                      verifiedOnly: false,
                      maxPrice: 50000,
                    });
                    updateUrlParams("Todas", "", "score");
                  }}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <ProviderCard
                    key={vendor.id}
                    provider={vendor}
                    isFavorite={favorites.includes(vendor.id)}
                    hasHiredBefore={hiredProviderIds.has(vendor.id)}
                    onToggleFavorite={toggleFavorite}
                    onViewProfile={(p) => setSelectedProfileVendor(p)}
                    onRequestBudget={(p) => setBudgetVendor(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: VER PERFIL COMPLETO COM PORTFÓLIO E AVALIAÇÕES */}
      <ProviderProfileModal
        provider={selectedProfileVendor}
        hasHiredBefore={selectedProfileVendor ? hiredProviderIds.has(selectedProfileVendor.id) : false}
        onClose={() => setSelectedProfileVendor(null)}
        onRequestBudget={(prov, svc) => {
          setSelectedProfileVendor(null);
          setBudgetInitialService(svc);
          setBudgetVendor(prov);
        }}
      />

      {/* MODAL: WIZARD DE SOLICITAÇÃO DE ORÇAMENTO EM 4 ETAPAS */}
      {budgetVendor && (
        <ServiceRequestWizard
          provider={budgetVendor}
          initialService={budgetInitialService}
          onClose={() => {
            setBudgetVendor(null);
            setBudgetInitialService(undefined);
          }}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* BOTTOM SHEET DE FILTROS (MOBILE FIRST) */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        filters={filters}
        categories={categoriesConfig}
        totalResultsCount={filteredVendors.length}
        onClose={() => setIsFilterSheetOpen(false)}
        onChange={(updated) => {
          const next = { ...filters, ...updated };
          setFilters(next);
          if (updated.category) setSelectedCategory(updated.category);
        }}
        onReset={() => {
          setFilters({
            category: "Todas",
            minRating: 0,
            verifiedOnly: false,
            maxPrice: 50000,
          });
          setSelectedCategory("Todas");
        }}
      />

      {/* MODAL DE AVALIAÇÃO DE SERVIÇO CONCLUÍDO */}
      {ratingTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setRatingTicketId(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#0F172A]">Avaliar Serviço Concluído</h3>
            <p className="text-xs text-slate-500">
              Sua avaliação ajuda a manter o ranking transparente e confiável para todos os vizinhos do condomínio.
            </p>

            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota do atendimento:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatingStars(s)}
                      className="p-1 text-slate-300 hover:text-[#FFD000] cursor-pointer"
                    >
                      <Icon
                        name="star"
                        size={24}
                        className={
                          s <= ratingStars
                            ? "text-[#FFD000] fill-[#FFD000]"
                            : "text-slate-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comentário sobre o serviço:
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Ex: O profissional foi pontual, realizou o reparo com rapidez e deixou tudo limpo."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4] leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRatingTicketId(null)}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRatingPending}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {isRatingPending ? "Enviando..." : "Publicar Avaliação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
