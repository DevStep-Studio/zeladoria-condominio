import { domainRequest } from "@/lib/api/server";
import { requireCondo } from "@/lib/auth";
import { NotificacoesClient, type NotificationItem } from "./notificacoes-client";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const { condoId } = await requireCondo();

  let notifications: NotificationItem[] = [];
  try {
    const res = await domainRequest<any[]>("/painel/notificacoes", {
      query: { condoId },
    });
    if (Array.isArray(res)) {
      notifications = res.map((r: any) => ({
        id: Number(r.id),
        condoId: Number(r.condoId || condoId),
        userId: Number(r.userId),
        title: String(r.title || "Notificação"),
        body: r.body ? String(r.body) : null,
        channel: String(r.channel || "app"),
        link: r.link ? String(r.link) : null,
        readAt: r.readAt ? String(r.readAt) : null,
        createdAt: String(r.createdAt || new Date().toISOString()),
      }));
    }
  } catch (err) {
    console.error("[Notificacoes] Erro ao carregar notificações:", err);
  }

  return <NotificacoesClient initialNotifications={notifications} />;
}
