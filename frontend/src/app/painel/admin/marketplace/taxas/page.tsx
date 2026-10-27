import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminMarketplaceTaxasPage() {
  redirect("/painel/admin/zeladoria-pay?tab=comissoes");
}
