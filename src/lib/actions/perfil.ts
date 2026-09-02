"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession, verifyPassword, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { str, bool } from "@/lib/utils";

export async function updateProfileInfoAction(formData: FormData) {
  const session = await requireSession();
  const name = str(formData, "name");
  const phone = str(formData, "phone");
  const document = str(formData, "document");
  const avatarUrl = str(formData, "avatarUrl");

  if (!name) return { success: false, error: "O nome é obrigatório." };

  await db
    .update(users)
    .set({
      name,
      phone: phone || null,
      document: document || null,
      avatarUrl: avatarUrl || null,
    })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: "atualizar",
    entity: "usuario",
    entityId: session.user.id,
    summary: `Atualizou dados cadastrais de perfil`,
  });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateDependentsAction(dependentsList: any[]) {
  const session = await requireSession();

  await db
    .update(users)
    .set({ dependents: dependentsList })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: "atualizar",
    entity: "dependentes",
    entityId: session.user.id,
    summary: `Atualizou lista de dependentes`,
  });

  revalidatePath("/painel/perfil");
  return { success: true };
}

export async function updateVehiclesAction(vehiclesList: any[]) {
  const session = await requireSession();

  await db
    .update(users)
    .set({ vehicles: vehiclesList })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: "atualizar",
    entity: "veiculos",
    entityId: session.user.id,
    summary: `Atualizou lista de veículos`,
  });

  revalidatePath("/painel/perfil");
  return { success: true };
}

export async function updateEmergencyContactsAction(contactsList: any[]) {
  const session = await requireSession();

  await db
    .update(users)
    .set({ emergencyContacts: contactsList })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: "atualizar",
    entity: "contatos_emergencia",
    entityId: session.user.id,
    summary: `Atualizou contatos de emergência`,
  });

  revalidatePath("/painel/perfil");
  return { success: true };
}

export async function updateNotificationPreferencesAction(preferences: any) {
  const session = await requireSession();

  await db
    .update(users)
    .set({ notificationPreferences: preferences })
    .where(eq(users.id, session.user.id));

  revalidatePath("/painel/perfil");
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const session = await requireSession();
  const currentPassword = str(formData, "currentPassword");
  const newPassword = str(formData, "newPassword");
  const confirmPassword = str(formData, "confirmPassword");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Todos os campos de senha são obrigatórios." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "A confirmação de senha não confere." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "A nova senha deve possuir no mínimo 8 caracteres." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return { success: false, error: "A senha atual está incorreta." };
  }

  const newHash = hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: "alterar_senha",
    entity: "usuario",
    entityId: session.user.id,
    summary: `Alterou a senha de acesso`,
    critical: true,
  });

  revalidatePath("/painel/perfil");
  return { success: true };
}

export async function toggleTwoFactorAction(enabled: boolean) {
  const session = await requireSession();

  await db
    .update(users)
    .set({ twoFactorEnabled: enabled })
    .where(eq(users.id, session.user.id));

  await logAudit({
    session,
    condoId: session.condo?.id ?? 0,
    action: enabled ? "ativar_2fa" : "desativar_2fa",
    entity: "seguranca",
    entityId: session.user.id,
    summary: `${enabled ? "Ativou" : "Desativou"} autenticação em duas etapas`,
    critical: true,
  });

  revalidatePath("/painel/perfil");
  return { success: true };
}
