import { requireCondo } from "@/lib/auth";
import { AchadosPerdidosClient } from "./achados-perdidos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Achados e Perdidos | Zeladoria Condomínio",
  description: "Central integrada de achados e perdidos do condomínio",
};

export default async function AchadosEPerdidosPage() {
  const { session } = await requireCondo();

  return (
    <AchadosPerdidosClient
      initialRole={session.role}
      userName={session.user?.name || "Morador"}
      condoName={session.condo?.name || "Condomínio"}
    />
  );
}

