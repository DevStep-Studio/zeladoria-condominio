import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceReviews, users, vendors } from "@/db/schema";
import { StorefrontClient } from "@/app/servicos/[slug]/storefront-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [vendor] = await db
    .select({ name: vendors.name, companyName: vendors.companyName, category: vendors.category })
    .from(vendors)
    .where(eq(vendors.slug, slug))
    .limit(1);

  if (!vendor) return { title: "Prestador não encontrado · Zeladoria Serviços" };

  return {
    title: `${vendor.companyName || vendor.name} · Zeladoria Serviços`,
    description: `Perfil profissional de ${vendor.name} para serviços de ${vendor.category}.`,
  };
}

export default async function PrestadorSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slug))
    .limit(1);

  if (!vendor) {
    const numId = parseInt(slug, 10);
    if (!isNaN(numId)) {
      const [vById] = await db.select().from(vendors).where(eq(vendors.id, numId)).limit(1);
      if (vById) {
        notFound();
      }
    }
    notFound();
  }

  // Load reviews for this vendor
  const reviews = await db
    .select({
      id: serviceReviews.id,
      rating: serviceReviews.rating,
      comment: serviceReviews.comment,
      createdAt: serviceReviews.createdAt,
      authorName: users.name,
      punctualityRating: serviceReviews.punctualityRating,
      qualityRating: serviceReviews.qualityRating,
      costBenefitRating: serviceReviews.costBenefitRating,
    })
    .from(serviceReviews)
    .innerJoin(users, eq(users.id, serviceReviews.customerId))
    .where(eq(serviceReviews.vendorId, vendor.id))
    .orderBy(desc(serviceReviews.createdAt))
    .limit(20);

  return <StorefrontClient vendor={vendor} reviews={reviews} />;
}
