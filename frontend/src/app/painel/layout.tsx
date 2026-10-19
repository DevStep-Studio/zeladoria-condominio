import { domainRequest } from "@/lib/api/domain";
import type { ReactNode } from "react";

import { requireCondo } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";
import { getNavigationGroups, getMobileNavItems } from "@/lib/navigation";
import { Shell } from "@/components/shell";
import { logoutAction, switchCondoAction } from "@/lib/actions/session";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: ReactNode }) {

  const { session } = await requireCondo();
  const condoId = session.condo?.id ?? 0;

  const { unread, annCount } = await domainRequest<{ unread: number; annCount: number }>(`/painel/layout?condoId=${condoId}`);

  const navigationGroups = getNavigationGroups(session.role, Number(annCount ?? 0));
  const mobileNav = getMobileNavItems(session.role);
  const activeMembership = session.memberships.find((m) => m.condoId === condoId);

  // Deduplicate condos to ensure unique items in switcher
  const uniqueCondos = Array.from(
    new Map(session.memberships.map((m) => [m.condoId, { id: m.condoId, name: m.condoName }])).values()
  );

  return (
    <Shell
      navigationGroups={navigationGroups}
      mobileNav={mobileNav}
      condos={uniqueCondos}
      activeCondoId={condoId}
      userName={session.user.name}
      roleLabel={ROLE_LABEL[session.role]}
      role={session.role}
      unitLabel={activeMembership?.unitLabel ?? null}
      condoName={session.condo?.name ?? "Condomínio"}
      unread={Number(unread ?? 0)}
      switchAction={switchCondoAction}
      logout={logoutAction}
    >
      {children}
    </Shell>
  );
}
