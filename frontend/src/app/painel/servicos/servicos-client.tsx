"use client";

import { resolveRebookProvider } from "@/lib/services/rebooking";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import {
  buildCategoriesConfig,
  normalizeServiceCategory,
  getCategorySubcategories,
  type MarketplaceProvider,
  type ServiceOffering,
} from "@/lib/services/providers-data";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/services/ranking";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { ProviderProfileModal } from "@/components/marketplace/provider-profile-modal";
import { ServiceRequestWizard } from "@/components/marketplace/service-request-wizard";
import { FilterDrawer, type ExtendedFilterState } from "@/components/marketplace/filter-drawer";
import { LocationModal, type ServiceLocation } from "@/components/marketplace/location-modal";
import { MarketplaceMap } from "@/components/marketplace/marketplace-map";
import { MarketplaceImageBanner } from "@/components/marketplace/marketplace-image-banner";
import { calculateHaversineKm } from "@/lib/services/geo";
import { selectEligiblePromotions } from "@/lib/services/promotions";
import {
  acceptQuoteAction,
  confirmServiceCompletionAction,
  createVerifiedReviewAction,
  sendServiceMessageAction,
  toggleCustomerFavoriteAction,
} from "@/lib/actions/marketplace";
import {
  customerSelectInspectionSlotAction,
  customerAcceptProposalAction,
  customerRejectProposalAction,
  customerAcceptContractAddendumAction,
  customerRejectContractAddendumAction,
  rebookServiceRequestAction,
  customerConfirmCompletionAction,
  customerOpenDisputeAction,
  simulateWebhookPaymentAction,
  getContractReceiptAction,
  customerRequestWarrantyAction,
} from "@/lib/actions/zeladoria-pay";
import {
  CustomerInspectionCheckoutModal,
  CustomerServiceCheckoutModal,
  CustomerDisputeModal,
  CustomerContractReceiptModal,
  CustomerWarrantyRequestModal,
  EvidenceLightboxModal,
  RebookServiceModal,
} from "@/components/marketplace/zeladoria-pay-modals";

// Definição das 5 etapas da máquina de estados do Tião Zelador
const SERVICE_STEPS = [
  { id: "solicitado", label: "Solicitado", icon: "clock" as IconName, shortDesc: "Pedido enviado" },
  { id: "aceito", label: "Aceito", icon: "user-check" as IconName, shortDesc: "Confirmado" },
  { id: "deslocamento", label: "Deslocamento", icon: "truck" as IconName, shortDesc: "A caminho" },
  { id: "atendimento", label: "Atendimento", icon: "wrench" as IconName, shortDesc: "Em execução" },
  { id: "concluido", label: "Concluído", icon: "check-circle" as IconName, shortDesc: "Finalizado" },
];

function getServiceProgress(status: string): {
  stepIndex: number;
  isDispute: boolean;
  isCanceled: boolean;
} {
  const s = String(status || "").toLowerCase();
  const isCanceled = s === "cancelado" || s === "recusado";
  const isDispute = s === "em_disputa" || s === "disputa_aberta";

  if (s === "concluido" || s === "finalizado" || s === "fechado") {
    return { stepIndex: 4, isDispute, isCanceled };
  }
  if (
    [
      "em_atendimento",
      "correcao_solicitada",
      "prestador_concluiu",
      "conclusao_solicitada",
      "prestador_finalizou",
      "servico_finalizado_prestador",
      "provider_completed",
      "executado_prestador",
    ].includes(s)
  ) {
    return { stepIndex: 3, isDispute, isCanceled };
  }
  if (["a_caminho", "deslocamento", "chegou"].includes(s)) {
    return { stepIndex: 2, isDispute, isCanceled };
  }
  if (
    [
      "aceito",
      "orcamento_aprovado",
      "proposta_aceita",
      "servico_pago_liberado",
      "pago",
      "agendado",
      "vistoria_confirmada",
      "vistoria_concluida",
      "aguardando_pagamento_servico",
    ].includes(s)
  ) {
    return { stepIndex: 1, isDispute, isCanceled };
  }
  return { stepIndex: 0, isDispute, isCanceled };
}

