/**
 * Integração Oficial Resend — E-mails Transacionais
 * Documentação: https://resend.com/docs
 * 
 * Limite do Plano Gratuito:
 * - 100 e-mails / dia
 * - 3.000 e-mails / mês
 * 
 * Regras:
 * - Envio exclusivo pelo backend / server actions
 * - Bloqueio automático ao atingir o limite para prevenir cobranças
 * - Templates consistentes com a identidade visual do Zeladoria Condomínio
 */

import { Resend } from "resend";
import { canMakeApiCall, recordApiUsage } from "./usage-tracker";

export const DEFAULT_FROM_EMAIL = "Zeladoria Condomínio <onboarding@resend.dev>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

// Chave para idempotência em memória (evita envios acidentais em duplicidade no intervalo de 30 segundos)
const recentDispatches = new Set<string>();

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY || "";
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

/**
 * Cria a estrutura HTML base dos e-mails transacionais do Zeladoria Condomínio
 */
export function buildHtmlTemplate(params: {
  title: string;
  greeting?: string;
  contentHtml: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}): string {
  const { title, greeting, contentHtml, buttonText, buttonUrl, footerNote } = params;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <!-- Cabeçalho com Logotipo -->
          <tr>
            <td style="padding: 32px 36px; background-color: #FFFFFF; border-bottom: 2px solid #F1F5F9; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                        Zeladoria <span style="color: #1355FF;">Condomínio</span>
                      </span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #EFF6FF; color: #1355FF; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Notificação
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 36px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                ${title}
              </h1>
              
              ${greeting ? `<p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; font-weight: 600;">${greeting}</p>` : ""}

              <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 28px;">
                ${contentHtml}
              </div>

              ${
                buttonText && buttonUrl
                  ? `
                <div style="margin: 32px 0 20px 0; text-align: left;">
                  <a href="${buttonUrl}" style="display: inline-block; background-color: #1355FF; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(19, 85, 255, 0.25);">
                    ${buttonText} &rarr;
                  </a>
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Rodapé de Segurança -->
          <tr>
            <td style="padding: 24px 36px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B; line-height: 1.5;">
              <p style="margin: 0 0 8px 0; font-weight: 600;">
                Zeladoria Condomínio — Gestão Inteligente e Conectada
              </p>
              <p style="margin: 0;">
                ${footerNote || "Este é um e-mail transacional automático do condomínio. Por favor, não responda a esta mensagem."}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envia um e-mail transacional via Resend com controle estrito de limites
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo } = options;
  const targetEmail = Array.isArray(to) ? to[0] : to;

  // Prevenção de duplicidade por chave de idempotência
  const idempotencyKey = `${targetEmail}_${subject}_${Math.floor(Date.now() / 30000)}`;
  if (recentDispatches.has(idempotencyKey)) {
    return {
      success: true,
      simulated: true,
      messageId: `dedup_${Date.now()}`,
    };
  }

  // Verificação de cota gratuita (100/dia)
  const { allowed, reason } = canMakeApiCall("resend");
  if (!allowed) {
    console.warn(`[Resend] Envio cancelado pelo monitor de cotas: ${reason}`);
    return {
      success: false,
      error: reason || "Cota diária de e-mails atingida.",
    };
  }

  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();
  const startTime = Date.now();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: html || (text ? `<p>${text}</p>` : "<p>Notificação Zeladoria Condomínio</p>"),
      text: text || "Notificação Zeladoria Condomínio",
      replyTo,
    });

    const durationMs = Date.now() - startTime;

    if (error) {
      recordApiUsage({
        service: "resend",
        action: "sendTransactionalEmail",
        success: false,
        durationMs,
        message: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }

    recentDispatches.add(idempotencyKey);
    const timer = setTimeout(() => recentDispatches.delete(idempotencyKey), 35000);
    if (typeof (timer as any)?.unref === "function") {
      (timer as any).unref();
    }

    recordApiUsage({
      service: "resend",
      action: "sendTransactionalEmail",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `E-mail enviado para ${targetEmail}: "${subject.slice(0, 30)}"`,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "resend",
      action: "sendTransactionalEmail",
      success: false,
      durationMs,
      message: err?.message || "Exceção inesperada no envio",
    });

    return {
      success: false,
      error: err?.message || "Falha na comunicação com o Resend.",
    };
  }
}
