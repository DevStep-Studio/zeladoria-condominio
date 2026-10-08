import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { promotionPlans, providerPromotions, vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { DEFAULT_PROMOTION_PLANS } from "@/lib/services/promotions";
import { DestaqueClient } from "./destaque-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Destaque e Publicidade · Zeladoria Prestadores",
  description: "Promova seu perfil no topo da sua categoria sem distorcer sua reputação orgânica.",
};

export default async function PrestadorDestaquePage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  // Buscar planos disponíveis
  let plans: any[] = [];
  try {
    plans = await db.select().from(promotionPlans).where(eq(promotionPlans.active, true));
  } catch {
    plans = [];
  }
  if (!plans.length) {
    plans = DEFAULT_PROMOTION_PLANS;
  }

  // Buscar campanhas deste prestador
  let promotions: any[] = [];
  try {
    promotions = await db
      .select()
      .from(providerPromotions)
      .where(eq(providerPromotions.vendorId, targetVendor.id))
      .orderBy(desc(providerPromotions.createdAt));
  } catch {
    promotions = [];
  }

  return (
    <DestaqueClient
      vendor={targetVendor}
      plans={plans}
      promotions={promotions}
    />
  );
}
