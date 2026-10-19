import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { PerfilClient } from "./perfil-client";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await requireSession();

  const { userData, userMemberships } = await domainRequest<{
    userData: any;
    userMemberships: any[];
  }>("/painel/perfil");

  return (
    <PerfilClient
      user={userData}
      memberships={userMemberships}
      activeCondoId={session.condo?.id ?? null}
    />
  );
}
