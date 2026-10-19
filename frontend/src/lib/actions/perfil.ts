"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest, ApiError } from "@/lib/api/server";
import { domainAction } from "@/lib/api/domain";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { str } from "@/lib/utils";

export async function updateProfileInfoAction(formData: FormData) {
  const session = await requireSession();
  const name = str(formData, "name");
  const phone = str(formData, "phone");
  const document = str(formData, "document");
  const avatarUrl = str(formData, "avatarUrl");

  if (!name) return { success: false, error: "O nome é obrigatório." };

  const result = await domainAction("/perfil", "PATCH", {
    name,
    phone: phone || null,
    document: document || null,
    avatarUrl: avatarUrl || null,
  });
  if (!result.success) return result;

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
  const result = await domainAction("/perfil", "PATCH", { dependents: dependentsList });
  if (!result.success) return result;

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
  const result = await domainAction("/perfil", "PATCH", { vehicles: vehiclesList });
  if (!result.success) return result;

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
  const result = await domainAction("/perfil", "PATCH", { emergencyContacts: contactsList });
  if (!result.success) return result;

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
  await requireSession();
  const result = await domainAction("/perfil", "PATCH", { notificationPreferences: preferences });
  if (!result.success) return result;

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

  try {
    await backendRequest("/auth/password", { method: "PUT", token: (await cookies()).get("gc_session")?.value, body: { currentPassword, newPassword, confirmPassword } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) return { success: false, error: "Verifique a senha atual e a confirmação da nova senha." };
    throw error;
  }

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
  const result = await domainAction("/perfil", "PATCH", { twoFactorEnabled: enabled });
  if (!result.success) return result;

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
