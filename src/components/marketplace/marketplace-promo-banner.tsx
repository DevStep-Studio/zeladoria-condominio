"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

export interface PromoSlide {
  id: string;
  tag: string;
  tagBg: string;
  tagText: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaAction: "newsletter" | "urgent" | "search";
  searchQuery?: string;
  bgColor: string;
  imageUrl: string;
}

export function MarketplacePromoBanner({
  onOpenNewsletter,
  onUrgentToggle,
  onSelectCategory,
}: {
  onOpenNewsletter: () => void;
  onUrgentToggle: () => void;
  onSelectCategory: (cat: string) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: PromoSlide[] = [
    {
      id: "promo-30off",
      tag: "OFERTA EXCLUSIVA",
      tagBg: "bg-[#FFD000]",
      tagText: "text-[#0F172A]",
      title: "30% OFF e Frete Grátis na primeira contratação",
      subtitle:
        "Cadastre-se na newsletter e garanta desconto exclusivo em pequenos reparos, instalações ou reformas para a sua unidade.",
      ctaText: "Garantir 30% de Desconto",
      ctaAction: "newsletter",
      bgColor: "bg-[#0055D4]",
      imageUrl: "/newsletter-banner.png",
    },
    {
      id: "promo-urgencia",
      tag: "ATENDIMENTO HOJE",
      tagBg: "bg-emerald-500",
      tagText: "text-white",
      title: "Chuveiro queimou ou pia vazando? Resolva agora",
      subtitle:
        "Profissionais credenciados com disponibilidade confirmada para deslocamento imediato até o seu condomínio.",
      ctaText: "Ver Disponíveis Hoje",
      ctaAction: "urgent",
      bgColor: "bg-[#0F172A]",
      imageUrl:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "promo-qualidade",
      tag: "AVALIAÇÃO 4.9 ★",
      tagBg: "bg-white",
      tagText: "text-[#0F172A]",
      title: "Profissionais verificados com nota máxima no condomínio",
      subtitle:
        "Mais de 1.200 atendimentos realizados com garantia de mão de obra e satisfação comprovada por moradores reais.",
      ctaText: "Explorar Melhores Avaliados",
      ctaAction: "search",
      bgColor: "bg-[#1E293B]",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    },
  ];

  // Auto avanço a cada 6 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const activeSlide = slides[currentSlide];

  const handleCtaClick = () => {
    if (activeSlide.ctaAction === "newsletter") {
      onOpenNewsletter();
    } else if (activeSlide.ctaAction === "urgent") {
      onUrgentToggle();
    } else {
      onSelectCategory("Todas");
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-200"
    >
      {/* Slide Container (Cores 100% sólidas sem gradiente) */}
      <div className={`relative w-full ${activeSlide.bgColor} text-white min-h-[220px] sm:min-h-[260px] flex flex-col sm:flex-row items-center justify-between overflow-hidden transition-colors duration-500`}>
        {/* Lado Esquerdo: Conteúdo Textual com Respiro */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${activeSlide.tagBg} ${activeSlide.tagText}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {activeSlide.tag}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            {activeSlide.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium line-clamp-2">
            {activeSlide.subtitle}
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCtaClick}
              className="rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>{activeSlide.ctaText}</span>
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>

        {/* Lado Direito: Imagem Promocional de Destaque */}
        <div className="w-full sm:w-5/12 h-44 sm:h-auto self-stretch relative bg-black/10 overflow-hidden shrink-0">
          <img
            src={activeSlide.imageUrl}
            alt={activeSlide.title}
            className="w-full h-full object-cover object-center transition-all duration-700"
          />
        </div>
      </div>

      {/* Controles de Navegação (Setas Anterior / Próxima) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <button
          type="button"
          onClick={() =>
            setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))
          }
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
          title="Slide anterior"
        >
          <Icon name="chevron-left" size={16} />
        </button>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
          title="Próximo slide"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Indicadores de Slide (Dots na base) */}
      <div className="absolute bottom-3 left-6 sm:left-10 flex items-center gap-1.5 z-20">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
