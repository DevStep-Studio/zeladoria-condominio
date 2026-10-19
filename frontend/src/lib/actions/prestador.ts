"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import { storeSessionToken } from "@/lib/auth";

type ProviderActionResult = { status?: string; success: boolean; error?: string; vendorId?: number; quoteId?: number; promotionId?: number; planId?: number; evidenceId?: number; active?: boolean; isOnline?: boolean; availableNow?: boolean; arrivedAt?: Date };

function refreshProvider() {
  revalidatePath("/prestador", "layout");
  revalidatePath("/painel/servicos");
  revalidatePath("/painel/admin/prestadores");
  revalidatePath("/painel/admin/marketplace/destaques");
}

async function finish(path: string, method: string, body?: unknown): Promise<ProviderActionResult> {
  const result = await domainAction<ProviderActionResult>(path, method, body);
  if (result.success) refreshProvider();
  return result;
}

export async function registerProviderAction(payload: {
  // Etapa 1 - Conta
  name: string;
  lastName: string;
  email: string;
  phone: string;
  cpf?: string;
  password?: string;
  photoUrl?: string;
  // Etapa 2 - Tipo de profissional
  providerType: "autonomo" | "empresa";
  companyName?: string;
  cnpj?: string;
  // Etapa 3 - Especialidades e Serviços
  category: string;
  specialties?: string[];
  services: {
    id: string;
    name: string;
    description: string;
    priceFromCents: number | null;
    priceType?: "fixo" | "a_partir" | "por_hora" | "sob_consulta";
    estimatedDurationMinutes?: number;
    warrantyDays?: number;
  }[];
  priceFromCents?: number;
  // Etapa 4 - Região e Cobertura
  cep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  serviceArea: string;
  serviceRadiusKm: number;
  lat?: number;
  lng?: number;
  // Etapa 5 - Dados Financeiros para Recebimento
  pixInfo?: {
    keyType: "cpf" | "cnpj" | "email" | "phone" | "random";
    key: string;
  };
  bankInfo?: {
    bankCode?: string;
    bankName?: string;
    agency?: string;
    account?: string;
    accountType?: "corrente" | "poupanca";
    holderName?: string;
    holderDocument?: string;
  };
  // Etapa 6 - Verificação de Identidade
  identityVerification?: {
    documentType: "cnh" | "rg";
    frontUrl?: string;
    backUrl?: string;
    digitalPdfUrl?: string;
    selfieUrl?: string;
  };
  // Experiência e Portfólio
  experienceYears?: number;
  description?: string;
  portfolio?: { url: string; caption: string; category?: string; date?: string }[];
  condoId?: number;
}) : Promise<ProviderActionResult> {
  const result = await domainAction<ProviderActionResult & { token?: string }>("/prestadores/cadastro", "POST", payload); if (result.success && "token" in result && result.token) await storeSessionToken(result.token); refreshProvider(); return result;
}

export async function reviewProviderVerificationAction(
  vendorId: number,
  decision: "aprovado" | "rejeitado" | "reenvio_solicitado",
  notes?: string
) : Promise<ProviderActionResult> {
  return finish("/admin/prestadores/" + vendorId + "/verificacao", "PATCH", { decision, notes });
}

export async function toggleProviderOnlineAction() : Promise<ProviderActionResult> {
  return finish("/prestador/disponibilidade", "PATCH", { toggle: "online" });
}

export async function acceptServiceRequestAction(requestId: number) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + requestId + "/aceite", "POST");
}

export async function sendQuoteAction(payload: {
  requestId: number;
  laborCents: number;
  materialsCents: number;
  totalCents?: number;
  description: string;
  estimatedDays?: number;
}) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + payload.requestId + "/orcamentos", "POST", payload);
}

export async function updateServiceProgressAction(
  requestId: number,
  nextStatus: "a_caminho" | "chegou" | "em_atendimento" | "prestador_concluiu" | "conclusao_solicitada" | "concluido" | "cancelado",
  reason?: string
) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + requestId + "/status", "PATCH", { status: nextStatus, reason });
}

export async function updateProviderStorefrontAction(payload: {
  condoId?: number;
  description?: string;
  whatsapp?: string;
  phone?: string;
  serviceArea?: string;
  serviceRadiusKm?: number;
  workingHours?: string;
  photoUrl?: string;
  coverUrl?: string;
  services?: any[];
  portfolio?: any[];
}) : Promise<ProviderActionResult> {
  return finish("/prestador/perfil", "PATCH", payload);
}

export async function rejectServiceRequestAction(requestId: number, reason?: string) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + requestId + "/recusa", "POST", { reason });
}

export async function toggleProviderAvailableNowAction() : Promise<ProviderActionResult> {
  return finish("/prestador/disponibilidade", "PATCH", { toggle: "available" });
}

export async function createPromotionCampaignAction(payload: {
  planId: number;
  type?: string;
  categoryId?: string;
  region?: string;
}) : Promise<ProviderActionResult> {
  return finish("/prestador/campanhas", "POST", payload);
}

export async function cancelPromotionCampaignAction(promotionId: number) : Promise<ProviderActionResult> {
  return finish("/prestador/campanhas/" + promotionId, "DELETE");
}

export async function adminCreatePromotionPlanAction(payload: {
  name: string;
  type: string;
  durationDays: number;
  priceCents: number;
  description?: string;
}) : Promise<ProviderActionResult> {
  return finish("/admin/planos-destaque", "POST", payload);
}

export async function adminTogglePromotionPlanAction(planId: number) : Promise<ProviderActionResult> {
  return finish("/admin/planos-destaque/" + planId, "PATCH");
}

export async function checkInOperationalAction(payload: {
  requestId: number;
  currentLat?: number;
  currentLng?: number;
}) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + payload.requestId + "/check-in", "POST", payload);
}

export async function updateServiceExecutionAction(payload: {
  requestId: number;
  checklist?: { item: string; checked: boolean }[];
  materialsUsed?: { name: string; quantity: number; notes?: string }[];
  executionNotes?: string;
}) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + payload.requestId + "/execucao", "PATCH", payload);
}

export async function addServiceEvidenceAction(payload: {
  requestId: number;
  stage: "ANTES" | "DURANTE" | "DEPOIS";
  fileUrl: string;
  caption?: string;
}) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + payload.requestId + "/evidencias", "POST", payload);
}

export async function requestServiceCompletionAction(payload: {
  requestId: number;
  finalNotes?: string;
  checklist?: { item: string; checked: boolean }[];
  materialsUsed?: { name: string; quantity: number; notes?: string }[];
  finalPhotos?: string[];
}) : Promise<ProviderActionResult> {
  return finish("/prestador/chamados/" + payload.requestId + "/conclusao", "POST", payload);
}

