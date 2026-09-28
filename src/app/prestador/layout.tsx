import { redirect } from "next/navigation";
import { getSession, requireProvider } from "@/lib/auth";
import { ProviderShell } from "./provider-shell";

export default async function PrestadorLayout({
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
