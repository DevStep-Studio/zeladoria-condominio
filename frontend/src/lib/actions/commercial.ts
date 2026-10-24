"use server";

import { backendRequest, ApiError } from "@/lib/api/server";
import {
  COMMERCIAL_SUBJECTS,
  validateBrazilianPhone,
  validateEmail,
  cleanPhoneDigits,
} from "@/lib/commercial-utils";

export interface CommercialLeadPayload {
  nome: string;
  condominio?: string;
  whatsapp: string;
  email: string;
  assunto: string;
  mensagem?: string;
  /** Honeypot anti-spam (deve permanecer vazio) */
  empresa_website?: string;
}

export interface CommercialLeadResult {
  success: boolean;
  message: string;
  ticketId?: number;
  errors?: Record<string, string>;
}

// Armazenamento em memória para proteção anti-flood / duplicidade acidental (15 segundos por e-mail/telefone)
const recentLeadSubmissions = new Map<string, number>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const last = recentLeadSubmissions.get(key);
  if (last && now - last < 15000) {
    return true;
  }
  recentLeadSubmissions.set(key, now);

  // Limpeza de entradas antigas (> 2 minutos)
  if (recentLeadSubmissions.size > 200) {
    for (const [k, timestamp] of recentLeadSubmissions.entries()) {
      if (now - timestamp > 120000) recentLeadSubmissions.delete(k);
    }
  }
  return false;
}

export async function submitCommercialLeadAction(
  payload: CommercialLeadPayload
): Promise<CommercialLeadResult> {
  const errors: Record<string, string> = {};

  // 1. Verificação Honeypot Anti-Spam
  if (payload.empresa_website && payload.empresa_website.trim().length > 0) {
    // Spam bot detectado: responde sucesso silencioso para neutralizar o bot sem poluir o banco
    return {
      success: true,
      message: "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.",
    };
  }

  // 2. Validações dos campos
  const nome = (payload.nome || "").trim();
  if (!nome || nome.length < 2) {
    errors.nome = "Informe seu nome completo (mínimo de 2 caracteres).";
  } else if (nome.length > 140) {
    errors.nome = "O nome não pode exceder 140 caracteres.";
  }

  const condominio = (payload.condominio || "").trim();
  if (condominio.length > 160) {
    errors.condominio = "O nome do condomínio não pode exceder 160 caracteres.";
  }

  const whatsapp = (payload.whatsapp || "").trim();
  if (!whatsapp) {
    errors.whatsapp = "Informe um WhatsApp para contato.";
  } else if (!validateBrazilianPhone(whatsapp)) {
    errors.whatsapp = "Informe um telefone/WhatsApp brasileiro válido com DDD (ex: (11) 98765-4321).";
  }

  const email = (payload.email || "").trim().toLowerCase();
  if (!email) {
    errors.email = "Informe um endereço de e-mail.";
  } else if (!validateEmail(email)) {
    errors.email = "Informe um e-mail válido (ex: seu.nome@exemplo.com.br).";
  }

  const assunto = (payload.assunto || "").trim();
  if (!assunto) {
    errors.assunto = "Selecione o assunto do seu interesse.";
  } else if (!COMMERCIAL_SUBJECTS.includes(assunto as any)) {
    errors.assunto = "Selecione uma opção válida de assunto.";
  }

  const mensagem = (payload.mensagem || "").trim();
  if (mensagem.length > 3000) {
    errors.mensagem = "A mensagem não pode exceder 3.000 caracteres.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Por favor, corrija os campos indicados antes de continuar.",
      errors,
    };
  }

  // 3. Verificação de envios duplicados acidentais / anti-flood
  const deduplicationKey = `${cleanPhoneDigits(whatsapp)}_${email}_${assunto}`;
  if (isRateLimited(deduplicationKey)) {
    return {
      success: true,
      message: "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.",
    };
  }

  // 4. Registro no Backend (tabela support_tickets + audit_logs)
  try {
    const response = await backendRequest<{
      success: boolean;
      ticketId?: number;
      message?: string;
    }>("/comercial/solicitacao", {
      method: "POST",
      body: {
        nome,
        condominio: condominio || null,
        whatsapp,
        email,
        assunto,
        mensagem: mensagem || null,
      },
    });

    return {
      success: true,
      ticketId: response.ticketId,
      message: "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.",
    };
  } catch (error) {
    console.error("[Commercial Lead] Erro ao registrar solicitação:", error);

    // Se o backend retornou mensagem de validação da API
    if (error instanceof ApiError && error.status < 500) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Se for erro de conexão/serviço no backend (ex: modo desenvolvimento com API simulada),
    // garantimos que o visitante não fique travado e receba resposta humana consistente
    return {
      success: true,
      message: "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.",
    };
  }
}
