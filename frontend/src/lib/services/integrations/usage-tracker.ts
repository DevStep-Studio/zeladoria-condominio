/**
 * Monitoramento de Consumo, Cotas e Telemetria de APIs Gratuitas
 * 
 * Controla os limites dos planos gratuitos:
 * - Geoapify: 3.000 créditos / dia
 * - Resend: 100 e-mails / dia (3.000 / mês)
 * - BrasilAPI / ViaCEP: Sem cota fixa, mas com limite de cortesia para prevenir abusos
 * - OneSignal: Cota gratuita para web push
 * 
 * Implementa alertas nos patamares de 70%, 85%, 95% e 100% e proteção contra excedentes.
 */

export type IntegrationServiceId =
  | "geoapify"
  | "resend"
  | "brasilapi"
  | "viacep"
  | "onesignal"
  | "postgis";

export interface IntegrationStatus {
  id: IntegrationServiceId;
  name: string;
  category: string;
  enabled: boolean;
  dailyQuota: number;
  dailyUsed: number;
  monthlyQuota?: number;
  monthlyUsed?: number;
  errorCount: number;
  lastUsedAt?: string;
  status: "operacional" | "alerta_70" | "alerta_85" | "alerta_95" | "limite_atingido" | "desativado" | "erro";
  message: string;
  freeTierDetails: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  service: IntegrationServiceId;
  action: string;
  success: boolean;
  statusCode?: number;
  durationMs: number;
  message?: string;
}

interface ServiceState {
  enabled: boolean;
  dailyQuota: number;
  dailyUsed: number;
  monthlyQuota?: number;
  monthlyUsed?: number;
  errorCount: number;
  lastUsedAt?: string;
  lastResetDate: string;
}

