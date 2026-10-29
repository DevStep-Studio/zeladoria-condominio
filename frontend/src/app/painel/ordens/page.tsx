import { domainRequest } from "@/lib/api/server";
import { requirePermission } from "@/lib/auth";
import { OrdensClient } from "./ordens-client";

export const dynamic = "force-dynamic";

export default async function OrdensPage() {
  // Backend security guard: only users with permission can access
  await requirePermission("service_order.view");

  const maintenanceData = await domainRequest<{
    orderRows?: any[];
    assetRows?: any[];
    planRows?: any[];
    vendorRows?: any[];
  }>("/painel/manutencao").catch(() => ({ orderRows: [], assetRows: [], vendorRows: [] }));

  return (
    <OrdensClient
      initialOrders={maintenanceData.orderRows || []}
      assets={maintenanceData.assetRows || []}
      vendors={maintenanceData.vendorRows || []}
    />
  );
}
