"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import {
  AppButton,
  AppSearch,
  AppFilter,
  AppPagination,
  AppEmptyState,
} from "@/components/app-ui";
import { dateTimeBR } from "@/lib/utils";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notificacoes";

export interface NotificationItem {
  id: number;
  condoId: number;
  userId: number;
  title: string;
  body: string | null;
  channel: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export type NotificationCategory =
  | "todas"
  | "ocorrencias"
  | "reservas"
  | "visitantes"
  | "encomendas"
  | "servicos"
  | "pagamentos"
  | "comunicados"
  | "assembleias"
  | "sistema";

export type PeriodFilter = "todas" | "hoje" | "semana" | "mes";

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: IconName; actionLabel: string }
> = {
  todas: { label: "Todas", icon: "bell", actionLabel: "Acessar" },
  ocorrencias: { label: "Ocorrências", icon: "clipboard", actionLabel: "Ver ocorrência" },
  reservas: { label: "Reservas", icon: "calendar", actionLabel: "Ver reserva" },
  visitantes: { label: "Visitantes", icon: "users", actionLabel: "Ver visitante" },
  encomendas: { label: "Encomendas", icon: "package", actionLabel: "Ver encomenda" },
  servicos: { label: "Serviços", icon: "briefcase", actionLabel: "Ver contratação" },
  pagamentos: { label: "Financeiro", icon: "wallet", actionLabel: "Ver pagamento" },
  comunicados: { label: "Comunicados", icon: "mail", actionLabel: "Ver comunicado" },
  assembleias: { label: "Assembleias", icon: "scale", actionLabel: "Acessar assembleia" },
  sistema: { label: "Sistema", icon: "settings", actionLabel: "Acessar registro" },
};

function detectCategory(n: NotificationItem): NotificationCategory {
  const text = `${n.title} ${n.body || ""} ${n.link || ""}`.toLowerCase();

  if (text.includes("prestador") || text.includes("serviço") || text.includes("servico") || text.includes("orçamento") || text.includes("orcamento") || text.includes("vistoria")) {
    return "servicos";
  }
  if (text.includes("encomenda") || text.includes("pacote") || text.includes("entrega") || text.includes("/encomendas")) {
    return "encomendas";
  }
  if (text.includes("visitante") || text.includes("visita") || text.includes("portaria") || text.includes("/visitantes")) {
    return "visitantes";
  }
  if (text.includes("ocorrência") || text.includes("ocorrencia") || text.includes("chamado") || text.includes("/ocorrencias")) {
    return "ocorrencias";
  }
  if (text.includes("reserva") || text.includes("churrasqueira") || text.includes("salão") || text.includes("/reservas")) {
    return "reservas";
  }
  if (text.includes("assembleia") || text.includes("votação") || text.includes("votacao") || text.includes("/assembleias")) {
    return "assembleias";
  }
  if (text.includes("comunicado") || text.includes("aviso") || text.includes("/comunicados")) {
    return "comunicados";
  }
  if (text.includes("pagamento") || text.includes("boleto") || text.includes("fatura") || text.includes("taxa") || text.includes("/financeiro")) {
    return "pagamentos";
  }

  return "sistema";
}

