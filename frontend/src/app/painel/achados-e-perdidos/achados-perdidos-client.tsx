"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  CATEGORIES_LIST,
  MOCK_LOST_AND_FOUND_ITEMS,
  type ItemCategory,
  type LostAndFoundItem,
} from "@/types/lost-and-found";
import { ItemCard } from "./components/item-card";
import { RegisterItemModal } from "./components/register-item-modal";
import { ItemDetailsDrawer } from "./components/item-details-drawer";

interface AchadosPerdidosClientProps {
  initialRole?: string;
  userName?: string;
  condoName?: string;
}

export function AchadosPerdidosClient({
  initialRole = "morador",
  userName = "Eduarda Lima",
  condoName = "Residencial Parque das Águas",
}: AchadosPerdidosClientProps) {
  // Lista de itens reativa em memória com dados iniciais ricos
  const [items, setItems] = useState<LostAndFoundItem[]>(MOCK_LOST_AND_FOUND_ITEMS);

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

  // Manipulação de cadastro de novo item
  const handleRegisterItem = (newItemData: Omit<LostAndFoundItem, "id" | "status">) => {
    const newItem: LostAndFoundItem = {
      ...newItemData,
      id: `item-${Date.now()}`,
      status: "OPEN",
    };

    setItems((prev) => [newItem, ...prev]);
    showFeedback(
      newItem.type === "FOUND"
        ? "Item encontrado registrado com sucesso! Obrigado por colaborar com o condomínio."
        : "Item perdido registrado! A comunidade e a portaria foram notificadas."
    );
  };

  // Reivindicação: "Este item é meu"
  const handleClaimItem = (itemId: string | number, message: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            claimedBy: userName,
            claimMessage: message,
            claimDate: new Date().toLocaleDateString("pt-BR"),
          };
        }
        return item;
      })
    );

    // Se estiver com drawer aberto para o mesmo item, atualiza a referência local
    setSelectedItem((prev) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            claimedBy: userName,
            claimMessage: message,
            claimDate: new Date().toLocaleDateString("pt-BR"),
          }
        : prev
    );

    showFeedback("Aviso enviado à portaria e zeladoria! Compareça à portaria com documento para conferência e retirada.");
  };

  // Ação: "Eu encontrei este item"
  const handleReportFound = (itemId: string | number, message: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            claimMessage: `Morador informou localização: "${message}"`,
            claimedBy: userName,
          };
        }
        return item;
      })
    );

    setSelectedItem((prev) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            claimMessage: `Morador informou localização: "${message}"`,
            claimedBy: userName,
          }
        : prev
    );

    showFeedback("Aviso registrado com sucesso! O morador que perdeu o item foi notificado.");
  };

  // Ação de Staff: "Marcar como Devolvido"
  const handleMarkResolved = (
    itemId: string | number,
    recipientName: string,
    notes: string
  ) => {
    const now = new Date();
    const resolvedAtString = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: "RESOLVED",
            resolvedAt: resolvedAtString,
            resolvedBy: `Devolvido para ${recipientName} (${notes})`,
          };
        }
        return item;
      })
    );

    setSelectedItem((prev) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            status: "RESOLVED",
            resolvedAt: resolvedAtString,
            resolvedBy: `Devolvido para ${recipientName} (${notes})`,
          }
        : prev
    );

    showFeedback(`Item marcado como devolvido para ${recipientName}!`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0070F3] border border-blue-100 shadow-2xs">
              <Icon name="tag" size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Achados e Perdidos
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Central integrada do {condoName} para localização e devolução de pertences
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Seletor Rápido de Perfil para Demonstração Interativa */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400">Visão:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="font-bold text-slate-700 bg-transparent outline-none cursor-pointer text-xs"
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
            className="inline-flex items-center gap-2 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
          >
            <Icon name="plus" size={15} />
            <span>+ Registrar Item</span>
          </button>
        </div>
      </div>

      {/* Stats Cards (Resumo Rápido) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total de Registros</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon name="package" size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {counts.total}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Itens catalogados</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Itens Encontrados</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Icon name="check-circle" size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
            {counts.found}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Aguardando dono</span>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Itens Perdidos</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Icon name="search" size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700 tracking-tight">
            {counts.lost}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">Moradores procurando</span>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Devolvidos</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#0070F3]">
              <Icon name="check" size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#0070F3] tracking-tight">
            {counts.resolved}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">Finalizados com sucesso</span>
        </div>
      </div>

      {/* Toolbar: Abas Superiores + Barra de Busca + Filtros */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-4">
        {/* Linha 1: Abas Principais (Todos, Encontrados, Perdidos) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Abas com Contagem */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("todos")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "todos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Todos</span>
              <span
                className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                  activeTab === "todos"
                    ? "bg-blue-50 text-[#0070F3]"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FOUND")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "FOUND"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="check-circle" size={13} />
              <span>Itens Encontrados</span>
              <span
                className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                  activeTab === "FOUND"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts.found}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("LOST")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "LOST"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="search" size={13} />
              <span>Itens Perdidos</span>
              <span
                className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                  activeTab === "LOST"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts.lost}
              </span>
            </button>
          </div>

          {/* Toggle de Visualização (Grid vs Lista) */}
          <div className="flex items-center gap-1 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "border-[#0070F3] bg-blue-50 text-[#0070F3]"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              title="Visualização em Grade de Cards"
            >
              <Icon name="grid" size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "border-[#0070F3] bg-blue-50 text-[#0070F3]"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              title="Visualização em Lista"
            >
              <Icon name="menu" size={15} />
            </button>
          </div>
        </div>

        {/* Linha 2: Barra de Busca e Filtros de Categoria e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Barra de Busca com Ícone */}
          <div className="sm:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, objeto, local ou descrição..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 outline-none transition-all focus:border-[#0070F3] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Filtro de Categoria */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none transition-all focus:border-[#0070F3] focus:bg-white cursor-pointer"
            >
              <option value="todas">Todas as categorias</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Status */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 outline-none transition-all focus:border-[#0070F3] focus:bg-white cursor-pointer"
            >
              <option value="TODOS">Todos os status</option>
              <option value="OPEN">Apenas Abertos</option>
              <option value="RESOLVED">Apenas Devolvidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listagem de Itens */}
      {filteredItems.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0070F3] border border-blue-100 mb-3">
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
              className="px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
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

                    <h4 className="mt-1 text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#0070F3] transition-colors">
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0070F3] group-hover:translate-x-1 transition-transform">
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
        currentUserUnit="Unidade 302"
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

