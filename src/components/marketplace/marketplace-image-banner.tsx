"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

export interface BannerSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

export function MarketplaceImageBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: BannerSlide[] = [
    {
      id: "slide-eletrica-reparos",
      imageUrl:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=80",
      alt: "Serviços e Manutenção Elétrica Condominial",
    },
    {
      id: "slide-condominio-fachada",
      imageUrl:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80",
      alt: "Gestão e Zeladoria de Condomínios",
    },
    {
      id: "slide-pintura-reforma",
      imageUrl:
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1600&q=80",
      alt: "Pintura, Obras e Reformas",
    },
    {
      id: "slide-manutencao-limpeza",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80",
      alt: "Serviços Gerais e Limpeza Profissional",
    },
  ];

  // Auto avanço a cada 5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-40 sm:h-52 md:h-64 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100 group"
    >
      {/* Imagem Ocupando 100% da Caixa (Sem Textos) */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <img
            src={slide.imageUrl}
            alt={slide.alt}
            className="w-full h-full object-cover object-center"
            loading={idx === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Setas de Navegação (Discretas, aparecem suavemente) */}
      <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <button
          type="button"
          onClick={() =>
            setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))
          }
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all cursor-pointer opacity-80 group-hover:opacity-100 active:scale-95"
          title="Slide anterior"
        >
          <Icon name="chevron-left" size={16} />
        </button>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all cursor-pointer opacity-80 group-hover:opacity-100 active:scale-95"
          title="Próximo slide"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Indicadores de Slide (Dots elegantes na base sobre a imagem) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            title={`Banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
