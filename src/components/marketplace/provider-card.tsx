"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/icon";
import type { MarketplaceProvider } from "@/lib/services/providers-data";

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

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div>
        {/* Top bar: Ranking / Sponsor badge & Favorite Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Ranking Position Badge */}
            {rankingPosition && rankingPosition <= 3 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  rankingPosition === 1
                    ? "bg-[#FFD000] text-[#12162A]"
                    : rankingPosition === 2
                    ? "bg-slate-200 text-slate-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                <Icon name="award" size={12} />
                <span>#{rankingPosition} da região</span>
              </span>
            )}

            {/* Sponsored Badge (Clear Distinction) */}
            {provider.isSponsored && (
              <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                Patrocinado
              </span>
            )}

            {/* Previous hiring notification badge */}
            {hasHiredBefore && (
              <span className="rounded bg-blue-50 text-[#0055D4] border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold">
                Já contratado
              </span>
            )}
          </div>

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(provider.id);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isFavorite
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                : "text-slate-400 hover:bg-slate-100 hover:text-rose-500"
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

        {/* Main Provider Info Header */}
        <div className="flex items-start gap-3.5">
          {/* Avatar / Photo */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-blue-50 border border-slate-100 shadow-xs">
            {provider.avatarUrl && !imageError ? (
              <img
                src={provider.avatarUrl}
                alt={provider.name}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-black text-[#0055D4] text-lg">
                {provider.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                {provider.name}
              </h3>
              {provider.isVerified && (
                <span title="Profissional com documentação e antecedentes verificados pelo condomínio">
                  <Icon name="check-circle" size={14} className="text-[#0055D4] shrink-0" />
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate font-medium">
              {provider.category} · {provider.company}
            </p>

            {/* Rating & Reviews */}
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {provider.reviewsCount > 0 ? (
                <>
                  <div className="flex items-center gap-1 font-black text-[#0F172A]">
                    <Icon name="star" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                    <span>{provider.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-400 font-medium">
                    ({provider.reviewsCount} avaliações)
                  </span>
                </>
              ) : (
                <span className="text-slate-400 font-medium">Ainda sem avaliações no condomínio</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio snippet */}
        {provider.bio && (
          <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {provider.bio}
          </p>
        )}

        {/* Mini Portfolio Preview (1 or 2 small photos) */}
        {provider.portfolio && provider.portfolio.length > 0 && (
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Trabalhos recentes:
            </span>
            <div className="flex items-center gap-2">
              {provider.portfolio.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  className="relative h-14 flex-1 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 cursor-pointer group/photo"
                  onClick={() => onViewProfile(provider)}
                  title={item.caption}
                >
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover/photo:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    Ver
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Indicators (Price, Completion) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
          {/* Starting Price */}
          <div className="font-bold text-[#0F172A] truncate">
            <span className="text-[10px] text-slate-400 font-normal">A partir de </span>
            <span className="text-[#0055D4]">
              {provider.startingPriceCents != null ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}` : "Sob consulta"}
            </span>
          </div>

          {/* Hired count */}
          <div className="text-right text-slate-500 truncate">
            {provider.hiredCount > 0 ? `${provider.hiredCount} contratação(ões) no condomínio` : "Ainda não contratado"}
          </div>

          {/* Completion rate */}
          {provider.completionRate !== null && (
            <div className="flex items-center gap-1 text-slate-500 truncate col-span-2">
              <Icon name="check-circle" size={11} className="text-slate-400 shrink-0" />
              <span>{provider.completionRate}% de conclusão de chamados</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onViewProfile(provider)}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer text-center"
        >
          Ver perfil
        </button>

        <button
          type="button"
          onClick={() => onRequestBudget(provider)}
          className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
        >
          Solicitar orçamento
        </button>
      </div>
    </div>
  );
}
