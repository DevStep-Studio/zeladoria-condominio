/**
 * Integração OneSignal — Notificações Push Web & Mobile
 * Documentação: https://documentation.onesignal.com/
 * 
 * Arquitetura Obrigatória:
 * 1. O banco interno (tabela `notifications`) é a fonte de verdade absoluta.
 * 2. O envio push externo é assíncrono e opcional. Se falhar, a notificação interna continua íntegra.
 * 3. Identificação estrita por `external_id` (ex: `user_123`), garantindo isolamento total por condomínio.
 */

import { canMakeApiCall, recordApiUsage } from "./usage-tracker";

export interface PushNotificationPayload {
  userId: number;
  condoId: number;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
}

export interface PushDispatchResult {
  success: boolean;
  externalDelivered: boolean;
  provider: "onesignal" | "webpush" | "internal_only";
  notificationId?: string;
  error?: string;
}

export function getOneSignalConfig() {
  const appId = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
  const apiKey = process.env.ONESIGNAL_REST_API_KEY || "";
  return { appId, apiKey, isConfigured: Boolean(appId && apiKey) };
}

/**
 * Envia notificação push para um usuário específico utilizando OneSignal
 */
export async function dispatchOneSignalPush(payload: PushNotificationPayload): Promise<PushDispatchResult> {
  const config = getOneSignalConfig();

  // Se o OneSignal não estiver com chave configurada, conclui graciosamente sem erro
  if (!config.isConfigured) {
    return {
      success: true,
      externalDelivered: false,
      provider: "internal_only",
    };
  }

  const { allowed, reason } = canMakeApiCall("onesignal");
  if (!allowed) {
    console.warn(`[OneSignal] Envio externo pausado pelo monitor de cotas: ${reason}`);
    return {
      success: true,
      externalDelivered: false,
      provider: "internal_only",
      error: reason,
    };
  }

  const startTime = Date.now();
  const externalUserId = `user_${payload.userId}_condo_${payload.condoId}`;

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        include_aliases: {
          external_id: [externalUserId],
        },
        target_channel: "push",
        headings: {
          en: payload.title,
          pt: payload.title,
        },
        contents: {
          en: payload.body,
          pt: payload.body,
        },
        url: payload.url,
        data: {
          condoId: payload.condoId,
          userId: payload.userId,
          ...(payload.data || {}),
        },
      }),
      signal: AbortSignal.timeout(4500),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      recordApiUsage({
        service: "onesignal",
        action: "dispatchPush",
        success: false,
        statusCode: response.status,
        durationMs,
        message: `HTTP ${response.status}`,
      });

      return {
        success: true, // Não falha a operação principal
        externalDelivered: false,
        provider: "onesignal",
        error: `Falha na API OneSignal (${response.status})`,
      };
    }

    const data = await response.json();

    recordApiUsage({
      service: "onesignal",
      action: "dispatchPush",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `Push despachado para ${externalUserId}`,
    });

    return {
      success: true,
      externalDelivered: true,
      provider: "onesignal",
      notificationId: data?.id,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "onesignal",
      action: "dispatchPush",
      success: false,
      durationMs,
      message: err?.message || "Timeout de push",
    });

    return {
      success: true, // Mantém sucesso da notificação no sistema
      externalDelivered: false,
      provider: "onesignal",
      error: err?.message,
    };
  }
}
