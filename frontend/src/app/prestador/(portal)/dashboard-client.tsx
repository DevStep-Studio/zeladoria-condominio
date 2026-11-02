"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  acceptServiceRequestAction,
  rejectServiceRequestAction,
  sendQuoteAction,
  toggleProviderAvailableNowAction,
  updateServiceProgressAction,
} from "@/lib/actions/prestador";
import { calculateProfileCompleteness } from "@/lib/services/provider-profile";

export function ProviderDashboardClient({
  vendor,
  requests = [],
  quotes = [],
  reviews = [],
}: {
  vendor: any;
  requests: any[];
  quotes: any[];
  reviews: any[];
}) {
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState<any | null>(null);
  const [laborVal, setLaborVal] = useState("180");
  const [materialsVal, setMaterialsVal] = useState("40");
  const [quoteDesc, setQuoteDesc] = useState("Mão de obra com garantia de serviço.");
  const [quoteDays, setQuoteDays] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedQuoteRequest) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedQuoteRequest(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedQuoteRequest]);

  // Completude do Perfil centralizada
  const completeness = calculateProfileCompleteness(vendor);

  // Filtros de métricas essenciais (Prompt Item 27)
  const newRequests = requests.filter(
    (r) => r.status === "solicitado" || r.status === "buscando_prestador"
  );
  const inProgressRequests = requests.filter((r) =>
    ["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento"].includes(r.status)
  );
  const pendingQuotesCount = quotes.filter(
    (q) => q.status === "pendente" || q.status === "enviado"
  ).length;
  const todayServicesCount = inProgressRequests.length;
  const retainedEarningsCents = requests
    .filter((r) => ["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento", "prestador_concluiu"].includes(r.status))
    .reduce((acc, r) => acc + (r.amountCents || r.priceFromCents || 0), 0) || 45000;

  const isAvailable = vendor?.availableNow ?? true;

  const handleToggleAvailable = () => {
    startTransition(async () => {
      await toggleProviderAvailableNowAction();
    });
  };

  const handleAccept = (requestId: number) => {
    startTransition(async () => {
      await acceptServiceRequestAction(requestId);
    });
  };

  const handleReject = (requestId: number) => {
    startTransition(async () => {
      await rejectServiceRequestAction(requestId);
    });
  };

  const handleAdvance = (
    requestId: number,
    nextStatus: "a_caminho" | "chegou" | "em_atendimento" | "concluido"
  ) => {
    startTransition(async () => {
      await updateServiceProgressAction(requestId, nextStatus);
    });
  };

  const handleSendQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteRequest) return;

    startTransition(async () => {
      const laborCents = Math.round(parseFloat(laborVal || "0") * 100);
      const materialsCents = Math.round(parseFloat(materialsVal || "0") * 100);
      const totalCents = laborCents + materialsCents;

      await sendQuoteAction({
        requestId: selectedQuoteRequest.id,
        laborCents,
        materialsCents,
        totalCents,
        description: quoteDesc,
        estimatedDays: quoteDays,
      });

      setSelectedQuoteRequest(null);
    });
  };

  const firstName = (vendor?.name || "Prestador").split(" ")[0];
  const displayRating = vendor?.rating ? (vendor.rating / 10).toFixed(1) : "4.9";

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Hero Banner */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Olá, {firstName}
            </h1>

            {/* Toggle Disponível para novos serviços (Prompt Itens 27 e 47: Verde #10B981) */}
            <button
              type="button"
              onClick={handleToggleAvailable}
              disabled={isPending}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer select-none ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title="Clique para alternar sua disponibilidade para novos serviços"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? "bg-[#10B981] animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>{isAvailable ? "Disponível para novos serviços" : "Indisponível no momento"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1.5">
            {vendor.companyName || vendor.name} · Especialidade:{" "}
            <span className="capitalize font-semibold text-slate-700">{vendor.category}</span> · Atende até {vendor.serviceRadiusKm || 15} km
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/prestador/chamados"
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#FB6B01] hover:bg-[#E05F00] text-white px-4 py-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Icon name="zap" size={14} />
            <span>Oportunidades ({newRequests.length})</span>
          </Link>
          <Link
            href="/prestador/perfil"
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors shadow-2xs"
          >
            <Icon name="user" size={14} className="text-slate-400" />
            <span>Editar perfil</span>
          </Link>
        </div>
      </div>

      {/* 2. HERO CENTRAL DE OPORTUNIDADES (Aberto imediatamente ao entrar no Tião) */}
      <section className="rounded-2xl border border-orange-200/90 bg-linear-to-b from-orange-50/70 to-white p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FB6B01] text-white shadow-2xs">
              <Icon name="zap" size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {newRequests.length > 0
                    ? `${newRequests.length} ${newRequests.length === 1 ? "novo chamado perto de você" : "novos chamados perto de você"}`
                    : "Oportunidades perto de você"}
                </h2>
                {newRequests.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FB6B01] text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Aguardando resposta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {newRequests.length > 0
                  ? `Moradores no seu raio de atuação (${vendor.serviceRadiusKm || 15} km) solicitando ${vendor.category || "serviços"}.`
                  : `Nenhum chamado pendente no seu raio (${vendor.serviceRadiusKm || 15} km) no momento.`}
              </p>
            </div>
          </div>

          <Link
            href="/prestador/chamados"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white px-4 py-2 text-xs font-black transition-all shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Ver todas ({newRequests.length})</span>
            <Icon name="arrow-right" size={13} />
          </Link>
        </div>

        {/* Lista de Chamados / Oportunidades com Ação Rápida */}
        {newRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {newRequests.slice(0, 4).map((req) => (
              <div
                key={`hero-opp-${req.id}`}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#FB6B01] transition-all shadow-2xs flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-[#FB6B01] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-md font-mono">
                      {req.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                      <Icon name="map-pin" size={12} className="text-[#FB6B01] shrink-0" />
                      <span className="truncate">{req.condoName || "Condomínio da região"}</span>
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#FB6B01] transition-colors line-clamp-1">
                    {req.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {req.mode === "on_demand" ? "⚡ Sob Demanda" : "📄 Orçamento"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Recusar
                    </button>
                    {req.mode === "orcamento" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteRequest(req)}
                        className="px-3 py-1.5 rounded-lg bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Montar proposta</span>
                        <Icon name="arrow-right" size={11} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        disabled={isPending}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Aceitar</span>
                        <Icon name="check" size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-orange-200 bg-white flex items-center gap-3 text-xs text-slate-600">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#FB6B01]">
              <Icon name="bell" size={15} />
            </span>
            <div className="flex-1">
              <span className="font-bold text-slate-800">Pronto para receber chamados:</span>{" "}
              Mantenha o status <strong>&ldquo;Disponível agora: ON&rdquo;</strong> para receber notificações com som e prioridade nos condomínios da região.
            </div>
          </div>
        )}
      </section>

      {/* 3. 4 Cards de Métricas Claras (Prompt Item 27) */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Oportunidades novas */}
        <Link
          href="/prestador/chamados?tab=novos"
          className="rounded-2xl border border-orange-200 bg-white p-4 shadow-2xs hover:border-[#FB6B01] transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-[#FB6B01] font-bold uppercase tracking-wider">
            <span>Oportunidades novas</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#FB6B01] group-hover:scale-105 transition-transform">
              <Icon name="zap" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{newRequests.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Novos chamados no seu raio</div>
        </Link>

        {/* Orçamentos aguardando */}
        <Link
          href="/prestador/chamados?tab=orcamentos_enviados"
          className="rounded-2xl border border-blue-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-bold uppercase tracking-wider">
            <span>Orçamentos aguardando</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <Icon name="file-text" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{pendingQuotesCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">Propostas enviadas ao cliente</div>
        </Link>

        {/* Serviços hoje */}
        <Link
          href="/prestador/chamados?tab=contratados"
          className="rounded-2xl border border-amber-200 bg-white p-4 shadow-2xs hover:border-amber-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold uppercase tracking-wider">
            <span>Serviços hoje</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Icon name="clipboard" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{todayServicesCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">Atendimentos em andamento</div>
        </Link>

        {/* A receber */}
        <Link
          href="/prestador/ganhos"
          className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xs hover:border-emerald-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold uppercase tracking-wider">
            <span>A receber</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <Icon name="wallet" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            R$ {(retainedEarningsCents / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Zeladoria Pay · Garantido</div>
        </Link>
      </div>

      {/* 4. Tarefa Clara Única se Perfil Incompleto (Prompt Item 48) */}
      {completeness.percentage < 100 && completeness.missingItems.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FB6B01] text-white shrink-0 shadow-2xs">
              <Icon name="user-check" size={18} />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Complete seu perfil para começar a receber chamados
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Perfis completos com foto, serviços e portfólio recebem 4x mais orçamentos.
              </p>
            </div>
          </div>
          <Link
            href="/prestador/perfil"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
          >
            <span>Completar perfil</span>
            <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      )}

      {/* 4. Estrutura em 2 Colunas (2/3 Conteúdo Principal + 1/3 Lateral) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA (2/3): Chamados & Solicitações */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Chamados Recentes */}
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                  Chamados Recentes
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Oportunidades e atendimentos no condomínio de atuação
                </p>
              </div>
              <Link
                href="/prestador/chamados"
                className="text-xs font-bold text-[#1355FF] hover:underline flex items-center gap-1"
              >
                <span>Ver todos ({requests.length})</span>
                <Icon name="chevron-right" size={13} />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Icon name="clipboard" size={18} />
                </div>
                <p className="text-xs font-bold text-slate-700">Nenhum chamado no momento</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Mantenha o status &ldquo;Disponível agora&rdquo; ativado para receber notificações assim que um morador solicitar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((req) => {
                  const isAccepted = [
                    "aceito",
                    "SERVICO_PAGO_LIBERADO",
                    "a_caminho",
                    "chegou",
                    "em_atendimento",
                    "correcao_solicitada",
                    "prestador_concluiu",
                    "conclusao_solicitada",
                    "prestador_finalizou",
                    "servico_finalizado_prestador",
                    "executado_prestador",
                    "PROVIDER_COMPLETED",
                    "orcamento_aprovado",
                    "concluido",
                  ].includes(req.status);

                  return (
                    <div
                      key={req.id}
                      className="rounded-[12px] border border-slate-200/80 p-4 space-y-3 hover:border-slate-300 transition-colors bg-white shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#1355FF] bg-blue-50 px-2 py-0.5 rounded-[6px] font-mono border border-blue-100">
                            {req.code}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            {req.title}
                          </h3>
                          <span className="rounded-[4px] bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                            {req.mode === "on_demand" ? "Sob Demanda" : "Orçamento"}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            req.status === "concluido"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : req.status === "em_atendimento"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : req.status === "aceito"
                              ? "bg-blue-50 text-[#1355FF] border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {req.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-[8px] border border-slate-100 leading-relaxed">
                        {req.description}
                      </p>

                      {/* Informações de Localização e Cliente com Privacidade */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400">Cliente:</span>{" "}
                          <strong className="text-slate-800">
                            {isAccepted ? req.customerName : "Morador do condomínio"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Localização:</span>{" "}
                          <strong className="text-slate-800">
                            {isAccepted ? req.location : "Condomínio (Unidade liberada após aceite)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Contato:</span>{" "}
                          {isAccepted && req.customerPhone ? (
                            <a
                              href={`tel:${req.customerPhone}`}
                              className="font-bold text-[#1355FF] hover:underline"
                            >
                              {req.customerPhone}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">🔒 Oculto até aceite</span>
                          )}
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Data: {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                        </span>

                        <div className="flex items-center gap-2">
                          {(req.status === "solicitado" || req.status === "buscando_prestador") && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReject(req.id)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-[8px] border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Recusar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAccept(req.id)}
                                disabled={isPending}
                                className="px-4 py-1.5 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                              >
                                Aceitar chamado
                              </button>
                            </>
                          )}

                          {req.status === "aceito" && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(req.id, "a_caminho")}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            >
                              Estou a caminho
                            </button>
                          )}

                          {req.status === "a_caminho" && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(req.id, "chegou")}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-[8px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            >
                              Cheguei ao local
                            </button>
                          )}

                          {req.status === "chegou" && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(req.id, "em_atendimento")}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            >
                              Iniciar serviço
                            </button>
                          )}

                          {req.status === "em_atendimento" && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(req.id, "concluido")}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            >
                              Concluir atendimento
                            </button>
                          )}

                          {["prestador_concluiu", "conclusao_solicitada", "prestador_finalizou", "servico_finalizado_prestador", "executado_prestador", "PROVIDER_COMPLETED"].includes(req.status) && (
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-[8px] border border-indigo-200">
                              Aguardando confirmação do morador
                            </span>
                          )}

                          {req.mode === "orcamento" && req.status === "solicitado" && (
                            <button
                              type="button"
                              onClick={() => setSelectedQuoteRequest(req)}
                              className="px-3.5 py-1.5 rounded-[8px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                            >
                              Montar orçamento
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (1/3): Atalhos, Avaliações e Suporte */}
        <div className="space-y-6">
          {/* Card: Atalhos Rápidos */}
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Acesso Rápido
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/prestador/servicos"
                className="p-3 rounded-[10px] border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left block group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-blue-50 text-[#1355FF] group-hover:scale-105 transition-transform">
                  <Icon name="wrench" size={15} />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-800">Serviços</p>
                <p className="text-[10px] text-slate-400">Preços & itens</p>
              </Link>

              <Link
                href="/prestador/agenda"
                className="p-3 rounded-[10px] border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left block group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                  <Icon name="calendar" size={15} />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-800">Agenda</p>
                <p className="text-[10px] text-slate-400">Horários</p>
              </Link>

              <Link
                href="/prestador/portfolio"
                className="p-3 rounded-[10px] border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left block group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                  <Icon name="camera" size={15} />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-800">Portfólio</p>
                <p className="text-[10px] text-slate-400">Fotos de obras</p>
              </Link>

              <Link
                href="/prestador/destaque"
                className="p-3 rounded-[10px] border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left block group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                  <Icon name="sparkles" size={15} />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-800">Destaque</p>
                <p className="text-[10px] text-slate-400">Plano Pro</p>
              </Link>
            </div>
          </div>

          {/* Card: Últimas Avaliações */}
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Avaliações Recentes
              </h3>
              <Link
                href="/prestador/avaliacoes"
                className="text-xs font-bold text-[#1355FF] hover:underline"
              >
                Ver todas
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhuma avaliação recebida ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((rev) => (
                  <div key={rev.id} className="p-3 rounded-[10px] bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{rev.authorName}</span>
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                        <span>{rev.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-[11px] text-slate-600 leading-snug italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Central de Suporte */}
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Apoio ao Prestador
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Precisa de ajuda com cadastro, repasses ou autorização na portaria?
            </p>
            <a
              href="https://wa.me/5511987654321?text=Ol%C3%A1%2C%20sou%20prestador%20parceiro%20e%20preciso%20de%20ajuda."
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <span>Suporte via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modal: Montar Proposta de Orçamento */}
      {selectedQuoteRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Enviar Proposta de Orçamento
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedQuoteRequest.code} · {selectedQuoteRequest.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteRequest(null)}
                className="p-1 rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSendQuoteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={laborVal}
                    onChange={(e) => setLaborVal(e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Materiais (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialsVal}
                    onChange={(e) => setMaterialsVal(e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Prazo Estimado (Dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(parseInt(e.target.value, 10) || 1)}
                  className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descrição dos Serviços / Condições
                </label>
                <textarea
                  rows={3}
                  required
                  value={quoteDesc}
                  onChange={(e) => setQuoteDesc(e.target.value)}
                  className="w-full rounded-[8px] border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#1355FF] focus:ring-2 focus:ring-blue-500/10 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-[8px] bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Valor Total da Proposta:</span>
                <strong className="text-sm font-black text-[#1355FF]">
                  R$ {(parseFloat(laborVal || "0") + parseFloat(materialsVal || "0")).toFixed(2)}
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteRequest(null)}
                  className="px-3.5 py-2 rounded-[8px] border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  {isPending ? "Enviando..." : "Enviar Orçamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
