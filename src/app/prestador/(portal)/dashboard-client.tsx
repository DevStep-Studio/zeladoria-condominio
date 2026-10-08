"use client";

import { useState, useTransition } from "react";
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

  // Completude do Perfil centralizada
  const completeness = calculateProfileCompleteness(vendor);

  // Filtros de métricas essenciais
  const newRequests = requests.filter(
    (r) => r.status === "solicitado" || r.status === "buscando_prestador"
  );
  const inProgressRequests = requests.filter((r) =>
    ["aceito", "orcamento_aprovado", "a_caminho", "chegou", "em_atendimento"].includes(r.status)
  );

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

            {/* Toggle Estou Disponível Agora ON / OFF */}
            <button
              type="button"
              onClick={handleToggleAvailable}
              disabled={isPending}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors cursor-pointer select-none ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title="Clique para alternar disponibilidade imediata no condomínio"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>Disponível agora:</span>
              <strong className="font-extrabold uppercase">{isAvailable ? "ON" : "OFF"}</strong>
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
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Icon name="clipboard" size={14} />
            <span>Ver chamados</span>
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

      {/* 2. 4 Cards de Métricas Essenciais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Novos Chamados */}
        <Link
          href="/prestador/chamados"
          className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#0055D4] transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Novos Chamados</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-blue-50 text-[#0055D4] group-hover:scale-105 transition-transform">
              <Icon name="bell" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-2">{newRequests.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Aguardando seu aceite</div>
        </Link>

        {/* Em Andamento */}
        <Link
          href="/prestador/chamados"
          className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-amber-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Em Andamento</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Icon name="wrench" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-2">{inProgressRequests.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Atendimentos ativos</div>
        </Link>

        {/* Avaliação */}
        <Link
          href="/prestador/avaliacoes"
          className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-yellow-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Avaliação Média</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-yellow-50 text-[#D97706] group-hover:scale-105 transition-transform">
              <Icon name="star" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-2 flex items-center gap-1.5">
            <span>{displayRating}</span>
            <span className="text-sm text-yellow-500">★</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{reviews.length} avaliações</div>
        </Link>

        {/* Completude do Perfil */}
        <Link
          href="/prestador/perfil"
          className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-emerald-400 transition-all block group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Perfil</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <Icon name="user-check" size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {completeness.percentage}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {completeness.percentage === 100 ? "Perfil 100% completo" : "Completar cadastro"}
          </div>
        </Link>
      </div>

      {/* 3. Banner Informativo se Perfil Incompleto */}
      {completeness.percentage < 100 && completeness.missingItems.length > 0 && (
        <div className="rounded-[14px] border border-blue-200/80 bg-blue-50/60 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0055D4] text-white shrink-0">
              <Icon name="sparkles" size={16} />
            </span>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                Complete seu perfil para aumentar sua taxa de contratações
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Perfis com fotos de trabalhos reais, serviços detalhados e documentação transmitem maior credibilidade aos moradores.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {completeness.missingItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.actionUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-blue-200 text-xs font-bold text-[#0055D4] hover:bg-blue-100/60 transition-colors shadow-2xs"
                  >
                    <span>+</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
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
                className="text-xs font-bold text-[#0055D4] hover:underline flex items-center gap-1"
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
                    "a_caminho",
                    "chegou",
                    "em_atendimento",
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
                          <span className="text-xs font-black text-[#0055D4] bg-blue-50 px-2 py-0.5 rounded-[6px] font-mono border border-blue-100">
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
                              ? "bg-blue-50 text-[#0055D4] border border-blue-200"
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
                              className="font-bold text-[#0055D4] hover:underline"
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
                                className="px-4 py-1.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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
                              className="px-3.5 py-1.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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
                              className="px-3.5 py-1.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-blue-50 text-[#0055D4] group-hover:scale-105 transition-transform">
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
                className="text-xs font-bold text-[#0055D4] hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
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
              <div className="grid grid-cols-2 gap-3">
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
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10"
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
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10"
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
                  className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10"
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
                  className="w-full rounded-[8px] border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-blue-500/10 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-[8px] bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Valor Total da Proposta:</span>
                <strong className="text-sm font-black text-[#0055D4]">
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
                  className="px-4 py-2 rounded-[8px] bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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
