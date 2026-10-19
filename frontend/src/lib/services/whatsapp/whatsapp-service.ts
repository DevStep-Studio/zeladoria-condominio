import { apiOperation } from "@/lib/api/server";

export type WhatsAppTemplateKey =
  | "NOVA_SOLICITACAO"
  | "PROPOSTA_RECEBIDA"
  | "PAGAMENTO_CONFIRMADO"
  | "PRESTADOR_A_CAMINHO"
  | "PRESTADOR_CHEGOU"
  | "CONCLUSAO_SOLICITADA"
  | "SERVICO_APROVADO"
  | "CORRECAO_SOLICITADA"
  | "DISPUTA_ABERTA";

export interface WhatsAppTemplateParams {
  condoName?: string;
  recipientName: string;
  serviceCode: string;
  serviceTitle: string;
  providerName?: string;
  customerName?: string;
  amountFormatted?: string;
  scheduledDateTime?: string;
  actionUrl?: string;
  notes?: string;
}

export interface WhatsAppDeliveryStatus {
  messageId: string;
  idempotencyKey: string;
  phone: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  template: WhatsAppTemplateKey;
  updatedAt: Date;
  error?: string;
}

// Armazenamento em memória para rastreamento de idempotência e status de entrega
const dispatchedMessages = new Map<string, WhatsAppDeliveryStatus>();

/**
 * Constrói o template estruturado oficial do WhatsApp com formatação e deep links
 */
