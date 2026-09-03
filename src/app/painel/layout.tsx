import type { ReactNode } from "react";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, notifications } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";
import { getNavigationGroups, getMobileNavItems } from "@/lib/navigation";
import { Shell } from "@/components/shell";
import { logoutAction, switchCondoAction } from "@/lib/actions/session";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const session = await requireSession();
  const condoId = session.condo?.id ?? 0;

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)));

  // Query announcements for dynamic badge
  const [{ annCount } = { annCount: 0 }] = await db
    .select({ annCount: sql<number>`count(*)::int` })
    .from(announcements)
    .where(eq(announcements.condoId, condoId));

  const navigationGroups = getNavigationGroups(session.role, Number(annCount ?? 0));
  const mobileNav = getMobileNavItems(session.role);
  const activeMembership = session.memberships.find((m) => m.condoId === condoId);

  return (
    <Shell
      navigationGroups={navigationGroups}
      mobileNav={mobileNav}
      condos={session.memberships.map((m) => ({ id: m.condoId, name: m.condoName }))}
      activeCondoId={condoId}
      userName={session.user.name}
      roleLabel={ROLE_LABEL[session.role]}
      role={session.role}
      unitLabel={activeMembership?.unitLabel ?? null}
      condoName={session.condo?.name ?? "Condomínio"}
      unread={Number(count ?? 0)}
      switchAction={switchCondoAction}
      logout={logoutAction}
    >
      {children}
    </Shell>
  );
}
