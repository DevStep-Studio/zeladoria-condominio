import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { promotionPlans, providerPromotions, vendors } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { DEFAULT_PROMOTION_PLANS } from "@/lib/services/promotions";
import { AdminDestaquesClient } from "./admin-destaques-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Destaques · Admin Marketplace",
  description: "Gerencie planos de publicidade, campanhas ativas e receita do marketplace.",
};

export default async function AdminMarketplaceDestaquesPage() {
  const session = await requireSession();
  const condoId = session.condo?.id ?? null;

  // Buscar planos
  let plans: any[] = [];
  try {
    plans = await db.select().from(promotionPlans).orderBy(desc(promotionPlans.id));
  } catch {
    plans = [];
  }
  if (!plans.length) {
    plans = DEFAULT_PROMOTION_PLANS;
  }

  // Buscar todas as campanhas com join no vendor
  let campaigns: any[] = [];
  try {
    const baseQuery = db
      .select({
        id: providerPromotions.id,
        vendorId: providerPromotions.vendorId,
        type: providerPromotions.type,
        categoryId: providerPromotions.categoryId,
        region: providerPromotions.region,
        startsAt: providerPromotions.startsAt,
        endsAt: providerPromotions.endsAt,
        status: providerPromotions.status,
        amountCents: providerPromotions.amountCents,
        paymentStatus: providerPromotions.paymentStatus,
        impressions: providerPromotions.impressions,
        clicks: providerPromotions.clicks,
        createdAt: providerPromotions.createdAt,
        vendorName: vendors.name,
        vendorCategory: vendors.category,
      })
      .from(providerPromotions)
      .leftJoin(vendors, eq(vendors.id, providerPromotions.vendorId));

    if (condoId) {
      campaigns = await baseQuery
        .where(eq(providerPromotions.condoId, condoId))
        .orderBy(desc(providerPromotions.createdAt));
    } else {
      campaigns = await baseQuery.orderBy(desc(providerPromotions.createdAt));
    }
  } catch {
    campaigns = [];
  }

  return (
    <AdminDestaquesClient
      plans={plans}
      campaigns={campaigns}
    />
  );
}
