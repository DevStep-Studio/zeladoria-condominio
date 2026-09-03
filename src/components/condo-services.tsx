"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";

type ServiceCardItem = {
  title: string;
  desc: string;
  icon: IconName;
  href: string;
  bgColor: string;
  darkText?: boolean;
};

const SERVICES: ServiceCardItem[] = [
  {
    title: "Saúde",
    desc: "Consultas e atendimentos",
    icon: "heart",
    href: "/painel/chamados",
    bgColor: "bg-[#FF6B35]", // Vibrant orange
  },
  {
    title: "Educação",
    desc: "Matrículas escolares",
    icon: "graduation",
    href: "/painel/reservas",
    bgColor: "bg-[#6C5CE7]", // Vibrant purple
  },
  {
    title: "Defesa Civil",
    desc: "Alertas e prevenção",
    icon: "shield",
    href: "/painel/portaria",
    bgColor: "bg-[#B8E926]", // Lime green
    darkText: true,
  },
  {
    title: "Participação",
    desc: "Sugestões públicas",
    icon: "clipboard",
    href: "/painel/assembleias",
    bgColor: "bg-[#00B894]", // Teal / Emerald
  },
  {
    title: "Transparência",
    desc: "Dados municipais",
    icon: "globe",
    href: "/painel/documentos",
    bgColor: "bg-[#FF4757]", // Coral / Rose
  },
  {
    title: "Outro serviço",
    desc: "Registrar solicitação",
    icon: "plus",
    href: "/painel/servicos",
    bgColor: "bg-[#111827]", // Dark Navy
  },
];

export function CondoServices() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-[#0F172A]">
          Serviços municipais
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Acesso rápido aos módulos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {SERVICES.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] ${item.bgColor} p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md min-h-[145px] sm:min-h-[155px]`}
          >
            {/* Top Icon */}
            <div className="flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.darkText ? "text-[#0F172A]" : "text-white"}`}>
                <Icon name={item.icon} size={22} strokeWidth={2.2} />
              </span>
            </div>

            {/* Bottom Content & Round Action Button */}
            <div className="mt-4 flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className={`text-base sm:text-lg font-black leading-tight tracking-tight ${item.darkText ? "text-[#0F172A]" : "text-white"}`}>
                  {item.title}
                </h4>
                <p className={`mt-0.5 text-xs font-medium leading-snug line-clamp-1 ${item.darkText ? "text-[#1E293B]" : "text-white/90"}`}>
                  {item.desc}
                </p>
              </div>

              {/* Round Arrow Button matching reference */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-md transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45">
                <Icon name="arrow-up-right" size={17} strokeWidth={2.5} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
