"use server";
import { domainAction } from "@/lib/api/domain";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { authenticate, destroySession, getSession, setActiveCondo, setActiveRole, type Role } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { str } from "@/lib/utils";

export async function loginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return "Informe e-mail e senha.";
  const user = await authenticate(email, password);
  if (!user) {
    await logAudit({
      session: null,
      condoId: null,
      action: "login_negado",
      entity: "auth",
      summary: `Tentativa de acesso negada para ${email}`,
      critical: true,
      origin: "login",
    });
    return "Credenciais inválidas. Verifique e tente novamente.";
  }
  const session = await getSession();
  await logAudit({
    session,
    condoId: session?.condo?.id ?? null,
    action: "login",
    entity: "auth",
    entityId: user.id,
    summary: `${user.name} acessou o sistema`,
    origin: "login",
  });
  redirect(session?.role === "prestador" ? "/prestador" : "/painel");
}

export async function providerLoginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return "Informe e-mail e senha.";
  const user = await authenticate(email, password, true);
  if (!user) {
    return "Credenciais inválidas. Verifique e tente novamente.";
  }
  const session = await getSession();
  await logAudit({
    session,
    condoId: session?.condo?.id ?? null,
    action: "login_prestador",
    entity: "auth",
    entityId: user.id,
    summary: `${user.name} acessou a área do prestador`,
    origin: "login_prestador",
  });
  redirect("/prestador");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logAudit({
      session,
      condoId: session.condo?.id ?? null,
      action: "logout",
      entity: "auth",
      entityId: session.user.id,
      summary: `${session.user.name} encerrou a sessão`,
    });
  }
  await destroySession();
  redirect("/login");
}

export async function switchCondoAction(formData: FormData) {
  const condoId = Number(formData.get("condoId"));
  if (Number.isFinite(condoId) && condoId > 0) {
    const session = await getSession();
    if (session && (session.user.isSuperAdmin || session.memberships.some((m) => m.condoId === condoId))) {
      await setActiveCondo(condoId);
      await logAudit({
        session,
        condoId,
        action: "trocar_condominio",
        entity: "auth",
        entityId: condoId,
        summary: `${session.user.name} alternou para condomínio #${condoId}`,
      });
    }
  }
  revalidatePath("/painel", "layout");
  redirect("/painel");
}

export async function switchRoleAction(formData: FormData) {
  const targetRole = formData.get("role") as Role | null;
  if (!targetRole) return;

  const session = await getSession();
  if (!session || !session.availableRoles.includes(targetRole)) return;

  await setActiveRole(targetRole);

  // Se estiver alternando para morador ou síndico e o condomínio atual não tiver esse papel,
  // selecionar o primeiro condomínio onde o usuário possui esse papel
  if (targetRole !== "prestador" && targetRole !== "superadmin") {
    const matchingMembership = session.memberships.find((m) => m.role === targetRole);
    if (matchingMembership && (!session.condo || session.role !== targetRole)) {
      await setActiveCondo(matchingMembership.condoId);
    }
  }

  await logAudit({
    session,
    condoId: session.condo?.id ?? null,
    action: "trocar_perfil",
    entity: "auth",
    entityId: session.user.id,
    summary: `${session.user.name} alternou perfil para ${targetRole}`,
  });

  revalidatePath("/painel", "layout");
  revalidatePath("/prestador", "layout");

  if (targetRole === "prestador") {
    redirect("/prestador");
  } else if (targetRole === "superadmin") {
    redirect("/painel/admin");
  } else {
    redirect("/painel");
  }
}

export async function setThemeAction(theme: string) {
  const session = await getSession();
  if (!session) return;
  await domainAction("/auth/theme", "PATCH", { theme: theme === "dark" ? "dark" : "light" });
}
