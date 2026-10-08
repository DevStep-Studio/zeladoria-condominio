import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { DisponibilidadeClient } from "./disponibilidade-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Disponibilidade e Horários · Zeladoria Prestadores",
  description: "Configure sua disponibilidade imediata (ON/OFF), dias de atendimento e raio de cobertura.",
};

export default async function PrestadorDisponibilidadePage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  return <DisponibilidadeClient vendor={targetVendor} />;
}
