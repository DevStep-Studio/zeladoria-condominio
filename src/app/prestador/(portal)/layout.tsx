import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { ProviderShell } from "./provider-shell";

export const dynamic = "force-dynamic";

export default async function PrestadorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, vendor } = await requireProvider();

  if (!vendor && session.role !== "superadmin") {
    redirect("/prestador/cadastro");
  }

  return (
    <ProviderShell session={session} vendor={vendor}>
      {children}
    </ProviderShell>
  );
}
