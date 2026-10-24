import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type IncidentPriority = "P0" | "P1" | "P2" | "P3";
export type IncidentStatus = "aberto" | "reconhecido" | "em_analise" | "resolvido" | "encerrado";
export type IncidentType = "aviso" | "erro";

export interface SystemIncidentItem {
  id: number;
  code: string;
  title: string;
  description: string;
  type: IncidentType;
  category: string;
  sourceModule: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  condoId: number | null;
  condoName: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  fingerprint: string | null;
  occurrencesCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  resolvedById: number | null;
  resolvedByName: string | null;
  resolutionNotes: string | null;
  isManual: boolean;
  startDate: string | null;
  endDate: string | null;
  recommendedAction: string | null;
  targetAudience: string | null;
  environment: string;
  correlationId: string | null;
  appVersion: string;
  technicalContext: Record<string, any> | null;
  stackTrace: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  relatedUrl: string | null;
  silenced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentActivityItem {
  id: number;
  incidentId: number;
  userId: number | null;
  userName: string;
  action: string;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface IncidentOccurrenceItem {
  id: number;
  incidentId: number;
  correlationId: string | null;
  message: string;
  context: Record<string, any> | null;
  createdAt: string;
}

export interface MonitoringRuleItem {
  id: number;
  name: string;
  module: string;
  eventCondition: string;
  threshold: number;
  windowMinutes: number;
  priority: IncidentPriority;
  defaultAssigneeName: string | null;
  active: boolean;
  actionPlan: string | null;
  createdAt: string;
}

export interface IncidentKPIs {
  activeAlerts: number;
  criticalErrors: number;
  inAnalysis: number;
  resolvedToday: number;
  unassigned: number;
}

const STORAGE_DIR = path.resolve(process.cwd(), "..", "backend", "storage");
const STORAGE_FILE = path.join(STORAGE_DIR, "system-incidents-store.json");

interface IncidentDataStore {
  incidents: SystemIncidentItem[];
  activities: IncidentActivityItem[];
  occurrences: IncidentOccurrenceItem[];
  rules: MonitoringRuleItem[];
}

function getInitialStore(): IncidentDataStore {
  const now = new Date();
  const isoNow = now.toISOString();
  const todayBR = now.toISOString().slice(0, 10);

  const incidents: SystemIncidentItem[] = [
    {
      id: 1,
      code: "INC-00001",
      title: "Manutenção preventiva de bombas d'água vencida há 5 dias",
      description: "A manutenção semestral do conjunto de motobombas da Torre A está com o cronograma vencido desde 19/10/2026. Há risco iminente de interrupção no abastecimento de água.",
      type: "aviso",
      category: "manutencao",
      sourceModule: "Manutenção Preventiva",
      priority: "P1",
      status: "aberto",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: null,
      assigneeName: null,
      fingerprint: null,
      occurrencesCount: 1,
      firstSeenAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Agendar visita técnica urgente com empresa de engenharia hidráulica credenciada.",
      targetAudience: "sindico",
      environment: "production",
      correlationId: "CORR-MANUT-01",
      appVersion: "1.0.0",
      technicalContext: { assetId: 4, assetName: "Bomba Principal Torre A", overdueDays: 5 },
      stackTrace: null,
      relatedEntityType: "maintenance_order",
      relatedEntityId: "12",
      relatedUrl: "/painel/manutencao",
      silenced: false,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 2,
      code: "INC-00002",
      title: "Falha de processamento de repasse PIX no gateway financeiro",
      description: "Repasse financeiro do lote #PAY-8823 para prestador de serviços rejeitado com status 'PSP_GATEWAY_TIMEOUT'. Transação bloqueada para evitar duplicidade de débito.",
      type: "erro",
      category: "financeiro",
      sourceModule: "Zeladoria Pay",
      priority: "P0",
      status: "aberto",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: null,
      assigneeName: null,
      fingerprint: "psp_pix_timeout_lote_8823",
      occurrencesCount: 4,
      firstSeenAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Verificar reconciliação na API do banco parceiro e reprocessar via console de autorizações.",
      targetAudience: "superadmin",
      environment: "production",
      correlationId: "CORR-PAY-9812",
      appVersion: "1.0.0",
      technicalContext: { loteId: "PAY-8823", provider: "ZeladoriaPayPSP", httpStatus: 504 },
      stackTrace: "GatewayTimeoutException: cURL error 28: Operation timed out after 30001 milliseconds\n    at PaymentGatewayClient.payout (/backend/app/Services/ZeladoriaPayService.php:142)\n    at ProcessPayoutsJob.handle (/backend/app/Jobs/ProcessPayoutsJob.php:58)",
      relatedEntityType: "payment_order",
      relatedEntityId: "8823",
      relatedUrl: "/painel/admin/zeladoria-pay?tab=repasses",
      silenced: false,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 3,
      code: "INC-00003",
      title: "Tentativas anormais de acesso não autorizado na Portaria Principal",
      description: "O sistema identificou 8 tentativas consecutivas de acesso com tag RFID desconhecida na catraca de pedestres em menos de 10 minutos. Protocolo de segurança acionado.",
      type: "aviso",
      category: "portaria",
      sourceModule: "Portaria e Acessos",
      priority: "P0",
      status: "em_analise",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: 2,
      assigneeName: "Carlos Silva (Zelador Chefe)",
      fingerprint: null,
      occurrencesCount: 8,
      firstSeenAt: new Date(Date.now() - 45 * 60000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Checar gravação do circuito interno de câmeras e instruir os porteiros de plantão.",
      targetAudience: "portaria",
      environment: "production",
      correlationId: "CORR-PORT-552",
      appVersion: "1.0.0",
      technicalContext: { reader: "Catraca Pedestres 01", attempts: 8, rfidTag: "E2004071881902" },
      stackTrace: null,
      relatedEntityType: "visitor_access",
      relatedEntityId: "552",
      relatedUrl: "/painel/portaria",
      silenced: false,
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 4,
      code: "INC-00004",
      title: "NetworkTimeoutException: Timeout na sincronização do webhook de encomendas",
      description: "Timeout de 30s ao despachar confirmação de entrega para transportadora integrada. 12 requisições em fila aguardando reprocessamento com exponential backoff.",
      type: "erro",
      category: "integracoes",
      sourceModule: "Backend API",
      priority: "P1",
      status: "aberto",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: null,
      assigneeName: null,
      fingerprint: "webhook_timeout_delivery_carrier",
      occurrencesCount: 12,
      firstSeenAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Monitorar fila de mensageria RabbitMQ/Redis e reiniciar worker se necessário.",
      targetAudience: "superadmin",
      environment: "production",
      correlationId: "CORR-WH-112",
      appVersion: "1.0.0",
      technicalContext: { failedJobs: 12, queue: "webhooks_outbound" },
      stackTrace: "Error: Request timed out after 30000ms\n    at HttpClient.post (/backend/app/Services/CarrierService.php:84)\n    at ProcessDeliveryQueue.handle (/backend/app/Jobs/ProcessDeliveryQueue.php:32)",
      relatedEntityType: "parcel",
      relatedEntityId: "942",
      relatedUrl: "/painel/encomendas",
      silenced: false,
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 5,
      code: "INC-00005",
      title: "Reserva de espaço gourmet aguardando aprovação além do prazo de 48h",
      description: "A solicitação de reserva #RES-4401 para a Churrasqueira 2 foi enviada pelo morador há mais de 48 horas e ainda não recebeu despacho da administração.",
      type: "aviso",
      category: "reservas",
      sourceModule: "Reservas",
      priority: "P2",
      status: "aberto",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: null,
      assigneeName: null,
      fingerprint: null,
      occurrencesCount: 1,
      firstSeenAt: new Date(Date.now() - 50 * 3600000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Acessar o módulo de reservas e aprovar ou reprovar justificando o motivo.",
      targetAudience: "sindico",
      environment: "production",
      correlationId: null,
      appVersion: "1.0.0",
      technicalContext: { reservationId: 4401, amenityName: "Churrasqueira 2" },
      stackTrace: null,
      relatedEntityType: "reservation",
      relatedEntityId: "4401",
      relatedUrl: "/painel/reservas",
      silenced: false,
      createdAt: new Date(Date.now() - 50 * 3600000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 6,
      code: "INC-00006",
      title: "Prestador de manutenção de ar-condicionado com documentação pendente",
      description: "O prestador Climatis Refrigeração está com certidão de regularidade fiscal vencida e possui 2 ordens de serviço pendentes de execução neste condomínio.",
      type: "aviso",
      category: "prestadores",
      sourceModule: "Marketplace & Prestadores",
      priority: "P2",
      status: "em_analise",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: 3,
      assigneeName: "Mariana Duarte (Administradora)",
      fingerprint: null,
      occurrencesCount: 1,
      firstSeenAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: null,
      resolvedById: null,
      resolvedByName: null,
      resolutionNotes: null,
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Solicitar envio imediato da certidão atualizada antes de autorizar a entrada da equipe técnica.",
      targetAudience: "sindico",
      environment: "production",
      correlationId: null,
      appVersion: "1.0.0",
      technicalContext: { vendorId: 104, document: "Certidão Negativa de Débitos" },
      stackTrace: null,
      relatedEntityType: "vendor",
      relatedEntityId: "104",
      relatedUrl: "/painel/fornecedores",
      silenced: false,
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 7,
      code: "INC-00007",
      title: "Cadastro de morador aguardando aprovação de documentação",
      description: "Documentação de escritura pendente de validação para unidade 104 Bloco B.",
      type: "aviso",
      category: "condominios",
      sourceModule: "Condomínios e Usuários",
      priority: "P3",
      status: "resolvido",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: 2,
      assigneeName: "Carlos Silva (Zelador Chefe)",
      fingerprint: null,
      occurrencesCount: 1,
      firstSeenAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      lastSeenAt: isoNow,
      resolvedAt: isoNow,
      resolvedById: 2,
      resolvedByName: "Carlos Silva (Zelador Chefe)",
      resolutionNotes: "Documentação conferida no cartório pelo síndico. Acesso cadastrado e aplicativo liberado.",
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Validar matrícula do imóvel.",
      targetAudience: "sindico",
      environment: "production",
      correlationId: null,
      appVersion: "1.0.0",
      technicalContext: { unitId: 104, userId: 88 },
      stackTrace: null,
      relatedEntityType: "user",
      relatedEntityId: "88",
      relatedUrl: "/painel/moradores",
      silenced: false,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 8,
      code: "INC-00008",
      title: "ClientRenderWarning: Hydration mismatch transitório no seletor de turno",
      description: "Aviso de divergência de renderização no seletor de horário da passagem de turno entre servidor e cliente.",
      type: "erro",
      category: "frontend",
      sourceModule: "Frontend Client",
      priority: "P3",
      status: "encerrado",
      condoId: 1,
      condoName: "Residencial Jardins",
      assigneeId: 1,
      assigneeName: "Equipe de Engenharia",
      fingerprint: "hydration_mismatch_shifts_page",
      occurrencesCount: 3,
      firstSeenAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      lastSeenAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      resolvedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      resolvedById: 1,
      resolvedByName: "Equipe de Engenharia",
      resolutionNotes: "Ajustado fuso horário estático em Server Components com renderização segura.",
      isManual: false,
      startDate: null,
      endDate: null,
      recommendedAction: "Fix deployado na v1.0.4.",
      targetAudience: "superadmin",
      environment: "production",
      correlationId: "CORR-FRONT-081",
      appVersion: "1.0.4",
      technicalContext: { component: "ShiftSelector", path: "/painel/turnos" },
      stackTrace: "Warning: Text content did not match. Server: '12:00' Client: '15:00'\n    at TimePicker (components/time-picker.tsx:44)\n    at ShiftPage (app/painel/turnos/page.tsx:120)",
      relatedEntityType: "shift",
      relatedEntityId: "33",
      relatedUrl: "/painel/turnos",
      silenced: false,
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  const activities: IncidentActivityItem[] = [
    {
      id: 1,
      incidentId: 1,
      userId: null,
      userName: "Sistema Automático",
      action: "criado",
      notes: "Alerta gerado por regra de manutenção preventiva vencida.",
      metadata: { trigger: "maintenance_due_date" },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 2,
      incidentId: 2,
      userId: null,
      userName: "Gateway Monitor",
      action: "criado",
      notes: "Incidente crítico criado após falha consecutiva de repasse PIX.",
      metadata: { trigger: "payout_failed" },
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 3,
      incidentId: 3,
      userId: null,
      userName: "Portaria Monitor",
      action: "criado",
      notes: "Incidente P0 gerado por múltiplas tentativas com RFID desconhecida.",
      metadata: { trigger: "access_denied_burst" },
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 4,
      incidentId: 3,
      userId: 2,
      userName: "Carlos Silva (Zelador Chefe)",
      action: "em_analise",
      notes: "Assumi a investigação. Estou verificando as imagens da câmera 2.",
      metadata: null,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 5,
      incidentId: 7,
      userId: 2,
      userName: "Carlos Silva (Zelador Chefe)",
      action: "resolvido",
      notes: "Documentação conferida no cartório pelo síndico. Acesso cadastrado e aplicativo liberado.",
      metadata: { solution: "verified" },
      createdAt: isoNow,
    },
  ];

  const occurrences: IncidentOccurrenceItem[] = [
    {
      id: 1,
      incidentId: 2,
      correlationId: "CORR-PAY-9812",
      message: "PSP_GATEWAY_TIMEOUT no endpoint /v1/payouts/pix",
      context: { lote: "PAY-8823", retry: 1 },
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 2,
      incidentId: 2,
      correlationId: "CORR-PAY-9813",
      message: "PSP_GATEWAY_TIMEOUT no endpoint /v1/payouts/pix",
      context: { lote: "PAY-8823", retry: 2 },
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
    {
      id: 3,
      incidentId: 4,
      correlationId: "CORR-WH-112",
      message: "Connection timed out after 30000ms connecting to carrier.api/webhook",
      context: { carrier: "Loggi/TotalExpress" },
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
  ];

  const rules: MonitoringRuleItem[] = [
    {
      id: 1,
      name: "Alerta de Ordem de Serviço Crítica Sem Responsável",
      module: "Manutenção Preventiva",
      eventCondition: "OS com prioridade 'urgente' ou 'emergencial' sem atribuição há mais de 60 minutos",
      threshold: 1,
      windowMinutes: 60,
      priority: "P0",
      defaultAssigneeName: "Zelador Chefe",
      active: true,
      actionPlan: "Notificar síndico e zelador via push e WhatsApp corporativo",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      name: "Falhas Consecutivas em Gateway de Pagamento",
      module: "Zeladoria Pay",
      eventCondition: "3 ou mais transações PIX ou cartão rejeitadas em janela de 15 minutos",
      threshold: 3,
      windowMinutes: 15,
      priority: "P0",
      defaultAssigneeName: "Equipe de Finanças & Engenharia",
      active: true,
      actionPlan: "Pausar repasses automáticos do lote e alertar administrador da plataforma",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 3,
      name: "Frequência Anormal de Erros HTTP 5xx no Backend",
      module: "Backend API",
      eventCondition: "Mais de 10 exceções não tratadas em janela de 10 minutos",
      threshold: 10,
      windowMinutes: 10,
      priority: "P1",
      defaultAssigneeName: "Engenharia de Software",
      active: true,
      actionPlan: "Capturar stack trace, gerar correlação e disparar escalonamento automático",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 4,
      name: "Tentativas Repetidas de Acesso Não Autorizado na Portaria",
      module: "Portaria e Acessos",
      eventCondition: "5 ou mais acessos bloqueados por biometria ou RFID em 15 minutos na mesma portaria",
      threshold: 5,
      windowMinutes: 15,
      priority: "P0",
      defaultAssigneeName: "Supervisor de Segurança",
      active: true,
      actionPlan: "Gerar alerta sonoro discreto na portaria e acionar gravação prioritária",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 5,
      name: "Manutenção Preventiva Ultrapassando Data Prevista",
      module: "Manutenção Preventiva",
      eventCondition: "Plano de manutenção preventiva ativo vencido há mais de 1 dia",
      threshold: 1,
      windowMinutes: 1440,
      priority: "P2",
      defaultAssigneeName: "Síndico",
      active: true,
      actionPlan: "Enviar e-mail para administradora e destacar no painel da zeladoria",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  return { incidents, activities, occurrences, rules };
}

// Memory cache + file backing
let inMemoryStore: IncidentDataStore | null = null;

function loadStore(): IncidentDataStore {
  if (inMemoryStore) return inMemoryStore;

  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8");
      inMemoryStore = JSON.parse(content) as IncidentDataStore;
      return inMemoryStore;
    }
  } catch (err) {
    console.error("Aviso ao carregar storage de incidentes:", err);
  }

  inMemoryStore = getInitialStore();
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: IncidentDataStore): void {
  inMemoryStore = store;
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal if storage dir is read-only
    console.error("Aviso ao gravar storage de incidentes:", err);
  }
}

export function getIncidentKPIs(condoId?: number | null, isSuperAdmin = false): IncidentKPIs {
  const store = loadStore();
  const nowBR = new Date().toISOString().slice(0, 10);
  const activeStatuses: IncidentStatus[] = ["aberto", "reconhecido", "em_analise"];

  const scoped = store.incidents.filter((inc) => {
    if (isSuperAdmin) return true;
    if (!condoId) return true;
    return inc.condoId === null || inc.condoId === condoId;
  });

  return {
    activeAlerts: scoped.filter((i) => i.type === "aviso" && activeStatuses.includes(i.status)).length,
    criticalErrors: scoped.filter((i) => i.priority === "P0" && activeStatuses.includes(i.status)).length,
    inAnalysis: scoped.filter((i) => i.status === "em_analise").length,
    resolvedToday: scoped.filter((i) => i.status === "resolvido" && i.resolvedAt?.startsWith(nowBR)).length,
    unassigned: scoped.filter((i) => (!i.assigneeName || i.assigneeName.trim() === "") && activeStatuses.includes(i.status)).length,
  };
}

export function queryIncidents(options: {
  tab?: "visao-geral" | "operacionais" | "tecnicos" | "historico";
  q?: string;
  priority?: IncidentPriority;
  status?: string;
  module?: string;
  type?: IncidentType;
  condoId?: number | null;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  isSuperAdmin?: boolean;
}) {
  const store = loadStore();
  const {
    tab = "visao-geral",
    q = "",
    priority,
    status,
    module,
    type,
    condoId,
    assignee,
    startDate,
    endDate,
    sortBy = "last_seen_at",
    sortDir = "desc",
    page = 1,
    perPage = 15,
    isSuperAdmin = false,
  } = options;

  let list = store.incidents.filter((inc) => {
    // Tenancy isolation
    if (!isSuperAdmin && condoId && inc.condoId !== null && inc.condoId !== condoId) {
      return false;
    }
    return true;
  });

  // Calculate live KPIs for this scope
  const kpis = getIncidentKPIs(condoId, isSuperAdmin);

  // Apply tab
  const activeStatuses: IncidentStatus[] = ["aberto", "reconhecido", "em_analise"];
  if (tab === "operacionais") {
    list = list.filter((i) => i.type === "aviso");
  } else if (tab === "tecnicos") {
    list = list.filter((i) => i.type === "erro");
  } else if (tab === "historico") {
    list = list.filter((i) => i.status === "resolvido" || i.status === "encerrado");
  } else {
    // 'visao-geral': show all active incidents needing attention
    list = list.filter((i) => activeStatuses.includes(i.status));
  }

  // Text search
  if (q.trim()) {
    const term = q.toLowerCase();
    list = list.filter(
      (i) =>
        i.code.toLowerCase().includes(term) ||
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.sourceModule.toLowerCase().includes(term)
    );
  }

  // Priority filter
  if (priority) {
    list = list.filter((i) => i.priority === priority);
  }

  // Type filter
  if (type) {
    list = list.filter((i) => i.type === type);
  }

  // Status filter
  if (status) {
    if (status === "ativos") {
      list = list.filter((i) => activeStatuses.includes(i.status));
    } else {
      list = list.filter((i) => i.status === status);
    }
  }

  // Module filter
  if (module) {
    list = list.filter((i) => i.sourceModule === module);
  }

  // Assignee filter
  if (assignee) {
    if (assignee === "sem_responsavel") {
      list = list.filter((i) => !i.assigneeName || i.assigneeName.trim() === "");
    } else {
      list = list.filter((i) => i.assigneeName?.toLowerCase().includes(assignee.toLowerCase()));
    }
  }

  // Date range filter
  if (startDate) {
    list = list.filter((i) => i.createdAt >= startDate);
  }
  if (endDate) {
    list = list.filter((i) => i.createdAt <= `${endDate}T23:59:59.999Z`);
  }

  // Sorting
  const priorityOrder: Record<IncidentPriority, number> = { P0: 1, P1: 2, P2: 3, P3: 4 };

  if (tab === "visao-geral" && sortBy === "last_seen_at") {
    list.sort((a, b) => {
      const pA = priorityOrder[a.priority];
      const pB = priorityOrder[b.priority];
      if (pA !== pB) return pA - pB;
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    });
  } else {
    list.sort((a, b) => {
      let valA: any = (a as any)[sortBy] ?? a.lastSeenAt;
      let valB: any = (b as any)[sortBy] ?? b.lastSeenAt;

      if (sortBy === "priority") {
        valA = priorityOrder[a.priority];
        valB = priorityOrder[b.priority];
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const total = list.length;
  const paginated = list.slice((page - 1) * perPage, page * perPage);

  // Sanitize stack trace for non-superadmin
  const sanitized = paginated.map((item) => {
    if (!isSuperAdmin) {
      const copy = { ...item };
      copy.stackTrace = null;
      return copy;
    }
    return item;
  });

  const modules = Array.from(new Set(store.incidents.map((i) => i.sourceModule)));

  return {
    incidents: sanitized,
    kpis,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage) || 1,
    },
    modules,
    serverTime: new Date().toISOString(),
  };
}

export function getIncidentDetail(id: number, isSuperAdmin = false) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  const activities = store.activities
    .filter((a) => a.incidentId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const occurrences = store.occurrences
    .filter((o) => o.incidentId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sanitized = { ...incident };
  if (!isSuperAdmin) {
    sanitized.stackTrace = null;
  }

  return {
    incident: sanitized,
    activities,
    occurrences,
  };
}

export function createManualIncident(payload: {
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  category?: string;
  sourceModule?: string;
  condoId?: number | null;
  condoName?: string | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recommendedAction?: string | null;
  targetAudience?: string | null;
  user: { id: number; name: string };
  notify?: boolean;
}): SystemIncidentItem {
  const store = loadStore();
  const nextId = store.incidents.length > 0 ? Math.max(...store.incidents.map((i) => i.id)) + 1 : 1;
  const code = `INC-${String(nextId).padStart(5, "0")}`;
  const now = new Date().toISOString();

  const newIncident: SystemIncidentItem = {
    id: nextId,
    code,
    title: payload.title,
    description: payload.description,
    type: payload.type,
    category: payload.category || "administrativo",
    sourceModule: payload.sourceModule || "Administração Condominial",
    priority: payload.priority,
    status: "aberto",
    condoId: payload.condoId ?? null,
    condoName: payload.condoName ?? null,
    assigneeId: payload.assigneeId ?? null,
    assigneeName: payload.assigneeName ?? null,
    fingerprint: null,
    occurrencesCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    resolutionNotes: null,
    isManual: true,
    startDate: payload.startDate || now,
    endDate: payload.endDate || null,
    recommendedAction: payload.recommendedAction || null,
    targetAudience: payload.targetAudience || "todos",
    environment: "production",
    correlationId: null,
    appVersion: "1.0.0",
    technicalContext: null,
    stackTrace: null,
    relatedEntityType: null,
    relatedEntityId: null,
    relatedUrl: null,
    silenced: false,
    createdAt: now,
    updatedAt: now,
  };

  store.incidents.unshift(newIncident);

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: nextId,
    userId: payload.user.id,
    userName: payload.user.name,
    action: "criado",
    notes: "Aviso administrativo registrado manualmente.",
    metadata: { isManual: true },
    createdAt: now,
  });

  saveStore(store);
  return newIncident;
}

export function updateIncidentStatus(
  id: number,
  status: IncidentStatus,
  resolutionNotes: string | null,
  user: { id: number; name: string }
) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  const oldStatus = incident.status;
  const now = new Date().toISOString();

  incident.status = status;
  incident.updatedAt = now;

  if (status === "resolvido") {
    incident.resolvedAt = now;
    incident.resolvedById = user.id;
    incident.resolvedByName = user.name;
    incident.resolutionNotes = resolutionNotes || "Incidente resolvido com sucesso.";
  } else if (status === "aberto" && (oldStatus === "resolvido" || oldStatus === "encerrado")) {
    incident.resolvedAt = null;
    incident.resolvedById = null;
    incident.resolvedByName = null;
  }

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: id,
    userId: user.id,
    userName: user.name,
    action: status === "resolvido" ? "resolvido" : oldStatus === "resolvido" ? "reaberto" : "status_alterado",
    notes: resolutionNotes || `Status alterado de '${oldStatus}' para '${status}'.`,
    metadata: { from: oldStatus, to: status },
    createdAt: now,
  });

  saveStore(store);
  return incident;
}

export function updateIncidentAssignee(
  id: number,
  assigneeName: string,
  assigneeId: number | null,
  user: { id: number; name: string }
) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  const oldAssignee = incident.assigneeName || "Sem responsável";
  const now = new Date().toISOString();

  incident.assigneeName = assigneeName;
  incident.assigneeId = assigneeId;
  incident.updatedAt = now;

  if (incident.status === "aberto") {
    incident.status = "em_analise";
  }

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: id,
    userId: user.id,
    userName: user.name,
    action: "atribuido",
    notes: `Responsável alterado de '${oldAssignee}' para '${assigneeName}'.`,
    metadata: { oldAssignee, newAssignee: assigneeName },
    createdAt: now,
  });

  saveStore(store);
  return incident;
}

export function updateIncidentPriority(
  id: number,
  priority: IncidentPriority,
  reason: string | null,
  user: { id: number; name: string }
) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  const oldPriority = incident.priority;
  const now = new Date().toISOString();

  incident.priority = priority;
  incident.updatedAt = now;

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: id,
    userId: user.id,
    userName: user.name,
    action: "prioridade_alterada",
    notes: `Prioridade alterada de '${oldPriority}' para '${priority}'.${reason ? ` Motivo: ${reason}` : ""}`,
    metadata: { from: oldPriority, to: priority },
    createdAt: now,
  });