export function NotificacoesClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [statusTab, setStatusTab] = useState<"todas" | "nao_lidas" | "lidas">("todas");
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("todas");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("todas");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  // Marcar individual como lida
  const handleMarkAsRead = (id: number) => {
    // Atualização otimista
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );

    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = () => {
    // Atualização otimista
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );

    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  // Contadores
  const unreadCount = useMemo(() => {
    return items.filter((n) => !n.readAt).length;
  }, [items]);

  const readCount = useMemo(() => {
    return items.filter((n) => !!n.readAt).length;
  }, [items]);

  // Filtragem
  const filteredNotifications = useMemo(() => {
    return items.filter((n) => {
      // 1. Status Tab
      if (statusTab === "nao_lidas" && n.readAt) return false;
      if (statusTab === "lidas" && !n.readAt) return false;

      // 2. Categoria
      const cat = detectCategory(n);
      if (selectedCategory !== "todas" && cat !== selectedCategory) return false;

      // 3. Período
      if (selectedPeriod !== "todas") {
        const itemDate = new Date(n.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - itemDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (selectedPeriod === "hoje" && diffHours > 24) return false;
        if (selectedPeriod === "semana" && diffHours > 24 * 7) return false;
        if (selectedPeriod === "mes" && diffHours > 24 * 30) return false;
      }

      // 4. Busca
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchBody = n.body ? n.body.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchBody) return false;
      }

      return true;
    });
  }, [items, statusTab, selectedCategory, selectedPeriod, search]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header com ações principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Central de Notificações</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#1355FF] text-white text-xs font-black">
                {unreadCount} nova{unreadCount === 1 ? "" : "s"}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Avisos de portaria, encomendas, chamados, contratos, assembleias e comunicados em tempo real.
          </p>
        </div>

        {unreadCount > 0 && (
          <AppButton
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            isLoading={isPending}
            icon="check-circle"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
          >
            Marcar todas como lidas ({unreadCount})
          </AppButton>
        )}
      </div>

      {/* Tabs de Status: Todas | Não lidas | Lidas */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => {
            setStatusTab("todas");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusTab === "todas"
              ? "bg-[#1355FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Todas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusTab === "todas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusTab("nao_lidas");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusTab === "nao_lidas"
              ? "bg-[#1355FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Não lidas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusTab === "nao_lidas" ? "bg-white/20 text-white" : "bg-blue-50 text-[#1355FF] font-black"}`}>
            {unreadCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusTab("lidas");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusTab === "lidas"
              ? "bg-[#1355FF] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Lidas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusTab === "lidas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {readCount}
          </span>
        </button>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <AppSearch
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Buscar por palavra-chave..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Período:
            </span>
            {[
              { id: "todas", label: "Tudo" },
              { id: "hoje", label: "Hoje" },
              { id: "semana", label: "7 dias" },
              { id: "mes", label: "30 dias" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPeriod(p.id as PeriodFilter);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedPeriod === p.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips de Categoria */}
        <AppFilter
          options={Object.entries(CATEGORY_META).map(([id, meta]) => ({
            id,
            label: meta.label,
          }))}
          selectedId={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id as NotificationCategory);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Lista de Notificações */}
      {filteredNotifications.length === 0 ? (
        <AppEmptyState
          title="Nenhuma notificação encontrada"
          description={
            search || selectedCategory !== "todas" || selectedPeriod !== "todas" || statusTab !== "todas"
              ? "Tente ajustar os filtros ou a palavra-chave pesquisada para encontrar outros registros."
              : "Você está em dia com todos os comunicados e atualizações do condomínio."
          }
          icon="bell"
          action={
            search || selectedCategory !== "todas" || selectedPeriod !== "todas" || statusTab !== "todas"
              ? {
                  label: "Limpar todos os filtros",
                  onClick: () => {
                    setSearch("");
                    setStatusTab("todas");
                    setSelectedCategory("todas");
                    setSelectedPeriod("todas");
                    setCurrentPage(1);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {paginatedNotifications.map((n) => {
            const isUnread = !n.readAt;
            const category = detectCategory(n);
            const meta = CATEGORY_META[category];

            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUnread
                    ? "border-blue-200 bg-blue-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread
                        ? "bg-[#1355FF] text-white shadow-xs"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon name={meta.icon} size={18} />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm tracking-tight ${
                          isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                        }`}
                      >
                        {n.title}
                      </h4>

                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#1355FF] shrink-0" title="Nova notificação" />
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {meta.label}
                      </span>

                      {n.channel && n.channel !== "app" && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          {n.channel.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {n.body && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 font-medium">
                      {dateTimeBR(n.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Ações contextuais */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (isUnread) handleMarkAsRead(n.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#1355FF] hover:text-[#1355FF] text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span>{meta.actionLabel}</span>
                      <Icon name="arrow-right" size={12} />
                    </Link>
                  )}

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Marcar como lida"
                      aria-label="Marcar como lida"
                    >
                      <Icon name="check" size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
        totalItems={filteredNotifications.length}
        pageSize={pageSize}
      />
    </div>
  );
}

