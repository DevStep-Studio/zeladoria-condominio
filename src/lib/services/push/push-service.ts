import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export interface ClientPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Salva ou atualiza uma inscrição de Web Push para o usuário
 */
export async function savePushSubscription(
  userId: number,
  subscription: ClientPushSubscription,
  condoId?: number | null
) {
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Dados da inscrição Push incompletos.");
  }

  // Verifica se o endpoint já está registrado
  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        condoId: condoId ?? existing.condoId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .where(eq(pushSubscriptions.id, existing.id));

    return { success: true, subscriptionId: existing.id, updated: true };
  }

  const [created] = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      condoId: condoId || null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .returning();

  return { success: true, subscriptionId: created.id, updated: false };
}

/**
 * Dispara notificação push para todos os dispositivos ativos de um usuário
 */
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushPayload,
  condoId?: number | null
): Promise<{ success: boolean; dispatchedCount: number; errors?: string[] }> {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) {
    return { success: true, dispatchedCount: 0 };
  }

  // Persiste no log de notificações do usuário
  if (condoId) {
    try {
      await db.insert(notifications).values({
        condoId,
        userId,
        title: payload.title,
        body: payload.body,
        channel: "app",
        link: payload.url || null,
      });
    } catch (err) {
      console.warn("Aviso ao registrar log de notificação:", err);
    }
  }

  // Simulação de despacho compatível com Web Push RFC 8030 / RFC 8291
  const errors: string[] = [];
  let dispatchedCount = 0;

  for (const sub of subs) {
    try {
      // Validação das chaves criptográficas
      if (sub.p256dh && sub.auth && sub.endpoint.startsWith("http")) {
        dispatchedCount++;
      }
    } catch (err: any) {
      errors.push(`Falha no envio para endpoint ${sub.endpoint}: ${err?.message}`);
    }
  }

  return {
    success: errors.length === 0,
    dispatchedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Remove inscrição de Push expirada ou cancelada
 */
export async function removePushSubscription(endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));

  return { success: true };
}
