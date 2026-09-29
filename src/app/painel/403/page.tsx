import Link from "next/link";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-sm">
        <Icon name="shield" size={36} strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-[6px] bg-rose-500 text-white shadow-xs">
          <Icon name="x" size={14} strokeWidth={2.6} />
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
        Acesso não permitido
      </h1>

      <p className="mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        Você não possui permissão para acessar esta área. Caso acredite que isto seja um engano, entre em contato com a administração do condomínio.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/painel"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-blue-500/20"
        >
          <Icon name="arrow-right" size={14} className="rotate-180" />
          <span>Voltar ao início</span>
        </Link>
      </div>
    </div>
  );
}
