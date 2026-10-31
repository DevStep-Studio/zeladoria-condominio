"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { categoryIcon, categoryImage, type MarketplaceProvider } from "@/lib/services/providers-data";

export interface ProviderCardProps {
  provider: MarketplaceProvider;
  isFavorite?: boolean;
  hasHiredBefore?: boolean;
  rankingPosition?: number;
  variant?: "standard" | "compact";
  onToggleFavorite?: (id: number) => void;
  onViewProfile: (provider: MarketplaceProvider) => void;
  onRequestBudget: (provider: MarketplaceProvider) => void;
}

export function ProviderCard({
  provider,
  isFavorite = false,
  hasHiredBefore = false,
  rankingPosition,
  variant = "standard",
  onToggleFavorite,
  onViewProfile,
  onRequestBudget,
}: ProviderCardProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Imagem principal: Portfólio real > Capa > Imagem da categoria
  const coverImage =
    provider.portfolio?.[0]?.url ||
    provider.coverUrl ||
    categoryImage(provider.category);

  const catIconName = categoryIcon(provider.category);

  // Sanitização de distância (Seção 30: evitar distâncias absurdas > 60km de dados não calibrados)
  const isReasonableDistance =
    provider.distanceKm != null &&
    !isNaN(provider.distanceKm) &&
    provider.distanceKm > 0 &&
    provider.distanceKm <= 60;

  const distanceLabel = isReasonableDistance
    ? `~${provider.distanceKm!.toFixed(1).replace(".", ",")} km`
    : "Atende a região";

  // VARIANTE COMPACTA (Horizontal para carrossel ou listas compactas)
  if (variant === "compact") {
    return (
      <div
        onClick={() => onViewProfile(provider)}
        className="group relative flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
            {coverImage && !imageError ? (
              <img
                src={coverImage}
                alt={provider.name}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-orange-50 text-[#FB6B01] flex items-center justify-center font-bold text-sm">
                {provider.name.charAt(0)}
              </div>
            )}
            {provider.isVerified && (
              <div
                title="Verificado"
                className="absolute bottom-0 right-0 bg-[#FB6B01] text-white rounded-tl-md p-0.5"
              >
                <Icon name="check" size={8} strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#FB6B01] transition-colors">
              {provider.name}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {provider.category.charAt(0).toUpperCase() + provider.category.slice(1)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
              {provider.reviewsCount > 0 ? (
                <span className="flex items-center gap-0.5 font-bold text-amber-600">
                  <Icon name="star" size={10} className="fill-amber-500 text-amber-500" />
                  {provider.rating.toFixed(1)}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Novo</span>
              )}
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold">
                {provider.startingPriceCents
                  ? `A partir de R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestBudget(provider);
          }}
          className="shrink-0 rounded-lg bg-[#FB6B01] hover:bg-[#E05F00] text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs"
        >
          Orçamento
        </button>
      </div>
    );
  }

  // VARIANTE STANDARD (Card Minimalista, Elegante e Funcional)
  return (
    <div
      onClick={() => onViewProfile(provider)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs cursor-pointer overflow-hidden"
    >
      <div>
        {/* FOTO DO SERVIÇO / PORTFÓLIO */}
        <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-slate-100">
          {coverImage && !imageError ? (
            <img
              src={coverImage}
              alt={provider.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#FB6B01] shadow-2xs">
                <Icon name={catIconName} size={18} />
              </span>
              <span className="text-xs font-bold text-slate-600 capitalize">
                {provider.category}
              </span>
            </div>
          )}

          {/* Badges de Destaque no topo esquerdo (Máximo 1 badge por card) */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
            {provider.isSponsored ? (
              <span className="text-[10px] font-bold tracking-wider uppercase text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Icon name="sparkles" size={10} className="text-amber-400" />
                <span>Destaque</span>
              </span>
            ) : provider.isNew ? (
              <span className="text-[10px] font-bold tracking-wider uppercase text-white bg-[#FB6B01] px-2.5 py-0.5 rounded-full shadow-2xs">
                Novo
              </span>
            ) : provider.rating >= 4.9 && provider.reviewsCount >= 3 ? (
              <span className="text-[10px] font-bold tracking-wider uppercase text-white bg-emerald-600 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Icon name="star" size={9} className="fill-white" />
                <span>Top Avaliado</span>
              </span>
            ) : null}
          </div>

          {/* Botão de Favoritar (♡) no canto superior direito */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(provider.id);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs shadow-2xs transition-all active:scale-90 hover:scale-105 cursor-pointer ${
                isFavorite ? "text-[#FB6B01] bg-white" : "text-slate-400 hover:text-[#FB6B01] hover:bg-white"
              }`}
              title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
              aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Icon
                name="heart"
                size={14}
                className={isFavorite ? "fill-[#FB6B01] text-[#FB6B01]" : ""}
              />
            </button>
          </div>
        </div>

        {/* CORPO DO CARD (Limpo, sem sobreposição pesada) */}
        <div className="p-3.5 space-y-2.5">
          {/* Identificação: Avatar + Nome + Categoria */}
          <div className="flex items-start gap-2.5">
            {/* Avatar integrado com inicial / foto e badge de verificado */}
            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs">
              {provider.avatarUrl && !avatarError ? (
                <img
                  src={provider.avatarUrl}
                  alt={provider.name}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-black text-white bg-[#FB6B01] text-xs">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Selo Verificado discreto */}
              {provider.isVerified && (
                <div
                  title="Documento e antecedentes verificados"
                  className="absolute bottom-0 right-0 bg-[#FB6B01] text-white rounded-tl-md p-0.5"
                >
                  <Icon name="check" size={7} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Nome e Especialidade */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate group-hover:text-[#FB6B01] transition-colors leading-tight">
                  {provider.name}
                </h3>
                {rankingPosition && rankingPosition <= 3 && provider.reviewsCount > 0 && (
                  <span className="text-[10px] font-bold text-[#FB6B01] bg-orange-50 border border-orange-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                    #{rankingPosition}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                <span className="capitalize text-slate-600 font-semibold">{provider.category}</span>
                {provider.company && provider.company !== provider.name ? (
                  <span className="text-slate-400 font-normal"> · {provider.company}</span>
                ) : provider.contactName && provider.contactName !== provider.name ? (
                  <span className="text-slate-400 font-normal"> · {provider.contactName}</span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Avaliação e Tempo de Resposta */}
          <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
            {provider.reviewsCount > 0 ? (
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px] font-black px-1.5 py-0.5 rounded-md">
                  <Icon name="star" size={10} className="fill-amber-400 text-amber-500" />
                  {provider.rating.toFixed(1)}
                </span>
                <span className="text-slate-400 font-normal text-[11px]">
                  ({provider.reviewsCount} {provider.reviewsCount === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                Novo profissional
              </span>
            )}

            {provider.responseTimeMinutes && (
              <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                <Icon name="clock" size={11} className="text-slate-400" />
                ~{provider.responseTimeMinutes} min resposta
              </span>
            )}
          </div>

          {/* Prova Social Condominial */}
          {(provider.condoHiredCount && provider.condoHiredCount > 0) || hasHiredBefore ? (
            <div className="pt-0.5">
              {provider.condoHiredCount && provider.condoHiredCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80 truncate max-w-full">
                  <Icon name="check" size={10} strokeWidth={3} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{provider.condoHiredCount} {provider.condoHiredCount === 1 ? "serviço no condomínio" : "serviços no condomínio"}</span>
                </span>
              ) : hasHiredBefore ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100/80 truncate max-w-full">
                  <Icon name="user-check" size={11} className="text-[#FB6B01] shrink-0" />
                  <span>Já contratado por você</span>
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Preço Inicial & Disponibilidade / Distância */}
          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                A partir de
              </span>
              <span className="text-xs sm:text-sm font-black text-[#0F172A]">
                {provider.startingPriceCents != null && provider.startingPriceCents > 0
                  ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>
            </div>

            <div className="text-right">
              {provider.availableNow && provider.isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Disponível hoje
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {distanceLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO: Ver perfil (Neutro) e Solicitar orçamento (Laranja Tião) */}
      <div className="grid grid-cols-2 gap-2 p-3.5 pt-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(provider);
          }}
          className="rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 py-2 text-xs font-bold transition-all cursor-pointer text-center shadow-2xs"
        >
          Ver perfil
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestBudget(provider);
          }}
          className="rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1"
        >
          <span>Orçamento</span>
          <Icon name="arrow-right" size={11} />
        </button>
      </div>
    </div>
  );
}
