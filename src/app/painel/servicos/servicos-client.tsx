"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  buildCategoriesConfig,
  getCategorySubcategories,
  type MarketplaceProvider,
  type ServiceOffering,
} from "@/lib/services/providers-data";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/services/ranking";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { ProviderProfileModal } from "@/components/marketplace/provider-profile-modal";
import { ServiceRequestWizard } from "@/components/marketplace/service-request-wizard";
import { FilterBottomSheet, type FilterState } from "@/components/marketplace/filter-bottom-sheet";
import { MarketplaceMap } from "@/components/marketplace/marketplace-map";
import {
  acceptQuoteAction,
  confirmServiceCompletionAction,
  createVerifiedReviewAction,
  sendServiceMessageAction,
  toggleCustomerFavoriteAction,
} from "@/lib/actions/marketplace";

export function ServicosClient({
  services = [],
  marketplaceRequests = [],
  quotes = [],
  reviews = [],
  messages = [],
  initialFavorites = [],
  vendors = [],
  providers = [],
  staff = [],
  role = "morador",
  currentUserId = 1,
  condoInfo,
  canSwitchCondo = false,
}: {
  services?: any[];
  marketplaceRequests?: any[];
  quotes?: any[];
  reviews?: any[];
  messages?: any[];
  initialFavorites?: number[];
  vendors?: any[];
  providers?: MarketplaceProvider[];
  staff?: any[];
  role?: string;
  currentUserId?: number;
  condoInfo?: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  canSwitchCondo?: boolean;
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
  const [displayMode, setDisplayMode] = useState<"lista" | "mapa">("lista");
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    minRating: 0,
    verifiedOnly: false,
    maxPrice: 50000,
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const categoriesConfig = useMemo(() => buildCategoriesConfig(providers), [providers]);

  // Favorites
  const [favorites, setFavorites] = useState<number[]>(initialFavorites);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]));
    toggleCustomerFavoriteAction(id);
  };

  // Modals state
  const [selectedProfileVendor, setSelectedProfileVendor] = useState<MarketplaceProvider | null>(null);
  const [budgetVendor, setBudgetVendor] = useState<MarketplaceProvider | null>(null);
  const [budgetInitialService, setBudgetInitialService] = useState<ServiceOffering | undefined>(undefined);
  const [isGeneralBudgetOpen, setIsGeneralBudgetOpen] = useState(false);

  // Auto-open budget if ?solicitar=true in URL
  useEffect(() => {
    if (searchParams.get("solicitar") === "true") {
      setIsGeneralBudgetOpen(true);
      if (providers.length > 0 && !budgetVendor) {
        setBudgetVendor(providers[0]);
      }
    }
  }, [searchParams, providers]);

  const handleCloseBudget = () => {
    setIsGeneralBudgetOpen(false);
    setBudgetVendor(null);
    setBudgetInitialService(undefined);
    if (searchParams.get("solicitar") === "true") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("solicitar");
      const queryStr = params.toString();
      const newPath = queryStr ? `/painel/servicos?${queryStr}` : `/painel/servicos`;
      window.history.replaceState(null, "", newPath);
    }
  };

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

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setFilters((prev) => ({ ...prev, category: cat }));
    updateUrlParams(cat, search, sortBy);
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    updateUrlParams(selectedCategory, q, sortBy);
  };

  const handleSortChange = (newSort: any) => {
    setSortBy(newSort);
    updateUrlParams(selectedCategory, search, newSort);
  };

  const hiredProviderIds = useMemo(() => {
    const fromTickets = services.filter((t) => t.vendorId).map((t) => t.vendorId);
    const fromMp = marketplaceRequests.filter((r) => r.vendorId).map((r) => r.vendorId);
    return new Set([...fromTickets, ...fromMp]);
  }, [services, marketplaceRequests]);

  // Filtered & Sorted Providers List
  const filteredVendors = useMemo(() => {
    return providers
      .filter((v) => {
        const activeCategory = filters.category !== "Todas" ? filters.category : selectedCategory;
        if (activeCategory !== "Todas" && v.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }

        if (filters.minRating > 0 && v.rating < filters.minRating) return false;
        if (filters.verifiedOnly && !v.isVerified) return false;
        if (v.startingPriceCents != null && v.startingPriceCents > filters.maxPrice) return false;

        if (onlyAvailableNow && !v.isOnline && !v.availableNow) {
          return false;
        }

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
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "reviews") return b.reviewsCount - a.reviewsCount;
        if (sortBy === "price_asc") return (a.startingPriceCents ?? Infinity) - (b.startingPriceCents ?? Infinity);
        return 0;
      });
  }, [providers, search, selectedCategory, filters, sortBy, onlyAvailableNow]);

  const sponsoredList = useMemo(() => filteredVendors.filter((v) => v.isSponsored), [filteredVendors]);
  const organicList = useMemo(() => filteredVendors.filter((v) => !v.isSponsored), [filteredVendors]);

  const topOrganicRegion = useMemo(() => {
    return [...providers]
      .filter((v) => (selectedCategory === "Todas" ? true : v.category.toLowerCase() === selectedCategory.toLowerCase()))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [providers, selectedCategory]);

  const hasRealRatingsInRegion = useMemo(() => {
    return topOrganicRegion.some((p) => (p.reviewsCount ?? 0) > 0);
  }, [topOrganicRegion]);

  const rehireProviders = useMemo(() => {
    return providers.filter((p) => p.hasHiredBefore || hiredProviderIds.has(p.id));
  }, [providers, hiredProviderIds]);

  const mostHiredInCondo = useMemo(() => {
    return [...providers]
      .filter((p) => (p.condoHiredCount ?? 0) > 0)
      .sort((a, b) => (b.condoHiredCount ?? 0) - (a.condoHiredCount ?? 0))
      .slice(0, 3);
  }, [providers]);

  const [activeView, setActiveView] = useState<"marketplace" | "contratacoes">(
    searchParams.get("aba") === "contratacoes" ? "contratacoes" : "marketplace"
  );

  // Review Modal State
  const [reviewRequest, setReviewRequest] = useState<any | null>(null);
  const [revRating, setRevRating] = useState(5);
  const [revPunctuality, setRevPunctuality] = useState(5);
  const [revQuality, setRevQuality] = useState(5);
  const [revCommunication, setRevCommunication] = useState(5);
  const [revCostBenefit, setRevCostBenefit] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [isActionPending, startActionTransition] = useTransition();

  // Chat Drawer State
  const [activeChatRequest, setActiveChatRequest] = useState<any | null>(null);
  const [chatInput, setChatInput] = useState("");

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequest) return;

    startActionTransition(async () => {
      await createVerifiedReviewAction({
        requestId: reviewRequest.id,
        vendorId: reviewRequest.vendorId,
        rating: revRating,
        punctualityRating: revPunctuality,
        qualityRating: revQuality,
        communicationRating: revCommunication,
        costBenefitRating: revCostBenefit,
        comment: revComment,
      });
      setReviewRequest(null);
    });
  };

  const handleAcceptQuote = (quoteId: number) => {
    startActionTransition(async () => {
      await acceptQuoteAction(quoteId);
    });
  };

  const handleConfirmCompletion = (requestId: number) => {
    startActionTransition(async () => {
      await confirmServiceCompletionAction(requestId);
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatRequest || !chatInput.trim()) return;

    startActionTransition(async () => {
      await sendServiceMessageAction(activeChatRequest.id, chatInput.trim());
      setChatInput("");
    });
  };

  const handleRehire = (req: any) => {
    const target = providers.find((p) => p.id === req.vendorId) || providers[0];
    if (target) {
      setBudgetVendor(target);
      setActiveView("marketplace");
    }
  };

  const totalContractedCount = marketplaceRequests.length + services.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0055D4] text-white shadow-xs">
              <Icon name="briefcase" size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Zeladoria Serviços
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Encontre, compare e contrate os melhores profissionais para pequenos reparos ou reformas completas.
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
            {totalContractedCount > 0 && (
              <span className="rounded-[4px] bg-[#0055D4] text-white px-1.5 py-0.2 text-[9px] font-bold">
                {totalContractedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeView === "contratacoes" ? (
        /* MINHAS CONTRATAÇÕES & ACOMPANHAMENTO */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
              Histórico de Chamados e Contratações Ativas
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsGeneralBudgetOpen(true);
                setBudgetVendor(providers.length > 0 ? providers[0] : null);
              }}
              className="text-xs font-bold text-[#0055D4] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Solicitar novo serviço</span>
            </button>
          </div>

          {marketplaceRequests.length === 0 && services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-[#0055D4] flex items-center justify-center mx-auto">
                <Icon name="clipboard" size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma contratação registrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Você ainda não solicitou atendimentos pelo Zeladoria Serviços.
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
            <div className="space-y-4">
              {/* Marketplace Requests */}
              {marketplaceRequests.map((req) => {
                const reqQuotes = quotes.filter((q) => q.requestId === req.id);
                const reqReview = reviews.find((r) => r.requestId === req.id);
                const isCompleted = req.status === "concluido";

                return (
                  <div
                    key={`mp-${req.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-md">
                          {req.code}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">{req.title}</h3>
                        <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5">
                          {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] ${
                          req.status === "concluido"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : req.status === "em_atendimento"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                            : req.status === "a_caminho" || req.status === "chegou"
                            ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Progress State Machine Indicators */}
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-bold text-slate-400 pt-1">
                      <div className={`p-1.5 rounded-lg ${["solicitado", "buscando_prestador", "aceito", "a_caminho", "chegou", "em_atendimento", "concluido"].includes(req.status) ? "bg-blue-50 text-[#0055D4]" : "bg-slate-50"}`}>
                        1. Solicitado
                      </div>
                      <div className={`p-1.5 rounded-lg ${["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento", "concluido"].includes(req.status) ? "bg-blue-50 text-[#0055D4]" : "bg-slate-50"}`}>
                        2. Aceito
                      </div>
                      <div className={`p-1.5 rounded-lg ${["a_caminho", "chegou", "em_atendimento", "concluido"].includes(req.status) ? "bg-blue-50 text-[#0055D4]" : "bg-slate-50"}`}>
                        3. Deslocamento
                      </div>
                      <div className={`p-1.5 rounded-lg ${["em_atendimento", "concluido"].includes(req.status) ? "bg-blue-50 text-[#0055D4]" : "bg-slate-50"}`}>
                        4. Atendimento
                      </div>
                      <div className={`p-1.5 rounded-lg ${req.status === "concluido" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50"}`}>
                        5. Concluído
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Profissional:</span>{" "}
                        <strong className="text-slate-800">{req.vendorCompany || req.vendorName || "Buscando parceiro..."}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Local:</span>{" "}
                        <strong className="text-slate-800">{req.location}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Data/Previsão:</span>{" "}
                        <strong className="text-slate-800">{req.scheduledDate || "Hoje / Imediato"}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {req.description}
                    </p>

                    {/* Propostas de Orçamento Recebidas */}
                    {reqQuotes.length > 0 && req.status === "aguardando_orcamento" && (
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                        <span className="text-xs font-bold text-[#0055D4] block">
                          Propostas de Orçamento Recebidas ({reqQuotes.length}):
                        </span>
                        <div className="space-y-2">
                          {reqQuotes.map((q) => (
                            <div
                              key={q.id}
                              className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="font-bold text-[#0F172A]">{q.vendorName}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Mão de obra: R$ {(q.laborCents / 100).toFixed(2)} · Materiais: R$ {(q.materialsCents / 100).toFixed(2)} · Prazo: {q.estimatedDays} dia(s)
                                </div>
                                <p className="text-slate-600 mt-1 italic">&quot;{q.description}&quot;</p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <span className="text-sm font-black text-[#0055D4]">
                                  R$ {(q.totalCents / 100).toFixed(2)}
                                </span>
                                {q.status === "aceito" ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    Proposta Aprovada
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptQuote(q.id)}
                                    disabled={isActionPending}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 font-bold cursor-pointer transition-colors shadow-xs"
                                  >
                                    Aprovar Proposta
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions and Status Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Chat button */}
                        <button
                          type="button"
                          onClick={() => setActiveChatRequest(req)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#0055D4] hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Icon name="mail" size={13} />
                          <span>Mensagens / Chat</span>
                        </button>

                        {/* Confirm Completion Button */}
                        {["em_atendimento", "chegou", "a_caminho"].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => handleConfirmCompletion(req.id)}
                            disabled={isActionPending}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Confirmar Conclusão
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <>
                            {reqReview ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-bold text-slate-500">Sua avaliação:</span>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(reqReview.rating)].map((_, i) => (
                                    <Icon key={i} name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                                  ))}
                                </div>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-[4px]">
                                  Verificado
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReviewRequest(req)}
                                className="rounded-xl bg-[#FFD000] hover:bg-[#F0C400] text-[#12162A] px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Icon name="star" size={12} />
                                <span>Avaliar serviço</span>
                              </button>
                            )}

                            {/* Contratar Novamente */}
                            <button
                              type="button"
                              onClick={() => handleRehire(req)}
                              className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Icon name="refresh" size={12} />
                              <span>Contratar novamente</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MARKETPLACE DISCOVERY EXPERIENCE */
        <>
          {/* LOCALIZAÇÃO NO TOPO (CONTEXTO CONDOMINIAL DO MARKETPLACE) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] shrink-0 border border-blue-100 shadow-2xs">
                <Icon name="map-pin" size={18} />
              </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400">
                    Atendimento no condomínio
                  </span>
                  <p className="text-xs sm:text-sm font-black text-[#0F172A] leading-tight mt-0.5">
                    {condoInfo?.name || "Residencial Parque das Águas"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {condoInfo?.address ? `${condoInfo.address} · ${condoInfo.city || "Curitiba"} - ${condoInfo.state || "PR"}` : "Av. das Nações, 1200 · Curitiba - PR"}
                  </p>
                </div>
            </div>
            {canSwitchCondo && (
              <button
                type="button"
                onClick={() => router.push("/painel")}
                className="text-xs font-bold text-[#0055D4] hover:text-[#0047BA] hover:underline self-start sm:self-center px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 cursor-pointer transition-colors"
              >
                Alterar condomínio
              </button>
            )}
          </div>

          {/* SECTION 1: SEARCH BAR PROMINENTE (DIRETO NA PÁGINA COM RESPIRO) */}
          <div className="py-2 space-y-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Qual serviço você precisa?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Encontre profissionais avaliados que atendem o seu condomínio com agilidade e segurança.
              </p>
            </div>

            <div ref={searchContainerRef} className="relative max-w-3xl">
              <div className="relative flex items-center">
                <Icon
                  name="search"
                  size={20}
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
                  placeholder="Ex.: chuveiro queimado, vazamento, pintura, ar-condicionado..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3.5 p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                  >
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                    Sugestões de problemas e serviços
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
                          <span className="font-bold text-[#0F172A] truncate">{sug.serviceTitle}</span>
                          <span className="text-[11px] text-slate-400 shrink-0">em {sug.category}</span>
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

            {/* Quick Tags */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
              <span className="text-[11px] font-bold text-slate-400">Problemas comuns:</span>
              {[
                { tag: "Chuveiro Queimou", cat: "eletrica", q: "chuveiro" },
                { tag: "Pia Vazando", cat: "hidraulica", q: "vazamento" },
                { tag: "Ar Não Gela", cat: "climatizacao", q: "ar-condicionado" },
                { tag: "Fechadura Travada", cat: "seguranca", q: "fechadura" },
                { tag: "Pintura de Parede", cat: "pintura", q: "pintura" },
                { tag: "Marcenaria", cat: "marcenaria", q: "marcenaria" },
              ].map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => {
                    handleSearchChange(item.q);
                    setSelectedCategory(item.cat);
                  }}
                  className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0055D4] text-slate-600 px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: CATEGORIAS VISUAIS (FOTO/ÍCONE E CONTAGEM) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0055D4]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Categorias de Serviços
                </h2>
              </div>
              {selectedCategory !== "Todas" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("Todas")}
                  className="text-xs font-bold text-[#0055D4] hover:underline cursor-pointer"
                >
                  Ver todas as categorias
                </button>
              )}
            </div>

            {/* Category visual rail / tiles */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:overflow-visible">
              {categoriesConfig.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`group flex flex-col items-center justify-between p-2 rounded-2xl text-center transition-all shrink-0 w-28 sm:w-auto cursor-pointer border ${
                      isActive
                        ? "bg-blue-50/70 border-[#0055D4] shadow-xs ring-2 ring-[#0055D4]/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    {/* Visual photo/icon tile */}
                    <div className="relative h-14 w-full rounded-xl overflow-hidden bg-slate-100 mb-2 flex items-center justify-center">
                      {cat.imageUrl ? (
                        <>
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className={`absolute inset-0 transition-opacity ${isActive ? "bg-[#0055D4]/25" : "bg-black/20 group-hover:bg-black/10"}`} />
                          <span className="absolute bottom-1 right-1 p-1 rounded-md bg-white/95 text-slate-800 shadow-2xs">
                            <Icon name={cat.icon as any} size={11} className={isActive ? "text-[#0055D4]" : "text-slate-700"} />
                          </span>
                        </>
                      ) : (
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-[#0055D4] text-white" : "bg-blue-50 text-[#0055D4]"}`}>
                          <Icon name={cat.icon as any} size={20} />
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-bold truncate max-w-full leading-tight ${isActive ? "text-[#0055D4]" : "text-[#0F172A]"}`}>
                      {cat.name}
                    </span>
                    <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-[#0055D4]" : "text-slate-400"}`}>
                      {cat.count} {cat.count === 1 ? "profis." : "profis."}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subcategorias quando categoria selecionada */}
            {selectedCategory !== "Todas" && getCategorySubcategories(selectedCategory).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Subcategorias:
                </span>
                {getCategorySubcategories(selectedCategory).map((subcat) => {
                  const isSelected = search.toLowerCase() === subcat.toLowerCase();
                  return (
                    <button
                      key={subcat}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleSearchChange("");
                        } else {
                          handleSearchChange(subcat);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#0055D4] text-white border-[#0055D4] shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-[#0055D4]"
                      }`}
                    >
                      {subcat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: PRECISA PARA HOJE? (CHAMADA VISUAL SOB DEMANDA) */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <Icon name="zap" size={24} className="text-[#FFD000] fill-[#FFD000]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">
                  Precisa resolver agora?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Veja profissionais credenciados com disponibilidade confirmada para atendimento hoje.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOnlyAvailableNow(!onlyAvailableNow)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 inline-flex items-center gap-2 ${
                onlyAvailableNow
                  ? "bg-slate-900 text-white"
                  : "bg-[#0055D4] hover:bg-[#0047BA] text-white"
              }`}
            >
              {onlyAvailableNow ? (
                <>
                  <Icon name="check" size={14} strokeWidth={2.4} />
                  <span>Mostrando Disponíveis Hoje</span>
                </>
              ) : (
                <>
                  <span>Ver profissionais disponíveis</span>
                  <Icon name="arrow-right" size={13} />
                </>
              )}
            </button>
          </div>

          {/* SECTION 4: MAIS CONTRATADOS NO SEU CONDOMÍNIO (RECOMENDAÇÃO SOCIAL VISUAL) */}
          {mostHiredInCondo.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-emerald-600 text-white">
                    <Icon name="shield" size={12} strokeWidth={2.4} />
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Mais contratados no {condoInfo?.name || "seu condomínio"}
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Profissionais com histórico no condomínio
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {mostHiredInCondo.map((vendor) => {
                  const mainPhoto = vendor.portfolio?.[0]?.url || vendor.avatarUrl;
                  return (
                    <div
                      key={`condo-top-${vendor.id}`}
                      onClick={() => setSelectedProfileVendor(vendor)}
                      className="group rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs cursor-pointer overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top Visual Photo - Limpa sem badges flutuantes */}
                      <div className="h-32 w-full bg-slate-100 overflow-hidden">
                        {mainPhoto ? (
                          <img
                            src={mainPhoto}
                            alt={vendor.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold">
                            {vendor.company}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-[#0F172A] truncate">
                              {vendor.name}
                            </h4>
                            {vendor.isVerified && (
                              <Icon name="check-circle" size={13} className="text-[#0055D4] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {vendor.category} · {vendor.company}
                          </p>

                          {/* Rating or Novo no Zeladoria */}
                          <div className="mt-1 flex items-center gap-2">
                            {vendor.reviewsCount > 0 ? (
                              <div className="flex items-center gap-1 text-xs">
                                <Icon name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                                <span className="font-black text-[#0F172A]">{vendor.rating.toFixed(1)}</span>
                                <span className="text-[10px] text-slate-400">({vendor.reviewsCount} avaliações)</span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-[#0055D4]">
                                Novo no Zeladoria
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] font-medium text-emerald-700 mt-1">
                            ✓ {vendor.condoHiredCount} serviços realizados neste condomínio
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileVendor(vendor);
                            }}
                            className="text-xs font-bold text-slate-700 hover:text-[#0055D4] transition-colors"
                          >
                            Ver perfil
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBudgetVendor(vendor);
                            }}
                            className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            Solicitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: MELHORES AVALIADOS NA SUA REGIÃO (TOP 3 VISUAL) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#FFD000] text-[#12162A]">
                  <Icon name="star" size={12} strokeWidth={2.4} />
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  {hasRealRatingsInRegion
                    ? `Melhores da sua Região ${selectedCategory !== "Todas" ? `(${selectedCategory})` : ""}`
                    : `Profissionais Credenciados ${selectedCategory !== "Todas" ? `(${selectedCategory})` : ""}`}
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {hasRealRatingsInRegion
                  ? "Ranking por avaliações verificadas, pontualidade e satisfação"
                  : "Profissionais verificados disponíveis para o seu condomínio"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {topOrganicRegion.map((vendor, index) => {
                const rankNum = index + 1;
                const photo = vendor.portfolio?.[0]?.url || vendor.avatarUrl;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedProfileVendor(vendor)}
                    className="group rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs cursor-pointer overflow-hidden flex flex-col justify-between"
                  >
                    {/* Visual photo top - Limpa sem badges flutuantes */}
                    <div className="h-28 w-full bg-slate-100 overflow-hidden">
                      {photo ? (
                        <img
                          src={photo}
                          alt={vendor.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold">
                          {vendor.company}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black ${rankNum === 1 ? "text-[#0055D4]" : "text-slate-400"}`}>
                            #{rankNum}
                          </span>
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

                        <div className="flex items-center justify-between text-xs mt-1.5">
                          {vendor.reviewsCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                              <span className="font-black text-[#0F172A]">{vendor.rating.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400">({vendor.reviewsCount})</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-[#0055D4]">
                              Novo no Zeladoria
                            </span>
                          )}

                          {vendor.startingPriceCents && (
                            <span className="text-[11px] font-semibold text-slate-700">
                              A partir de R$ {(vendor.startingPriceCents / 100).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfileVendor(vendor);
                          }}
                          className="text-xs font-bold text-slate-700 hover:text-[#0055D4] transition-colors"
                        >
                          Ver perfil
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBudgetVendor(vendor);
                          }}
                          className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Solicitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: CONTRATE NOVAMENTE (SE HOUVER HISTÓRICO REAL DO MORADOR) */}
          {rehireProviders.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0055D4] text-white">
                  <Icon name="refresh" size={12} strokeWidth={2.4} />
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Contrate Novamente
                </h2>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Profissionais já contratados por você anteriormente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rehireProviders.slice(0, 3).map((vendor) => (
                  <div
                    key={`rehire-${vendor.id}`}
                    className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-[#0055D4] shrink-0 overflow-hidden shadow-2xs">
                        {vendor.avatarUrl ? (
                          <img src={vendor.avatarUrl} alt={vendor.name} className="h-full w-full object-cover" />
                        ) : (
                          vendor.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                          {vendor.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {vendor.category} · {vendor.company}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                          ✓ Você já utilizou este profissional
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-100">
                      <div className="flex items-center gap-1 text-xs">
                        {vendor.reviewsCount > 0 ? (
                          <>
                            <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                            <span className="font-bold text-[#0F172A]">{vendor.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400">({vendor.reviewsCount})</span>
                          </>
                        ) : (
                          <span className="rounded bg-white text-[#0055D4] text-[10px] font-bold px-1.5 py-0.2">
                            Novo no Zeladoria
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBudgetVendor(vendor)}
                        className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Icon name="refresh" size={12} />
                        <span>Contratar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: PATROCINADOS (PUBLICIDADE DISTINTA) */}
          {sponsoredList.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Patrocinados
                </h2>
                <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider">
                  Publicidade
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

          {/* SECTION 6: VITRINE COMPLETA COM SELETOR LISTA / MAPA */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Prestadores Disponíveis
                </h2>
                <span className="rounded-[4px] bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-black">
                  {filteredVendors.length}
                </span>
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {/* View Switcher: Lista vs Mapa */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("lista")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displayMode === "lista"
                        ? "bg-[#0055D4] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon name="grid" size={12} />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("mapa")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      displayMode === "mapa"
                        ? "bg-[#0055D4] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon name="map-pin" size={12} />
                    <span>Mapa</span>
                  </button>
                </div>

                {/* Filter Sheet Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Icon name="filter" size={13} className="text-[#0055D4]" />
                  <span>Filtros</span>
                </button>

                {/* Sort selector */}
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

            {/* Display Mode: MAPA */}
            {displayMode === "mapa" ? (
              <MarketplaceMap
                providers={filteredVendors}
                onSelectProvider={(p) => setSelectedProfileVendor(p)}
                onRequestBudget={(p) => setBudgetVendor(p)}
              />
            ) : (
              /* Display Mode: LISTA */
              <>
                {providers.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Icon name="briefcase" size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Nenhum prestador cadastrado ainda</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Ainda não há prestadores credenciados disponíveis para este condomínio.
                    </p>
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Icon name="search" size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Nenhum prestador encontrado com estes filtros</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Tente alterar os termos de busca ou selecionar outra categoria.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("Todas");
                        setOnlyAvailableNow(false);
                      }}
                      className="rounded-xl bg-[#0055D4] text-white px-4 py-2 text-xs font-bold cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVendors.map((vendor, index) => (
                      <ProviderCard
                        key={vendor.id}
                        provider={vendor}
                        rankingPosition={index < 3 ? index + 1 : undefined}
                        isFavorite={favorites.includes(vendor.id)}
                        hasHiredBefore={hiredProviderIds.has(vendor.id)}
                        onToggleFavorite={toggleFavorite}
                        onViewProfile={(p) => setSelectedProfileVendor(p)}
                        onRequestBudget={(p) => setBudgetVendor(p)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Profile Storefront Modal */}
      {selectedProfileVendor && (
        <ProviderProfileModal
          provider={selectedProfileVendor}
          hasHiredBefore={hiredProviderIds.has(selectedProfileVendor.id)}
          onClose={() => setSelectedProfileVendor(null)}
          onRequestBudget={(p, svc) => {
            setSelectedProfileVendor(null);
            setBudgetVendor(p);
            setBudgetInitialService(svc);
          }}
        />
      )}

      {/* Service Request Wizard */}
      {(isGeneralBudgetOpen || budgetVendor) && (
        <ServiceRequestWizard
          provider={budgetVendor}
          availableProviders={providers}
          initialService={budgetInitialService}
          onClose={handleCloseBudget}
          onSuccess={() => {
            handleCloseBudget();
            setActiveView("contratacoes");
          }}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        filters={filters}
        categories={categoriesConfig}
        totalResultsCount={filteredVendors.length}
        onClose={() => setIsFilterSheetOpen(false)}
        onChange={(updated) => {
          setFilters((prev) => {
            const next = { ...prev, ...updated };
            if (updated.category) {
              setSelectedCategory(updated.category);
              updateUrlParams(updated.category, search, sortBy);
            }
            return next;
          });
        }}
        onReset={() => {
          setFilters({ category: "Todas", minRating: 0, verifiedOnly: false, maxPrice: 50000 });
          setSelectedCategory("Todas");
          updateUrlParams("Todas", search, sortBy);
        }}
      />

      {/* Review Modal (4 Criteria) */}
      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setReviewRequest(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0055D4]">
                  Avaliação Verificada
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Como foi o atendimento de {reviewRequest.vendorCompany || reviewRequest.vendorName}?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Nota Geral */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota Geral do Serviço (1 a 5 estrelas):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRevRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Icon
                        name="star"
                        size={24}
                        className={revRating >= star ? "text-[#FFD000] fill-[#FFD000]" : "text-slate-300"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-[#0F172A] ml-2">{revRating} de 5</span>
                </div>
              </div>

              {/* 4 Critérios Opcionais */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-600 font-medium">Pontualidade:</span>
                  <select
                    value={revPunctuality}
                    onChange={(e) => setRevPunctuality(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                  >
                    <option value={5}>5 - Excelente / No horário</option>
                    <option value={4}>4 - Bom</option>
                    <option value={3}>3 - Regular</option>
                    <option value={2}>2 - Atrasou</option>
                    <option value={1}>1 - Muito atrasado</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-600 font-medium">Qualidade da Execução:</span>
                  <select
                    value={revQuality}
                    onChange={(e) => setRevQuality(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                  >
                    <option value={5}>5 - Impecável</option>
                    <option value={4}>4 - Muito boa</option>
                    <option value={3}>3 - Adequada</option>
                    <option value={2}>2 - Deixou a desejar</option>
                    <option value={1}>1 - Ruim</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-600 font-medium">Comunicação e Educação:</span>
                  <select
                    value={revCommunication}
                    onChange={(e) => setRevCommunication(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                  >
                    <option value={5}>5 - Muito atencioso</option>
                    <option value={4}>4 - Boa</option>
                    <option value={3}>3 - Normal</option>
                    <option value={2}>2 - Pouco comunicativo</option>
                    <option value={1}>1 - Inadequada</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-600 font-medium">Custo-Benefício:</span>
                  <select
                    value={revCostBenefit}
                    onChange={(e) => setRevCostBenefit(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                  >
                    <option value={5}>5 - Justo e vantajoso</option>
                    <option value={4}>4 - Bom</option>
                    <option value={3}>3 - Razoável</option>
                    <option value={2}>2 - Caro</option>
                    <option value={1}>1 - Muito caro</option>
                  </select>
                </div>
              </div>

              {/* Comentário */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Comentário Público:
                </label>
                <textarea
                  rows={3}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Conte para outros moradores como foi a sua experiência com este prestador..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isActionPending ? "Enviando avaliação..." : "Publicar Avaliação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contextual Chat Drawer */}
      {activeChatRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setActiveChatRequest(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl z-10 flex flex-col h-[520px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0055D4]">Chat do Atendimento</span>
                <h3 className="text-sm font-bold text-[#0F172A]">{activeChatRequest.title}</h3>
                <p className="text-[11px] text-slate-400">Chamado: {activeChatRequest.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChatRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-slate-50">
              {messages.filter((m) => m.requestId === activeChatRequest.id).length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  Nenhuma mensagem trocada ainda neste chamado.
                </div>
              ) : (
                messages
                  .filter((m) => m.requestId === activeChatRequest.id)
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                        msg.senderRole === "sistema"
                          ? "bg-slate-200 text-slate-700 mx-auto text-center"
                          : msg.senderRole === "morador"
                          ? "bg-[#0055D4] text-white ml-auto rounded-tr-xs"
                          : "bg-white text-slate-800 border border-slate-200 mr-auto rounded-tl-xs"
                      }`}
                    >
                      <div className="text-[10px] opacity-75 mb-0.5 capitalize">{msg.senderRole}</div>
                      <div>{msg.body}</div>
                    </div>
                  ))
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva uma mensagem para o prestador..."
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#0055D4]"
              />
              <button
                type="submit"
                disabled={isActionPending || !chatInput.trim()}
                className="h-10 px-4 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Icon name="send" size={13} />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
