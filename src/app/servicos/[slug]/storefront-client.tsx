"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ServiceRequestWizard } from "@/components/marketplace/service-request-wizard";
import type { MarketplaceProvider } from "@/lib/services/providers-data";

export function StorefrontClient({
  vendor,
  reviews = [],
}: {
  vendor: any;
  reviews: any[];
}) {
  const [activeTab, setActiveTab] = useState<"servicos" | "portfolio" | "avaliacoes" | "sobre">("servicos");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedInitialService, setSelectedInitialService] = useState<any>(undefined);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const services = Array.isArray(vendor.services) ? vendor.services : [];
  const portfolio = Array.isArray(vendor.portfolio) ? vendor.portfolio : [];

  // Map vendor to MarketplaceProvider interface for wizard
  const providerForWizard: MarketplaceProvider = {
    id: vendor.id,
    name: vendor.name,
    company: vendor.companyName || vendor.name,
    category: vendor.category,
    rating: vendor.rating || 5,
    reviewsCount: reviews.length,
    score: 95,
    isSponsored: vendor.sponsored,
    isVerified: vendor.verified,
    completionRate: 98,
    hiredCount: reviews.length,
    startingPriceCents: vendor.priceFromCents || null,
    regionCoverage: vendor.serviceArea || null,
    phone: vendor.phone || null,
    whatsapp: vendor.whatsapp || null,
    bio: vendor.description || null,
    avatarUrl: vendor.photoUrl || null,
    portfolio,
    servicesOffered: services,
    reviews: [],
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  const handleRequestService = (svc?: any) => {
    setSelectedInitialService(svc);
    setIsWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] pb-24">
      {/* Top Floating Return Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/painel/servicos"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Icon name="arrow-left" size={14} />
            <span>Voltar ao Marketplace</span>
          </Link>

          <button
            type="button"
            onClick={() => handleRequestService()}
            className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="zap" size={13} className="text-[#FFD000] fill-[#FFD000]" />
            <span>Solicitar Atendimento</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Cover / Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          {/* Cover image or decorative background */}
          <div className="h-40 sm:h-52 w-full bg-slate-800 relative">
            {vendor.coverUrl ? (
              <img src={vendor.coverUrl} alt="Capa" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-medium">
                Zeladoria Serviços · Credenciado Oficial
              </div>
            )}
          </div>

          {/* Profile Bar info */}
          <div className="p-5 sm:p-6 sm:pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white p-1 border-2 border-white shadow-md shrink-0 overflow-hidden bg-slate-100">
                  {vendor.photoUrl ? (
                    <img
                      src={vendor.photoUrl}
                      alt={vendor.name}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-blue-50 text-[#0055D4] flex items-center justify-center font-black text-2xl">
                      {vendor.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                      {vendor.companyName || vendor.name}
                    </h1>
                    {vendor.verified && (
                      <span className="inline-flex items-center gap-1 rounded-[4px] bg-blue-50 border border-blue-200 text-[#0055D4] px-2 py-0.5 text-[10px] font-bold">
                        <Icon name="check-circle" size={12} />
                        <span>Verificado</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {vendor.name} · Especialista em {vendor.category.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Status and Action CTA */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    vendor.isOnline
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      vendor.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  <span>{vendor.isOnline ? "Disponível agora" : "Offline / Agendado"}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleRequestService()}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Icon name="zap" size={14} className="text-[#FFD000] fill-[#FFD000]" />
                  <span>Solicitar Atendimento</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avaliação Geral</span>
                <div className="font-black text-[#0F172A] flex items-center justify-center gap-1 mt-0.5">
                  <Icon name="star" size={13} className="text-[#FFD000] fill-[#FFD000]" />
                  <span>{vendor.rating ? `${vendor.rating}.0` : "5.0"}</span>
                  <span className="text-[10px] text-slate-400">({reviews.length})</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Experiência</span>
                <div className="font-black text-[#0F172A] mt-0.5">{vendor.experienceYears || 3} anos</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tempo de Resposta</span>
                <div className="font-black text-[#0055D4] mt-0.5">{vendor.responseTimeMinutes || 15} min</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Preço Inicial</span>
                <div className="font-black text-emerald-700 mt-0.5">
                  {vendor.priceFromCents ? `A partir de R$ ${(vendor.priceFromCents / 100).toFixed(0)}` : "Sob consulta"}
                </div>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-2 mt-6 border-b border-slate-200 overflow-x-auto text-xs font-bold">
              {[
                { id: "servicos", label: `Serviços & Preços (${services.length})` },
                { id: "portfolio", label: `Trabalhos Realizados (${portfolio.length})` },
                { id: "avaliacoes", label: `Avaliações (${reviews.length})` },
                { id: "sobre", label: "Sobre & Garantias" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[#0055D4] text-[#0055D4]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 1: Serviços & Preços */}
        {activeTab === "servicos" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#0F172A]">
              Tabela de Serviços com Valores de Referência
            </h2>
            {services.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                Este profissional realiza orçamentos sob medida para a sua necessidade.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {services.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0F172A]">{svc.name}</h3>
                        <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 capitalize">
                          {svc.priceType === "a_partir" ? "A partir de" : svc.priceType?.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-sm font-black text-[#0055D4]">
                        {svc.priceFromCents
                          ? `R$ ${(svc.priceFromCents / 100).toFixed(2)}`
                          : "Sob consulta"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRequestService(svc)}
                        className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Orçar este
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Portfólio de Trabalhos (Grid com Lightbox) */}
        {activeTab === "portfolio" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#0F172A]">
              Galeria de Instalações e Manutenções Executadas
            </h2>
            {portfolio.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                Ainda não há fotos no portfólio deste profissional.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {portfolio.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxUrl(item.url)}
                    className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs cursor-pointer space-y-2 p-2"
                  >
                    <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={item.url}
                        alt={item.caption}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] px-1 truncate">
                      {item.caption}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Avaliações Verificadas */}
        {activeTab === "avaliacoes" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#0F172A]">
              Avaliações de Clientes do Condomínio ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                Ainda não há avaliações registradas para este profissional.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F172A]">
                        <span>{rev.authorName}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-[4px]">
                          <Icon name="check" size={11} strokeWidth={2.4} />
                          <span>Serviço Verificado</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Icon key={i} name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">&quot;{rev.comment}&quot;</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sobre & Garantias */}
        {activeTab === "sobre" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 text-xs text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Apresentação Profissional</h3>
              <p>{vendor.description || "Profissional credenciado no Zeladoria Serviços."}</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Área e Raio de Atendimento</h3>
              <p>Atende: <strong>{vendor.serviceArea || "Região metropolitana"}</strong></p>
              <p className="text-slate-500 mt-0.5">Raio máximo de deslocamento: {vendor.serviceRadiusKm || 15} km</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Horário de Funcionamento</h3>
              <p>{vendor.workingHours || "Segunda a Sexta, das 08:00 às 18:00"}</p>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img src={lightboxUrl} alt="Foto ampliada" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Service Request Wizard Modal */}
      {isWizardOpen && (
        <ServiceRequestWizard
          provider={providerForWizard}
          initialService={selectedInitialService}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            setIsWizardOpen(false);
          }}
        />
      )}
    </div>
  );
}
