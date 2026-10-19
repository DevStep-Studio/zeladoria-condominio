import { getPublicProvider } from "@/lib/api/marketplace";
import { notFound } from "next/navigation";

import { StorefrontClient } from "@/app/servicos/[slug]/storefront-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicProvider(slug);
  const vendor = data?.vendor;

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

  const data = await getPublicProvider(slug);
  if (!data) notFound();
  return <StorefrontClient vendor={data.vendor} reviews={data.reviews} />;
}
