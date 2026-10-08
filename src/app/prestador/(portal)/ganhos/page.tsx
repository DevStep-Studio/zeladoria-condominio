import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequests, vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderGanhosClient } from "./ganhos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ganhos & Financeiro · Zeladoria Prestadores",
  description: "Acompanhe faturamento, serviços concluídos e comissões.",
};

export default async function PrestadorGanhosPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  const completedServices = await db
    .select({
      id: serviceRequests.id,
      code: serviceRequests.code,
      title: serviceRequests.title,
      finalAmountCents: serviceRequests.finalAmountCents,
      platformFeeCents: serviceRequests.platformFeeCents,
      completedAt: serviceRequests.completedAt,
      createdAt: serviceRequests.createdAt,
    })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.vendorId, targetVendor.id),
        eq(serviceRequests.status, "concluido")
      )
    )
    .orderBy(desc(serviceRequests.completedAt));

  return <ProviderGanhosClient vendor={targetVendor} services={completedServices} />;
}
