import Link from "next/link";
import { Icon } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center selection:bg-[#1355FF] selection:text-white">
      <div className="mb-6">
        <BrandLogo size="lg" variant="default" showText={true} />
      </div>

      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-[#1355FF] border border-blue-200/80 shadow-xs">
        <Icon name="compass" size={44} strokeWidth={2} />
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FFD000] text-[#12162A] shadow-xs text-xs font-black">
          404
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
        Página não encontrada
      </h1>

      <p className="mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        O endereço que você tentou acessar não existe, foi alterado ou está temporariamente indisponível.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/painel"
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#1355FF] hover:bg-[#0D47E6] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
        >
          <Icon name="arrow-right" size={14} className="rotate-180" />
          <span>Ir para o Início</span>
        </Link>
        <Link
          href="/painel/ajuda"
          className="inline-flex items-center gap-2 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition-all shadow-2xs"
        >
          <Icon name="help" size={14} />
          <span>Central de Ajuda</span>
        </Link>
      </div>
    </div>
  );
}
