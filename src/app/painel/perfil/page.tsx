import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, condominiums, memberships, units, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { PerfilClient } from "./perfil-client";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await requireSession();

  // Load fresh user data
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  // Load all memberships with condo & unit info
  const userMemberships = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      condoId: condominiums.id,
      condoName: condominiums.name,
      condoCity: condominiums.city,
      condoState: condominiums.state,
      unitNumber: units.number,
      unitFloor: units.floor,
      blockName: blocks.name,
    })
    .from(memberships)
    .innerJoin(condominiums, eq(condominiums.id, memberships.condoId))
    .leftJoin(units, eq(units.id, memberships.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .where(eq(memberships.userId, session.user.id));

  return (
    <PerfilClient
      user={userData}
      memberships={userMemberships}
      activeCondoId={session.condo?.id ?? null}
    />
  );
}
