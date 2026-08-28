"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";

type ServiceCardItem = {
  title: string;
  desc: string;
  icon: IconName;
  href: string;
  bgGradient: string;
  textColor?: string;
};

const SERVICES: ServiceCardItem[] = [
  {
    title: "Manutenção",
    desc: "Chamados e reparos",
    icon: "heart",
    href: "/painel/chamados",
    bgGradient: "from-[#F97316] to-[#EA580C]", // Warm Amber/Orange
  },
  {
    title: "Reservas",
    desc: "Espaços e eventos",
    icon: "graduation",
    href: "/painel/reservas",
    bgGradient: "from-[#6366F1] to-[#4F46E5]", // Royal Indigo/Blue
  },
  {
    title: "Portaria",
    desc: "Visitantes e acessos",
    icon: "shield",
    href: "/painel/portaria",
    bgGradient: "from-[#84CC16] to-[#65A30D]", // Lime Green
  },
  {
    title: "Zeladoria",
    desc: "Limpeza e vistorias",
    icon: "clipboard",
    href: "/painel/turnos",
    bgGradient: "from-[#06B6D4] to-[#0891B2]", // Teal / Cyan
  },
  {
    title: "Assembleias",
    desc: "Votações e atas",
    icon: "globe",
    href: "/painel/assembleias",
    bgGradient: "from-[#F43F5E] to-[#E11D48]", // Coral / Crimson
  },
  {
    title: "Outros serviços",
    desc: "Finanças e regras",
    icon: "plus",
    href: "/painel/documentos",
    bgGradient: "from-[#1E293B] to-[#0F172A]", // Dark Navy
  },
];

export function CondoServices() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold tracking-tight text-[var(--color-ink)]">
          Serviços do condomínio
        </h3>
        <p className="text-xs text-[var(--color-muted)] font-medium">
          Acesso rápido aos módulos operacionais.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SERVICES.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br ${item.bgGradient} p-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-h-[140px] sm:min-h-[155px]`}
          >
            {/* Top Icon */}
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/20 text-white backdrop-blur-xs">
                <Icon name={item.icon} size={18} />
              </span>
            </div>

            {/* Bottom Content & Round Action Button */}
            <div className="mt-4 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-base font-bold leading-tight tracking-tight text-white sm:text-lg">
                  {item.title}
                </h4>
                <p className="mt-0.5 text-xs text-white/80 font-medium leading-snug line-clamp-1">
                  {item.desc}
                </p>
              </div>

              {/* Round Arrow Button matching reference */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-md transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45">
                <Icon name="arrow-up-right" size={16} strokeWidth={2.5} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
