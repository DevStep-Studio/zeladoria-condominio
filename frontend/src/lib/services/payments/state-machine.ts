/**
 * State Machine Centralizada do Zeladoria Serviços e Zeladoria Pay
 * Define os estados canônicos, transições permitidas e compatibilidade retroativa.
 */

export const SERVICE_STATUSES = {
  REQUESTED: "REQUESTED",
  PROVIDER_REVIEWING: "PROVIDER_REVIEWING",
  VISIT_OFFERED: "VISIT_OFFERED",
  VISIT_PAYMENT_PENDING: "VISIT_PAYMENT_PENDING",
  VISIT_SCHEDULED: "VISIT_SCHEDULED",
  VISIT_COMPLETED: "VISIT_COMPLETED",
  QUOTE_DRAFT: "QUOTE_DRAFT",
  QUOTE_SENT: "QUOTE_SENT",
  QUOTE_REVISION_REQUESTED: "QUOTE_REVISION_REQUESTED",
  QUOTE_ACCEPTED: "QUOTE_ACCEPTED",
  SERVICE_PAYMENT_PENDING: "SERVICE_PAYMENT_PENDING",
  PAID: "PAID",
  SERVICE_SCHEDULED: "SERVICE_SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  PROVIDER_COMPLETED: "PROVIDER_COMPLETED",
  CUSTOMER_CONFIRMED: "CUSTOMER_CONFIRMED",
  DISPUTED: "DISPUTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ServiceLifecycleStatus = (typeof SERVICE_STATUSES)[keyof typeof SERVICE_STATUSES];

/**
 * Matriz de Transições Permitidas
 */
export const ALLOWED_TRANSITIONS: Record<ServiceLifecycleStatus, readonly ServiceLifecycleStatus[]> = {
  REQUESTED: [
    "PROVIDER_REVIEWING",
    "VISIT_OFFERED",
    "QUOTE_SENT",
    "CANCELLED",
  ],
  PROVIDER_REVIEWING: [
    "VISIT_OFFERED",
    "QUOTE_SENT",
    "CANCELLED",
  ],
  VISIT_OFFERED: [
    "VISIT_PAYMENT_PENDING",
    "VISIT_SCHEDULED", // Para vistoria gratuita (sem checkout)
    "CANCELLED",
  ],
  VISIT_PAYMENT_PENDING: [
    "VISIT_SCHEDULED", // Após webhook ou confirmação do PSP
    "VISIT_OFFERED", // Expirou hold de 10 min
    "CANCELLED",
  ],
  VISIT_SCHEDULED: [
    "IN_PROGRESS",
    "VISIT_COMPLETED",
    "CANCELLED",
  ],
  VISIT_COMPLETED: [
    "QUOTE_DRAFT",
    "QUOTE_SENT",
    "CANCELLED",
  ],
  QUOTE_DRAFT: [
    "QUOTE_SENT",
    "CANCELLED",
  ],
  QUOTE_SENT: [
    "QUOTE_REVISION_REQUESTED",
    "QUOTE_ACCEPTED",
    "QUOTE_SENT", // Nova versão emitida (v2, v3...)
    "CANCELLED",
  ],
  QUOTE_REVISION_REQUESTED: [
    "QUOTE_SENT", // Nova versão emitida com alterações
    "CANCELLED",
  ],
  QUOTE_ACCEPTED: [
    "SERVICE_PAYMENT_PENDING",
    "PAID",
    "CANCELLED",
  ],
  SERVICE_PAYMENT_PENDING: [
    "PAID", // Confirmação de pagamento via PSP/Webhook
    "QUOTE_ACCEPTED", // Retentativa de pagamento
    "CANCELLED",
  ],
  PAID: [
    "SERVICE_SCHEDULED",
    "IN_PROGRESS",
    "CANCELLED",
  ],
  SERVICE_SCHEDULED: [
    "IN_PROGRESS",
    "CANCELLED",
  ],
  IN_PROGRESS: [
    "PROVIDER_COMPLETED",
    "DISPUTED",
    "CANCELLED",
  ],
  PROVIDER_COMPLETED: [
    "CUSTOMER_CONFIRMED",
    "DISPUTED",
    "COMPLETED",
    "IN_PROGRESS", // Solicitação de correção ou retrabalho pelo cliente
  ],
  CUSTOMER_CONFIRMED: [
    "COMPLETED",
    "DISPUTED",
  ],
  DISPUTED: [
    "CUSTOMER_CONFIRMED", // Após mediação com aprovação do morador
    "CANCELLED",          // Acordo com cancelamento/reembolso
    "IN_PROGRESS",        // Retorno de garantia ou retrabalho
  ],
  COMPLETED: [
    "DISPUTED", // Abertura de suporte ou contestação pós-conclusão
  ],
  CANCELLED: [],
};

/**
 * Normaliza e mapeia status legados do banco para o enum canônico
 */
export function normalizeServiceStatus(status: string): ServiceLifecycleStatus {
  if (!status) return "REQUESTED";
  const upper = status.trim().toUpperCase();

  // Se já for canônico
  if (upper in SERVICE_STATUSES) {
    return upper as ServiceLifecycleStatus;
  }

  // Mapeamento retrocompatível
  const legacyMap: Record<string, ServiceLifecycleStatus> = {
    solicitado: "REQUESTED",
    buscando_prestador: "REQUESTED",
    prestador_encontrado: "PROVIDER_REVIEWING",
    vistoria_proposta: "VISIT_OFFERED",
    aguardando_pagamento_vistoria: "VISIT_PAYMENT_PENDING",
    vistoria_agendada: "VISIT_SCHEDULED",
    vistoria_confirmada: "VISIT_SCHEDULED",
    diagnostico_registrado: "VISIT_COMPLETED",
    proposta_enviada: "QUOTE_SENT",
    aguardando_orcamento: "QUOTE_DRAFT",
    orcamento_aprovado: "QUOTE_ACCEPTED",
    aguardando_pagamento_servico: "SERVICE_PAYMENT_PENDING",
    servico_pago_liberado: "PAID",
    aceito: "SERVICE_SCHEDULED",
    a_caminho: "IN_PROGRESS",
    chegou: "IN_PROGRESS",
    em_atendimento: "IN_PROGRESS",
    em_execucao: "IN_PROGRESS",
    correcao_solicitada: "IN_PROGRESS",
    conclusao_solicitada: "PROVIDER_COMPLETED",
    prestador_concluiu: "PROVIDER_COMPLETED",
    prestador_finalizou: "PROVIDER_COMPLETED",
    servico_finalizado_prestador: "PROVIDER_COMPLETED",
    morador_confirmou: "CUSTOMER_CONFIRMED",
    concluido: "COMPLETED",
    em_disputa: "DISPUTED",
    cancelado: "CANCELLED",
    reembolsado: "CANCELLED",
  };

  const lower = status.trim().toLowerCase();
  if (lower in legacyMap) {
    return legacyMap[lower];
  }

  return "REQUESTED";
}

/**
 * Verifica se a transição de estado é permitida
 */
export function canTransition(
  current: string | ServiceLifecycleStatus,
  next: string | ServiceLifecycleStatus
): boolean {
  const normalizedCurrent = normalizeServiceStatus(current);
  const normalizedNext = normalizeServiceStatus(next);

  if (normalizedCurrent === normalizedNext) return true;

  const allowed = ALLOWED_TRANSITIONS[normalizedCurrent] || [];
  return allowed.includes(normalizedNext);
}

/**
 * Valida a transição e lança erro seguro se ilegal
 */
export function assertTransition(
  current: string | ServiceLifecycleStatus,
  next: string | ServiceLifecycleStatus
): void {
  if (!canTransition(current, next)) {
    const from = normalizeServiceStatus(current);
    const to = normalizeServiceStatus(next);
    throw new Error(
      `Transição de estado inválida no Zeladoria Serviços: não é permitido transitar de '${from}' para '${to}'.`
    );
  }
}

/**
 * Metadados visuais para badges e exibições
 */
export const STATUS_METADATA: Record<
  ServiceLifecycleStatus,
  { label: string; badgeColor: string; description: string }
> = {
  REQUESTED: {
    label: "Solicitado",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Chamado aberto aguardando resposta do profissional",
  },
  PROVIDER_REVIEWING: {
    label: "Em Análise",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Prestador analisando a solicitação de serviço",
  },
  VISIT_OFFERED: {
    label: "Vistoria Proposta",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Prestador enviou opções de horário para vistoria",
  },
  VISIT_PAYMENT_PENDING: {
    label: "Aguardando Vistoria",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    description: "Aguardando confirmação de pagamento da vistoria técnica",
  },
  VISIT_SCHEDULED: {
    label: "Vistoria Agendada",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Horário de vistoria confirmado na agenda",
  },
  VISIT_COMPLETED: {
    label: "Vistoria Realizada",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Vistoria concluída e laudo registrado",
  },
  QUOTE_DRAFT: {
    label: "Elaborando Orçamento",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Prestador preparando proposta digital detalhada",
  },
  QUOTE_SENT: {
    label: "Proposta Enviada",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-300",
    description: "Proposta digital aguardando análise do morador",
  },
  QUOTE_REVISION_REQUESTED: {
    label: "Ajuste Solicitado",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Morador solicitou ajustes na proposta",
  },
  QUOTE_ACCEPTED: {
    label: "Proposta Aceita",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Proposta aceita com contrato digital gerado",
  },
  SERVICE_PAYMENT_PENDING: {
    label: "Aguardando Pagamento",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "Aguardando confirmação do pagamento no Zeladoria Pay",
  },
  PAID: {
    label: "Pago · Protegido",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Pagamento aprovado e sob proteção Zeladoria Protege",
  },
  SERVICE_SCHEDULED: {
    label: "Serviço Agendado",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    description: "Data de execução combinada entre as partes",
  },
  IN_PROGRESS: {
    label: "Em Execução",
    badgeColor: "bg-yellow-100 text-yellow-900 border-yellow-300 animate-pulse",
    description: "Prestador executando o serviço no condomínio",
  },
  PROVIDER_COMPLETED: {
    label: "Serviço Finalizado",
    badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    description: "Prestador finalizou o serviço; aguardando confirmação do morador",
  },
  CUSTOMER_CONFIRMED: {
    label: "Confirmado pelo Morador",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Morador aprovou a execução (Tudo Certo!)",
  },
  DISPUTED: {
    label: "Em Contestação",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
    description: "Contestação aberta; repasse retido sob mediação",
  },
  COMPLETED: {
    label: "Concluído",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    description: "Contratação finalizada, repasse liquidado e garantia ativa",
  },
  CANCELLED: {
    label: "Cancelado",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    description: "Chamado ou contratação encerrada",
  },
};
