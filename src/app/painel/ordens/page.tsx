import { requirePermission } from "@/lib/auth";
import { OrdensClient } from "./ordens-client";

export const dynamic = "force-dynamic";

export default async function OrdensPage() {
  // Backend security guard: only users with permission can access
  await requirePermission("service_order.view");

  return <OrdensClient />;
}