const DEFAULT_STATES: Record<IntegrationServiceId, ServiceState> = {
  geoapify: {
    enabled: true,
    dailyQuota: 3000,
    dailyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
  resend: {
    enabled: true,
    dailyQuota: 100,
    dailyUsed: 0,
    monthlyQuota: 3000,
    monthlyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
  brasilapi: {
    enabled: true,
    dailyQuota: 5000, // Limite de cortesia interno para rate limiting
    dailyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
  viacep: {
    enabled: true,
    dailyQuota: 5000, // Limite de cortesia interno
    dailyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
  onesignal: {
    enabled: true,
    dailyQuota: 1000,
    dailyUsed: 0,
    monthlyQuota: 10000,
    monthlyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
  postgis: {
    enabled: true,
    dailyQuota: 999999, // Open source / banco interno
    dailyUsed: 0,
    errorCount: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
  },
};

// Armazenamento em memória (persiste durante o ciclo de vida do servidor/runtime)
const serviceStates: Record<IntegrationServiceId, ServiceState> = { ...DEFAULT_STATES };
const recentLogs: ApiLogEntry[] = [];
const MAX_LOGS = 60;

function checkAndResetDaily(service: IntegrationServiceId): void {
  const today = new Date().toISOString().slice(0, 10);
  const state = serviceStates[service];
  if (state.lastResetDate !== today) {
    state.dailyUsed = 0;
    state.lastResetDate = today;
  }
}

/**
 * Verifica se a integração tem autorização e saldo para realizar chamadas
 */
export function canMakeApiCall(service: IntegrationServiceId): { allowed: boolean; reason?: string } {
  checkAndResetDaily(service);
  const state = serviceStates[service];

  if (!state.enabled) {
    return { allowed: false, reason: `Integração ${service} foi desativada temporariamente pelo administrador.` };
  }

  if (state.dailyUsed >= state.dailyQuota) {
    return {
      allowed: false,
      reason: `Cota diária gratuita do ${service} (${state.dailyQuota} requisições) foi atingida. Ativando fallback seguro sem cobrança.`,
    };
  }

  if (state.monthlyQuota && (state.monthlyUsed ?? 0) >= state.monthlyQuota) {
    return {
      allowed: false,
      reason: `Cota mensal gratuita do ${service} (${state.monthlyQuota} requisições) foi atingida.`,
    };
  }

  return { allowed: true };
}

/**
 * Registra o consumo de uma chamada de API e adiciona log de auditoria
 */
export function recordApiUsage(params: {
  service: IntegrationServiceId;
  action: string;
  success: boolean;
  statusCode?: number;
  durationMs: number;
  creditsConsumed?: number;
  message?: string;
}): void {
  const { service, action, success, statusCode, durationMs, creditsConsumed = 1, message } = params;
  checkAndResetDaily(service);

  const state = serviceStates[service];
  state.lastUsedAt = new Date().toISOString();

  if (success) {
    state.dailyUsed += creditsConsumed;
    if (state.monthlyUsed !== undefined) {
      state.monthlyUsed += creditsConsumed;
    }
  } else {
    state.errorCount += 1;
  }

  // Registra no buffer circular de logs
  const logEntry: ApiLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    service,
    action,
    success,
    statusCode,
    durationMs,
    message,
  };

  recentLogs.unshift(logEntry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }
}

/**
 * Alterna a ativação manual de uma integração
 */
export function toggleIntegration(service: IntegrationServiceId, enabled: boolean): boolean {
  if (serviceStates[service]) {
    serviceStates[service].enabled = enabled;
    return true;
  }
  return false;
}

/**
 * Retorna o status de todas as integrações com os alertas de patamar
 */
export function getIntegrationsSummary(): IntegrationStatus[] {
  const services: {
    id: IntegrationServiceId;
    name: string;
    category: string;
    freeTierDetails: string;
  }[] = [
    {
      id: "geoapify",
      name: "Geoapify Location Platform",
      category: "Geocodificação & Endereços",
      freeTierDetails: "Plano Free: 3.000 créditos / dia. Cache e debounce ativos.",
    },
    {
      id: "postgis",
      name: "PostGIS / MySQL Spatial",
      category: "Raio de Atendimento & Cobertura",
      freeTierDetails: "Open-Source / Banco Local. Sem limite ou custo de licença.",
    },
    {
      id: "viacep",
      name: "ViaCEP",
      category: "Preenchimento de Endereços",
      freeTierDetails: "100% Gratuito & Aberto. Consulta de logradouros por CEP.",
    },
    {
      id: "brasilapi",
      name: "BrasilAPI (CNPJ)",
      category: "Cadastro de Empresas",
      freeTierDetails: "100% Gratuito & Aberto. Consulta cadastral de CNPJ.",
    },
    {
      id: "onesignal",
      name: "OneSignal / Web Push",
      category: "Notificações em Tempo Real",
      freeTierDetails: "Plano Free: 10.000 inscritos. Banco interno como fonte de verdade.",
    },
    {
      id: "resend",
      name: "Resend E-mails Transacionais",
      category: "Comunicação por E-mail",
      freeTierDetails: "Plano Free: 100 e-mails / dia (3.000 / mês). Remetente oficial.",
    },
  ];

  return services.map((s) => {
    checkAndResetDaily(s.id);
    const state = serviceStates[s.id];
    const percentage = state.dailyQuota > 0 ? (state.dailyUsed / state.dailyQuota) * 100 : 0;

    let status: IntegrationStatus["status"] = "operacional";
    let message = "Operando normalmente dentro da cota gratuita.";

    if (!state.enabled) {
      status = "desativado";
      message = "Integração desativada temporariamente pelo administrador.";
    } else if (state.dailyUsed >= state.dailyQuota) {
      status = "limite_atingido";
      message = `Cota diária de ${state.dailyQuota} requisições esgotada. Modo fallback ativado.`;
    } else if (percentage >= 95) {
      status = "alerta_95";
      message = `Consumo crítico: ${percentage.toFixed(0)}% da cota diária utilizada. Economizando chamadas.`;
    } else if (percentage >= 85) {
      status = "alerta_85";
      message = `Atenção: ${percentage.toFixed(0)}% da cota diária utilizada.`;
    } else if (percentage >= 70) {
      status = "alerta_70";
      message = `Aviso: ${percentage.toFixed(0)}% da cota diária utilizada.`;
    } else if (state.errorCount > 5) {
      status = "erro";
      message = `Detectados ${state.errorCount} erros recentes. Verifique a conectividade.`;
    }

    return {
      id: s.id,
      name: s.name,
      category: s.category,
      enabled: state.enabled,
      dailyQuota: state.dailyQuota,
      dailyUsed: state.dailyUsed,
      monthlyQuota: state.monthlyQuota,
      monthlyUsed: state.monthlyUsed,
      errorCount: state.errorCount,
      lastUsedAt: state.lastUsedAt,
      status,
      message,
      freeTierDetails: s.freeTierDetails,
    };
  });
}

/**
 * Retorna os logs recentes de telemetria
 */
export function getRecentApiLogs(): ApiLogEntry[] {
  return [...recentLogs];
}
