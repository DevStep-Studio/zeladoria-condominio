import { requireCondo } from "@/lib/auth";
import { getAllSuggestions } from "@/lib/services/sugestoes-storage";
import { SugestoesClient } from "./sugestoes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sugestões & Melhorias | Zeladoria Condomínio",
  description: "Central integrada de sugestões e melhorias para moradores, zeladoria e administração",
};

export default async function SugestoesPage() {
  const { session } = await requireCondo();
  const condoId = session.condo?.id ?? null;
  const initialSuggestions = getAllSuggestions(condoId);

  const activeMembership = session.memberships?.find((m) => m.condoId === condoId);
  const unitLabel = activeMembership?.unitLabel || "Condomínio";

  return (
    <SugestoesClient
      initialSuggestions={initialSuggestions}
      userRole={session.role}
      userName={session.user.name}
      userUnit={unitLabel}
    />
  );
}
