import { domainRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/auth";
import { AdminPrestadoresClient } from "./admin-prestadores-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Prestadores · Admin da Plataforma",
  description: "Profissionais e empresas parceiras cadastradas no Marketplace Zeladoria.",
};

export default async function AdminPrestadoresPage() {
  await requireSession();

  const vendorsList = await domainRequest<any[]>("/painel/admin/prestadores").catch(() => []);

  return <AdminPrestadoresClient initialVendors={vendorsList} />;
}
