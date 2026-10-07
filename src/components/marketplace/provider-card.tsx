"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { categoryImage, type MarketplaceProvider } from "@/lib/services/providers-data";

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

  // Imagem principal de impacto visual (trabalho realizado > capa > categoria)
  const coverImage =
    provider.portfolio?.[0]?.url ||
    provider.coverUrl ||
    categoryImage(provider.category) ||
    "/condominio-login.jpg";

  return (
    <div
      onClick={() => onViewProfile(provider)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg cursor-pointer overflow-hidden"
    >
      <div>
        {/* BANNER FOTOGRÁFICO DO TRABALHO / CAPA (Proporção 16:10) */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          {!imageError ? (
            <img
              src={coverImage}
              alt={provider.name}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
              {provider.company || provider.name}
            </div>
          )}

          {/* Botão de Favoritar (♡) limpo no topo direito da foto */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(provider.id);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs shadow-xs transition-transform active:scale-90 hover:scale-105 cursor-pointer ${
                isFavorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
              }`}
              title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Icon
                name="heart"
                size={15}
                className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
              />
            </button>
          </div>

          {/* FOTO / AVATAR DO PRESTADOR (Sobrepondo a borda inferior da foto) */}
          <div className="absolute -bottom-5 left-4 z-10">
            <div className="relative h-13 w-13 rounded-2xl bg-white p-0.5 border-2 border-white shadow-md overflow-hidden bg-slate-100">
              {provider.avatarUrl && !avatarError ? (
                <img
                  src={provider.avatarUrl}
                  alt={provider.name}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover rounded-xl"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-black text-white bg-[#0055D4] rounded-xl text-base">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Selo Verificado sobre o avatar */}
              {provider.isVerified && (
                <div
                  title="Verificado pelo condomínio"
                  className="absolute bottom-0 right-0 bg-[#0055D4] text-white rounded-tl-lg rounded-br-xl p-0.5"
                >
                  <Icon name="check" size={10} strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CORPO DO CARD (Foco em decisão visual: Nome, Especialidade, Nota, Preço) */}
        <div className="p-4 pt-7 space-y-2.5">
          {/* Nome e Especialidade */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate group-hover:text-[#0055D4] transition-colors">
                {provider.name}
              </h3>
              {provider.isSponsored && (
                <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold uppercase shrink-0">
                  Patrocinado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              {provider.category.charAt(0).toUpperCase() + provider.category.slice(1)} · {provider.company}
            </p>
          </div>

          {/* Avaliação e Prova Social Comunitária */}
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
            {provider.reviewsCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 font-black text-[#0F172A]">
                  <Icon name="star" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                  <span>{provider.rating.toFixed(1)}</span>
                </div>
                <span className="text-slate-400 font-medium text-[11px]">
                  ({provider.reviewsCount} {provider.reviewsCount === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-[#0055D4]">
                Novo no Zeladoria
              </span>
            )}

            {/* Tempo médio de resposta */}
            <span className="text-[11px] text-slate-400 font-medium">
              ~{provider.responseTimeMinutes || 15} min resposta
            </span>
          </div>

          {/* Destaque Comunitário: Serviços realizados neste condomínio */}
          {provider.condoHiredCount && provider.condoHiredCount > 0 ? (
            <p className="text-[11px] font-medium text-emerald-700">
              ✓ {provider.condoHiredCount} {provider.condoHiredCount === 1 ? "serviço realizado" : "serviços realizados"} no condomínio
            </p>
          ) : hasHiredBefore ? (
            <p className="text-[11px] font-medium text-[#0055D4]">
              ✓ Você já contratou anteriormente
            </p>
          ) : null}

          {/* Preço Inicial & Disponibilidade / Distância */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                A partir de
              </span>
              <span className="text-sm font-black text-[#0F172A]">
                {provider.startingPriceCents != null
                  ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              {provider.availableNow && (
                <span className="font-bold text-emerald-700 block">
                  Disponível hoje
                </span>
              )}
              <span>
                {provider.distanceKm != null
                  ? `${provider.distanceKm.toFixed(1).replace(".", ",")} km`
                  : "Atende seu condomínio"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO (Ver perfil e Solicitar) */}
      <div className="grid grid-cols-2 gap-2 p-4 pt-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(provider);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer text-center"
        >
          Ver perfil
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestBudget(provider);
          }}
          className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
        >
          Solicitar
        </button>
      </div>
    </div>
  );
}
