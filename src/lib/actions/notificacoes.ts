"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { num } from "@/lib/utils";

export async function markNotificationAsReadAction(formData: FormData) {
  const session = await requireSession();
  const id = num(formData, "id");
  if (!id) return { success: false };

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

  revalidatePath("/painel/notificacoes");
  revalidatePath("/painel");
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const session = await requireSession();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        isNull(notifications.readAt),
      ),
    );

  revalidatePath("/painel/notificacoes");
  revalidatePath("/painel");
  return { success: true };
}
