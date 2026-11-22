import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/internal/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  // Regra crítica de segurança: Admin da Plataforma é restrito a superadmin
  if (session.role !== "superadmin") {
    redirect("/painel/403");
  }

  return <AdminShell>{children}</AdminShell>;
}