  saveStore(store);
  return incident;
}

export function addIncidentComment(id: number, comment: string, user: { id: number; name: string }) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  const now = new Date().toISOString();
  const activity: IncidentActivityItem = {
    id: store.activities.length + 1,
    incidentId: id,
    userId: user.id,
    userName: user.name,
    action: "comentario",
    notes: comment,
    metadata: null,
    createdAt: now,
  };

  store.activities.push(activity);
  saveStore(store);
  return activity;
}

export function silenceIncident(id: number, silenced: boolean, user: { id: number; name: string }) {
  const store = loadStore();
  const incident = store.incidents.find((i) => i.id === id);
  if (!incident) return null;

  incident.silenced = silenced;
  incident.updatedAt = new Date().toISOString();

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: id,
    userId: user.id,
    userName: user.name,
    action: silenced ? "silenciado" : "reativado",
    notes: silenced ? "Alerta silenciado pelo administrador." : "Alerta reativado.",
    metadata: { silenced },
    createdAt: new Date().toISOString(),
  });

  saveStore(store);
  return incident;
}

export function reportTechnicalError(payload: {
  message: string;
  errorType?: string;
  sourceModule?: string;
  condoId?: number | null;
  correlationId?: string;
  stackTrace?: string;
  context?: Record<string, any>;
  environment?: string;
  appVersion?: string;
}) {
  const store = loadStore();
  const now = new Date().toISOString();
  const errorType = payload.errorType || "UnhandledException";
  const sourceModule = payload.sourceModule || "Frontend Client";
  const correlationId = payload.correlationId || `CORR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // Stable fingerprint for intelligent grouping
  const normalized = payload.message.replace(/[0-9a-f]{8}-[0-9a-f]{4}/gi, "<UUID>").replace(/\d+/g, "<N>");
  const fingerprint = crypto.createHash("sha256").update(`${errorType}::${sourceModule}::${normalized}`).digest("hex");

  // Check if open incident exists with same fingerprint
  const existing = store.incidents.find(
    (i) => i.fingerprint === fingerprint && (i.status === "aberto" || i.status === "reconhecido" || i.status === "em_analise")
  );

  if (existing) {
    existing.occurrencesCount += 1;
    existing.lastSeenAt = now;
    existing.updatedAt = now;

    // Escalation rule: recurring >= 10 in production elevates to P0
    if (existing.occurrencesCount >= 10 && existing.priority !== "P0") {
      existing.priority = "P0";
      store.activities.push({
        id: store.activities.length + 1,
        incidentId: existing.id,
        userId: null,
        userName: "Sistema (Escalonamento Automático)",
        action: "prioridade_alterada",
        notes: `Prioridade elevada para P0 devido à alta frequência (${existing.occurrencesCount} repetições).`,
        metadata: { trigger: "frequency_threshold", count: existing.occurrencesCount },
        createdAt: now,
      });
    }

    store.occurrences.push({
      id: store.occurrences.length + 1,
      incidentId: existing.id,
      correlationId,
      message: payload.message,
      context: payload.context || null,
      createdAt: now,
    });

    saveStore(store);
    return { incident: existing, grouped: true };
  }

  // Create new incident
  const nextId = store.incidents.length > 0 ? Math.max(...store.incidents.map((i) => i.id)) + 1 : 1;
  const code = `INC-${String(nextId).padStart(5, "0")}`;

  const newIncident: SystemIncidentItem = {
    id: nextId,
    code,
    title: `[${errorType}] ${payload.message.slice(0, 110)}`,
    description: payload.message,
    type: "erro",
    category: "tecnico",
    sourceModule,
    priority: "P1",
    status: "aberto",
    condoId: payload.condoId ?? null,
    condoName: null,
    assigneeId: null,
    assigneeName: null,
    fingerprint,
    occurrencesCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    resolutionNotes: null,
    isManual: false,
    startDate: null,
    endDate: null,
    recommendedAction: "Investigar contexto técnico e logs associados ao correlationId.",
    targetAudience: "superadmin",
    environment: payload.environment || "production",
    correlationId,
    appVersion: payload.appVersion || "1.0.0",
    technicalContext: payload.context || null,
    stackTrace: payload.stackTrace || null,
    relatedEntityType: null,
    relatedEntityId: null,
    relatedUrl: null,
    silenced: false,
    createdAt: now,
    updatedAt: now,
  };

  store.incidents.unshift(newIncident);

  store.activities.push({
    id: store.activities.length + 1,
    incidentId: nextId,
    userId: null,
    userName: "Monitoramento Automático",
    action: "criado",
    notes: "Erro técnico capturado e indexado com assinatura única.",
    metadata: { fingerprint },
    createdAt: now,
  });

  store.occurrences.push({
    id: store.occurrences.length + 1,
    incidentId: nextId,
    correlationId,
    message: payload.message,
    context: payload.context || null,
    createdAt: now,
  });

  saveStore(store);
  return { incident: newIncident, grouped: false };
}

export function getMonitoringRules(): MonitoringRuleItem[] {
  const store = loadStore();
  return store.rules;
}

export function updateMonitoringRule(id: number, updates: Partial<MonitoringRuleItem>): MonitoringRuleItem | null {
  const store = loadStore();
  const rule = store.rules.find((r) => r.id === id);
  if (!rule) return null;

  if (updates.active !== undefined) rule.active = updates.active;
  if (updates.threshold !== undefined) rule.threshold = updates.threshold;
  if (updates.windowMinutes !== undefined) rule.windowMinutes = updates.windowMinutes;
  if (updates.priority !== undefined) rule.priority = updates.priority;

  saveStore(store);
  return rule;
}

export function generateIncidentsCsv(condoId?: number | null, isSuperAdmin = false): string {
  const store = loadStore();
  const scoped = store.incidents.filter((inc) => {
    if (isSuperAdmin) return true;
    if (!condoId) return true;
    return inc.condoId === null || inc.condoId === condoId;
  });

  const headers = [
    "ID",
    "Tipo",
    "Prioridade",
    "Status",
    "Título",
    "Módulo",
    "Responsável",
    "Repetições",
    "Primeira Ocorrência",
    "Última Ocorrência",
    "Resolvido Em",
    "Resolvido Por",
    "Solução Adotada",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = String(val).replace(/"/g, '""');
    // Formula injection mitigation: prefix formula triggers with '
    if (/^[=+@\-\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const lines = [headers.join(";")];

  for (const item of scoped) {
    lines.push(
      [
        escapeCsv(item.code),
        escapeCsv(item.type),
        escapeCsv(item.priority),
        escapeCsv(item.status),
        escapeCsv(item.title),
        escapeCsv(item.sourceModule),
        escapeCsv(item.assigneeName || "Sem responsável"),
        escapeCsv(item.occurrencesCount),
        escapeCsv(item.firstSeenAt),
        escapeCsv(item.lastSeenAt),
        escapeCsv(item.resolvedAt || "-"),
        escapeCsv(item.resolvedByName || "-"),
        escapeCsv(item.resolutionNotes || "-"),
      ].join(";")
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}
