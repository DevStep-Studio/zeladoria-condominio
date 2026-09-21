"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import type { MarketplaceProvider, ServiceOffering, PortfolioItem } from "@/lib/services/providers-data";

export function ProviderProfileModal({
  provider,
  hasHiredBefore = false,
  onClose,
  onRequestBudget,
}: {
  provider: MarketplaceProvider | null;
  hasHiredBefore?: boolean;
  onClose: () => void;
  onRequestBudget: (provider: MarketplaceProvider, specificService?: ServiceOffering) => void;
}) {
  const [activeTab, setActiveTab] = useState<"servicos" | "portfolio" | "avaliacoes" | "sobre">("servicos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!provider) return null;

  const currentPortfolioItem = lightboxIndex !== null ? provider.portfolio[lightboxIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Sticky Header with Provider Overview */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar */}
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl bg-blue-50 border border-slate-200 shadow-xs">
                {provider.avatarUrl ? (
                  <img
                    src={provider.avatarUrl}
                    alt={provider.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-black text-[#0055D4] text-xl">
                    {provider.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Identity */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A] truncate">
                    {provider.name}
                  </h2>
                  {provider.isVerified && (
                    <span
                      title="Profissional com documentação e antecedentes verificados pelo condomínio"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0055D4] bg-blue-50 px-1.5 py-0.5 rounded-full"
                    >
                      <Icon name="check-circle" size={13} />
                      <span className="hidden sm:inline">Verificado</span>
                    </span>
                  )}
                  {provider.isSponsored && (
                    <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                      Patrocinado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium truncate">
                  {provider.category} · {provider.company}
                </p>

                <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
                  {provider.reviewsCount > 0 ? (
                    <>
                      <div className="flex items-center gap-1 font-black text-[#0F172A]">
                        <Icon name="star" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                        <span>{provider.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        ({provider.reviewsCount} avaliações no condomínio)
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">Ainda sem avaliações no condomínio</span>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Banner: Previously Hired by user/condo */}
          {hasHiredBefore && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0055D4]">
              <Icon name="check-circle" size={14} className="shrink-0" />
              <span>Você ou sua unidade já contrataram este profissional anteriormente com sucesso.</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Contratações</span>
              <p className="font-black text-[#0F172A] mt-0.5">{provider.hiredCount}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Conclusão</span>
              <p className="font-black text-[#0055D4] mt-0.5">{provider.completionRate !== null ? `${provider.completionRate}%` : "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preço Inicial</span>
              <p className="font-black text-emerald-700 mt-0.5">
                {provider.startingPriceCents != null ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}` : "Sob consulta"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-200 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("servicos")}
              className={`pb-2.5 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "servicos"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Serviços & Preços ({provider.servicesOffered.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={`pb-2.5 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "portfolio"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Trabalhos Realizados ({provider.portfolio.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("avaliacoes")}
              className={`pb-2.5 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "avaliacoes"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Avaliações ({provider.reviewsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sobre")}
              className={`pb-2.5 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "sobre"
                  ? "border-[#0055D4] text-[#0055D4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Sobre & Contato
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SERVIÇOS & PREÇOS */}
          {activeTab === "servicos" && (
            <div className="space-y-3">
              {provider.servicesOffered.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                  Este prestador ainda não cadastrou uma lista de serviços com preços. Você pode solicitar um orçamento
                  personalizado mesmo assim.
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Selecione um serviço abaixo para orçar diretamente com valores de referência:
                  </p>
                  <div className="space-y-2.5">
                    {provider.servicesOffered.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            {svc.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {svc.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block">A partir de</span>
                            <span className="text-xs sm:text-sm font-black text-[#0055D4]">
                              {svc.priceFromCents != null ? `R$ ${(svc.priceFromCents / 100).toFixed(0)}` : "Sob consulta"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRequestBudget(provider, svc)}
                            className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Orçar este
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: TRABALHOS REALIZADOS (PORTFÓLIO) */}
          {activeTab === "portfolio" && (
            <div className="space-y-3">
              {provider.portfolio.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                  Este prestador ainda não cadastrou fotos de trabalhos realizados.
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Fotos de instalações e manutenções executadas pelo profissional:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {provider.portfolio.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => setLightboxIndex(index)}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                      >
                        <div className="relative h-44 w-full overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.caption}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Icon name="search" size={14} />
                            <span>Ampliar foto</span>
                          </div>
                        </div>
                        {item.caption && (
                          <div className="p-3">
                            <p className="text-[11px] text-slate-500 line-clamp-2">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: AVALIAÇÕES */}
          {activeTab === "avaliacoes" && (
            <div className="space-y-4">
              {/* Rating Summary Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {/* Score */}
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                    {provider.rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon
                        key={s}
                        name="star"
                        size={14}
                        className="text-[#FFD000] fill-[#FFD000]"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-1">
                    {provider.reviewsCount} avaliações
                  </span>
                </div>

                {/* Stars Distribution Bar */}
                <div className="sm:col-span-2 space-y-1.5 text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = (provider.ratingDistribution as any)[stars] || 0;
                    const pct = provider.reviewsCount > 0 ? (count / provider.reviewsCount) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-8 font-bold text-slate-500 text-[11px] flex items-center gap-0.5">
                          <span>{stars}</span>
                          <Icon name="star" size={10} className="text-[#FFD000] fill-[#FFD000]" />
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#0055D4] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] text-slate-400 font-semibold">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Comentários de condôminos que já contrataram
                </h4>
                {provider.reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                    Ainda não há avaliações registradas para este prestador neste condomínio.
                  </p>
                ) : (
                  provider.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700">
                            {rev.authorName.charAt(0)}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#0F172A]">
                                {rev.authorName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({rev.unit})
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700">
                              <Icon name="check-circle" size={10} />
                              <span>Serviço registrado neste condomínio</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-0.5 justify-end">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Icon
                                key={i}
                                name="star"
                                size={11}
                                className="text-[#FFD000] fill-[#FFD000]"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.date}</span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          &quot;{rev.comment}&quot;
                        </p>
                      )}

                      <div className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">Serviço:</span> {rev.serviceDone}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SOBRE & CONTATO */}
          {activeTab === "sobre" && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] mb-1.5">Sobre o Profissional</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {provider.bio || "O prestador ainda não cadastrou uma descrição profissional."}
                </p>
              </div>

              {provider.regionCoverage && (
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-1.5">Região Atendida</h4>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                    <Icon name="pin" size={14} className="text-[#0055D4] shrink-0" />
                    <span>{provider.regionCoverage}</span>
                  </div>
                </div>
              )}

              {(provider.whatsapp || provider.phone) && (
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-1.5">Contato Direto</h4>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 block">WhatsApp / Telefone</span>
                      <span className="text-emerald-700">{provider.whatsapp || provider.phone}</span>
                    </div>
                    {provider.whatsapp && (
                      <a
                        href={`https://wa.me/55${provider.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 transition-colors flex items-center gap-1.5"
                      >
                        <Icon name="phone" size={13} />
                        <span>Chamar no WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Modal Bottom Action Bar (Crucial for Mobile-First Conversion) */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:block min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Preços a partir de
            </span>
            <span className="text-sm font-black text-[#0055D4]">
              {provider.startingPriceCents != null ? `R$ ${(provider.startingPriceCents / 100).toFixed(0)}` : "Sob consulta"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => onRequestBudget(provider)}
              className="flex-1 sm:flex-initial rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
            >
              Solicitar Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for Portfolio Photos */}
      {currentPortfolioItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            {/* Close Lightbox */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
            >
              <Icon name="x" size={24} />
            </button>

            {/* Photo */}
            <div className="relative max-h-[75vh] w-full overflow-hidden rounded-2xl bg-black">
              <img
                src={currentPortfolioItem.url}
                alt={currentPortfolioItem.caption}
                className="h-full w-full object-contain max-h-[75vh]"
              />
            </div>

            {/* Caption & Navigation Controls */}
            <div className="mt-3 flex items-center justify-between w-full text-white text-xs">
              <div>
                <p className="text-slate-300 text-[11px]">{currentPortfolioItem.caption}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={lightboxIndex === 0}
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                  className="rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 p-2"
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <span className="font-bold">
                  {(lightboxIndex || 0) + 1} / {provider.portfolio.length}
                </span>
                <button
                  type="button"
                  disabled={lightboxIndex === provider.portfolio.length - 1}
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev < provider.portfolio.length - 1 ? prev + 1 : prev
                    )
                  }
                  className="rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 p-2"
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
