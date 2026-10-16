import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  marketplaceSettings,
  paymentOrders,
  paymentRecipients,
  payouts,
  serviceContracts,
  serviceDisputes,
  serviceInspections,
  vendors,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getMarketplaceSettings } from "@/lib/services/payments/payment-service";
import { ZeladoriaPayAdminClient } from "./zeladoria-pay-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zeladoria Pay · Administração Financeira do Marketplace",
  description: "Controle de GMV, comissões, vistorias pagas, repasses, contestações e split financeiro.",
};

export default async function AdminZeladoriaPayPage() {
  const { condoId } = await requireRole(["sindico", "superadmin"]);

  const settings = await getMarketplaceSettings(condoId);

  // Busca ordens de pagamento do condomínio
  const orders = await db
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
      refundedAt: paymentOrders.refundedAt,
      createdAt: paymentOrders.createdAt,
      vendorName: vendors.name,
      contractId: paymentOrders.contractId,
    })
    .from(paymentOrders)
    .leftJoin(vendors, eq(vendors.id, paymentOrders.vendorId))
    .where(eq(paymentOrders.condoId, condoId))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(100);

  // Busca disputas
  const disputes = await db
    .select()
    .from(serviceDisputes)
    .orderBy(desc(serviceDisputes.createdAt))
    .limit(50);

  // Busca repasses (Payouts)
  const allPayouts = await db
    .select()
    .from(payouts)
    .where(eq(payouts.condoId, condoId))
    .orderBy(desc(payouts.createdAt))
    .limit(50);

  // Busca prestadores com onboarding financeiro
  const recipients = await db
    .select({
      id: paymentRecipients.id,
      vendorId: paymentRecipients.vendorId,
      vendorName: vendors.name,
      vendorCompany: vendors.companyName,
      status: paymentRecipients.status,
      pspProvider: paymentRecipients.pspProvider,
      pspAccountId: paymentRecipients.pspAccountId,
      accountType: paymentRecipients.accountType,
      pixKey: paymentRecipients.pixKey,
      createdAt: paymentRecipients.createdAt,
    })
    .from(paymentRecipients)
    .leftJoin(vendors, eq(vendors.id, paymentRecipients.vendorId))
    .limit(50);

  // Busca vistorias pagas
  const paidInspections = await db
    .select()
    .from(serviceInspections)
    .where(eq(serviceInspections.type, "paga"))
    .orderBy(desc(serviceInspections.createdAt))
    .limit(50);

  return (
    <ZeladoriaPayAdminClient
      condoId={condoId}
      settings={settings}
      orders={orders}
      disputes={disputes}
      payouts={allPayouts}
      recipients={recipients}
      paidInspections={paidInspections}
    />
  );
}
