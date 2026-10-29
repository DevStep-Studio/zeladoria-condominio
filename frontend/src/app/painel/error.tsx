"use client";

import { useEffect } from "react";
import { AppErrorState } from "@/components/app-ui";

export default function PainelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Painel Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="py-12 max-w-xl mx-auto">
      <AppErrorState
        title="Não foi possível carregar a página"
        description={error?.message || "Ocorreu uma falha inesperada na comunicação com o servidor."}
        onRetry={() => reset()}
        retryText="Tentar novamente"
      />
    </div>
  );
}
