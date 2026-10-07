"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { categoryImage, type MarketplaceProvider, type ServiceOffering, type PortfolioItem } from "@/lib/services/providers-data";

export function ProviderProfileModal({
  provider,
  hasHiredBefore = false,
  isFavorite = false,
  onToggleFavorite,
  onClose,
  onRequestBudget,
}: {
  provider: MarketplaceProvider | null;
  hasHiredBefore?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onClose: () => void;
  onRequestBudget: (provider: MarketplaceProvider, specificService?: ServiceOffering) => void;
}) {
  const [activeTab, setActiveTab] = useState<"servicos" | "portfolio" | "avaliacoes" | "sobre">("servicos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!provider) return null;

  const currentPortfolioItem = lightboxIndex !== null ? provider.portfolio[lightboxIndex] : null;

  const coverImage =
    provider.coverUrl ||
    provider.portfolio?.[0]?.url ||
    categoryImage(provider.category) ||
    "/condominio-login.jpg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal / Storefront Sheet Container (Grande e Visual: max-w-4xl) */}
      <div className="relative w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* TOP BAR / CAPA VISUAL COM HEADER DE MARKETPLACE */}
        <div className="relative w-full">
          {/* Imagem de Capa (Trabalho Realizado / Empresa) */}
          <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
            <img
              src={coverImage}
              alt={provider.name}
              className="h-full w-full object-cover object-center brightness-[0.92]"
            />
            {/* Gradiente sutil escurecido no topo para legibilidade dos botões de controle */}
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />

            {/* Ações de Topo: Fechar & Favoritar */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => onToggleFavorite?.(provider.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Salvar nos favoritos"
              >
                <Icon
                  name="heart"
                  size={16}
                  className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
                />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-md hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                title="Fechar"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          </div>

          {/* PERFIL DO PRESTADOR COM AVATAR SOBREPOSTO */}
          <div className="px-5 sm:px-8 pb-4 bg-white border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
              {/* Avatar e Identificação */}
              <div className="flex items-end gap-4">
                <div className="relative h-22 w-22 sm:h-26 sm:w-26 rounded-2xl bg-white p-1 border-3 border-white shadow-xl overflow-hidden shrink-0 bg-slate-100">
                  {provider.avatarUrl ? (
                    <img
                      src={provider.avatarUrl}
                      alt={provider.name}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-black text-white bg-[#0055D4] rounded-xl text-2xl">
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {provider.isVerified && (
                    <div
                      title="Profissional com verificação oficial"
                      className="absolute bottom-1 right-1 bg-[#0055D4] text-white rounded-lg p-1 shadow-md"
                    >
                      <Icon name="check" size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight truncate">
                      {provider.name}
                    </h1>
                    {provider.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[#0055D4] text-xs font-bold">
                        <Icon name="check-circle" size={13} />
                        <span>Verificado</span>
                      </span>
                    )}
                    {provider.availableNow && (
                      <span className="text-emerald-700 text-xs font-bold">
                        · Disponível hoje
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
                    {provider.company} · Especialista em {provider.category}
                  </p>
                </div>
              </div>

              {/* Botão Principal de Solicitação no Header (Desktop) */}
              <div className="hidden sm:flex items-center gap-3 shrink-0 pb-1">
                {provider.slug && (
                  <Link
                    href={`/servicos/${provider.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Icon name="external-link" size={13} />
                    <span>Página pública</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => onRequestBudget(provider)}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                >
                  <Icon name="zap" size={14} className="text-[#FFD000] fill-[#FFD000]" />
                  <span>Solicitar Serviço</span>
                </button>
              </div>
            </div>

            {/* BARRA DE NÚMEROS & LABELS (Sem poluição de badges - Prompt Item 22) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-4 border-t border-slate-100 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Avaliação
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Icon name="star" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                  <span className="text-sm font-black text-[#0F172A]">
                    {provider.reviewsCount > 0 ? provider.rating.toFixed(1) : "Novo"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({provider.reviewsCount})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Atendimentos
                </span>
                <span className="text-sm font-black text-[#0F172A] mt-0.5 block">
                  {provider.hiredCount > 0 ? `${provider.hiredCount} concluídos` : "Primeiros serviços"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  No Condomínio
                </span>
                <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                  {provider.condoHiredCount && provider.condoHiredCount > 0
                    ? `${provider.condoHiredCount} realizados`
                    : "Atende a região"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Resposta
                </span>
                <span className="text-sm font-black text-[#0F172A] mt-0.5 block">
                  ~{provider.responseTimeMinutes || 15} min
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Preço Base
                </span>
                <span className="text-sm font-black text-[#0055D4] mt-0.5 block">
                  {provider.startingPriceCents != null
                    ? `A partir de R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                    : "Sob consulta"}
                </span>
              </div>
            </div>

            {/* PREVIEW RÁPIDO DO PORTFÓLIO (Prompt Item 31: Galeria de Fotos no topo) */}
            {provider.portfolio && provider.portfolio.length > 0 && (
              <div className="pt-4 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Fotos de Trabalhos Realizados:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("portfolio")}
                    className="text-xs font-bold text-[#0055D4] hover:underline"
                  >
                    Ver galeria completa ({provider.portfolio.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {provider.portfolio.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="relative h-18 sm:h-22 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100 shadow-2xs"
                      title={item.caption}
                    >
                      <img
                        src={item.url}
                        alt={item.caption}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                        Ampliar
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TABS DE NAVEGAÇÃO DA LOJA (Serviços, Portfólio, Avaliações, Sobre) */}
          <div className="flex items-center gap-1 px-5 sm:px-8 border-b border-slate-200 bg-slate-50/70 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("servicos")}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "servicos"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon name="briefcase" size={13} />
              <span>Catálogo de Serviços</span>
              {provider.servicesOffered.length > 0 && (
                <span className="rounded-full bg-blue-100 text-[#0055D4] px-1.5 py-0.2 text-[10px]">
                  {provider.servicesOffered.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "portfolio"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon name="camera" size={13} />
              <span>Trabalhos & Portfólio</span>
              {provider.portfolio.length > 0 && (
                <span className="rounded-full bg-slate-200 text-slate-700 px-1.5 py-0.2 text-[10px]">
                  {provider.portfolio.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("avaliacoes")}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "avaliacoes"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon name="star" size={13} />
              <span>Avaliações Verificadas</span>
              {provider.reviewsCount > 0 && (
                <span className="rounded-full bg-slate-200 text-slate-700 px-1.5 py-0.2 text-[10px]">
                  {provider.reviewsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sobre")}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "sobre"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon name="shield" size={13} />
              <span>Sobre & Área Atendida</span>
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL COM SCROLL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* TAB 1: CATÁLOGO DE SERVIÇOS E PREÇOS (Prompt Item 23) */}
          {activeTab === "servicos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">
                    Tabela de Serviços e Valores Estimados
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione um serviço específico para solicitar ou requisite um orçamento geral.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRequestBudget(provider)}
                  className="text-xs font-bold text-[#0055D4] hover:underline"
                >
                  Solicitar orçamento personalizado →
                </button>
              </div>

              {provider.servicesOffered.length === 0 ? (
                /* Empty state elegante (Prompt Item 34) */
                <div className="rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-[#0055D4] flex items-center justify-center mx-auto">
                    <Icon name="briefcase" size={18} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    Serviços sob consulta
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Este profissional atende sob medida para sua necessidade. Você pode descrever o problema e solicitar um orçamento diretamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRequestBudget(provider)}
                    className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Solicitar Orçamento
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {provider.servicesOffered.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug">
                            {svc.name}
                          </h4>
                          <span className="text-sm font-black text-[#0055D4] shrink-0">
                            {svc.priceFromCents != null
                              ? `R$ ${(svc.priceFromCents / 100).toFixed(0)}`
                              : "Sob consulta"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {svc.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {svc.priceFromCents != null ? "Preço estimado a partir de" : "Valores sob consulta"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRequestBudget(provider, svc)}
                          className="rounded-lg bg-blue-50 hover:bg-[#0055D4] text-[#0055D4] hover:text-white px-3 py-1 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Solicitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRABALHOS REALIZADOS / PORTFÓLIO (Prompt Item 24) */}
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">
                    Galeria de Trabalhos Realizados
                  </h3>
                  <p className="text-xs text-slate-500">
                    Projetos, instalações e manutenções concluídas pelo profissional.
                  </p>
                </div>
              </div>

              {provider.portfolio.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    O prestador ainda está organizando as fotos deste portfólio.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRequestBudget(provider)}
                    className="text-xs font-bold text-[#0055D4] hover:underline"
                  >
                    Solicitar atendimento agora →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                  {provider.portfolio.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="group rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs cursor-pointer hover:border-blue-300 transition-all"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.url}
                          alt={item.caption}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-[#0F172A] line-clamp-2 leading-snug">
                          {item.caption}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVALIAÇÕES VERIFICADAS (Prompt Item 25) */}
          {activeTab === "avaliacoes" && (
            <div className="space-y-5">
              {/* Resumo da Reputação e Distribuição */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="text-center sm:text-left sm:border-r border-slate-200 sm:pr-4">
                  <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                    {provider.reviewsCount > 0 ? provider.rating.toFixed(1) : "—"}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name="star"
                        size={15}
                        className={
                          star <= Math.round(provider.rating)
                            ? "text-[#FFD000] fill-[#FFD000]"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {provider.reviewsCount} {provider.reviewsCount === 1 ? "avaliação verificada" : "avaliações verificadas"}
                  </p>
                </div>

                {/* Distribuição 5★ a 1★ */}
                <div className="sm:col-span-2 space-y-1.5 text-xs">
                  {([5, 4, 3, 2, 1] as const).map((stars) => {
                    const count = provider.ratingDistribution[stars] || 0;
                    const pct = provider.reviewsCount > 0 ? (count / provider.reviewsCount) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-6 text-slate-600 font-semibold">{stars} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#FFD000] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-slate-400 font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Comentários */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Comentários de Moradores
                </h4>

                {provider.reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-50 border border-slate-100">
                    Ainda não há avaliações registradas para este profissional.
                  </p>
                ) : (
                  provider.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F172A]">{rev.authorName}</span>
                          <span className="text-[10px] text-slate-400">· {rev.unit}</span>
                          <span className="rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 border border-emerald-200">
                            Serviço Verificado
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Icon
                            key={s}
                            name="star"
                            size={12}
                            className={s <= rev.rating ? "text-[#FFD000] fill-[#FFD000]" : "text-slate-200"}
                          />
                        ))}
                        {rev.serviceDone && (
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            Serviço: <strong>{rev.serviceDone}</strong>
                          </span>
                        )}
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          &quot;{rev.comment}&quot;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SOBRE & ÁREA ATENDIDA (Prompt Items 26, 27, 28) */}
          {activeTab === "sobre" && (
            <div className="space-y-4 text-xs">
              {/* Descrição e Bio */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Apresentação Profissional
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {provider.bio || "Profissional qualificado com ampla experiência em serviços condominiais e residenciais."}
                </p>
              </div>

              {/* Informações Operacionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Área e Raio de Atendimento
                  </h4>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Icon name="map-pin" size={16} className="text-[#0055D4]" />
                    <span>{provider.regionCoverage || "Curitiba e Região Metropolitana"}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Atende até {provider.serviceRadiusKm || 15} km a partir do raio configurado.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Horários de Funcionamento
                  </h4>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Icon name="clock" size={16} className="text-[#0055D4]" />
                    <span>{provider.workingHours || "Seg a Sex 08:00 - 18:00"}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Atendimentos emergenciais conforme disponibilidade prévia.
                  </p>
                </div>
              </div>

              {/* Nossa Equipe (Aparece apenas quando for empresa e possuir equipe) */}
              {provider.isCompany && provider.teamMembers && provider.teamMembers.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Nossa Equipe de Profissionais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {provider.teamMembers.map((member, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 text-[#0055D4] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-xs truncate">{member.name}</h5>
                          <p className="text-[11px] text-slate-400 truncate">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE STICKY CTA BAR (Prompt Item 29: Barra fixa inferior no mobile) */}
        <div className="sm:hidden sticky bottom-0 z-30 bg-white border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Preço a partir de
            </span>
            <span className="text-sm font-black text-[#0055D4]">
              {provider.startingPriceCents != null
                ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                : "Sob consulta"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRequestBudget(provider)}
            className="flex-1 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2.5 text-xs font-bold shadow-md transition-colors cursor-pointer text-center"
          >
            Solicitar Serviço
          </button>
        </div>
      </div>

      {/* LIGHTBOX MODAL PARA FOTOS DO PORTFÓLIO */}
      {currentPortfolioItem && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Fechar</span>
              <Icon name="x" size={18} />
            </button>

            {/* Navigation buttons */}
            {provider.portfolio.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : provider.portfolio.length - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                  title="Foto anterior"
                >
                  <Icon name="chevron-left" size={20} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null && prev < provider.portfolio.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                  title="Próxima foto"
                >
                  <Icon name="chevron-right" size={20} />
                </button>
              </>
            )}

            <img
              src={currentPortfolioItem.url}
              alt={currentPortfolioItem.caption}
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <div className="flex items-center justify-between w-full max-w-xl mt-3 text-white text-xs font-medium px-2">
              <p className="truncate">{currentPortfolioItem.caption}</p>
              <span className="shrink-0 text-slate-400">
                {(lightboxIndex ?? 0) + 1} de {provider.portfolio.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
