"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import {
  INTERNAL_BTN_PRIMARY_CLS,
  InternalPageHeader,
  InternalStatGrid,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";
import {
  InternalFilterBar,
  InternalSearchInput,
  InternalStatFilterCard,
  InternalTabStrip,
  InternalViewToggle,
} from "@/components/internal/internal-interactive";
import {
  CATEGORIES_LIST,
  type LostAndFoundItem,
} from "@/types/lost-and-found";
import { ItemCard } from "./components/item-card";
import { RegisterItemModal } from "./components/register-item-modal";
import { ItemDetailsDrawer } from "./components/item-details-drawer";

const LOCAL_STORAGE_KEY = "zc_achados_perdidos_items";

interface AchadosPerdidosClientProps {
  initialItems?: LostAndFoundItem[];
  initialRole?: string;
  userName?: string;
  currentUserUnit?: string;
  condoName?: string;
  condoId?: number | null;
}

export function AchadosPerdidosClient({
  initialItems = [],
  initialRole = "morador",
  userName = "Eduarda Lima",
  currentUserUnit = "Unidade 302",
  condoName = "Residencial Parque das Águas",
  condoId,
}: AchadosPerdidosClientProps) {
  // Lista de itens reativa persistida
  const [items, setItems] = useState<LostAndFoundItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [];
  });

  // Carregamento e sincronização com LocalStorage e API
  useEffect(() => {
    // 1. Se recebemos itens do SSR, salvamos no localStorage como cache
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialItems));
      } catch {
        // Ignora quota de localStorage
      }
    } else {
      // 2. Se SSR veio vazio, tenta ler cache do localStorage
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        }
      } catch {
        // Ignora erro de JSON
      }
    }

    // 3. Sincroniza em segundo plano com a API para obter a lista mais recente
    fetch("/api/achados-e-perdidos")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data && Array.isArray(payload.data)) {
          setItems(payload.data);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload.data));
          } catch {
            // Ignora erro
          }
        }
      })
      .catch((err) => {
        console.warn("Aviso na sincronização de achados e perdidos:", err);
      });
  }, [initialItems]);

  // Tabs: "todos" | "FOUND" | "LOST"
  const [activeTab, setActiveTab] = useState<"todos" | "FOUND" | "LOST">("todos");

  // Barra de busca
  const [searchQuery, setSearchQuery] = useState("");

  // Filtros adicionais
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | "OPEN" | "RESOLVED">("TODOS");

  // Visualização: Grid ou Lista
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal de Cadastro
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Drawer de Detalhes
  const [selectedItem, setSelectedItem] = useState<LostAndFoundItem | null>(null);

  // Perfil ativo (com seletor interativo para teste instantâneo de permissões)
  const [currentRole, setCurrentRole] = useState<string>(initialRole.toLowerCase());

  // Mensagem de feedback (Toast)
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

  const showFeedback = (text: string, type: "success" | "info" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Helper para salvar estado e espelhar em localStorage
  const syncItemsState = (updater: (prev: LostAndFoundItem[]) => LostAndFoundItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignora estouro de cota
      }
      return next;
    });
  };

  // Contadores para abas e métricas
  const counts = useMemo(() => {
    const total = items.length;
    const found = items.filter((i) => i.type === "FOUND").length;
    const lost = items.filter((i) => i.type === "LOST").length;
    const resolved = items.filter((i) => i.status === "RESOLVED").length;
    const open = items.filter((i) => i.status === "OPEN").length;
    return { total, found, lost, resolved, open };
  }, [items]);

  // Filtragem dos itens
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro de aba
      if (activeTab === "FOUND" && item.type !== "FOUND") return false;
      if (activeTab === "LOST" && item.type !== "LOST") return false;

      // Filtro de categoria
      if (selectedCategory !== "todas" && item.category !== selectedCategory) return false;

      // Filtro de status
      if (statusFilter !== "TODOS" && item.status !== statusFilter) return false;

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesLoc = item.location.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesReporter = item.reportedBy.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesLoc || matchesCat || matchesReporter;
      }

      return true;
    });
  }, [items, activeTab, selectedCategory, statusFilter, searchQuery]);

  // Manipulação de cadastro de novo item (salva no servidor e no localStorage)
  const handleRegisterItem = async (newItemData: Omit<LostAndFoundItem, "id" | "status">) => {
    const tempId = `item-${Date.now()}`;
    const optimisticItem: LostAndFoundItem = {
      ...newItemData,
      id: tempId,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    // Atualização otimista imediata no cliente
    syncItemsState((prev) => [optimisticItem, ...prev]);

    showFeedback(
      optimisticItem.type === "FOUND"
        ? "Item encontrado registrado com sucesso! Obrigado por colaborar com o condomínio."
        : "Item perdido registrado! A comunidade e a portaria foram notificadas."
    );

    // Persistência na API
    try {
      const res = await fetch("/api/achados-e-perdidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItemData,
          condoId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          syncItemsState((prev) => prev.map((item) => (item.id === tempId ? json.data : item)));
        }
      }
    } catch (error) {
      console.warn("Aviso ao sincronizar novo item com a API:", error);
    }
  };

  // Reivindicação: "Este item é meu"
  const handleClaimItem = async (itemId: string | number, message: string) => {
    const claimDate = new Date().toLocaleDateString("pt-BR");

    // Atualização otimista
    syncItemsState((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(itemId)) {
          return {
            ...item,
            claimedBy: userName,
            claimMessage: message,
            claimDate,
          };
        }
        return item;
      })
    );

    // Se estiver com drawer aberto para o mesmo item, atualiza a referência local
    setSelectedItem((prev) =>
      prev && String(prev.id) === String(itemId)
        ? {
            ...prev,
            claimedBy: userName,
            claimMessage: message,
            claimDate,
          }
        : prev
    );

    showFeedback("Aviso enviado à portaria e zeladoria! Compareça à portaria com documento para conferência e retirada.");

    // Persistência na API
    try {
      const res = await fetch("/api/achados-e-perdidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          action: "claim",
          claimedBy: userName,
          claimMessage: message,
          claimDate,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          syncItemsState((prev) =>
            prev.map((item) => (String(item.id) === String(itemId) ? json.data : item))
          );
          setSelectedItem((prev) => (prev && String(prev.id) === String(itemId) ? json.data : prev));
        }
      }
    } catch (error) {
      console.warn("Aviso ao persistir reivindicação de item:", error);
    }
  };

  // Ação: "Eu encontrei este item"
  const handleReportFound = async (itemId: string | number, message: string) => {
    const claimMsg = `Morador informou localização: "${message}"`;

    syncItemsState((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(itemId)) {
          return {
            ...item,
            claimMessage: claimMsg,
            claimedBy: userName,
          };
        }
        return item;
      })
    );

    setSelectedItem((prev) =>
      prev && String(prev.id) === String(itemId)
        ? {
            ...prev,
            claimMessage: claimMsg,
            claimedBy: userName,
          }
        : prev
    );

    showFeedback("Aviso registrado com sucesso! O morador que perdeu o item foi notificado.");

    try {
      const res = await fetch("/api/achados-e-perdidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          action: "report_found",
          reporterName: userName,
          locationNotes: message,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          syncItemsState((prev) =>
            prev.map((item) => (String(item.id) === String(itemId) ? json.data : item))
          );
          setSelectedItem((prev) => (prev && String(prev.id) === String(itemId) ? json.data : prev));
        }
      }
    } catch (error) {
      console.warn("Aviso ao persistir aviso de item encontrado:", error);
    }
  };

  // Ação de Staff: "Marcar como Devolvido"
  const handleMarkResolved = async (
    itemId: string | number,
    recipientName: string,
    notes: string
  ) => {
    const now = new Date();
    const resolvedAtString = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    const resolvedByString = `Devolvido para ${recipientName} (${notes})`;

    syncItemsState((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(itemId)) {
          return {
            ...item,
            status: "RESOLVED",
            resolvedAt: resolvedAtString,
            resolvedBy: resolvedByString,
          };
        }
        return item;
      })
    );

    setSelectedItem((prev) =>
      prev && String(prev.id) === String(itemId)
        ? {
            ...prev,
            status: "RESOLVED",
            resolvedAt: resolvedAtString,
            resolvedBy: resolvedByString,
          }
        : prev
    );

    showFeedback(`Item marcado como devolvido para ${recipientName}!`);

    try {
      const res = await fetch("/api/achados-e-perdidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          action: "resolve",
          recipientName,
          notes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          syncItemsState((prev) =>
            prev.map((item) => (String(item.id) === String(itemId) ? json.data : item))
          );
          setSelectedItem((prev) => (prev && String(prev.id) === String(itemId) ? json.data : prev));
        }
      }
    } catch (error) {
      console.warn("Aviso ao marcar item como devolvido:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div className="fixed top-5 right-5 z-[70] max-w-md animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-xs font-semibold text-emerald-900 shadow-xl backdrop-blur-md flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
              <Icon name="check" size={14} />
            </span>
            <div className="flex-1">
              <p className="font-bold text-emerald-950">Ação confirmada</p>
              <p className="mt-0.5 leading-relaxed">{feedback.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <InternalPageHeader
        icon="tag"
        title="Achados e Perdidos"
        description={`Central integrada do ${condoName} para localização, triagem e devolução de pertences.`}
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Achados e Perdidos" },
        ]}
        badge={<InternalStatusBadge tone="blue">{counts.total} registros</InternalStatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] px-3 py-2 text-xs">
              <span className="font-bold text-[#526079]">Visão:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="font-bold text-[#101828] bg-transparent outline-none cursor-pointer text-xs"
              >
                <option value="morador">Morador</option>
                <option value="porteiro">Portaria</option>
                <option value="zelador">Zelador</option>
                <option value="sindico">Síndico / Admin</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className={INTERNAL_BTN_PRIMARY_CLS}
            >
              <Icon name="plus" size={15} />
              <span>Registrar item</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards Compactos */}
      <InternalStatGrid columns={4}>
        <InternalStatFilterCard
          label="Total de registros"
          value={counts.total}
          hint="catalogados"
          icon="package"
          tone="navy"
          active={activeTab === "todos"}
          onClick={() => setActiveTab("todos")}
        />
        <InternalStatFilterCard
          label="Itens encontrados"
          value={counts.found}
          hint="aguardando dono"
          icon="check-circle"
          tone="green"
          active={activeTab === "FOUND"}
          onClick={() => setActiveTab("FOUND")}
        />
        <InternalStatFilterCard
          label="Itens perdidos"
          value={counts.lost}
          hint="em busca"
          icon="search"
          tone="amber"
          active={activeTab === "LOST"}
          onClick={() => setActiveTab("LOST")}
        />
        <InternalStatFilterCard
          label="Devolvidos"
          value={counts.resolved}
          hint="finalizados"
          icon="check"
          tone="blue"
          active={statusFilter === "RESOLVED"}
          onClick={() => setStatusFilter(statusFilter === "RESOLVED" ? "TODOS" : "RESOLVED")}
        />
      </InternalStatGrid>

      {/* Toolbar: Abas + Busca + Categoria + Status + View Toggle */}
      <InternalFilterBar
        left={
          <InternalTabStrip
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "todos" | "FOUND" | "LOST")}
            tabs={[
              { key: "todos", label: "Todos", count: counts.total },
              { key: "FOUND", label: "Encontrados", icon: "check-circle", count: counts.found },
              { key: "LOST", label: "Perdidos", icon: "search", count: counts.lost },
            ]}
          />
        }
        right={
          <InternalViewToggle
            value={viewMode}
            onChange={(v) => setViewMode(v as "grid" | "list")}
            options={[
              { key: "grid", label: "Cards", icon: "grid" },
              { key: "list", label: "Lista", icon: "menu" },
            ]}
          />
        }
        bottom={
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6">
              <InternalSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar por objeto, local ou descrição..."
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs sm:text-sm font-semibold text-[#101828] outline-none focus:border-[#1455FF] cursor-pointer"
              >
                <option value="todas">Todas as categorias</option>
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "TODOS" | "OPEN" | "RESOLVED")}
                className="h-9.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs sm:text-sm font-semibold text-[#101828] outline-none focus:border-[#1455FF] cursor-pointer"
              >
                <option value="TODOS">Todos os status</option>
                <option value="OPEN">Apenas Abertos</option>
                <option value="RESOLVED">Apenas Devolvidos</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Listagem de Itens */}
      {filteredItems.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1455FF] border border-blue-100 mb-3">
            <Icon name="tag" size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Nenhum item encontrado
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "todas" || statusFilter !== "TODOS"
              ? "Nenhum resultado corresponde aos filtros aplicados. Tente ajustar a busca."
              : "Ainda não há registros cadastrados nesta categoria."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || selectedCategory !== "todas" || statusFilter !== "TODOS") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("todas");
                  setStatusFilter("TODOS");
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1455FF] hover:bg-[#0048E8] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Registrar Novo Item
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid de Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={(clicked) => setSelectedItem(clicked)}
            />
          ))}
        </div>
      ) : (
        /* Visualização em Lista */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const isFound = item.type === "FOUND";
            const isOpen = item.status === "OPEN";

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-100">
                        <Icon name="tag" size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isFound
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isFound ? "Achado" : "Perdido"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isOpen
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isOpen ? "Aberto" : "Devolvido"}
                      </span>

                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="mt-1 text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#1455FF] transition-colors">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icon name="map-pin" size={12} className="text-slate-400" />
                        {item.location}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" size={12} className="text-slate-400" />
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-xs text-slate-500 font-medium sm:hidden">
                    Por {item.reportedBy}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1455FF] group-hover:translate-x-1 transition-transform">
                    <span>Ver detalhes</span>
                    <Icon name="arrow-right" size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro de Item */}
      <RegisterItemModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleRegisterItem}
        currentUserName={userName}
        currentUserUnit={currentUserUnit || "Condomínio"}
      />

      {/* Drawer de Detalhes e Ações Interativas */}
      <ItemDetailsDrawer
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        userRole={currentRole}
        onClaimItem={handleClaimItem}
        onReportFound={handleReportFound}
        onMarkResolved={handleMarkResolved}
      />
    </div>
  );
}
