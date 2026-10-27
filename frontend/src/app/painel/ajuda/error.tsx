"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";

export default function AjudaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro ao renderizar a central de ajuda e suporte:", error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--color-line)] bg-white p-8 text-center shadow-2xs">
      <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600">
        <Icon name="alert" size={24} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
        Não foi possível carregar o suporte e central de ajuda
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-[var(--color-muted)]">
        Ocorreu uma instabilidade ao consultar os chamados de suporte e artigos da base de conhecimento. Clique no botão abaixo para tentar novamente.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-[var(--color-subtle)]">
          Código do erro: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-primary"
          type="button"
        >
          <Icon name="refresh" size={15} />
          Tentar novamente
        </button>
        <a href="/painel" className="btn-ghost">
          Voltar ao início do painel
        </a>
      </div>
    </div>
  );
}
