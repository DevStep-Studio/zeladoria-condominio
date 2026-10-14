import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { marketplaceSettings, paymentOrders, vendors } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getMarketplaceSettings } from "@/lib/services/payments/payment-service";
import { AdminTaxasClient } from "./taxas-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zeladoria Pay · Taxas & Split do Marketplace",
  description: "Configure a comissão de intermediação, prazos de retenção e acompanhe repasses.",
};

export default async function AdminMarketplaceTaxasPage() {
  const { session, condoId } = await requireRole(["sindico", "superadmin"]);

  const settings = await getMarketplaceSettings(condoId);

  let recentOrders: any[] = [];
  try {
    recentOrders = await db
      .select({
        id: paymentOrders.id,
        code: paymentOrders.code,
        purpose: paymentOrders.purpose,
        amountGrossCents: paymentOrders.amountGrossCents,
        platformFeeCents: paymentOrders.platformFeeCents,
        netVendorCents: paymentOrders.netVendorCents,
        commissionPercent: paymentOrders.commissionPercent,
        billingType: paymentOrders.billingType,
        status: paymentOrders.status,
        paidAt: paymentOrders.paidAt,
        releasedAt: paymentOrders.releasedAt,
        createdAt: paymentOrders.createdAt,
        vendorName: vendors.name,
      })
      .from(paymentOrders)
      .leftJoin(vendors, eq(vendors.id, paymentOrders.vendorId))
      .where(eq(paymentOrders.condoId, condoId))
      .orderBy(desc(paymentOrders.createdAt))
      .limit(30);
  } catch (err) {
    console.warn("Could not query recentOrders for admin taxas:", err);
  }

  return (
    <AdminTaxasClient
      condoId={condoId}
      settings={settings}
      recentOrders={recentOrders}
    />
  );
}