export function ServicosClient({
  services = [],
  marketplaceRequests = [],
  quotes = [],
  reviews = [],
  messages = [],
  inspections = [],
  paymentOrders = [],
  addendums = [],
  evidences = [],
  hiredProviders = [],
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
  inspections?: any[];
  paymentOrders?: any[];
  addendums?: any[];
  evidences?: any[];
  hiredProviders?: any[];
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

  // Condomínios disponíveis para escolha rápida
  const availableCondos = useMemo(() => {
    return condoInfo
      ? [
          {
            id: condoInfo.id,
            name: condoInfo.name,
            address: condoInfo.address,
            city: condoInfo.city,
            state: condoInfo.state,
            lat: condoInfo.latitude ? Number(condoInfo.latitude) : -25.4284,
            lng: condoInfo.longitude ? Number(condoInfo.longitude) : -49.2733,
          },
        ]
      : [];
  }, [condoInfo]);

  // Location State (Interativo no topo e no mapa)
  const [serviceLocation, setServiceLocation] = useState<ServiceLocation>(() => {
    const defaultLat = condoInfo?.latitude ? Number(condoInfo.latitude) : -25.4284;
    const defaultLng = condoInfo?.longitude ? Number(condoInfo.longitude) : -49.2733;
    return {
      type: "meu_condominio",
      name: condoInfo?.name || "Residencial Parque das Águas",
      address: condoInfo?.address || "Av. das Nações, 1200",
      unit: "Unidade 302",
      city: condoInfo?.city || "Curitiba",
      state: condoInfo?.state || "PR",
      lat: defaultLat,
      lng: defaultLng,
    };
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // URL state persistence
  const initialCategory = searchParams.get("categoria") || "Todas";
  const initialSearch = searchParams.get("busca") || "";
  const initialSort = (searchParams.get("ordem") as any) || "score";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<"score" | "distance" | "rating" | "condo" | "response" | "price_asc">(initialSort);
  const [displayMode, setDisplayMode] = useState<"lista" | "mapa">("lista");
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<ExtendedFilterState>({
    category: initialCategory,
    subcategory: undefined,
    minRating: 0,
    verifiedOnly: false,
    maxPrice: 50000,
    availableNowOnly: false,
    condoHiredOnly: false,
    maxDistanceKm: undefined,
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

  // Lightbox e Recontratação Direta
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    images: { url: string; caption?: string; stage?: string }[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });
  const [isRebookModalOpen, setIsRebookModalOpen] = useState(false);
  const [rebookVendor, setRebookVendor] = useState<any>(null);

  const openLightbox = (images: { url: string; caption?: string; stage?: string }[], index: number = 0) => {
    setLightboxData({
      isOpen: true,
      images,
      initialIndex: index,
    });
  };

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

  // Active Filters Count (para exibir badge no botão de filtros)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== "Todas") count++;
    if (filters.subcategory) count++;
    if (filters.minRating > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.availableNowOnly || onlyAvailableNow) count++;
    if (filters.condoHiredOnly) count++;
    if (filters.maxPrice < 50000) count++;
    if (filters.maxDistanceKm != null) count++;
    return count;
  }, [filters, onlyAvailableNow]);

  const isContratacoesTab = (params: { get: (k: string) => string | null }) => {
    const tab = params.get("tab");
    const aba = params.get("aba");
    return (
      tab === "minhas-contratacoes" ||
      tab === "contratacoes" ||
      aba === "contratacoes" ||
      aba === "minhas-contratacoes"
    );
  };

  const isFavoritesTab = (params: { get: (k: string) => string | null }) => {
    return params.get("tab") === "favoritos" || params.get("fav") === "1";
  };

  const [activeView, setActiveView] = useState<"marketplace" | "contratacoes">(
    isContratacoesTab(searchParams) ? "contratacoes" : "marketplace"
  );
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(
    isFavoritesTab(searchParams)
  );

  useEffect(() => {
    setActiveView(isContratacoesTab(searchParams) ? "contratacoes" : "marketplace");
    setOnlyFavorites(isFavoritesTab(searchParams));
  }, [searchParams]);

  const switchTab = (tab: "marketplace" | "contratacoes" | "favoritos") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("aba");
    if (tab === "contratacoes") {
      setActiveView("contratacoes");
      setOnlyFavorites(false);
      params.set("tab", role === "morador" ? "minhas-contratacoes" : "contratacoes");
    } else if (tab === "favoritos") {
      setActiveView("marketplace");
      setOnlyFavorites(true);
      params.set("tab", "favoritos");
    } else {
      setActiveView("marketplace");
      setOnlyFavorites(false);
      params.delete("tab");
      params.delete("fav");
    }
    const queryStr = params.toString();
    const newPath = queryStr ? `/painel/servicos?${queryStr}` : `/painel/servicos`;
    window.history.replaceState(null, "", newPath);
  };

  const switchView = (view: "marketplace" | "contratacoes") => switchTab(view);

  // Distância dinâmica recalculada em tempo real com base no local de atendimento selecionado
  const providersWithDynamicDistance = useMemo(() => {
    const targetLat = serviceLocation.lat ?? (condoInfo?.latitude ? Number(condoInfo.latitude) : -25.4284);
    const targetLng = serviceLocation.lng ?? (condoInfo?.longitude ? Number(condoInfo.longitude) : -49.2733);

    return providers.map((p) => {
      if (p.lat != null && p.lng != null) {
        const dist = calculateHaversineKm(targetLat, targetLng, p.lat, p.lng);
        return { ...p, distanceKm: dist };
      }
      return p;
    });
  }, [providers, serviceLocation.lat, serviceLocation.lng, condoInfo?.latitude, condoInfo?.longitude]);

  // Filtered & Sorted Providers List
  const filteredVendors = useMemo(() => {
    return providersWithDynamicDistance
      .filter((v) => {
        if (onlyFavorites && !favorites.includes(v.id)) {
          return false;
        }
        const activeCategory = filters.category !== "Todas" ? filters.category : selectedCategory;
        if (activeCategory !== "Todas" && normalizeServiceCategory(v.category) !== normalizeServiceCategory(activeCategory)) {
          return false;
        }

        // Subcategoria
        if (filters.subcategory) {
          const subLower = filters.subcategory.toLowerCase();
          const matchesOffering = v.servicesOffered.some((s) => s.name.toLowerCase().includes(subLower));
          const matchesBio = (v.bio ?? "").toLowerCase().includes(subLower);
          if (!matchesOffering && !matchesBio) return false;
        }

        if (filters.minRating > 0 && v.rating < filters.minRating) return false;
        if (filters.verifiedOnly && !v.isVerified) return false;
        if (filters.condoHiredOnly && (v.condoHiredCount ?? 0) <= 0) return false;
        if (filters.maxPrice < 50000 && v.startingPriceCents != null && v.startingPriceCents > filters.maxPrice) return false;
        if (filters.maxDistanceKm != null && v.distanceKm != null && v.distanceKm > filters.maxDistanceKm) return false;

        // Regra do Marketplace (PostGIS / Spatial): O raio de atendimento pertence ao prestador.
        // Se a distância do cliente for superior ao alcance definido pelo prestador, ele não atende esse local.
        const providerCoverageRadiusKm = v.serviceRadiusKm ?? 15;
        if (v.distanceKm != null && v.distanceKm > providerCoverageRadiusKm) {
          return false;
        }

        const mustBeAvailableNow = onlyAvailableNow || filters.availableNowOnly;
        if (mustBeAvailableNow && !v.isOnline && !v.availableNow) {
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
        if (sortBy === "distance") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
        if (sortBy === "rating") return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        if (sortBy === "condo") return (b.condoHiredCount ?? 0) - (a.condoHiredCount ?? 0);
        if (sortBy === "response") return (a.responseTimeMinutes ?? 999) - (b.responseTimeMinutes ?? 999);
        if (sortBy === "price_asc") return (a.startingPriceCents ?? Infinity) - (b.startingPriceCents ?? Infinity);
        return 0;
      });
  }, [providersWithDynamicDistance, search, selectedCategory, filters, sortBy, onlyAvailableNow, onlyFavorites, favorites]);

  const sponsoredList = useMemo(() => {
    const rawSponsored = providers.filter((v) => v.isSponsored);
    const eligible = selectEligiblePromotions(
      rawSponsored.map((p) => ({
        ...p,
        vendorId: p.id,
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 3600000),
        endsAt: new Date(Date.now() + 86400000 * 7),
        categoryId: p.category,
        vendorCategory: p.category,
      })),
      {
        category: selectedCategory === "Todas" ? (search ? search : undefined) : selectedCategory,
        maxLimit: 2,
      }
    );
    // Mapear de volta para o objeto de MarketplaceProvider
    const eligibleVendorIds = new Set(eligible.map((e) => e.vendorId));
    return rawSponsored.filter((p) => eligibleVendorIds.has(p.id)).slice(0, 2);
  }, [providers, selectedCategory, search]);

  const organicList = useMemo(() => {
    return filteredVendors.filter((v) => !v.isSponsored);
  }, [filteredVendors]);

  // Seus Profissionais filtrados contextualmente (Seção 56)
  const displayedHiredProviders = useMemo(() => {
    if (!hiredProviders || hiredProviders.length === 0) return [];
    return hiredProviders.filter((hp: any) => {
      if (
        selectedCategory !== "Todas" &&
        normalizeServiceCategory(hp.category) !== normalizeServiceCategory(selectedCategory)
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = hp.name.toLowerCase().includes(q);
        const matchesCat = hp.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      return true;
    });
  }, [hiredProviders, selectedCategory, search]);

  // Patrocinados relevantes (Seção 13, 14, 57)
  const displayedSponsoredList = useMemo(() => {
    const hiredIds = new Set(displayedHiredProviders.map((hp: any) => hp.id));
    const notInHired = sponsoredList.filter((p) => !hiredIds.has(p.id));
    return notInHired.length > 0 ? notInHired.slice(0, 2) : sponsoredList.slice(0, 2);
  }, [sponsoredList, displayedHiredProviders]);

  // Recomendados para você com Deduplicação Visual (Seção 55)
  const displayedOrganicList = useMemo(() => {
    const higherPriorityIds = new Set([
      ...displayedHiredProviders.map((hp: any) => hp.id),
      ...displayedSponsoredList.map((sp) => sp.id),
    ]);
    const deduplicated = organicList.filter((v) => !higherPriorityIds.has(v.id));
    return deduplicated.length > 0 ? deduplicated : organicList;
  }, [organicList, displayedHiredProviders, displayedSponsoredList]);

  // Paginação controlada com "Carregar mais" (Seção 48)
  const [visibleCount, setVisibleCount] = useState(12);
  const paginatedOrganicList = useMemo(() => {
    return displayedOrganicList.slice(0, visibleCount);
  }, [displayedOrganicList, visibleCount]);

  // Reset da paginação ao alterar categoria, busca ou ordenação
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, search, sortBy]);

  const newcomersList = useMemo(() => {
    return providers
      .filter((v) => !v.isSponsored && (v.reviewsCount === 0 || !v.rating))
      .slice(0, 4);
  }, [providers]);

  const topOrganicRegion = useMemo(() => {
    return [...providers]
      .filter((v) => (selectedCategory === "Todas" ? true : normalizeServiceCategory(v.category) === normalizeServiceCategory(selectedCategory)))
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

  // Zeladoria Pay Checkout & Dispute States
  const [inspectionCheckoutData, setInspectionCheckoutData] = useState<any>(null);
  const [serviceCheckoutData, setServiceCheckoutData] = useState<any>(null);
  const [disputeModalReq, setDisputeModalReq] = useState<any>(null);
  const [receiptModalData, setReceiptModalData] = useState<any>(null);
  const [warrantyModalReq, setWarrantyModalReq] = useState<any>(null);
  const [selectedInspectionSlots, setSelectedInspectionSlots] = useState<Record<number, { date: string; time: string }>>({});

  // Marketplace: Ordenação de orçamentos e modal de resumo de aceite
  const [quoteSortBy, setQuoteSortBy] = useState<Record<number, "recomendados" | "menor_preco" | "melhor_avaliacao" | "mais_rapido">>({});
  const [selectedQuoteForAcceptance, setSelectedQuoteForAcceptance] = useState<{ quote: any; request: any } | null>(null);

  const handleSelectSlot = (reqId: number, slot: { date: string; time: string }) => {
    setSelectedInspectionSlots((prev) => ({ ...prev, [reqId]: slot }));
  };

  const handleConfirmInspection = (insp: any, req: any) => {
    const slot = selectedInspectionSlots[req.id] || (insp.availableSlots && insp.availableSlots[0]);
    if (!slot) return;

    startActionTransition(async () => {
      const res = await customerSelectInspectionSlotAction({
        inspectionId: insp.id,
        selectedSlot: { date: slot.date, time: slot.time },
      });
      if (res && res.success && 'checkoutRequired' in res && res.checkoutRequired) {
        setInspectionCheckoutData(res);
      }
    });
  };

  const handleAcceptProposalZeladoriaProtege = (quoteId: number) => {
    startActionTransition(async () => {
      const res = await customerAcceptProposalAction({ quoteId });
      if (res?.success) {
        setServiceCheckoutData(res);
      } else {
        alert(res?.error || "Erro ao processar aceite da proposta.");
      }
    });
  };

  const handleRejectQuote = (requestId: number, quoteId: number) => {
    if (!confirm("Deseja recusar este orçamento?")) return;
    startActionTransition(async () => {
      const res = await customerRejectProposalAction({ requestId, quoteId });
      if (!res.success) {
        alert(('error' in res && res.error) || "Não foi possível recusar o orçamento.");
      }
    });
  };

  const handleAcceptAddendum = (addendumId: number) => {
    startActionTransition(async () => {
      const res = await customerAcceptContractAddendumAction({ addendumId });
      if (res?.success) {
        setServiceCheckoutData(res);
      }
    });
  };

  const handleSimulatePayment = (orderCode: string) => {
    startActionTransition(async () => {
      await simulateWebhookPaymentAction(orderCode);
      setInspectionCheckoutData(null);
      setServiceCheckoutData(null);
    });
  };

  const handleOpenDispute = (data: { reason: string; description: string }) => {
    if (!disputeModalReq) return;
    startActionTransition(async () => {
      await customerOpenDisputeAction({
        requestId: disputeModalReq.id,
        reason: data.reason,
        description: data.description,
      });
      setDisputeModalReq(null);
    });
  };

  const handleOpenReceipt = (requestId: number) => {
    startActionTransition(async () => {
      const res = await getContractReceiptAction(requestId);
      if (res.success && res.receipt) {
        setReceiptModalData(res.receipt);
      } else {
        alert(res.error || "Não foi possível carregar o recibo da contratação.");
      }
    });
  };

  const handleOpenWarranty = (req: any) => {
    setWarrantyModalReq(req);
  };

  const handleSubmitWarranty = (requestId: number, description: string) => {
    startActionTransition(async () => {
      const res = await customerRequestWarrantyAction({ requestId, description });
      if (res.success) {
        alert("Solicitação de garantia registrada com sucesso! A equipe de suporte e o prestador foram notificados.");
        setWarrantyModalReq(null);
        router.refresh();
      } else {
        alert(res.error || "Erro ao registrar solicitação de garantia.");
      }
    });
  };

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
      router.refresh();
    });
  };

  const handleAcceptQuote = (quoteId: number) => {
    startActionTransition(async () => {
      await acceptQuoteAction(quoteId);
    });
  };

  const handleConfirmCompletion = (reqOrId: any) => {
    const targetReq = typeof reqOrId === "object" ? reqOrId : marketplaceRequests.find((r) => r.id === reqOrId);
    const reqId = typeof reqOrId === "object" ? reqOrId.id : reqOrId;

    startActionTransition(async () => {
      const res = await customerConfirmCompletionAction(reqId);
      if (!res.success) {
        await confirmServiceCompletionAction(reqId);
      }
      if (targetReq) {
        setReviewRequest(targetReq);
      }
      router.refresh();
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

  const handleRejectAddendum = (addendumId: number) => {
    if (!confirm("Deseja realmente recusar este adicional? O serviço continuará somente no escopo original acordado.")) return;
    startActionTransition(async () => {
      try {
        const res = await customerRejectContractAddendumAction({ addendumId });
        if (res.success) {
          router.refresh();
        } else {
          alert((res as any).error || "Erro ao recusar adicional.");
        }
      } catch (e: any) {
        alert(e.message || "Erro inesperado.");
      }
    });
  };

  const handleRebookSubmit = (data: any) => {
    startActionTransition(async () => {
      try {
        const res = await rebookServiceRequestAction(data);
        if (res.success) {
          if ("emailWarning" in res && res.emailWarning) alert(res.emailWarning);
          setIsRebookModalOpen(false);
          setRebookVendor(null);
          setActiveView("contratacoes");
          router.refresh();
        } else {
          alert(res.error || "Erro ao solicitar novo chamado.");
        }
      } catch (e: any) {
        alert(e.message || "Erro inesperado.");
      }
    });
  };

  const handleRehire = (reqOrVendor: any) => {
    const vId = reqOrVendor.vendorId || reqOrVendor.id;
    const target = resolveRebookProvider(vId, providers, vendors) ?? {
      id: vId,
      name: reqOrVendor.vendorCompany || reqOrVendor.vendorName || reqOrVendor.name || "Profissional",
      category: reqOrVendor.category || "Serviços Residenciais",
      active: false,
      services: [],
    };
    setRebookVendor(target);
    setIsRebookModalOpen(true);
  };

  const getQuoteValidityInfo = (quote: any) => {
    if (!quote.expiresAt) {
      return {
        isExpired: false,
        isNearExpiry: false,
        hoursLeft: null,
        formattedExpiry: null,
      };
    }
    const expiryDate = new Date(quote.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const isExpired = diffMs <= 0;
    const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    const isNearExpiry = !isExpired && hoursLeft <= 3;

    const day = String(expiryDate.getDate()).padStart(2, "0");
    const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
    const hours = String(expiryDate.getHours()).padStart(2, "0");
    const minutes = String(expiryDate.getMinutes()).padStart(2, "0");
    const formattedExpiry = `${day}/${month} às ${hours}:${minutes}`;

    return {
      isExpired,
      isNearExpiry,
      hoursLeft,
      formattedExpiry,
    };
  };

  const totalContractedCount = marketplaceRequests.length + services.length;

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. HERO OFICIAL DO TIÃO ZELADOR */}
      <div className="rounded-2xl border border-orange-200/90 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Detalhe gráfico discreto e sólido de fundo */}
        <svg
          className="pointer-events-none absolute right-0 top-0 h-full w-1/3 select-none text-orange-50"
          viewBox="0 0 240 140"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="40" r="80" stroke="#FB6B01" strokeWidth="1" strokeOpacity="0.15" />
          <circle cx="200" cy="40" r="120" stroke="#FB6B01" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.12" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Lado Esquerdo: Identidade Tião */}
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="shrink-0 flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#FB6B01] p-2 shadow-xs">
              <img
                src="/brands/tiao/mascot-white.png"
                alt="Tião Zelador"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Tião Zelador
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Encontre, compare e contrate profissionais para pequenos reparos, manutenções e serviços do dia a dia com pagamento seguro.
              </p>
            </div>
          </div>

          {/* Lado Direito: Alternância de Abas (Encontrar Profissional, Minhas Contratações, Favoritos) */}
          <div className="w-full lg:w-auto flex items-stretch sm:items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200 shadow-2xs overflow-x-auto scrollbar-none">
            {/* Aba 1: Encontrar Profissional */}
            <button
              type="button"
              onClick={() => switchTab("marketplace")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-0 ${
                activeView === "marketplace" && !onlyFavorites
                  ? "bg-[#FB6B01] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Icon name="search" size={14} />
              <span>Encontrar profissional</span>
            </button>

            {/* Aba 2: Minhas Contratações */}
            <button
              type="button"
              onClick={() => switchTab("contratacoes")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-0 ${
                activeView === "contratacoes"
                  ? "bg-[#FB6B01] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Icon name="clipboard" size={14} />
              <span>Minhas contratações</span>
              {totalContractedCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    activeView === "contratacoes"
                      ? "bg-white text-[#FB6B01]"
                      : "bg-orange-100 text-[#FB6B01]"
                  }`}
                >
                  {totalContractedCount}
                </span>
              )}
            </button>

            {/* Aba 3: Favoritos */}
            <button
              type="button"
              onClick={() => switchTab("favoritos")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-0 ${
                activeView === "marketplace" && onlyFavorites
                  ? "bg-[#FB6B01] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Icon name="star" size={14} />
              <span>Favoritos</span>
              {favorites.length > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    activeView === "marketplace" && onlyFavorites
                      ? "bg-white text-[#FB6B01]"
                      : "bg-orange-100 text-[#FB6B01]"
                  }`}
                >
                  {favorites.length}
                </span>
              )}
            </button>

            {role === "superadmin" && (
              <Link
                href="/painel/admin/marketplace/destaques"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FB6B01] hover:bg-white transition-all whitespace-nowrap min-h-[40px] sm:min-h-0"
                title="Gerenciar Planos de Publicidade e Destaques"
              >
                <Icon name="sparkles" size={14} />
                <span className="hidden xs:inline">Destaques Admin</span>
                <span className="xs:hidden">Destaques</span>
              </Link>
            )}
          </div>
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
                setBudgetVendor(null);
              }}
              className="text-xs font-bold text-[#FB6B01] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Solicitar novo serviço</span>
            </button>
          </div>

          {marketplaceRequests.length === 0 && services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-orange-50 text-[#FB6B01] flex items-center justify-center mx-auto">
                <Icon name="clipboard" size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma contratação registrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Você ainda não solicitou atendimentos pelo Tião Zelador.
              </p>
              <button
                type="button"
                onClick={() => switchTab("marketplace")}
                className="rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs font-black text-[#FB6B01] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/70 shadow-2xs">
                          {req.code}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">{req.title}</h3>
                        <span className="rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                          {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs self-start sm:self-center ${
                          req.status === "concluido"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ["prestador_concluiu", "conclusao_solicitada", "prestador_finalizou", "servico_finalizado_prestador", "PROVIDER_COMPLETED", "executado_prestador"].includes(req.status)
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse"
                            : req.status === "em_atendimento"
                            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            : req.status === "a_caminho" || req.status === "chegou"
                            ? "bg-orange-50 text-[#FB6B01] border-orange-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Barra de Progresso Minimalista e Funcional */}
                    {(() => {
                      const progress = getServiceProgress(req.status);
                      return (
                        <div className="py-3 px-1 sm:px-3">
                          <div className="relative">
                            {/* Trilho de fundo conectando centros dos nós (10% ao 90%) */}
                            <div className="absolute top-4 sm:top-4.5 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0" />

                            {/* Trilho ativo de preenchimento */}
                            <div
                              className={`absolute top-4 sm:top-4.5 left-[10%] h-0.5 z-0 transition-all duration-500 ${
                                progress.isCanceled
                                  ? "bg-slate-300"
                                  : progress.isDispute
                                  ? "bg-rose-500"
                                  : progress.stepIndex === 4
                                  ? "bg-emerald-500"
                                  : "bg-[#FB6B01]"
                              }`}
                              style={{
                                width: `${(progress.stepIndex / (SERVICE_STEPS.length - 1)) * 80}%`,
                              }}
                            />

                            {/* Nós de Etapas com Ícones */}
                            <div className="relative z-10 grid grid-cols-5 gap-1">
                              {SERVICE_STEPS.map((step, idx) => {
                                const isDone = idx < progress.stepIndex;
                                const isCurrent = idx === progress.stepIndex;

                                return (
                                  <div key={step.id} className="flex flex-col items-center text-center">
                                    <div
                                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 ${
                                        isDone
                                          ? "bg-[#FB6B01] text-white shadow-2xs"
                                          : isCurrent
                                          ? progress.isCanceled
                                            ? "bg-slate-500 text-white ring-4 ring-slate-100 shadow-xs"
                                            : progress.isDispute
                                            ? "bg-rose-600 text-white ring-4 ring-rose-100 shadow-xs animate-pulse"
                                            : progress.stepIndex === 4
                                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs"
                                            : "bg-[#FB6B01] text-white ring-4 ring-orange-100 shadow-xs scale-105"
                                          : "bg-white border-2 border-slate-200 text-slate-400"
                                      }`}
                                    >
                                      {isDone ? (
                                        <Icon name="check" size={14} strokeWidth={2.5} />
                                      ) : (
                                        <Icon
                                          name={step.icon}
                                          size={14}
                                          strokeWidth={isCurrent ? 2.2 : 1.8}
                                        />
                                      )}
                                    </div>

                                    <span
                                      className={`mt-2 text-[10px] sm:text-xs font-bold leading-tight ${
                                        isCurrent
                                          ? progress.stepIndex === 4
                                            ? "text-emerald-700"
                                            : "text-[#FB6B01]"
                                          : isDone
                                          ? "text-slate-800"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      <span className="hidden sm:inline">{idx + 1}. </span>
                                      {step.label}
                                    </span>

                                    {isCurrent && (
                                      <span
                                        className={`mt-1 hidden md:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                          progress.stepIndex === 4
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-orange-50 text-[#FB6B01] border-orange-200/60"
                                        }`}
                                      >
                                        {step.shortDesc}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Faixa de Detalhes com Ícones Minimalistas */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      {/* Profissional */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="briefcase" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Profissional</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {req.vendorCompany || req.vendorName || "Buscando parceiro..."}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

                      {/* Local */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="map-pin" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Local</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {req.location}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

                      {/* Data / Previsão */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="calendar" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Data / Previsão</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {req.scheduledDate || "Hoje / Imediato"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Descrição do Chamado */}
                    {req.description && (
                      <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                        <Icon name="file" size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{req.description}</span>
                      </div>
                    )}

                    {/* Orçamentos para seu chamado */}
                    {reqQuotes.length > 0 && !["concluido", "cancelado"].includes(req.status) && (
                      <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/30 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-lg bg-[#FB6B01] text-white flex items-center justify-center font-bold text-xs">
                                {reqQuotes.length}
                              </span>
                              <h4 className="text-sm font-black text-slate-900">
                                Orçamentos para seu chamado
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Compare profissionais, avaliações e prazos. O valor do orçamento é o valor final garantido pelo Zeladoria Protege.
                            </p>
                          </div>

                          {/* Ordenação Opcional */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] self-start sm:self-auto">
                            <span className="text-slate-400 font-bold px-1.5 text-[10px] uppercase">Ordenar:</span>
                            {(["recomendados", "menor_preco", "melhor_avaliacao", "mais_rapido"] as const).map((mode) => {
                              const currentMode = quoteSortBy[req.id] || "recomendados";
                              const labels = {
                                recomendados: "Recomendados",
                                menor_preco: "Menor preço",
                                melhor_avaliacao: "Melhor nota",
                                mais_rapido: "Mais rápido",
                              };
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setQuoteSortBy((prev) => ({ ...prev, [req.id]: mode }))}
                                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                    currentMode === mode
                                      ? "bg-[#FB6B01] text-white shadow-2xs"
                                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                  }`}
                                >
                                  {labels[mode]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Lista de Orçamentos Ordenada */}
                        <div className="space-y-2.5">
                          {(() => {
                            const mode = quoteSortBy[req.id] || "recomendados";
                            const sorted = [...reqQuotes].sort((a, b) => {
                              if (mode === "menor_preco") return a.totalCents - b.totalCents;
                              if (mode === "melhor_avaliacao") return (b.vendorRating || 5) - (a.vendorRating || 5);
                              if (mode === "mais_rapido") return (a.estimatedDays || 1) - (b.estimatedDays || 1);
                              if (a.status === "aceito") return -1;
                              if (b.status === "aceito") return 1;
                              return (b.vendorRating || 5) - (a.vendorRating || 5) || a.totalCents - b.totalCents;
                            });

                            const hasAnyAccepted = reqQuotes.some((q) => q.status === "aceito");

                            return sorted.map((q) => {
                              const isThisAccepted = q.status === "aceito";
                              return (
                                <div
                                  key={q.id}
                                  className={`p-4 rounded-2xl bg-white border transition-all text-xs shadow-xs space-y-3 ${
                                    isThisAccepted
                                      ? "border-emerald-500 ring-2 ring-emerald-500/10"
                                      : "border-slate-200/90 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      {q.vendorPhoto ? (
                                        <img
                                          src={q.vendorPhoto}
                                          alt={q.vendorName}
                                          className="h-11 w-11 rounded-full object-cover border border-slate-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="h-11 w-11 rounded-full bg-orange-100 text-[#FB6B01] flex items-center justify-center font-black text-sm shrink-0">
                                          {(q.vendorName || "P")[0]}
                                        </div>
                                      )}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <strong className="text-slate-900 text-sm font-black">
                                            {q.vendorName}
                                          </strong>
                                          <span className="flex items-center text-amber-500 font-black text-[11px]">
                                            ★ {(q.vendorRating || 4.9).toFixed(1)}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                          {q.vendorCompletedJobs || 132} serviços realizados · {q.warrantyDays || 30} dias de garantia
                                        </div>
                                        <p className="text-slate-700 italic mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                          &quot;{q.description}&quot;
                                        </p>
                                      </div>
                                    </div>

                                    {/* Preço e Botão */}
                                    {(() => {
                                      const validity = getQuoteValidityInfo(q);
                                      const isExpired = validity.isExpired && q.status !== "aceito";

                                      return (
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                          <div className="text-left sm:text-right">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                              Valor do Serviço
                                            </span>
                                            <span className="text-xl font-black text-[#FB6B01]">
                                              R$ {(q.totalCents / 100).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block">
                                              {q.availableAt ? `Disponível: ${q.availableAt}` : "Disponível Hoje"}
                                            </span>
                                            {validity.formattedExpiry && (
                                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                                Válido até: <strong>{validity.formattedExpiry}</strong>
                                              </span>
                                            )}
                                            {validity.isNearExpiry && (
                                              <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                                Expira em {validity.hoursLeft}h
                                              </span>
                                            )}
                                          </div>

                                          {isThisAccepted ? (
                                            <span className="text-emerald-700 font-black bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                                              <Icon name="check-circle" size={14} />
                                              <span>Orçamento Contratado</span>
                                            </span>
                                          ) : isExpired ? (
                                            <div className="flex flex-col sm:items-end gap-1">
                                              <span className="text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 text-[11px]">
                                                Orçamento expirado
                                              </span>
                                              <button
                                                type="button"
                                                disabled={isActionPending}
                                                onClick={() => {
                                                  const target = providers.find((p) => p.id === q.vendorId) || { id: q.vendorId, name: q.vendorName };
                                                  setBudgetVendor(target as any);
                                                }}
                                                className="px-3 py-1 rounded-lg border border-orange-200 text-[#FB6B01] hover:bg-orange-50 text-[11px] font-bold transition-colors cursor-pointer"
                                              >
                                                Solicitar novo orçamento
                                              </button>
                                            </div>
                                          ) : hasAnyAccepted ? (
                                            <span className="text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-xl text-[11px]">
                                              Não selecionado
                                            </span>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                disabled={isActionPending}
                                                onClick={() => handleRejectQuote(req.id, q.id)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600 text-slate-500 font-bold text-xs cursor-pointer transition-all"
                                              >
                                                Recusar
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isActionPending}
                                                onClick={() => setSelectedQuoteForAcceptance({ quote: q, request: req })}
                                                className="px-4 py-2.5 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white font-black cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                                              >
                                                <span>Aceitar orçamento</span>
                                                <Icon name="arrow-right" size={13} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Solicitações de Custo Adicional (Aditivos - Cláusulas 19 a 29) */}
                    {(addendums || [])
                      .filter((a: any) => a.requestId === req.id && a.status === "proposto")
                      .map((ad: any) => {
                        const originalQuote = reqQuotes.find((q) => q.status === "aceito") || {
                          totalCents: req.finalAmountCents || 35000,
                        };
                        const originalCents = originalQuote.totalCents;
                        const additionalCents = ad.additionalAmountCents || ad.amountCents || 0;
                        const newTotalCents = originalCents + additionalCents;

                        return (
                          <div
                            key={ad.id}
                            className="p-4 rounded-2xl border border-amber-300 bg-amber-50/90 text-xs space-y-3 text-amber-950"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="h-7 w-7 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
                                  <Icon name="alert" size={15} />
                                </span>
                                <div>
                                  <strong className="text-sm font-black text-slate-900 block">
                                    Solicitação de Adicional: {ad.title}
                                  </strong>
                                  <span className="text-[11px] text-amber-800">
                                    O prestador identificou um serviço complementar necessário no local.
                                  </span>
                                </div>
                              </div>
                              <span className="text-lg font-black text-amber-900">
                                + R$ {(additionalCents / 100).toFixed(2)}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-slate-800">
                              {ad.reason && (
                                <p className="text-[11px] text-slate-500 font-bold">
                                  Motivo técnico: <span className="text-slate-800 font-semibold">{ad.reason}</span>
                                </p>
                              )}
                              <p className="leading-relaxed">{ad.description}</p>
                            </div>

                            {/* Resumo Financeiro Transparente (Original + Adicional = Novo Total) */}
                            <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-200 text-[11px] space-y-1">
                              <div className="flex justify-between items-center text-slate-600">
                                <span>SERVIÇO ORIGINAL:</span>
                                <span className="font-bold">R$ {(originalCents / 100).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-amber-900 font-bold">
                                <span>ADICIONAL SOLICITADO ({ad.title}):</span>
                                <span>+ R$ {(additionalCents / 100).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-900 font-black border-t border-amber-300 pt-1 text-xs">
                                <span>NOVO TOTAL:</span>
                                <span className="text-[#FB6B01]">R$ {(newTotalCents / 100).toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() => handleRejectAddendum(ad.id)}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold cursor-pointer transition-colors"
                              >
                                Recusar Adicional
                              </button>
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() => handleAcceptAddendum(ad.id)}
                                className="px-4 py-2 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <Icon name="check-circle" size={13} />
                                <span>Aceitar e Pagar Adicional</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Evidências Fotográficas do Serviço (Antes e Depois - Cláusulas 9 a 18) */}
                    {(() => {
                      const reqEvidences = (evidences || []).filter(
                        (e: any) => e.requestId === req.id || (req.contractId && e.contractId === req.contractId)
                      );
                      if (reqEvidences.length === 0) return null;

                      const beforeEvidences = reqEvidences.filter((e: any) => e.stage === "ANTES" || e.stage === "before");
                      const afterEvidences = reqEvidences.filter((e: any) => e.stage === "DEPOIS" || e.stage === "after");

                      return (
                        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Icon name="camera" size={14} className="text-[#FB6B01]" />
                              <span>Evidências Técnicas do Serviço</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Zeladoria Protege · Registro Visual
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Bloco Antes */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <strong className="text-amber-800 font-bold flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                  <span>ANTES DO SERVIÇO</span>
                                </strong>
                                <span className="text-[10px] text-slate-400">{beforeEvidences.length} foto(s)</span>
                              </div>
                              {beforeEvidences.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic py-1">Nenhuma foto antes registrada.</p>
                              ) : (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {beforeEvidences.map((ev: any, idx: number) => (
                                    <button
                                      key={ev.id || idx}
                                      type="button"
                                      onClick={() => {
                                        const allImgs = reqEvidences.map((x: any) => ({
                                          url: x.fileUrl,
                                          caption: x.caption,
                                          stage: x.stage,
                                        }));
                                        const curIdx = allImgs.findIndex((x: any) => x.url === ev.fileUrl);
                                        openLightbox(allImgs, Math.max(0, curIdx));
                                      }}
                                      className="h-16 w-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 group relative hover:opacity-90 cursor-pointer"
                                      title={ev.caption || "Foto antes do serviço"}
                                    >
                                      <img
                                        src={ev.fileUrl}
                                        alt={ev.caption || "Foto antes"}
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Bloco Depois */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <strong className="text-emerald-800 font-bold flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                  <span>DEPOIS DO SERVIÇO</span>
                                </strong>
                                <span className="text-[10px] text-slate-400">{afterEvidences.length} foto(s)</span>
                              </div>
                              {afterEvidences.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic py-1">Nenhuma foto depois registrada.</p>
                              ) : (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {afterEvidences.map((ev: any, idx: number) => (
                                    <button
                                      key={ev.id || idx}
                                      type="button"
                                      onClick={() => {
                                        const allImgs = reqEvidences.map((x: any) => ({
                                          url: x.fileUrl,
                                          caption: x.caption,
                                          stage: x.stage,
                                        }));
                                        const curIdx = allImgs.findIndex((x: any) => x.url === ev.fileUrl);
                                        openLightbox(allImgs, Math.max(0, curIdx));
                                      }}
                                      className="h-16 w-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 group relative hover:opacity-90 cursor-pointer"
                                      title={ev.caption || "Foto depois do serviço"}
                                    >
                                      <img
                                        src={ev.fileUrl}
                                        alt={ev.caption || "Foto depois"}
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Vistoria Técnica: Oferta do Prestador e Seleção de Horários */}
                    {(() => {
                      const reqInsp = inspections.find((i: any) => i.requestId === req.id);
                      if (!reqInsp) return null;

                      if (req.status === "vistoria_proposta" && reqInsp.status === "pendente_escolha_morador") {
                        const slots = (reqInsp.availableSlots as any[]) || [];
                        const currentSelected = selectedInspectionSlots[req.id] || slots[0];

                        return (
                          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#FB6B01] flex items-center gap-1.5">
                                <Icon name="calendar" size={14} />
                                <span>Proposta de Vistoria Técnica</span>
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${reqInsp.type === 'gratuita' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                {reqInsp.type === "gratuita" ? "Vistoria Gratuita" : `Vistoria Paga: R$ ${(reqInsp.priceCents / 100).toFixed(2)}`}
                              </span>
                            </div>

                            <p className="text-slate-600">
                              Duração estimada: <strong>{reqInsp.estimatedDurationMinutes || 40} min</strong>. {reqInsp.notes}
                            </p>

                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-700 block text-[11px]">Selecione o melhor horário para receber o profissional:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {slots.map((s, idx) => {
                                  const isChosen = currentSelected && currentSelected.date === s.date && currentSelected.time === s.time;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSelectSlot(req.id, s)}
                                      className={`p-2.5 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                                        isChosen
                                          ? "border-[#FB6B01] bg-white text-[#FB6B01] shadow-xs"
                                          : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                                      }`}
                                    >
                                      <div>{s.label || `${s.date} às ${s.time}`}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end">
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() => handleConfirmInspection(reqInsp, req)}
                                className={`px-4 py-2 rounded-xl text-white font-bold cursor-pointer shadow-xs transition-all flex items-center gap-1.5 ${
                                  reqInsp.type === "gratuita"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-[#FB6B01] hover:bg-[#E05F00]"
                                }`}
                              >
                                <Icon name="check-circle" size={14} />
                                <span>
                                  {reqInsp.type === "gratuita"
                                    ? "Confirmar Vistoria Gratuita"
                                    : `Pagar e Confirmar (R$ ${(reqInsp.priceCents / 100).toFixed(2)})`}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (req.status === "aguardando_pagamento_vistoria") {
                        const paidOrder = paymentOrders.find((p: any) => p.requestId === req.id && p.purpose === "vistoria");
                        return (
                          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between text-xs text-amber-900">
                            <div className="flex items-center gap-2">
                              <Icon name="clock" size={16} className="text-amber-700" />
                              <div>
                                <strong>Horário pré-reservado por 10 minutos!</strong>
                                <p className="text-[11px] text-amber-800">Conclua o pagamento para confirmar a visita.</p>
                              </div>
                            </div>
                            {paidOrder && (
                              <button
                                type="button"
                                onClick={() => setInspectionCheckoutData({
                                  orderCode: paidOrder.code,
                                  amountCents: paidOrder.amountGrossCents,
                                  vendorName: req.vendorName || "Prestador",
                                  slot: reqInsp.selectedSlot || { date: req.scheduledDate, time: req.scheduledTimeSlot },
                                  pixCopiaECola: paidOrder.pixCopiaECola,
                                  pixQrCode: paidOrder.pixQrCode,
                                  holdExpiresAt: reqInsp.holdExpiresAt,
                                })}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
                              >
                                Pagar Pix
                              </button>
                            )}
                          </div>
                        );
                      }

                      if (req.status === "VISTORIA_AGENDADA" || req.status === "VISTORIA_CONFIRMADA") {
                        return (
                          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center gap-2 text-xs text-emerald-900">
                            <Icon name="check-circle" size={15} className="text-emerald-700 shrink-0" />
                            <div>
                              <strong>Vistoria Confirmada: </strong>
                              <span>{reqInsp.selectedSlot ? `${reqInsp.selectedSlot.date} às ${reqInsp.selectedSlot.time}` : req.scheduledDate}</span>
                              <p className="text-[10px] text-emerald-800 mt-0.5">O prestador comparecerá ao imóvel no horário acordado.</p>
                            </div>
                          </div>
                        );
                      }

                      if (req.status === "diagnostico_registrado" && reqInsp.diagnosticReport) {
                        return (
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Icon name="file-text" size={14} className="text-[#FB6B01]" />
                              <span>Diagnóstico da Vistoria Técnica:</span>
                            </div>
                            <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100">
                              &quot;{reqInsp.diagnosticReport}&quot;
                            </p>
                            <span className="text-[10px] text-slate-400 block pt-0.5">Aguardando envio da proposta final detalhada pelo profissional.</span>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Banner Zeladoria Protege Ativo no Serviço Principal */}
                    {req.status === "SERVICO_PAGO_LIBERADO" && (
                      <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center gap-2 text-xs text-emerald-900">
                        <Icon name="shield" size={16} className="text-emerald-700 shrink-0" />
                        <div>
                          <strong>Zeladoria Protege Ativo: </strong>
                          <span>Pagamento protegido e retido no parceiro financeiro. O repasse será liberado após a sua aprovação.</span>
                        </div>
                      </div>
                    )}

                    {/* Banner Prestador Informou Conclusão */}
                    {["prestador_concluiu", "conclusao_solicitada", "prestador_finalizou", "servico_finalizado_prestador", "PROVIDER_COMPLETED", "executado_prestador"].includes(req.status) && (
                      <div className="p-3.5 rounded-xl border border-orange-300 bg-orange-50/70 space-y-2 text-xs text-slate-900">
                        <div className="flex items-center gap-2">
                          <Icon name="check-circle" size={16} className="text-[#FB6B01] shrink-0" />
                          <div>
                            <strong>O prestador informou que concluiu o serviço!</strong>
                            <p className="text-[11px] text-slate-700">
                              Verifique o resultado e as evidências. Confirme para liberar o repasse ou abra uma contestação caso haja alguma inconformidade.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() => handleConfirmCompletion(req)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Icon name="check-circle" size={14} />
                            <span>Está tudo certo (Liberar Repasse & Avaliar)</span>
                          </button>
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() => setDisputeModalReq(req)}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold cursor-pointer shadow-xs"
                          >
                            Tenho um problema (Contestar)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Banner Disputa / Mediação */}
                    {req.status === "em_disputa" && (
                      <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 flex items-center gap-2 text-xs text-rose-900">
                        <Icon name="alert" size={16} className="text-rose-700 shrink-0" />
                        <div>
                          <strong>Serviço em Mediação: </strong>
                          <span>Contestação registrada no Zeladoria Protege. O repasse ao prestador está temporariamente bloqueado para análise pela administração do condomínio.</span>
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
                          className="inline-flex items-center gap-2 text-xs font-bold text-[#FB6B01] bg-orange-50/90 hover:bg-orange-100/80 border border-orange-200/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer group"
                        >
                          <Icon name="mail" size={14} className="text-[#FB6B01] transition-transform group-hover:scale-110" />
                          <span>Mensagens / Chat</span>
                          {(() => {
                            const chatCount = messages.filter((m) => m.requestId === req.id).length;
                            return chatCount > 0 ? (
                              <span className="rounded-full bg-[#FB6B01] text-white px-1.5 py-0.2 text-[10px] font-black">
                                {chatCount}
                              </span>
                            ) : null;
                          })()}
                        </button>

                        {/* Retomar Pagamento PIX se aguardando pagamento */}
                        {req.status === "aguardando_pagamento_servico" && (
                          (() => {
                            const candidateQuote = req.quotes?.find((q: any) => q.status === "aceito" || q.status === "pendente") || req.quotes?.[0];
                            if (candidateQuote) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptProposalZeladoriaProtege(candidateQuote.id)}
                                  disabled={isActionPending}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Icon name="zap" size={13} />
                                  <span>Retomar Pagamento PIX</span>
                                </button>
                              );
                            }
                            return null;
                          })()
                        )}

                        {/* Confirm Completion / Zeladoria Protege Buttons */}
                        {["em_atendimento", "chegou", "a_caminho", "SERVICO_PAGO_LIBERADO", "conclusao_solicitada", "prestador_concluiu", "prestador_finalizou", "servico_finalizado_prestador", "PROVIDER_COMPLETED"].includes(req.status) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmCompletion(req)}
                              disabled={isActionPending}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Icon name="check-circle" size={13} />
                              <span>Confirmar Conclusão (Tudo Certo!)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDisputeModalReq(req)}
                              disabled={isActionPending}
                              className="rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                            >
                              Contestar
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <>
                            {/* Ver Comprovante da Contratação */}
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(req.id)}
                              disabled={isActionPending}
                              className="rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-[#FB6B01] px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Visualizar Comprovante Oficial Zeladoria Protege"
                            >
                              <Icon name="file-text" size={12} />
                              <span>Comprovante</span>
                            </button>

                            {/* Acionar Garantia CDC */}
                            <button
                              type="button"
                              onClick={() => handleOpenWarranty(req)}
                              disabled={isActionPending}
                              className="rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Solicitar suporte ou acionar garantia do serviço"
                            >
                              <Icon name="shield" size={12} />
                              <span>Garantia CDC</span>
                            </button>

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

              {/* Service Orders / Contratações Registradas */}
              {services.map((svc: any) => {
                const svcVendor =
                  providers.find((p) => p.id === svc.vendorId) ||
                  vendors.find((v: any) => v.id === svc.vendorId);
                const isCompleted = svc.status === "concluido";
                return (
                  <div
                    key={`svc-${svc.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs font-black text-[#FB6B01] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/70 shadow-2xs">
                          {svc.code}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">{svc.title}</h3>
                        <span className="rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 capitalize">
                          {svc.category}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs self-start sm:self-center ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-orange-50 text-[#FB6B01] border-orange-200"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {(svc.status || "solicitado").replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Barra de Progresso Minimalista e Funcional */}
                    {(() => {
                      const progress = getServiceProgress(svc.status);
                      return (
                        <div className="py-3 px-1 sm:px-3">
                          <div className="relative">
                            <div className="absolute top-4 sm:top-4.5 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0" />
                            <div
                              className={`absolute top-4 sm:top-4.5 left-[10%] h-0.5 z-0 transition-all duration-500 ${
                                isCompleted ? "bg-emerald-500" : "bg-[#FB6B01]"
                              }`}
                              style={{
                                width: `${(progress.stepIndex / (SERVICE_STEPS.length - 1)) * 80}%`,
                              }}
                            />
                            <div className="relative z-10 grid grid-cols-5 gap-1">
                              {SERVICE_STEPS.map((step, idx) => {
                                const isDone = idx < progress.stepIndex;
                                const isCurrent = idx === progress.stepIndex;
                                return (
                                  <div key={step.id} className="flex flex-col items-center text-center">
                                    <div
                                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 ${
                                        isDone
                                          ? "bg-[#FB6B01] text-white shadow-2xs"
                                          : isCurrent
                                          ? isCompleted
                                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs"
                                            : "bg-[#FB6B01] text-white ring-4 ring-orange-100 shadow-xs scale-105"
                                          : "bg-white border-2 border-slate-200 text-slate-400"
                                      }`}
                                    >
                                      {isDone ? (
                                        <Icon name="check" size={14} strokeWidth={2.5} />
                                      ) : (
                                        <Icon name={step.icon} size={14} strokeWidth={isCurrent ? 2.2 : 1.8} />
                                      )}
                                    </div>
                                    <span
                                      className={`mt-2 text-[10px] sm:text-xs font-bold leading-tight ${
                                        isCurrent
                                          ? isCompleted
                                            ? "text-emerald-700"
                                            : "text-[#FB6B01]"
                                          : isDone
                                          ? "text-slate-800"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      <span className="hidden sm:inline">{idx + 1}. </span>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Faixa de Detalhes com Ícones */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="briefcase" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Profissional</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {svcVendor?.name || "Prestador credenciado"}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="map-pin" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Local</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {svc.location || (svc.blockName && svc.unitNumber ? `${svc.blockName} · Unidade ${svc.unitNumber}` : "Unidade no condomínio")}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          <Icon name="calendar" size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block leading-none font-medium">Data / Previsão</span>
                          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                            {svc.scheduledFor || svc.preferredTime || "Conforme agendado"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {svc.description && (
                      <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                        <Icon name="file" size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{svc.description}</span>
                      </div>
                    )}

                    {svc.costCents != null && svc.costCents > 0 && (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500">
                          Valor registrado:{" "}
                          <strong className="text-slate-900">
                            R$ {(svc.costCents / 100).toFixed(2)}
                          </strong>
                        </span>
                        {svc.vendorId && (
                          <button
                            type="button"
                            onClick={() => handleRehire(svc)}
                            className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Icon name="refresh" size={12} />
                            <span>Contratar novamente</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MARKETPLACE DISCOVERY EXPERIENCE */
        <>
          {/* LOCALIZAÇÃO (COMPONENTE INTERATIVO PRINCIPAL FULL-WIDTH) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs w-full">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FB6B01] shrink-0 border border-orange-200/70 shadow-2xs">
                <Icon name="map-pin" size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Atendimento em
                </span>
                <p className="text-sm font-black text-[#0F172A] leading-tight mt-0.5 truncate">
                  {serviceLocation.name}
                  {serviceLocation.unit ? ` · Unidade ${serviceLocation.unit}` : ""}
                </p>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {serviceLocation.address} · {serviceLocation.city} - {serviceLocation.state}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB6B01] hover:text-[#E05F00] self-start sm:self-center px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100/70 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <span>Alterar local</span>
              <Icon name="chevron-down" size={13} />
            </button>
          </div>

          {/* SECTION 1: SEARCH BAR PROMINENTE (FULL WIDTH ATÉ O FINAL DA PÁGINA) */}
          <div className="py-1 space-y-3 w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Qual serviço você precisa?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Encontre profissionais avaliados que atendem {serviceLocation.name}.
              </p>
            </div>

            <div ref={searchContainerRef} className="relative w-full">
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
                  placeholder="Ex.: vazamento, chuveiro, pintura, eletricista..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#FB6B01] focus:ring-2 focus:ring-orange-100 transition-all shadow-xs"
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
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon name="search" size={13} className="text-[#FB6B01] shrink-0" />
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

            {/* Quick Tags de Problemas Comuns */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
              <span className="text-xs font-bold text-slate-500">Problemas comuns:</span>
              {[
                { tag: "Chuveiro Queimou", cat: "eletrica", q: "chuveiro" },
                { tag: "Pia Vazando", cat: "hidraulica", q: "vazamento" },
                { tag: "Ar Não Gela", cat: "climatizacao", q: "ar-condicionado" },
                { tag: "Fechadura Travada", cat: "seguranca", q: "fechadura" },
                { tag: "Pintura de Parede", cat: "pintura", q: "pintura" },
                { tag: "Marcenaria", cat: "marcenaria", q: "marcenaria" },
              ].map((item) => {
                const isSelected = search.toLowerCase() === item.q.toLowerCase();
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleSearchChange("");
                        setSelectedCategory("Todas");
                      } else {
                        handleSearchChange(item.q);
                        setSelectedCategory(item.cat);
                      }
                    }}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#FB6B01] text-white border-[#FB6B01] shadow-2xs font-bold"
                        : "bg-slate-100 hover:bg-orange-50 hover:text-[#FB6B01] text-slate-600 border-slate-200/80"
                    }`}
                  >
                    {item.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CATEGORIAS VISUAIS (EXPANDIDAS EM 6 COLUNAS ATÉ O FINAL DA PÁGINA) */}
          <div className="space-y-3 pt-1 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FB6B01]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Categorias de Serviços
                </h2>
              </div>
              {selectedCategory !== "Todas" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("Todas")}
                  className="text-xs font-bold text-[#FB6B01] hover:underline cursor-pointer"
                >
                  Ver todas as categorias
                </button>
              )}
            </div>

            {/* Category grid: 6 items spanning exactly across 6 columns on lg, 3 on sm, 2 on xs, filling 100% */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
              {categoriesConfig.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`group flex flex-col items-center justify-between p-2.5 rounded-2xl text-center transition-all w-full cursor-pointer border ${
                      isActive
                        ? "bg-orange-50/90 border-[#FB6B01] shadow-xs ring-2 ring-[#FB6B01]/20"
                        : "bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/20 shadow-2xs"
                    }`}
                  >
                    {/* Visual photo/icon tile com fallback automático onError */}
                    <div className="relative h-16 w-full rounded-xl overflow-hidden bg-slate-100 mb-2 flex items-center justify-center">
                      {cat.imageUrl ? (
                        <>
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            onError={(e) => {
                              // Se houver erro de rede na imagem, esconde a tag img e mostra o container de fallback
                              e.currentTarget.style.display = "none";
                            }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className={`absolute inset-0 transition-opacity ${isActive ? "bg-[#FB6B01]/25" : "bg-black/20 group-hover:bg-black/10"}`} />
                          <span className="absolute bottom-1 right-1 p-1 rounded-md bg-white/95 text-slate-800 shadow-2xs">
                            <Icon name={cat.icon as any} size={11} className={isActive ? "text-[#FB6B01]" : "text-slate-700"} />
                          </span>
                        </>
                      ) : (
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-[#FB6B01] text-white" : "bg-orange-50 text-[#FB6B01]"}`}>
                          <Icon name={cat.icon as any} size={20} />
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-bold truncate max-w-full leading-tight ${isActive ? "text-[#FB6B01]" : "text-[#0F172A]"}`}>
                      {cat.name}
                    </span>
                    <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-[#FB6B01]" : "text-slate-400"}`}>
                      {cat.count} {cat.count === 1 ? "profissional" : "profissionais"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subcategorias quando categoria selecionada */}
            {selectedCategory !== "Todas" && getCategorySubcategories(selectedCategory).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 snap-start">
                  Subcategorias:
                </span>
                {getCategorySubcategories(selectedCategory).map((subcat) => {
                  const isSelected = search.toLowerCase() === subcat.toLowerCase() || filters.subcategory === subcat;
                  return (
                    <button
                      key={subcat}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleSearchChange("");
                          setFilters((prev) => ({ ...prev, subcategory: undefined }));
                        } else {
                          handleSearchChange(subcat);
                          setFilters((prev) => ({ ...prev, subcategory: subcat }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer border snap-start ${
                        isSelected
                          ? "bg-[#FB6B01] text-white border-[#FB6B01] shadow-xs font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-[#FB6B01]"
                      }`}
                    >
                      {subcat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: PRECISA PARA HOJE? (CHAMADA VISUAL LIMPA E FULL-WIDTH) */}
          <div className="w-full rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <Icon name="zap" size={24} className="text-[#FFD000] fill-[#FFD000]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">
                  Precisa resolver agora?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Encontre profissionais aprovados e online com disponibilidade confirmada para hoje.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !onlyAvailableNow;
                setOnlyAvailableNow(nextVal);
                setFilters((prev) => ({ ...prev, availableNowOnly: nextVal }));
              }}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all shadow-xs cursor-pointer shrink-0 inline-flex items-center gap-2 ${
                onlyAvailableNow
                  ? "bg-slate-900 text-white"
                  : "bg-[#FB6B01] hover:bg-[#E05F00] text-white"
              }`}
            >
              {onlyAvailableNow ? (
                <>
                  <Icon name="check" size={14} strokeWidth={2.4} />
                  <span>Mostrando Disponíveis Agora</span>
                </>
              ) : (
                <>
                  <span>Encontrar disponível agora</span>
                  <Icon name="arrow-right" size={13} />
                </>
              )}
            </button>
          </div>

          {/* SECTION 4: BARRA DE RESULTADOS E TOOLBAR REORGANIZADA (Seções 4, 5, 6, 7, 8, 44, 45, 46) */}
          <div className="space-y-4 pt-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 px-1 border-b border-slate-200">
              {/* Lado Esquerdo: Quantidade e Localização Discreta (Seções 4 e 5) */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                    {filteredVendors.length} {filteredVendors.length === 1 ? "profissional encontrado" : "profissionais encontrados"}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon name="map-pin" size={12} className="text-[#FB6B01] shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-xs">{serviceLocation.name}</span>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="font-bold text-[#FB6B01] hover:underline cursor-pointer"
                  >
                    Alterar local
                  </button>
                </div>
              </div>

              {/* Lado Direito: [Lista | Mapa] + [Filtros] + [Ordenar] (Seções 6, 7 e 8) */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
                {/* Segmented Control Lista | Mapa */}
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("lista")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      displayMode === "lista"
                        ? "bg-[#FB6B01] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon name="grid" size={12} />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("mapa")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      displayMode === "mapa"
                        ? "bg-[#FB6B01] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon name="map-pin" size={12} />
                    <span>Mapa</span>
                  </button>
                </div>

                {/* Botão de Filtros com Badge Laranja */}
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeFiltersCount > 0
                      ? "border-[#FB6B01] bg-orange-50 text-[#FB6B01]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="filter" size={12} className={activeFiltersCount > 0 ? "text-[#FB6B01]" : "text-slate-500"} />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FB6B01] text-white text-[9px] font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Seletor Compacto de Ordenação */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#FB6B01] cursor-pointer"
                >
                  <option value="score">Recomendados</option>
                  <option value="rating">Melhor avaliados</option>
                  <option value="distance">Mais próximos</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="condo">Mais contratados</option>
                  <option value="response">Resposta rápida</option>
                </select>
              </div>
            </div>

            {/* Display Mode: MAPA (58/42 Split view desktop / solid bottom card mobile) */}
            {displayMode === "mapa" ? (
              <MarketplaceMap
                providers={filteredVendors}
                condoName={serviceLocation.name}
                condoAddress={serviceLocation.address}
                condoLat={serviceLocation.lat ?? (condoInfo?.latitude ? Number(condoInfo.latitude) : -25.4284)}
                condoLng={serviceLocation.lng ?? (condoInfo?.longitude ? Number(condoInfo.longitude) : -49.2733)}
                onSelectProvider={(p) => setSelectedProfileVendor(p)}
                onRequestBudget={(p) => setBudgetVendor(p)}
                onChangeLocationClick={() => setIsLocationModalOpen(true)}
                onLocationChange={(coords) => {
                  setServiceLocation((prev) => ({
                    ...prev,
                    type: "mapa",
                    name: coords.address || "Local no Mapa",
                    address: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
                    lat: coords.lat,
                    lng: coords.lng,
                  }));
                }}
              />
            ) : (
              /* Display Mode: LISTA */
              <>
                {filteredVendors.length === 0 ? (
                  onlyFavorites ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs max-w-lg mx-auto my-6">
                      <div className="h-14 w-14 rounded-2xl bg-orange-50 text-[#FB6B01] flex items-center justify-center mx-auto shadow-2xs">
                        <Icon name="star" size={26} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                          Nenhum profissional favoritado ainda
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Toque no ícone de estrela nos cards dos profissionais para salvá-los e acessá-los rapidamente aqui.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchTab("marketplace")}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Icon name="search" size={14} />
                        <span>Encontrar profissionais</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center space-y-5 shadow-xs max-w-xl mx-auto my-6">
                      <div className="h-14 w-14 rounded-2xl bg-orange-50 text-[#FB6B01] flex items-center justify-center mx-auto shadow-2xs">
                        <Icon name="map-pin" size={26} />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                          Ainda não encontramos profissionais cadastrados nesta região.
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Para a região de <strong>{serviceLocation.name}</strong> ({serviceLocation.city} - {serviceLocation.state}), não há prestadores aprovados com os filtros atuais.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-700 mb-3 text-left">
                          Alternativas disponíveis:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                          {/* 1. Ampliar o raio de busca */}
                          <button
                            type="button"
                            onClick={() => {
                              setFilters((prev) => ({ ...prev, maxDistanceKm: 100 }));
                            }}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-[#FB6B01] hover:bg-orange-50/50 transition-all cursor-pointer group"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-[#FB6B01] group-hover:text-white text-slate-600 transition-colors shrink-0">
                              <Icon name="compass" size={15} />
                            </span>
                            <div>
                              <span className="text-xs font-bold text-[#0F172A] block group-hover:text-[#FB6B01]">
                                Ampliar o raio de busca
                              </span>
                              <span className="text-[10px] text-slate-400">Expandir raio para até 100 km</span>
                            </div>
                          </button>

                          {/* 2. Alterar a localização */}
                          <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-[#FB6B01] hover:bg-orange-50/50 transition-all cursor-pointer group"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-[#FB6B01] group-hover:text-white text-slate-600 transition-colors shrink-0">
                              <Icon name="map-pin" size={15} />
                            </span>
                            <div>
                              <span className="text-xs font-bold text-[#0F172A] block group-hover:text-[#FB6B01]">
                                Alterar a localização
                              </span>
                              <span className="text-[10px] text-slate-400">Buscar por GPS, CEP ou cidade</span>
                            </div>
                          </button>

                          {/* 3. Buscar outra especialidade */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory("Todas");
                              setFilters((prev) => ({ ...prev, category: "Todas", subcategory: undefined }));
                              updateUrlParams("Todas", search, sortBy);
                            }}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-[#FB6B01] hover:bg-orange-50/50 transition-all cursor-pointer group"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-[#FB6B01] group-hover:text-white text-slate-600 transition-colors shrink-0">
                              <Icon name="grid" size={15} />
                            </span>
                            <div>
                              <span className="text-xs font-bold text-[#0F172A] block group-hover:text-[#FB6B01]">
                                Buscar outra especialidade
                              </span>
                              <span className="text-[10px] text-slate-400">Ver todas as especialidades</span>
                            </div>
                          </button>

                          {/* 4. Convidar um profissional para se cadastrar */}
                          <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-[#FB6B01] hover:bg-orange-50/50 transition-all cursor-pointer group"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-[#FB6B01] group-hover:text-white text-slate-600 transition-colors shrink-0">
                              <Icon name="users" size={15} />
                            </span>
                            <div>
                              <span className="text-xs font-bold text-[#0F172A] block group-hover:text-[#FB6B01]">
                                Convidar um profissional
                              </span>
                              <span className="text-[10px] text-slate-400">Enviar convite de adesão</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {/* Header indicativo de favoritos */}
                    {onlyFavorites && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 border border-orange-200/80 text-xs text-orange-950 mb-3">
                        <div className="flex items-center gap-2 font-bold">
                          <Icon name="star" size={15} className="text-[#FB6B01] fill-[#FB6B01]" />
                          <span>Exibindo seus profissionais favoritos ({filteredVendors.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => switchTab("marketplace")}
                          className="text-[11px] font-bold text-[#FB6B01] hover:underline cursor-pointer"
                        >
                          Ver todos os profissionais →
                        </button>
                      </div>
                    )}
                  <div className="space-y-6">
                    {/* SEUS PROFISSIONAIS (Seções 9, 10, 11, 12: Compacto, sem container gigante) */}
                    {displayedHiredProviders.length > 0 && (
                      <section className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-sm font-bold text-[#0F172A]">Seus profissionais</h2>
                            <p className="text-xs text-slate-500">Profissionais que você já contratou.</p>
                          </div>
                        </div>

                        {/* Desktop: flex row com largura controlada (280-320px) / Mobile: carrossel horizontal */}
                        <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 sm:overflow-visible sm:flex-wrap">
                          {displayedHiredProviders.map((hp: any) => {
                            const isEligible = hp.active && hp.onboardingStatus !== "suspenso";
                            return (
                              <div
                                key={`hired-${hp.id}`}
                                className="w-[280px] sm:w-[320px] shrink-0 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between gap-3 snap-start"
                              >
                                <div className="flex items-center gap-3">
                                  {hp.photoUrl ? (
                                    <img
                                      src={hp.photoUrl}
                                      alt={hp.name}
                                      className="h-12 w-12 rounded-xl object-cover border border-slate-100 shrink-0"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-orange-50 text-[#FB6B01] flex items-center justify-center font-bold text-sm shrink-0 border border-orange-100">
                                      {hp.name[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">{hp.name}</h4>
                                      <span className="text-[11px] text-amber-600 font-bold flex items-center gap-0.5 shrink-0">
                                        ★ {(hp.rating || 4.9).toFixed(1)}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block truncate">{hp.category}</span>
                                    <span className="text-[10px] font-medium text-slate-500 mt-0.5 block">
                                      Contratado {hp.hireCount} {hp.hireCount === 1 ? "vez" : "vezes"}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  {isEligible ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRehire(hp)}
                                      className="w-full py-1.5 px-3 rounded-lg bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                      <Icon name="refresh" size={12} />
                                      <span>Contratar novamente</span>
                                    </button>
                                  ) : (
                                    <div className="w-full flex items-center justify-between gap-1 text-[11px]">
                                      <span className="text-slate-400 italic">Indisponível no momento</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCategoryChange(hp.category)}
                                        className="text-[#FB6B01] hover:underline font-bold"
                                      >
                                        Ver semelhantes
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* PATROCINADOS (Seções 13 a 17: Anúncio discreto, sem container amarelo gigante) */}
                    {displayedSponsoredList.length > 0 && (
                      <section className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                            Patrocinado
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Anúncio · Profissional em destaque
                          </span>
                        </div>

                        {/* Mobile: carrossel horizontal / Desktop: grid alinhado com largura controlada */}
                        <div className="flex gap-3.5 overflow-x-auto pb-2 pt-0.5 sm:overflow-visible sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {displayedSponsoredList.map((vendor) => (
                            <div key={`sponsored-${vendor.id}`} className="w-[280px] sm:w-auto shrink-0 snap-start">
                              <ProviderCard
                                provider={vendor}
                                rankingPosition={undefined}
                                isFavorite={favorites.includes(vendor.id)}
                                hasHiredBefore={hiredProviderIds.has(vendor.id)}
                                onToggleFavorite={toggleFavorite}
                                onViewProfile={(p) => setSelectedProfileVendor(p)}
                                onRequestBudget={(p) => setBudgetVendor(p)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* RECOMENDADOS PARA VOCÊ (Seções 18 a 24, 48, 55: Principal área com deduplicação) */}
                    <section className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div>
                          <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                            {selectedCategory === "Todas"
                              ? "Recomendados para você"
                              : `Recomendados em ${selectedCategory}`}
                          </h2>
                          <p className="text-xs text-slate-500">Com base em localização, avaliações e histórico.</p>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {displayedOrganicList.length} {displayedOrganicList.length === 1 ? "profissional" : "profissionais"}
                        </span>
                      </div>

                      {displayedOrganicList.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">Nenhum profissional encontrado com os filtros selecionados.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                            {paginatedOrganicList.map((vendor, index) => (
                              <ProviderCard
                                key={vendor.id}
                                provider={vendor}
                                rankingPosition={
                                  sortBy === "rating" && index < 3 && vendor.reviewsCount > 0
                                    ? index + 1
                                    : undefined
                                }
                                isFavorite={favorites.includes(vendor.id)}
                                hasHiredBefore={hiredProviderIds.has(vendor.id)}
                                onToggleFavorite={toggleFavorite}
                                onViewProfile={(p) => setSelectedProfileVendor(p)}
                                onRequestBudget={(p) => setBudgetVendor(p)}
                              />
                            ))}
                          </div>

                          {/* Paginação / Carregar Mais (Seção 48) */}
                          {displayedOrganicList.length > visibleCount && (
                            <div className="pt-4 text-center">
                              <button
                                type="button"
                                onClick={() => setVisibleCount((prev) => prev + 8)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <Icon name="chevron-down" size={13} />
                                <span>Carregar mais profissionais</span>
                                <span className="text-slate-400 font-normal">
                                  ({paginatedOrganicList.length} de {displayedOrganicList.length})
                                </span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </section>

                    {/* BLOCO 4: NOVOS NO TIÃO (Seção 23: Novos profissionais sem distorcer o ranking) */}
                    {newcomersList.length > 0 && selectedCategory === "Todas" && !search && (
                      <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#0F172A]">Novos no Tião</h3>
                          <p className="text-xs text-slate-500">
                            Profissionais recém-credenciados para você conhecer e contratar com confiança
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                          {newcomersList.map((vendor) => (
                            <ProviderCard
                              key={`newcomer-${vendor.id}`}
                              provider={vendor}
                              rankingPosition={undefined}
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
                  </div>
                </>
              )}
              </>
            )}
          </div>
        </>
      )}

      {/* Location Modal Interativo */}
      <LocationModal
        isOpen={isLocationModalOpen}
        currentLocation={serviceLocation}
        availableCondos={availableCondos}
        onClose={() => setIsLocationModalOpen(false)}
        onSave={(loc) => setServiceLocation(loc)}
        onPickOnMap={() => {
          setDisplayMode("mapa");
        }}
      />

      {/* Filter Drawer (Lateral no desktop / Bottom Sheet no mobile) */}
      <FilterDrawer
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
          setFilters({
            category: "Todas",
            subcategory: undefined,
            minRating: 0,
            verifiedOnly: false,
            maxPrice: 50000,
            availableNowOnly: false,
            condoHiredOnly: false,
            maxDistanceKm: undefined,
          });
          setSelectedCategory("Todas");
          setOnlyAvailableNow(false);
          updateUrlParams("Todas", search, sortBy);
        }}
      />

      {/* Profile Storefront Modal */}
      {selectedProfileVendor && (
        <ProviderProfileModal
          provider={selectedProfileVendor}
          hasHiredBefore={hiredProviderIds.has(selectedProfileVendor.id)}
          userHiredCount={hiredProviders.find((hp: any) => hp.id === selectedProfileVendor.id)?.hireCount}
          onRehire={(p) => handleRehire(p)}
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
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FB6B01]">
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
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-[#FB6B01]"
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
                  className="px-5 py-2 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                <span className="text-[10px] font-black uppercase text-[#FB6B01]">Chat do Atendimento</span>
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
                          ? "bg-[#FB6B01] text-white ml-auto rounded-tr-xs"
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
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#FB6B01]"
              />
              <button
                type="submit"
                disabled={isActionPending || !chatInput.trim()}
                className="h-10 px-4 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Icon name="send" size={13} />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT DA VISTORIA PAGA */}
      <CustomerInspectionCheckoutModal
        isOpen={!!inspectionCheckoutData}
        onClose={() => setInspectionCheckoutData(null)}
        checkoutData={inspectionCheckoutData}
        onSimulatePay={handleSimulatePayment}
        isPending={isActionPending}
      />

      {/* MODAL CHECKOUT DO SERVIÇO PRINCIPAL (ZELADORIA PROTEGE) */}
      <CustomerServiceCheckoutModal
        isOpen={!!serviceCheckoutData}
        onClose={() => setServiceCheckoutData(null)}
        checkoutData={serviceCheckoutData}
        onSimulatePay={handleSimulatePayment}
        isPending={isActionPending}
      />

      {/* MODAL CONTESTAÇÃO / MEDIAÇÃO */}
      <CustomerDisputeModal
        isOpen={!!disputeModalReq}
        onClose={() => setDisputeModalReq(null)}
        request={disputeModalReq}
        onSubmit={handleOpenDispute}
        isPending={isActionPending}
      />

      {/* MODAL COMPROVANTE OFICIAL DE CONTRATAÇÃO */}
      <CustomerContractReceiptModal
        isOpen={!!receiptModalData}
        onClose={() => setReceiptModalData(null)}
        receipt={receiptModalData}
      />

      {/* MODAL SOLICITAÇÃO DE SUPORTE EM GARANTIA CDC */}
      <CustomerWarrantyRequestModal
        isOpen={!!warrantyModalReq}
        onClose={() => setWarrantyModalReq(null)}
        request={warrantyModalReq}
        onSubmit={(desc) => warrantyModalReq && handleSubmitWarranty(warrantyModalReq.id, desc)}
        isPending={isActionPending}
      />

      {/* MODAL RESUMO DO ACEITE (ZELADORIA PROTEGE) */}
      {selectedQuoteForAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Aceitar Orçamento</h2>
                <p className="text-[11px] text-slate-500">Resumo da contratação e garantias</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteForAcceptance(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Profissional:</span>
                <strong className="text-slate-900 font-bold">{selectedQuoteForAcceptance.quote.vendorName}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chamado / Serviço:</span>
                <span className="text-slate-800 font-medium truncate max-w-[200px]">{selectedQuoteForAcceptance.request.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quando pode executar:</span>
                <strong className="text-slate-800">{selectedQuoteForAcceptance.quote.availableAt || "Hoje às 15h"}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Garantia Informada:</span>
                <strong className="text-emerald-700">{selectedQuoteForAcceptance.quote.warrantyDays || 30} dias de garantia</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-700">Valor do Serviço:</span>
                <span className="text-xl font-black text-[#FB6B01]">
                  R$ {(selectedQuoteForAcceptance.quote.totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-slate-900 text-xs flex items-center gap-2">
              <Icon name="shield" size={16} className="text-[#FB6B01] shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Zeladoria Protege:</strong> ✓ Contratação registrada em contrato imutável. Seu pagamento é protegido pelo Zeladoria Pay e só será liberado após a conclusão satisfatória do serviço.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => {
                  const quoteId = selectedQuoteForAcceptance.quote.id;
                  setSelectedQuoteForAcceptance(null);
                  handleAcceptProposalZeladoriaProtege(quoteId);
                }}
                className="w-full py-3 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white font-black text-sm cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Icon name="check-circle" size={16} />
                <span>Continuar para Pagamento</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuoteForAcceptance(null)}
                className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Voltar e Comparar Outros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal para Evidências Técnicas (Antes / Depois) */}
      <EvidenceLightboxModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
        images={lightboxData.images}
        initialIndex={lightboxData.initialIndex}
      />

      {/* Modal de Contratar Novamente (Rebooking Direto) */}
      <RebookServiceModal
        isOpen={isRebookModalOpen}
        onClose={() => {
          setIsRebookModalOpen(false);
          setRebookVendor(null);
        }}
        vendor={rebookVendor}
        onSubmit={handleRebookSubmit}
        isPending={isActionPending}
      />

      {/* Modal Convidar Prestador de Serviços */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsInviteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#FB6B01]">
                  <Icon name="users" size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">Convidar Prestador</h3>
                  <p className="text-[11px] text-slate-400">Credenciamento de profissionais de confiança</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Conhece um eletricista, encanador, pintor ou técnico de confiança? Envie o link de adesão para que ele crie seu perfil profissional e atenda os moradores de <strong>{serviceLocation.name}</strong>.
            </p>

            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Link de Cadastro Oficial
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://zeladoriacondominio.com.br/seja-um-prestador"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText("https://zeladoriacondominio.com.br/seja-um-prestador");
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    inviteCopied ? "bg-emerald-600 text-white" : "bg-[#FB6B01] text-white hover:bg-[#E05F00]"
                  }`}
                >
                  {inviteCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-[11px] text-slate-900 space-y-1">
              <span className="font-bold block">Como funciona a aprovação?</span>
              <p className="text-slate-600">
                O prestador realiza o cadastro, envia documentos e dados de contato. Nossa administração analisa as informações e, quando aprovado, o profissional passa a aparecer no marketplace da região.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(
                    `Olá! Gostaria de convidar você para se cadastrar como prestador de serviços parceiro no Zeladoria Condomínio e receber chamados no nosso condomínio (${serviceLocation.name}). Acesse o link para iniciar seu cadastro: https://zeladoriacondominio.com.br/seja-um-prestador`
                  );
                  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Icon name="send" size={14} />
                <span>Enviar via WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
