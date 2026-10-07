"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { SpaceCard } from "./components/space-card";
import { SpaceDetailsModal } from "./components/space-details-modal";
import { MyReservations } from "./components/my-reservations";
import { AdminCalendar } from "./components/admin-calendar";
import { AdminRequests } from "./components/admin-requests";
import { SpaceWizardModal } from "./components/space-wizard-modal";
import { BlockModal } from "./components/block-modal";
import type { Amenity, AmenityBlock, CurrentUser, ReservationItem } from "./types";

interface ReservasClientProps {
  amenities: Amenity[];
  reservations: ReservationItem[];
  blocks: AmenityBlock[];
  role: string;
  currentUser: CurrentUser;
}

export function ReservasClient({
  amenities: initialAmenities,
  reservations: initialReservations,
  blocks: initialBlocks,
  role,
  currentUser,
}: ReservasClientProps) {
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);

  // Active Tab:
  // Morador: "areas" | "minhas"
  // Síndico: "areas" | "calendar" | "requests" | "minhas"
  const [activeTab, setActiveTab] = useState<"areas" | "calendar" | "requests" | "minhas">("areas");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingFilter, setPricingFilter] = useState<"all" | "gratis" | "pago">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modals state
  const [selectedSpace, setSelectedSpace] = useState<Amenity | null>(null);
  const [modalInitialAction, setModalInitialAction] = useState<"details" | "reserve">("details");
  const [wizardModal, setWizardModal] = useState<{ open: boolean; space?: Amenity | null }>({ open: false });
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // Pending requests count for Síndico badge
  const pendingRequests = useMemo(() => {
    return initialReservations.filter((r) => r.status === "pendente");
  }, [initialReservations]);

  const myReservationsCount = useMemo(() => {
    return initialReservations.filter((r) => r.userId === currentUser.id).length;
  }, [initialReservations, currentUser.id]);

  // Filtered spaces
  const filteredAmenities = useMemo(() => {
    return initialAmenities.filter((space) => {
      // Search
      const matchesSearch =
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (space.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (space.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Pricing
      if (pricingFilter === "gratis" && space.feeCents && space.feeCents > 0) return false;
      if (pricingFilter === "pago" && (!space.feeCents || space.feeCents === 0)) return false;

      // Category
      if (categoryFilter !== "all" && space.category !== categoryFilter) return false;

      return true;
    });
  }, [initialAmenities, searchQuery, pricingFilter, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(initialAmenities.map((a) => a.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [initialAmenities]);

  const handleOpenSpaceModal = (space: Amenity, action: "details" | "reserve") => {
    setSelectedSpace(space);
    setModalInitialAction(action);
  };

  return (
    <div className="space-y-6">
      {/* Page Header Padronizado */}
      <PageHeader
        icon="calendar"
        title="Reservas"
        description={
          isStaff
            ? "Gestão integrada de espaços comuns, aprovação de solicitações e agenda do condomínio."
            : "Reserve os espaços de lazer e convivência do seu condomínio com poucos cliques."
        }
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0055D4] border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
            {initialAmenities.filter((a) => a.active).length} espaços disponíveis
          </span>
        }
        actions={
          isStaff ? (
            <button
              type="button"
              onClick={() => setWizardModal({ open: true, space: null })}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3.5 shadow-xs"
            >
              <Icon name="plus" size={15} />
              <span>Novo espaço</span>
            </button>
          ) : undefined
        }
      />

      {/* Main Tab Capsule Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("areas")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "areas"
                ? "bg-[#0055D4] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon name="grid" size={14} className={activeTab === "areas" ? "text-white" : "text-slate-400"} />
            <span>Áreas disponíveis</span>
            <span
              className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                activeTab === "areas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {initialAmenities.length}
            </span>
          </button>

          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "calendar"
                  ? "bg-[#0055D4] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon name="calendar" size={14} className={activeTab === "calendar" ? "text-white" : "text-slate-400"} />
              <span>Calendário</span>
            </button>
          )}

          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "requests"
                  ? "bg-[#0055D4] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon name="clipboard" size={14} className={activeTab === "requests" ? "text-white" : "text-slate-400"} />
              <span>Solicitações</span>
              {pendingRequests.length > 0 && (
                <span
                  className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                    activeTab === "requests" ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("minhas")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "minhas"
                ? "bg-[#0055D4] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon name="user" size={14} className={activeTab === "minhas" ? "text-white" : "text-slate-400"} />
            <span>Minhas reservas</span>
            <span
              className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                activeTab === "minhas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {myReservationsCount}
            </span>
          </button>
        </div>

        {/* Quick hint for resident */}
        {!isStaff && (
          <p className="text-xs text-slate-400 hidden sm:block">
            Clique em <strong>Reservar</strong> para escolher data e horário.
          </p>
        )}
      </div>

      {/* =========================================================================
          TAB 1: ÁREAS DISPONÍVEIS (Morador & Síndico Discovery)
          ========================================================================= */}
      {activeTab === "areas" && (
        <div className="space-y-4">
          {/* Search & Compact Filter Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Icon
                name="search"
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar espaço..."
                className="input pl-10 w-full text-xs"
              />
            </div>

            {/* Compact Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPricingFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pricingFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter("gratis")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pricingFilter === "gratis"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Grátis
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter("pago")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pricingFilter === "pago"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Pago
              </button>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input py-1.5 text-xs capitalize"
                >
                  <option value="all">Categorias: Todas</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Grid of Spaces */}
          {filteredAmenities.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon name="search" size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Nenhum espaço encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Tente ajustar os termos de busca ou remover os filtros aplicados."
                  : "Nenhum espaço cadastrado ou disponível no condomínio no momento."}
              </p>
              {isStaff && !searchQuery && (
                <button
                  type="button"
                  onClick={() => setWizardModal({ open: true, space: null })}
                  className="btn-primary inline-flex items-center gap-2 text-xs"
                >
                  <Icon name="plus" size={14} />
                  <span>Cadastrar primeiro espaço</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAmenities.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onSelect={handleOpenSpaceModal}
                  isStaff={isStaff}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CALENDÁRIO ADMINISTRATIVO (Síndico / Staff)
          ========================================================================= */}
      {activeTab === "calendar" && isStaff && (
        <AdminCalendar
          reservations={initialReservations}
          amenities={initialAmenities}
          blocks={initialBlocks}
          onOpenBlockModal={() => setBlockModalOpen(true)}
        />
      )}

      {/* =========================================================================
          TAB 3: SOLICITAÇÕES PENDENTES (Síndico / Staff)
          ========================================================================= */}
      {activeTab === "requests" && isStaff && (
        <AdminRequests requests={pendingRequests} />
      )}

      {/* =========================================================================
          TAB 4: MINHAS RESERVAS (Morador & Staff)
          ========================================================================= */}
      {activeTab === "minhas" && (
        <MyReservations
          reservations={initialReservations}
          amenities={initialAmenities}
          currentUserId={currentUser.id}
        />
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* 1. Space Details & Booking Modal */}
      {selectedSpace && (
        <SpaceDetailsModal
          space={selectedSpace}
          initialAction={modalInitialAction}
          reservations={initialReservations}
          blocks={initialBlocks}
          currentUser={currentUser}
          onClose={() => setSelectedSpace(null)}
          onSuccess={() => {
            setSelectedSpace(null);
            setActiveTab("minhas");
          }}
        />
      )}

      {/* 2. Space Wizard Creator / Editor */}
      {wizardModal.open && (
        <SpaceWizardModal
          space={wizardModal.space}
          onClose={() => setWizardModal({ open: false, space: null })}
          onSuccess={() => setWizardModal({ open: false, space: null })}
        />
      )}

      {/* 3. Block Period Modal */}
      {blockModalOpen && (
        <BlockModal
          amenities={initialAmenities}
          onClose={() => setBlockModalOpen(false)}
          onSuccess={() => setBlockModalOpen(false)}
        />
      )}
    </div>
  );
}
