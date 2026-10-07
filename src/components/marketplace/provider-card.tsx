"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { categoryIcon, categoryImage, type MarketplaceProvider } from "@/lib/services/providers-data";

export function ProviderCard({
  provider,
  isFavorite = false,
  hasHiredBefore = false,
  rankingPosition,
  onToggleFavorite,
  onViewProfile,
  onRequestBudget,
}: {
  provider: MarketplaceProvider;
  isFavorite?: boolean;
  hasHiredBefore?: boolean;
  rankingPosition?: number;
  onToggleFavorite?: (id: number) => void;
  onViewProfile: (provider: MarketplaceProvider) => void;
  onRequestBudget: (provider: MarketplaceProvider) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Imagem principal: Foto real de trabalho > Capa > Imagem da categoria
  const coverImage =
    provider.portfolio?.[0]?.url ||
    provider.coverUrl ||
    categoryImage(provider.category);

  const catIconName = categoryIcon(provider.category);

  return (
    <div
      onClick={() => onViewProfile(provider)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer overflow-hidden"
    >
      <div>
        {/* BANNER FOTOGRÁFICO COMPACTO E MODERNO */}
        <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-100">
          {coverImage && !imageError ? (
            <img
              src={coverImage}
              alt={provider.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            /* Fallback elegante e neutro: Ícone da categoria + nome da categoria */
            <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 border-b border-slate-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#0055D4] shadow-2xs">
                <Icon name={catIconName} size={20} />
              </span>
              <span className="text-xs font-bold text-slate-600 capitalize">
                {provider.category}
              </span>
            </div>
          )}

          {/* Botão de Favoritar (♡) compacto no topo direito */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(provider.id);
              }}
              className={`flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/95 shadow-xs transition-transform active:scale-90 hover:scale-105 cursor-pointer ${
                isFavorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
              }`}
              title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Icon
                name="heart"
                size={14}
                className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
              />
            </button>
          </div>
        </div>

        {/* CORPO DO CARD */}
        <div className="p-3.5 pt-0 space-y-2 relative">
          {/* LOGO DA EMPRESA / AVATAR DO PRESTADOR (Flutuando perfeitamente sobre o banner e corpo, sem nenhum corte!) */}
          <div className="-mt-6 flex items-end justify-between gap-2 relative z-20">
            <div className="relative h-12 w-12 rounded-xl bg-white p-0.5 border-2 border-white shadow-md overflow-hidden shrink-0 bg-slate-100">
              {provider.avatarUrl && !avatarError ? (
                <img
                  src={provider.avatarUrl}
                  alt={provider.name}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-black text-white bg-[#0055D4] rounded-lg text-sm shadow-2xs">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Selo Verificado sobre o avatar */}
              {provider.isVerified && (
                <div
                  title="Documento e antecedentes verificados"
                  className="absolute bottom-0 right-0 bg-[#0055D4] text-white rounded-tl-md rounded-br-lg p-0.5"
                >
                  <Icon name="check" size={8} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Selo de Ranking (#1, #2, #3) */}
            {rankingPosition && rankingPosition <= 3 ? (
              <span className="text-[10px] font-black text-[#0055D4] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg shrink-0 mb-1">
                #{rankingPosition}
              </span>
            ) : null}
          </div>

          {/* Identidade: Nome & Empresa / Especialidade */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate group-hover:text-[#0055D4] transition-colors">
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

          {/* Avaliação e Reviews */}
          <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
            {provider.reviewsCount > 0 ? (
              <div className="flex items-center gap-1">
                <Icon name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                <span className="font-black text-[#0F172A] text-xs">{provider.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-medium text-[10px]">
                  ({provider.reviewsCount})
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-[#0055D4]">
                Novo no Zeladoria
              </span>
            )}

            {provider.responseTimeMinutes && (
              <span className="text-[10px] text-slate-400">
                ~{provider.responseTimeMinutes} min resposta
              </span>
            )}
          </div>

          {/* Prova Social Condominial: Máximo 1 badge contextual */}
          {provider.condoHiredCount && provider.condoHiredCount > 0 ? (
            <p className="text-[10px] font-semibold text-emerald-700 truncate">
              ✓ {provider.condoHiredCount} {provider.condoHiredCount === 1 ? "serviço no condomínio" : "serviços no condomínio"}
            </p>
          ) : hasHiredBefore ? (
            <p className="text-[10px] font-semibold text-[#0055D4] truncate">
              ✓ Já contratado anteriormente
            </p>
          ) : null}

          {/* Preço Inicial & Disponibilidade / Distância */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                A partir de
              </span>
              <span className="text-xs sm:text-sm font-black text-[#0F172A]">
                {provider.startingPriceCents != null
                  ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>
            </div>

            <div className="text-right text-[10px]">
              {provider.availableNow ? (
                <span className="font-bold text-emerald-700 block">
                  Disponível hoje
                </span>
              ) : (
                <span className="text-slate-400 block">
                  Atende a região
                </span>
              )}
              <span className="text-slate-400">
                {provider.distanceKm != null
                  ? `${provider.distanceKm.toFixed(1).replace(".", ",")} km`
                  : "Próximo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO: Ver perfil e Solicitar (Mais compactos e elegantes) */}
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
          className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-1.5 sm:py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
        >
          Solicitar
        </button>
      </div>
    </div>
  );
}
