import { getPublicProvider } from "@/lib/api/marketplace";
import { notFound } from "next/navigation";

import { StorefrontClient } from "./storefront-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicProvider(slug);
  const vendor = data?.vendor;

  if (!vendor) return { title: "Prestador não encontrado · Zeladoria Serviços" };

  return {
    title: `${vendor.companyName || vendor.name} · Zeladoria Serviços`,
    description: `Contrate ${vendor.name} para serviços de ${vendor.category} em condomínios.`,
  };
}

export default async function ProviderStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getPublicProvider(slug);
  if (!data) notFound();
  return <StorefrontClient vendor={data.vendor} reviews={data.reviews} />;
}
