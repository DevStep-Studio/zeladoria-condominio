import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const session = await requireSession();

  if (session.role !== "superadmin") {
    redirect("/painel/403");
  }

  redirect("/painel/admin");
}
