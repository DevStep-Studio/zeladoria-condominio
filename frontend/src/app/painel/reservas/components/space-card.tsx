"use client";

import Image from "next/image";
import { Icon, type IconName } from "@/components/icon";
import { money } from "@/lib/utils";
import type { Amenity } from "../types";

interface SpaceCardProps {
  space: Amenity;
  onSelect: (space: Amenity, action: "details" | "reserve") => void;
  isStaff?: boolean;
}

const FEATURE_ICONS: Record<string, { label: string; icon: IconName }> = {
  wifi: { label: "Wi-Fi", icon: "globe" },
  ar_condicionado: { label: "Ar-condicionado", icon: "wind" },
  churrasqueira: { label: "Churrasqueira", icon: "flame" },
  geladeira: { label: "Geladeira", icon: "inbox" },
  cozinha: { label: "Cozinha", icon: "coffee" },
  mesas: { label: "Mesas & Cadeiras", icon: "grid" },
  cadeiras: { label: "Cadeiras", icon: "grid" },
  tv: { label: "TV", icon: "tv" },
  projetor: { label: "Projetor", icon: "tv" },
  banheiro: { label: "Sanitários", icon: "droplet" },
  acessibilidade: { label: "Acessibilidade", icon: "shield" },
  iluminacao: { label: "Iluminação LED", icon: "sun" },
  vestiario: { label: "Vestiário", icon: "user" },
  brinquedos: { label: "Brinquedos", icon: "sparkles" },
  som: { label: "Som Ambiente", icon: "megaphone" },
};

function getSpaceImage(space: Amenity): string {
  if (space.images && space.images.length > 0 && space.images[0]) {
    return space.images[0];
  }
  const lower = space.name.toLowerCase();
  if (lower.includes("churrasq")) return "/amenities/churrasqueira.jpg";
  if (lower.includes("coworking") || lower.includes("reuni")) return "/amenities/coworking.jpg";
  if (lower.includes("quadra") || lower.includes("esporte")) return "/amenities/quadra.jpg";
  if (lower.includes("festa") || lower.includes("salao") || lower.includes("salão")) return "/amenities/salao-festas.jpg";
  if (lower.includes("piscina")) return "/amenities/piscina.jpg";
  if (lower.includes("academia")) return "/amenities/academia.jpg";
  return "/amenities/salao-festas.jpg";
}

export function SpaceCard({ space, onSelect, isStaff }: SpaceCardProps) {
  const isFree = !space.feeCents || space.feeCents === 0;
  const imageSrc = getSpaceImage(space);
  const openTime = space.openTime?.slice(0, 5) || "08:00";
  const closeTime = space.closeTime?.slice(0, 5) || "22:00";

  return (
    <div
      className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(7,26,56,0.035)] transition-all hover:border-[#1455FF]/40 hover:shadow-[0_8px_22px_rgba(20,85,255,0.09)] ${
        !space.active ? "opacity-60" : ""
      }`}
    >
      <div>
        {/* Card Image Banner */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt={space.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            priority={false}
          />

          {/* Top Right Pricing Badge */}
          <div className="absolute right-3 top-3">
            {isFree ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A] px-3 py-1 text-xs font-bold text-white shadow-xs">
                Grátis
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#081A37] px-3 py-1 text-xs font-bold text-white shadow-xs">
                {money(space.feeCents)}
                {space.pricingType === "por_hora" ? "/h" : ""}
              </span>
            )}
          </div>

          {/* Top Left Status (if inactive) */}
          {!space.active && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                Inativo
              </span>
            </div>
          )}

          {/* Bottom Bar on Image (Capacity & Hours) */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#081A37]/82 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-[2px]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={13} className="text-white/80" />
              <span>{space.capacity ? `Até ${space.capacity} pessoas` : "Capacidade livre"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={13} className="text-white/80" />
              <span>{openTime} – {closeTime}</span>
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-extrabold text-[#101828] leading-snug tracking-tight group-hover:text-[#1455FF] transition-colors">
              {space.name}
            </h3>
            {space.requiresApproval ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                Aprovação prévia
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAF1FF] px-2.5 py-0.5 text-[11px] font-bold text-[#0D47FF] border border-[#1455FF]/20">
                Confirmação direta
              </span>
            )}
          </div>

          {space.description && (
            <p className="text-xs text-[#526079] line-clamp-2 leading-relaxed">
              {space.description}
            </p>
          )}

          {/* Comodidades Preview (Up to 3 icons) */}
          {space.features && space.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {space.features.slice(0, 3).map((f) => {
                const feat = FEATURE_ICONS[f] || { label: f, icon: "check" as IconName };
                return (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] px-2 py-0.5 text-[11px] font-semibold text-[#526079]"
                  >
                    <Icon name={feat.icon} size={11} className="text-[#1455FF]" />
                    <span>{feat.label}</span>
                  </span>
                );
              })}
              {space.features.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-bold text-[#1455FF]">
                  +{space.features.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Buttons */}
      <div className="border-t border-[#EDF1F7] bg-[#F5F8FC]/40 px-4 py-3 sm:px-5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onSelect(space, "details")}
          className="inline-flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F8FC] text-xs font-bold text-[#101828] transition-colors cursor-pointer"
        >
          <Icon name="eye" size={14} />
          <span>Ver detalhes</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(space, "reserve")}
          disabled={!space.active}
          className="inline-flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1455FF] hover:bg-[#0048E8] text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Icon name="calendar" size={14} />
          <span>Reservar</span>
        </button>
      </div>
    </div>
  );
}
