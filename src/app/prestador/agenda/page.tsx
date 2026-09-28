import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequests, users, vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderAgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Minha Agenda · Zeladoria Prestadores",
  description: "Visualize seus serviços agendados e configure sua disponibilidade.",
};

export default async function PrestadorAgendaPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  const scheduledRequests = await db
    .select({
      id: serviceRequests.id,
      code: serviceRequests.code,
      title: serviceRequests.title,
      scheduledDate: serviceRequests.scheduledDate,
      scheduledTimeSlot: serviceRequests.scheduledTimeSlot,
      location: serviceRequests.location,
      status: serviceRequests.status,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .where(
      and(
        eq(serviceRequests.vendorId, targetVendor.id),
        eq(serviceRequests.status, "aceito")
      )
    )
    .orderBy(desc(serviceRequests.createdAt));

  return <ProviderAgendaClient vendor={targetVendor} appointments={scheduledRequests} />;
}
