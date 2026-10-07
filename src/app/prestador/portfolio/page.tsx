import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { PortfolioClient } from "./portfolio-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfólio de Trabalhos · Zeladoria Prestadores",
  description: "Cadastre e gerencie fotos dos seus trabalhos realizados com títulos e categorias.",
};

export default async function PrestadorPortfolioPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  return <PortfolioClient vendor={targetVendor} />;
}