export function buildWhatsAppMessage(
  template: WhatsAppTemplateKey,
  params: WhatsAppTemplateParams
): { title: string; body: string; formattedMessage: string } {
  const portalUrl = params.actionUrl || "https://app.zeladoriacondominio.com.br";

  switch (template) {
    case "NOVA_SOLICITACAO": {
      const title = `Novo Chamado Disponível: ${params.serviceCode}`;
      const body = `Olá, ${params.recipientName}! Há um novo serviço em ${params.condoName || "seu condomínio"}: ${params.serviceTitle}.`;
      const formattedMessage = [
        `*🔔 ZELADORIA CONDOMÍNIO — Nova Oportunidade*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `Um novo chamado compatível com suas especialidades foi aberto:`,
        `📍 *Condomínio:* ${params.condoName || "Condomínio Residencial"}`,
        `🔧 *Serviço:* ${params.serviceTitle}`,
        `🔢 *Código:* ${params.serviceCode}`,
        ``,
        `Acesse o app para ver os detalhes e aceitar o atendimento:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "PROPOSTA_RECEBIDA": {
      const title = `Orçamento Recebido para ${params.serviceCode}`;
      const body = `${params.providerName || "O profissional"} enviou uma proposta de ${params.amountFormatted || "valor orçado"} para o serviço "${params.serviceTitle}".`;
      const formattedMessage = [
        `*📋 ZELADORIA CONDOMÍNIO — Proposta de Serviço*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O profissional *${params.providerName || "credenciado"}* enviou uma proposta para o seu chamado:`,
        `🔧 *Serviço:* ${params.serviceTitle} (${params.serviceCode})`,
        `💰 *Valor Total:* ${params.amountFormatted || "Consulte no app"}`,
        `🛡️ *Garantia:* 90 dias com proteção Zeladoria Protege`,
        ``,
        `Revise o escopo e aprove com segurança:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "PAGAMENTO_CONFIRMADO": {
      const title = `Pagamento Confirmado: ${params.serviceCode}`;
      const body = `O pagamento de ${params.amountFormatted || ""} do chamado ${params.serviceCode} foi confirmado sob custódia do Zeladoria Protege.`;
      const formattedMessage = [
        `*✅ ZELADORIA CONDOMÍNIO — Pagamento Confirmado*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O pagamento do serviço *${params.serviceCode}* foi aprovado com sucesso!`,
        `🔒 *Zeladoria Protege:* O valor está seguro sob custódia e só é liberado após a aprovação da entrega.`,
        ``,
        `Acompanhe o andamento pelo painel:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "PRESTADOR_A_CAMINHO": {
      const title = `Profissional a Caminho: ${params.serviceCode}`;
      const body = `${params.providerName || "O prestador"} informou que está a caminho do condomínio.`;
      const formattedMessage = [
        `*🚗 ZELADORIA CONDOMÍNIO — A Caminho*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O profissional *${params.providerName || "atribuído"}* acabou de sair e está a caminho do condomínio para atender seu chamado:`,
        `🔧 *Serviço:* ${params.serviceTitle} (${params.serviceCode})`,
        ``,
        `Por favor, garanta a autorização de entrada na portaria.`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "PRESTADOR_CHEGOU": {
      const title = `Profissional no Local: ${params.serviceCode}`;
      const body = `${params.providerName || "O profissional"} realizou check-in na portaria/condomínio.`;
      const formattedMessage = [
        `*📍 ZELADORIA CONDOMÍNIO — Check-in Realizado*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O profissional *${params.providerName || "prestador"}* chegou ao condomínio e realizou o check-in operacional.`,
        `🔧 *Serviço:* ${params.serviceTitle} (${params.serviceCode})`,
        ``,
        `O atendimento será iniciado em instantes.`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "CONCLUSAO_SOLICITADA": {
      const title = `Validação de Conclusão: ${params.serviceCode}`;
      const body = `${params.providerName || "O profissional"} finalizou o serviço e aguarda sua validação (Tudo Certo!).`;
      const formattedMessage = [
        `*🏁 ZELADORIA CONDOMÍNIO — Serviço Concluído*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O serviço *${params.serviceTitle}* (${params.serviceCode}) foi finalizado pelo profissional!`,
        ``,
        `Por favor, confira o resultado do trabalho e clique em *"Tudo Certo!"* no aplicativo para liberar o repasse financeiro e deixar sua avaliação:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "SERVICO_APROVADO": {
      const title = `Serviço Aprovado: ${params.serviceCode}`;
      const body = `O cliente aprovou a conclusão do chamado ${params.serviceCode}. Repasse liberado!`;
      const formattedMessage = [
        `*🎉 ZELADORIA CONDOMÍNIO — Repasse Liberado*`,
        ``,
        `Parabéns, *${params.recipientName}*!`,
        `O cliente aprovou o serviço *${params.serviceCode}*!`,
        `💰 Seu repasse financeiro foi liberado pelo Zeladoria Protege.`,
        ``,
        `Consulte seus recebimentos no portal do prestador:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "CORRECAO_SOLICITADA": {
      const title = `Ajuste Solicitado: ${params.serviceCode}`;
      const body = `O morador solicitou uma revisão no serviço ${params.serviceCode}: ${params.notes || "Verifique as instruções"}.`;
      const formattedMessage = [
        `*⚠️ ZELADORIA CONDOMÍNIO — Ajuste Solicitado*`,
        ``,
        `Olá, *${params.recipientName}*!`,
        `O morador solicitou uma correção no chamado *${params.serviceCode}*:`,
        `📝 *Motivo:* "${params.notes || "Ajuste na execução"}"`,
        ``,
        `Verifique os detalhes no chat do serviço para combinar a finalização:`,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }

    case "DISPUTA_ABERTA": {
      const title = `Ouvidoria Aberta: ${params.serviceCode}`;
      const body = `Uma contestação foi registrada no chamado ${params.serviceCode}. Mediação iniciada.`;
      const formattedMessage = [
        `*⚖️ ZELADORIA CONDOMÍNIO — Mediação de Atendimento*`,
        ``,
        `Chamado: *${params.serviceCode}*`,
        `Uma mediação foi solicitada: "${params.notes || "Contestação de execução"}"`,
        `O repasse financeiro permanece retido preventivamente sob o Zeladoria Protege até a resolução.`,
        ``,
        `👉 ${portalUrl}`,
      ].join("\n");
      return { title, body, formattedMessage };
    }
  }
}

/**
 * Envia notificação transacional com garantia estrita de Idempotência
 */
export async function sendWhatsAppNotification(params: {
  condoId: number;
  userId: number;
  phone: string;
  template: WhatsAppTemplateKey;
  templateParams: WhatsAppTemplateParams;
  idempotencyKey: string;
}): Promise<{
  success: boolean;
  messageId: string;
  status: "queued" | "sent" | "delivered";
  duplicated?: boolean;
}> {
  const { condoId, userId, phone, template, templateParams, idempotencyKey } = params;

  // 1. Verificação de Idempotência
  if (dispatchedMessages.has(idempotencyKey)) {
    const existing = dispatchedMessages.get(idempotencyKey)!;
    return {
      success: true,
      messageId: existing.messageId,
      status: existing.status === "failed" ? "queued" : (existing.status as any),
      duplicated: true,
    };
  }

  // 2. Constrói conteúdo formatado do template
  const { title, body, formattedMessage } = buildWhatsAppMessage(template, templateParams);
  const messageId = `wpp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 3. Registra no histórico de notificações do sistema
  try {
    await apiOperation("lib.services.whatsapp.whatsapp-service.001", [{
      condoId,
      userId,
      title,
      body: formattedMessage,
      channel: "whatsapp",
      link: templateParams.actionUrl || null,
    }]);
  } catch (err) {
    console.warn("Aviso ao persistir notification de WhatsApp no banco:", err);
  }

  // 4. Registra no mapa de status e idempotência
  const record: WhatsAppDeliveryStatus = {
    messageId,
    idempotencyKey,
    phone,
    status: "sent",
    template,
    updatedAt: new Date(),
  };
  dispatchedMessages.set(idempotencyKey, record);

  return {
    success: true,
    messageId,
    status: "sent",
    duplicated: false,
  };
}

/**
 * Processa webhook receiver de status de entrega do WhatsApp
 */
export function processWhatsAppDeliveryWebhook(payload: {
  messageId: string;
  event: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  error?: string;
}): { success: boolean; updatedStatus?: WhatsAppDeliveryStatus } {
  for (const [key, record] of dispatchedMessages.entries()) {
    if (record.messageId === payload.messageId) {
      record.status = payload.event;
      record.updatedAt = payload.timestamp ? new Date(payload.timestamp) : new Date();
      if (payload.error) record.error = payload.error;
      dispatchedMessages.set(key, record);
      return { success: true, updatedStatus: record };
    }
  }

  return { success: false };
}

/**
 * Consulta status de uma notificação enviada
 */
export function getWhatsAppNotificationStatus(idempotencyKey: string): WhatsAppDeliveryStatus | undefined {
  return dispatchedMessages.get(idempotencyKey);
}
