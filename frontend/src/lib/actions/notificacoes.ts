"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import { requireSession } from "@/lib/auth";
import { num } from "@/lib/utils";

export async function markNotificationAsReadAction(formData: FormData) {
  await requireSession();
  const id = num(formData, "id");
  if (!id) return { success: false };

  await domainAction(`/notificacoes/${id}/lida`, "PATCH");

  revalidatePath("/painel/notificacoes");
  revalidatePath("/painel");
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  await requireSession();

  await domainAction("/notificacoes/ler-todas", "POST");

  revalidatePath("/painel/notificacoes");
  revalidatePath("/painel");
  return { success: true };
}
