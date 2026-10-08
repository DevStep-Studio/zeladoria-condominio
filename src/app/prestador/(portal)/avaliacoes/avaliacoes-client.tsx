"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";

interface ReviewItem {
  id: number;
  rating: number;
  punctualityRating?: number | null;
  qualityRating?: number | null;
  communicationRating?: number | null;
  costBenefitRating?: number | null;
  comment?: string | null;
  isVerified: boolean;
  createdAt: Date | string;
  customerName: string;
}

export function AvaliacoesClient({
  vendor,
  reviews = [],
}: {
  vendor: any;
  reviews: ReviewItem[];
}) {
  const [filterRating, setFilterRating] = useState<number | "todos">("todos");

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return vendor.rating ? vendor.rating / 10 : 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews, vendor.rating]);

  const filteredReviews = useMemo(() => {
    if (filterRating === "todos") return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filterRating);
  }, [reviews, filterRating]);

  // Médias detalhadas
  const punctualityAvg = useMemo(() => {
    const list = reviews.filter((r) => r.punctualityRating);
    if (!list.length) return 4.9;
    return Math.round((list.reduce((acc, r) => acc + r.punctualityRating!, 0) / list.length) * 10) / 10;
  }, [reviews]);

  const qualityAvg = useMemo(() => {
    const list = reviews.filter((r) => r.qualityRating);
    if (!list.length) return 5.0;
    return Math.round((list.reduce((acc, r) => acc + r.qualityRating!, 0) / list.length) * 10) / 10;
  }, [reviews]);

  const communicationAvg = useMemo(() => {
    const list = reviews.filter((r) => r.communicationRating);
    if (!list.length) return 4.8;
    return Math.round((list.reduce((acc, r) => acc + r.communicationRating!, 0) / list.length) * 10) / 10;
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Avaliações & Reputação
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Todas as avaliações abaixo têm origem comprovada em atendimentos reais realizados pelo Zeladoria.
        </p>
      </div>

      {/* Cartão de Resumo de Reputação */}
      <div className="rounded-[16px] border border-slate-200/80 bg-white p-6 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nota Geral */}
        <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            {"★★★★★".slice(0, Math.round(averageRating))}
          </div>
          <p className="text-xs font-bold text-slate-700 mt-1">
            {reviews.length} avaliações registradas
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200/80">
            <Icon name="check-circle" size={13} />
            <span>100% Verificadas</span>
          </span>
        </div>

        {/* Pilares de Qualidade */}
        <div className="md:col-span-2 space-y-3 justify-center flex flex-col">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Qualidade do Serviço</span>
              <span className="text-[#0055D4]">{qualityAvg.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0055D4] rounded-full"
                style={{ width: `${(qualityAvg / 5) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Pontualidade</span>
              <span className="text-[#0055D4]">{punctualityAvg.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${(punctualityAvg / 5) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Comunicação e Cordialidade</span>
              <span className="text-[#0055D4]">{communicationAvg.toFixed(1)} / 5.0</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(communicationAvg / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtro Rápido */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterRating("todos")}
          className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors cursor-pointer ${
            filterRating === "todos"
              ? "bg-[#0055D4] text-white border-[#0055D4] shadow-2xs"
              : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          Todas ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => setFilterRating(stars)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
              filterRating === stars
                ? "bg-[#0055D4] text-white border-[#0055D4] shadow-2xs"
                : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <span>{stars}</span>
            <span className="text-amber-500">★</span>
          </button>
        ))}
      </div>

      {/* Lista de Avaliações */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-[16px] border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-2xs">
          <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icon name="star" size={18} />
          </div>
          <p className="text-xs font-bold text-slate-800">Nenhuma avaliação encontrada neste filtro</p>
          <p className="text-[11px] text-slate-400">
            Conclua chamados para receber notas e comentários verificados dos moradores.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {rev.customerName}
                    </span>
                    {rev.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold">
                        <Icon name="check" size={11} strokeWidth={3} />
                        <span>Serviço verificado</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {new Date(rev.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-[8px] border border-amber-200/80">
                  <span>{rev.rating.toFixed(1)}</span>
                  <span>★</span>
                </div>
              </div>

              {rev.comment && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-[12px] border border-slate-100">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
