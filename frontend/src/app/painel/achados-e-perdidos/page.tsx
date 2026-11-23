import { requireCondo } from "@/lib/auth";
import { getAllLostAndFoundItems } from "@/lib/services/lost-and-found-storage";
import { AchadosPerdidosClient } from "./achados-perdidos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Achados e Perdidos | Zeladoria Condomínio",
  description: "Central integrada de achados e perdidos do condomínio",
};

export default async function AchadosEPerdidosPage() {
  const { session } = await requireCondo();
  const condoId = session.condo?.id ?? null;
  const initialItems = getAllLostAndFoundItems(condoId);
  const activeMembership = session.memberships?.find((m) => m.condoId === condoId);
  const unitLabel = activeMembership?.unitLabel || "Condomínio";

  return (
    <AchadosPerdidosClient
      initialItems={initialItems}
      initialRole={session.role}
      userName={session.user?.name || "Morador"}
      currentUserUnit={unitLabel}
      condoName={session.condo?.name || "Condomínio"}
      condoId={condoId}
    />
  );
}
