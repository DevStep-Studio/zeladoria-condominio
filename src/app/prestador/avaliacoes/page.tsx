import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceReviews, users, vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { AvaliacoesClient } from "./avaliacoes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avaliações e Reputação · Zeladoria Prestadores",
  description: "Acompanhe suas avaliações verificadas de atendimentos concluídos no condomínio.",
};

export default async function PrestadorAvaliacoesPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  const reviews = await db
    .select({
      id: serviceReviews.id,
      rating: serviceReviews.rating,
      punctualityRating: serviceReviews.punctualityRating,
      qualityRating: serviceReviews.qualityRating,
      communicationRating: serviceReviews.communicationRating,
      costBenefitRating: serviceReviews.costBenefitRating,
      comment: serviceReviews.comment,
      isVerified: serviceReviews.isVerified,
      createdAt: serviceReviews.createdAt,
      customerName: users.name,
    })
    .from(serviceReviews)
    .innerJoin(users, eq(users.id, serviceReviews.customerId))
    .where(eq(serviceReviews.vendorId, targetVendor.id))
    .orderBy(desc(serviceReviews.createdAt));

  return <AvaliacoesClient vendor={targetVendor} reviews={reviews} />;
}
