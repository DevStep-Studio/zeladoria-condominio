"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import {
  INTERNAL_BTN_PRIMARY_CLS,
  InternalEmptyState,
  InternalPageHeader,
  InternalPageLayout,
  InternalStatCard,
  InternalStatGrid,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";
import {
  InternalFilterBar,
  InternalSearchInput,
  InternalTabStrip,
} from "@/components/internal/internal-interactive";
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
  const router = useRouter();
  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(role);

  // Reactive state with instant sync
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities);
  const [reservations, setReservations] = useState<ReservationItem[]>(initialReservations);
  const [blocks, setBlocks] = useState<AmenityBlock[]>(initialBlocks);

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

  function broadcastReservasUpdate() {
    if (typeof window !== "undefined") {
      try {
        const bc = new BroadcastChannel("zc_reservas_sync");
        bc.postMessage({ type: "RESERVATION_UPDATED", timestamp: Date.now() });
        bc.close();
      } catch {}
      try {
        localStorage.setItem("zc_reservas_last_update", String(Date.now()));
      } catch {}
    }
  }

  const fetchLatestReservas = useCallback(async () => {
    try {
      const res = await fetch("/api/reservas", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.reservations)) {
        setReservations(data.reservations);
      }
      if (Array.isArray(data.amenities)) {
        setAmenities(data.amenities);
      }
      if (Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
      }
    } catch {
      // Silencioso em caso de falha transitória
    }
  }, []);

  // Sync state if props change from server
  useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);

  useEffect(() => {
    setAmenities(initialAmenities);
  }, [initialAmenities]);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  // Real-time synchronization
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("zc_reservas_sync");
      bc.onmessage = () => {
        fetchLatestReservas();
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "zc_reservas_last_update") {
        fetchLatestReservas();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatestReservas();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", () => fetchLatestReservas());

    const pollInterval = setInterval(() => {
      fetchLatestReservas();
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", () => fetchLatestReservas());
      if (bc) bc.close();
    };
  }, [fetchLatestReservas]);

  // Pending requests count for Síndico badge
  const pendingRequests = useMemo(() => {
    return reservations.filter((r) => r.status === "pendente");
  }, [reservations]);

  const myReservationsCount = useMemo(() => {
    return reservations.filter((r) => r.userId === currentUser.id).length;
  }, [reservations, currentUser.id]);

  // Filtered spaces
  const filteredAmenities = useMemo(() => {
    return amenities.filter((space) => {
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
  }, [amenities, searchQuery, pricingFilter, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(amenities.map((a) => a.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [amenities]);

  const handleOpenSpaceModal = (space: Amenity, action: "details" | "reserve") => {
    setSelectedSpace(space);
    setModalInitialAction(action);
  };

  const activeAmenitiesCount = useMemo(
    () => amenities.filter((a) => a.active).length,
    [amenities]
  );

  const upcomingReservationsCount = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === "aprovada" || r.status === "confirmada" || r.status === "pendente"
      ).length,
    [reservations]
  );

  return (
    <InternalPageLayout>
      {/* 1. Cabeçalho Padrão */}
      <InternalPageHeader
        icon="calendar"
        title="Reservas"
        description={
          isStaff
            ? "Gestão de áreas comuns, calendário de ocupação e aprovação de solicitações."
            : "Reserve os espaços de lazer e convivência do condomínio com verificação automática de conflitos."
        }
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Reservas" },
        ]}
        badge={
          <InternalStatusBadge tone="blue" showDot>
            {activeAmenitiesCount} espaços disponíveis
          </InternalStatusBadge>
        }
        actions={
          isStaff ? (
            <button
              type="button"
              onClick={() => setWizardModal({ open: true, space: null })}
              className={INTERNAL_BTN_PRIMARY_CLS}
            >
              <Icon name="plus" size={15} />
              <span>Novo espaço</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Indicadores Resumidos */}
      <InternalStatGrid columns={4}>
        <InternalStatCard
          label="Espaços disponíveis"
          value={activeAmenitiesCount}
          hint="prontos para reserva"
          icon="home"
          tone="blue"
          active={activeTab === "areas"}
        />
        <InternalStatCard
          label="Minhas reservas"
          value={myReservationsCount}
          hint="vinculadas a você"
          icon="user"
          tone="green"
          active={activeTab === "minhas"}
        />
        <InternalStatCard
          label={isStaff ? "Aprovações pendentes" : "Reservas ativas"}
          value={isStaff ? pendingRequests.length : upcomingReservationsCount}
          hint={isStaff ? "aguardando síndico" : "no condomínio"}
          icon="clock"
          tone="amber"
          active={isStaff && activeTab === "requests"}
        />
        <InternalStatCard
          label="Total agendado"
          value={reservations.length}
          hint="histórico geral"
          icon="calendar"
          tone="navy"
          active={isStaff && activeTab === "calendar"}
        />
      </InternalStatGrid>

      {/* 3. Barra de Navegação em Abas + Dica Rápida */}
      <InternalFilterBar
        left={
          <InternalTabStrip
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "areas" | "calendar" | "requests" | "minhas")}
            tabs={[
              { key: "areas", label: "Áreas disponíveis", icon: "grid" as IconName, count: amenities.length },
              ...(isStaff
                ? [
                    { key: "calendar", label: "Calendário", icon: "calendar" as IconName },
                    {
                      key: "requests",
                      label: "Solicitações & Reservas",
                      icon: "clipboard" as IconName,
                      count: pendingRequests.length > 0 ? pendingRequests.length : reservations.length,
                    },
                  ]
                : []),
              { key: "minhas", label: "Minhas reservas", icon: "user" as IconName, count: myReservationsCount },
            ]}
          />
        }
        right={
          !isStaff ? (
            <span className="text-xs font-medium text-[#526079] hidden sm:inline">
              Selecione um espaço e clique em <strong className="text-[#101828]">Reservar</strong>.
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setBlockModalOpen(true)}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F8FC] px-3 text-xs font-bold text-[#101828] transition-colors cursor-pointer"
            >
              <Icon name="lock" size={14} className="text-amber-600" />
              <span>Bloquear horário</span>
            </button>
          )
        }
      />

      {/* =========================================================================
          TAB 1: ÁREAS DISPONÍVEIS (Morador & Síndico Discovery)
          ========================================================================= */}
      {activeTab === "areas" && (
        <div className="space-y-4">
          {/* Search & Compact Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E2E8F0] bg-white p-3 sm:p-3.5 shadow-[0_2px_8px_rgba(7,26,56,0.03)]">
            <InternalSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar espaço, churrasqueira, salão..."
              className="sm:max-w-md"
            />

            {/* Compact Filters */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPricingFilter("all")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  pricingFilter === "all"
                    ? "bg-[#081A37] text-white"
                    : "bg-[#F5F8FC] text-[#526079] hover:text-[#101828] hover:bg-slate-200/60"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter("gratis")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  pricingFilter === "gratis"
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#F5F8FC] text-[#526079] hover:text-[#101828] hover:bg-slate-200/60"
                }`}
              >
                Grátis
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter("pago")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  pricingFilter === "pago"
                    ? "bg-[#1455FF] text-white"
                    : "bg-[#F5F8FC] text-[#526079] hover:text-[#101828] hover:bg-slate-200/60"
                }`}
              >
                Pago
              </button>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 rounded-xl border border-[#E2E8F0] bg-white pl-3 pr-8 text-xs font-bold text-[#101828] capitalize outline-none focus:border-[#1455FF]"
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
            <InternalEmptyState
              title="Nenhum espaço encontrado"
              description={
                searchQuery
                  ? "Tente ajustar os termos de busca ou remover os filtros aplicados."
                  : "Nenhum espaço cadastrado ou disponível no condomínio no momento."
              }
              icon="calendar"
              action={
                isStaff && !searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setWizardModal({ open: true, space: null })}
                    className={INTERNAL_BTN_PRIMARY_CLS}
                  >
                    <Icon name="plus" size={14} />
                    <span>Cadastrar primeiro espaço</span>
                  </button>
                ) : null
              }
            />
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
          reservations={reservations}
          amenities={amenities}
          blocks={blocks}
          onOpenBlockModal={() => setBlockModalOpen(true)}
        />
      )}

      {/* =========================================================================
          TAB 3: SOLICITAÇÕES & GESTÃO DE RESERVAS (Síndico / Staff)
          ========================================================================= */}
      {activeTab === "requests" && isStaff && (
        <AdminRequests
          requests={pendingRequests}
          allReservations={reservations}
          amenities={amenities}
          onRefresh={fetchLatestReservas}
        />
      )}

      {/* =========================================================================
          TAB 4: MINHAS RESERVAS (Morador & Staff)
          ========================================================================= */}
      {activeTab === "minhas" && (
        <MyReservations
          reservations={reservations}
          amenities={amenities}
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
          reservations={reservations}
          blocks={blocks}
          currentUser={currentUser}
          onClose={() => setSelectedSpace(null)}
          onSuccess={() => {
            setSelectedSpace(null);
            setActiveTab("minhas");
            broadcastReservasUpdate();
            fetchLatestReservas();
            router.refresh();
          }}
        />
      )}

      {/* 2. Space Wizard Creator / Editor */}
      {wizardModal.open && (
        <SpaceWizardModal
          space={wizardModal.space}
          onClose={() => setWizardModal({ open: false, space: null })}
          onSuccess={() => {
            setWizardModal({ open: false, space: null });
            broadcastReservasUpdate();
            fetchLatestReservas();
            router.refresh();
          }}
        />
      )}

      {/* 3. Block Period Modal */}
      {blockModalOpen && (
        <BlockModal
          amenities={amenities}
          onClose={() => setBlockModalOpen(false)}
          onSuccess={() => {
            setBlockModalOpen(false);
            broadcastReservasUpdate();
            fetchLatestReservas();
            router.refresh();
          }}
        />
      )}
    </InternalPageLayout>
  );
}
