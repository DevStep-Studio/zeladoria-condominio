"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";
import { INTERNAL_BTN_PRIMARY_CLS, INTERNAL_BTN_SECONDARY_CLS } from "@/components/internal/internal-ui";

export default function ChamadosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro ao renderizar a aba de chamados:", error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center shadow-[0_2px_10px_rgba(8,26,55,0.03)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
        <Icon name="alert" size={24} />
      </span>
      <h2 className="mt-4 text-lg font-extrabold text-[#101828]">
        Não foi possível carregar os chamados
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-[#526079]">
        Ocorreu uma instabilidade ao consultar as solicitações deste condomínio. Clique no botão abaixo para tentar novamente.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-[#64748B]">
          Código do erro: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className={INTERNAL_BTN_PRIMARY_CLS}
          type="button"
        >
          <Icon name="refresh" size={15} />
          <span>Tentar novamente</span>
        </button>
        <a href="/painel" className={INTERNAL_BTN_SECONDARY_CLS}>
          Voltar ao início do painel
        </a>
      </div>
    </div>
  );
}
