"use server";

import { domainRequest } from "@/lib/api/server";
import { requireCondo, requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Marca uma notificação individual como lida
 */
export async function markNotificationReadAction(notificationId: number) {
  try {
    await requireSession();
    await domainRequest(`/notificacoes/${notificationId}/lida`, {
      method: "PATCH",
    });

    revalidatePath("/painel/notificacoes");
    revalidatePath("/painel", "layout");
    revalidatePath("/prestador", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao marcar notificação como lida:", err);
    return { success: false, error: err?.message || "Erro ao atualizar notificação." };
  }
}

/**
 * Marca todas as notificações do usuário no condomínio ativo como lidas
 */
export async function markAllNotificationsReadAction() {
  try {
    const { session, condoId } = await requireCondo();
    await domainRequest("/notificacoes/ler-todas", {
      method: "POST",
      body: {
        userId: session.user.id,
        condoId: condoId > 0 ? condoId : undefined,
      },
    });

    revalidatePath("/painel/notificacoes");
    revalidatePath("/painel", "layout");
    revalidatePath("/prestador", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao marcar todas as notificações como lidas:", err);
    return { success: false, error: err?.message || "Erro ao atualizar notificações." };
  }
}
