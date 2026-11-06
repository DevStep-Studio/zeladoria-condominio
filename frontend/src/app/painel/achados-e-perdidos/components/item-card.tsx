"use client";

import { Icon, type IconName } from "@/components/icon";
import type { LostAndFoundItem } from "@/types/lost-and-found";

interface ItemCardProps {
  item: LostAndFoundItem;
  onClick: (item: LostAndFoundItem) => void;
  onQuickAction?: (item: LostAndFoundItem) => void;
}

const CATEGORY_ICONS: Record<string, IconName> = {
  Documentos: "file-text",
  Eletrônicos: "tv",
  Chaves: "key",
  Roupas: "tag",
  Outros: "package",
};

export function ItemCard({ item, onClick }: ItemCardProps) {
  const isFound = item.type === "FOUND";
  const isOpen = item.status === "OPEN";
  const categoryIcon = CATEGORY_ICONS[item.category] || "package";

  return (
    <article
      onClick={() => onClick(item)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Imagem ou Ilustração de Fallback */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/70 p-4 text-slate-400">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 text-slate-500">
                <Icon name={categoryIcon} size={28} />
              </span>
              <span className="mt-2 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                {item.category}
              </span>
            </div>
          )}

          {/* Badges Flutuantes */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-xs backdrop-blur-md ${
                isFound
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              <Icon name={isFound ? "check-circle" : "search"} size={12} />
              <span>{isFound ? "Achado" : "Perdido"}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md ${
                isOpen
                  ? "bg-white/95 text-blue-700 border border-blue-200/60"
                  : "bg-slate-900/90 text-white"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOpen ? "bg-blue-600 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span>{isOpen ? "Aberto" : "Devolvido"}</span>
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs backdrop-blur-md border border-slate-200/60">
              <Icon name={categoryIcon} size={11} className="text-slate-500" />
              <span>{item.category}</span>
            </span>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-[#0070F3] transition-colors">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Metadados: Local e Data */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
              <Icon name="map-pin" size={13} className="text-slate-400 shrink-0" />
              <span className="truncate font-medium">{item.location}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Icon name="calendar" size={13} className="text-slate-400 shrink-0" />
              <span>
                {isFound ? "Encontrado em" : "Perdido em"} {item.date}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 font-bold text-[10px] text-slate-700 shrink-0">
            {item.reportedBy.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-slate-500 font-medium">
            Por {item.reportedBy}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 font-bold text-[#0070F3] group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Detalhes</span>
          <Icon name="arrow-right" size={12} />
        </span>
      </div>
    </article>
  );
}

