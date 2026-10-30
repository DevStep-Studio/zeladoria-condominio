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

  // VARIANTE STANDARD (Card Vertical Otimizado - Seções 20 a 33)
  return (
    <div
      onClick={() => onViewProfile(provider)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs cursor-pointer overflow-hidden"
    >
      <div>
        {/* FOTO DO SERVIÇO (Proporção 16:9 / 3:2 consistente e altura reduzida) */}
        <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-slate-100">
          {coverImage && !imageError ? (
            <img
              src={coverImage}
              alt={provider.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            {provider.isSponsored ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-100/95 border border-amber-200/90 px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs">
                Patrocinado
              </span>
            ) : provider.isNew ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-950 bg-orange-100/95 border border-orange-200/90 px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs">
                Novo no Tião
              </span>
            ) : provider.rating >= 4.9 && provider.reviewsCount >= 3 ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-100/95 border border-emerald-200/90 px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs">
                Melhor avaliado
              </span>
            ) : null}
          </div>

          {/* Botão de Favoritar (♡) no canto superior direito */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(provider.id);
              }}
              className={`flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/95 shadow-xs transition-transform active:scale-90 hover:scale-105 cursor-pointer ${
                isFavorite ? "text-[#FB6B01]" : "text-slate-400 hover:text-[#FB6B01]"
              }`}
              title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Icon
                name="heart"
                size={14}
                className={isFavorite ? "fill-[#FB6B01] text-[#FB6B01]" : ""}
              />
            </button>
          </div>
        </div>

        {/* CORPO DO CARD */}
        <div className="p-3.5 pt-0 space-y-2 relative">
          {/* AVATAR DO PRESTADOR (Sobrepondo sutilmente a divisória da imagem) */}
          <div className="-mt-5 flex items-end justify-between gap-2 relative z-20">
            <div className="relative h-11 w-11 rounded-xl bg-white p-0.5 border-2 border-white shadow-xs overflow-hidden shrink-0 bg-slate-100">
              {provider.avatarUrl && !avatarError ? (
                <img
                  src={provider.avatarUrl}
                  alt={provider.name}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-white bg-[#FB6B01] rounded-lg text-sm shadow-2xs">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Selo Verificado discreto */}
              {provider.isVerified && (
                <div
                  title="Documento e antecedentes verificados"
                  className="absolute bottom-0 right-0 bg-[#FB6B01] text-white rounded-tl-md p-0.5"
                >
                  <Icon name="check" size={8} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Selo de Ranking (#1, #2, #3) - Exibido apenas com avaliações reais */}
            {rankingPosition && rankingPosition <= 3 && provider.reviewsCount > 0 ? (
              <span className="text-[10px] font-bold text-[#FB6B01] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md shrink-0 mb-0.5">
                #{rankingPosition}
              </span>
            ) : null}
          </div>

          {/* Nome e Categoria */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#FB6B01] transition-colors leading-snug">
              {provider.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {provider.category.charAt(0).toUpperCase() + provider.category.slice(1)}
              {provider.contactName && provider.contactName !== provider.name
                ? ` · ${provider.contactName}`
                : provider.company && provider.company !== provider.name
                ? ` · ${provider.company}`
                : ""}
            </p>
          </div>

          {/* Avaliação e Tempo de Resposta */}
          <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
            {provider.reviewsCount > 0 ? (
              <div className="flex items-center gap-1 font-bold text-[#0F172A]">
                <Icon name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                <span>{provider.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal text-[10px]">
                  ({provider.reviewsCount})
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">
                Ainda sem avaliações
              </span>
            )}

            {provider.responseTimeMinutes && (
              <span className="text-[10px] text-slate-400 font-normal">
                ~{provider.responseTimeMinutes} min resposta
              </span>
            )}
          </div>

          {/* Prova Social Condominial (Seção 22: sutil e prioritária) */}
          {provider.condoHiredCount && provider.condoHiredCount > 0 ? (
            <p className="text-[10px] font-semibold text-emerald-700 truncate">
              ✓ {provider.condoHiredCount} {provider.condoHiredCount === 1 ? "serviço no condomínio" : "serviços no condomínio"}
            </p>
          ) : hasHiredBefore ? (
            <p className="text-[10px] font-semibold text-[#FB6B01] truncate">
              ✓ Já contratado por você
            </p>
          ) : null}

          {/* Preço Inicial & Disponibilidade / Distância */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                A partir de
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                {provider.startingPriceCents != null && provider.startingPriceCents > 0
                  ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>
            </div>

            <div className="text-right text-[10px]">
              {provider.availableNow && provider.isOnline ? (
                <span className="font-semibold text-emerald-700 block">
                  Disponível hoje
                </span>
              ) : (
                <span className="text-slate-400 block">
                  Sob agendamento
                </span>
              )}
              <span className="text-slate-400">
                {distanceLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO: Ver perfil (Neutro) e Solicitar orçamento (Laranja Tião) */}
      <div className="grid grid-cols-2 gap-2 p-3 pt-1 border-t border-slate-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(provider);
          }}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-1.5 sm:py-2 text-xs font-bold transition-colors cursor-pointer text-center"
        >
          Ver perfil
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestBudget(provider);
          }}
          className="rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white py-1.5 sm:py-2 text-xs font-bold shadow-2xs transition-colors cursor-pointer text-center"
        >
          Orçamento
        </button>
      </div>
    </div>
  );
}
