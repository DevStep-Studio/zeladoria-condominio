"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  condominiums,
  memberships,
  promotionPlans,
  providerPromotions,
  serviceMessages,
  serviceQuotes,
  serviceRequests,
  serviceReviews,
  users,
  vendors,
} from "@/db/schema";
import {
  authenticate,
  createSession,
  getSession,
  hashPassword,
  requireProvider,
  requireSession,
} from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { num, sequence, str } from "@/lib/utils";

/**
 * Onboarding / Cadastro de Prestador em 8 etapas
 */
export async function registerProviderAction(payload: {
  // Etapa 1 - Conta
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  // Etapa 2 - Perfil
  providerType: "autonomo" | "empresa";
  companyName?: string;
  cnpj?: string;
  photoUrl?: string;
  // Etapa 3 - Serviços
  category: string;
  services: { id: string; name: string; description: string; priceFromCents: number | null; priceType?: "fixo" | "a_partir" | "por_hora" | "sob_consulta" }[];
  priceFromCents?: number;
  // Etapa 4 - Região
  serviceArea: string;
  serviceRadiusKm: number;
  // Etapa 5 - Experiência
  experienceYears: number;
  description: string;
  // Etapa 6 - Portfólio
  portfolio: { url: string; caption: string; category?: string; date?: string }[];
  // Etapa 7 - Documentos
  documentUrl?: string;
  documentName?: string;
  condoId?: number;
}) {
  const email = payload.email.trim().toLowerCase();
  if (!email || !payload.name) {
    return { success: false, error: "Nome e e-mail são obrigatórios." };
  }

  // 1. Resolve or create user account
  let userId: number;
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const rawPass = payload.password?.trim() || "prestador2026";
    const passwordHash = hashPassword(rawPass);
    const fullName = `${payload.name.trim()} ${payload.lastName.trim()}`.trim();

    const [newUser] = await db
      .insert(users)
      .values({
        name: fullName,
        email,
        phone: payload.phone.trim(),
        passwordHash,
        status: "ativo",
        isSuperAdmin: false,
      })
      .returning();

    userId = newUser.id;
  }

  // 2. Select target condominium (active condo or first available)
  let targetCondoId = payload.condoId;
  if (!targetCondoId) {
    const [firstCondo] = await db.select({ id: condominiums.id }).from(condominiums).limit(1);
    targetCondoId = firstCondo?.id ?? 1;
  }

  // 3. Create public slug from name/company
  const baseSlug = (payload.companyName || payload.name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

  const documents = payload.documentUrl
    ? [
        {
          name: payload.documentName || "Documento de identificação",
          url: payload.documentUrl,
          verified: false,
          submittedAt: new Date().toISOString(),
        },
      ]
    : [];

  const fullName = `${payload.name.trim()} ${payload.lastName.trim()}`.trim();

  // 4. Create or update vendor profile
  const [existingVendor] = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);

  let vendorId: number;
  if (existingVendor) {
    vendorId = existingVendor.id;
    await db
      .update(vendors)
      .set({
        name: fullName,
        companyName: payload.companyName || fullName,
        providerType: payload.providerType,
        cnpj: payload.cnpj || null,
        category: payload.category.toLowerCase(),
        phone: payload.phone,
        whatsapp: payload.phone,
        description: payload.description,
        serviceArea: payload.serviceArea,
        serviceRadiusKm: payload.serviceRadiusKm || 15,
        experienceYears: payload.experienceYears || 3,
        photoUrl: payload.photoUrl || existingVendor.photoUrl,
        services: payload.services,
        portfolio: payload.portfolio,
        documents,
        priceFromCents: payload.priceFromCents || null,
        onboardingStatus: "em_analise",
        active: true,
      })
      .where(eq(vendors.id, existingVendor.id));
  } else {
    const [newVendor] = await db
      .insert(vendors)
      .values({
        condoId: targetCondoId,
        userId,
        slug,
        name: fullName,
        companyName: payload.companyName || fullName,
        providerType: payload.providerType,
        cnpj: payload.cnpj || null,
        category: payload.category.toLowerCase(),
        contactName: fullName,
        phone: payload.phone,
        email,
        whatsapp: payload.phone,
        description: payload.description,
        serviceArea: payload.serviceArea,
        serviceRadiusKm: payload.serviceRadiusKm || 15,
        experienceYears: payload.experienceYears || 3,
        photoUrl: payload.photoUrl || null,
        services: payload.services,
        portfolio: payload.portfolio,
        documents,
        priceFromCents: payload.priceFromCents || null,
        onboardingStatus: "em_analise",
        isOnline: true,
        availableNow: true,
        active: true,
        verified: false,
        sponsored: false,
      })
      .returning();

    vendorId = newVendor.id;
  }

  // 5. Create automatic session for seamless onboarding
  await createSession(userId);

  revalidatePath("/prestador");
  revalidatePath("/painel/servicos");
  return { success: true, vendorId };
}

/**
 * Alternar status Online / Offline do Prestador
 */
export async function toggleProviderOnlineAction() {
  const { vendor } = await requireProvider();
  if (!vendor) return { success: false, error: "Perfil de prestador não encontrado." };

  const nextStatus = !vendor.isOnline;
  await db
    .update(vendors)
    .set({ isOnline: nextStatus })
    .where(eq(vendors.id, vendor.id));

  revalidatePath("/prestador");
  return { success: true, isOnline: nextStatus };
}

/**
 * Prestador aceita um chamado Sob Demanda
 */
export async function acceptServiceRequestAction(requestId: number) {
  const { vendor, session } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };
  if (req.status !== "solicitado" && req.status !== "buscando_prestador") {
    return { success: false, error: "Este chamado já foi assumido por outro profissional ou cancelado." };
  }

  await db
    .update(serviceRequests)
    .set({
      vendorId: vendor.id,
      status: "aceito",
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  // Registrar mensagem do sistema
  await db.insert(serviceMessages).values({
    requestId,
    senderId: session.user.id,
    senderRole: "sistema",
    body: `${vendor.name} aceitou o seu chamado e está preparando o atendimento.`,
  });

  // Notificar morador solicitante
  await notify(
    req.condoId,
    [req.customerId],
    `Profissional aceitou seu chamado!`,
    `${vendor.name} confirmou o atendimento para "${req.title}".`,
    `/painel/servicos`
  );

  revalidatePath("/prestador");
  revalidatePath("/prestador/chamados");
  revalidatePath(`/painel/servicos`);
  return { success: true };
}

/**
 * Prestador envia um orçamento formal com mão de obra + materiais
 */
export async function sendQuoteAction(payload: {
  requestId: number;
  laborCents: number;
  materialsCents: number;
  totalCents: number;
  description: string;
  estimatedDays?: number;
}) {
  const { vendor, session } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, payload.requestId))
    .limit(1);

  if (!req) return { success: false, error: "Solicitação não encontrada." };

  // Inserir proposta formal
  const [quote] = await db
    .insert(serviceQuotes)
    .values({
      requestId: payload.requestId,
      vendorId: vendor.id,
      laborCents: payload.laborCents,
      materialsCents: payload.materialsCents,
      totalCents: payload.totalCents,
      description: payload.description,
      estimatedDays: payload.estimatedDays || 1,
      status: "pendente",
    })
    .returning();

  // Atualiza chamado para aguardando aprovação
  await db
    .update(serviceRequests)
    .set({
      status: "aguardando_orcamento",
      vendorId: req.vendorId || vendor.id,
      estimatedAmountCents: payload.totalCents,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, payload.requestId));

  // Mensagem no chat
  await db.insert(serviceMessages).values({
    requestId: payload.requestId,
    senderId: session.user.id,
    senderRole: "prestador",
    body: `Orçamento enviado: R$ ${(payload.totalCents / 100).toFixed(2)} (Mão de obra: R$ ${(payload.laborCents / 100).toFixed(2)} | Materiais: R$ ${(payload.materialsCents / 100).toFixed(2)}). Previsão: ${payload.estimatedDays || 1} dia(s).`,
  });

  // Notificar morador
  await notify(
    req.condoId,
    [req.customerId],
    `Novo orçamento recebido!`,
    `${vendor.name} enviou uma proposta de R$ ${(payload.totalCents / 100).toFixed(2)} para seu serviço.`,
    `/painel/servicos`
  );

  revalidatePath("/prestador");
  revalidatePath("/prestador/chamados");
  revalidatePath("/painel/servicos");
  return { success: true, quoteId: quote.id };
}

/**
 * Atualizar avanço do serviço (State Machine Centralizada)
 */
export async function updateServiceProgressAction(
  requestId: number,
  nextStatus: "a_caminho" | "chegou" | "em_atendimento" | "concluido" | "cancelado",
  reason?: string
) {
  const { vendor, session } = await requireProvider();
  if (!vendor) return { success: false, error: "Não autorizado." };

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };

  // Validação de transições válidas
  const VALID_TRANSITIONS: Record<string, string[]> = {
    aceito: ["a_caminho", "cancelado"],
    orcamento_aprovado: ["a_caminho", "cancelado"],
    a_caminho: ["chegou", "cancelado"],
    chegou: ["em_atendimento", "cancelado"],
    em_atendimento: ["concluido", "cancelado"],
  };

  const allowed = VALID_TRANSITIONS[req.status] || [];
  if (!allowed.includes(nextStatus)) {
    return { success: false, error: `Transição inválida de ${req.status} para ${nextStatus}.` };
  }

  const updates: Record<string, any> = {
    status: nextStatus,
    updatedAt: new Date(),
  };

  if (nextStatus === "chegou") updates.arrivedAt = new Date();
  if (nextStatus === "em_atendimento") updates.startedAt = new Date();
  if (nextStatus === "concluido") updates.completedAt = new Date();
  if (nextStatus === "cancelado") {
    updates.cancelledAt = new Date();
    updates.cancelledBy = session.user.id;
    updates.cancelReason = reason || "Cancelado pelo prestador";
  }

  await db.update(serviceRequests).set(updates).where(eq(serviceRequests.id, requestId));

  // Chat message
  const statusLabels: Record<string, string> = {
    a_caminho: "O profissional informou que está a caminho do condomínio.",
    chegou: "O profissional chegou ao condomínio / portaria.",
    em_atendimento: "O atendimento foi iniciado.",
    concluido: "O prestador finalizou a execução do serviço.",
    cancelado: `Serviço cancelado. Motivo: ${reason || "Não informado"}`,
  };

  await db.insert(serviceMessages).values({
    requestId,
    senderId: session.user.id,
    senderRole: "sistema",
    body: statusLabels[nextStatus] || `Status atualizado para ${nextStatus}.`,
  });

  // Notificar morador
  await notify(
    req.condoId,
    [req.customerId],
    `Atualização no seu serviço: ${req.title}`,
    statusLabels[nextStatus] || `Status: ${nextStatus}`,
    `/painel/servicos`
  );

  revalidatePath("/prestador");
  revalidatePath("/prestador/chamados");
  revalidatePath("/painel/servicos");
  return { success: true };
}

/**
 * Atualizar Perfil e Loja do Prestador
 */
export async function updateProviderStorefrontAction(payload: {
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
}) {
  const { vendor } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  await db
    .update(vendors)
    .set({
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.whatsapp !== undefined && { whatsapp: payload.whatsapp }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.serviceArea !== undefined && { serviceArea: payload.serviceArea }),
      ...(payload.serviceRadiusKm !== undefined && { serviceRadiusKm: payload.serviceRadiusKm }),
      ...(payload.workingHours !== undefined && { workingHours: payload.workingHours }),
      ...(payload.photoUrl !== undefined && { photoUrl: payload.photoUrl }),
      ...(payload.coverUrl !== undefined && { coverUrl: payload.coverUrl }),
      ...(payload.services !== undefined && { services: payload.services }),
      ...(payload.portfolio !== undefined && { portfolio: payload.portfolio }),
    })
    .where(eq(vendors.id, vendor.id));

  revalidatePath("/prestador");
  revalidatePath("/prestador/perfil");
  revalidatePath("/prestador/servicos");
  revalidatePath("/painel/servicos");
  return { success: true };
}

/**
 * Prestador recusa uma solicitação de serviço
 */
export async function rejectServiceRequestAction(requestId: number, reason?: string) {
  const { vendor, session } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };

  // Se o chamado foi direcionado exclusivamente a este prestador, marca como cancelado/recusado
  await db
    .update(serviceRequests)
    .set({
      status: "cancelado",
      cancelledBy: session.user.id,
      cancelReason: reason || "Prestador indisponível para este atendimento no momento.",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  // Registrar mensagem no chat
  await db.insert(serviceMessages).values({
    requestId,
    senderId: session.user.id,
    senderRole: "prestador",
    body: `Solicitação recusada pelo prestador. Motivo: ${reason || "Indisponibilidade no horário solicitado."}`,
  });

  // Notificar morador
  await notify(
    req.condoId,
    [req.customerId],
    `Atualização no chamado ${req.code}`,
    `O prestador não pôde assumir este serviço no momento. Você pode selecionar outro profissional no Zeladoria Serviços.`,
    `/painel/servicos`
  );

  revalidatePath("/prestador");
  revalidatePath("/prestador/chamados");
  revalidatePath("/painel/servicos");
  return { success: true };
}

/**
 * Alternar botão "Estou disponível agora" (ON / OFF)
 */
export async function toggleProviderAvailableNowAction() {
  const { vendor } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  const nextVal = !vendor.availableNow;
  await db
    .update(vendors)
    .set({ availableNow: nextVal, isOnline: nextVal })
    .where(eq(vendors.id, vendor.id));

  revalidatePath("/prestador");
  revalidatePath("/prestador/disponibilidade");
  revalidatePath("/painel/servicos");
  return { success: true, availableNow: nextVal };
}

/**
 * Prestador adquire ou ativa plano de promoção/destaque interno
 */
export async function createPromotionCampaignAction(payload: {
  planId: number;
  type?: string;
  categoryId?: string;
  region?: string;
}) {
  const { vendor } = await requireProvider();
  if (!vendor) return { success: false, error: "Prestador não autorizado." };

  if (vendor.onboardingStatus === "suspenso" || vendor.onboardingStatus === "rejeitado") {
    return { success: false, error: "Prestadores suspensos ou reprovados não podem contratar campanhas de destaque." };
  }

  // Buscar plano
  let planDurationDays = 7;
  let planPriceCents = 2990;
  let planType = payload.type || "categoria";

  try {
    const [plan] = await db
      .select()
      .from(promotionPlans)
      .where(eq(promotionPlans.id, payload.planId))
      .limit(1);

    if (plan) {
      planDurationDays = plan.durationDays;
      planPriceCents = plan.priceCents;
      planType = plan.type;
    }
  } catch {
    // Usar defaults se tabela não estiver populada
  }

  const startsAt = new Date();
  const endsAt = new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000);

  const [promo] = await db
    .insert(providerPromotions)
    .values({
      condoId: vendor.condoId,
      vendorId: vendor.id,
      planId: payload.planId,
      type: planType,
      categoryId: payload.categoryId || vendor.category,
      region: payload.region || vendor.serviceArea || "Geral",
      startsAt,
      endsAt,
      status: "ACTIVE", // Ativo de imediato na simulação de contratação
      amountCents: planPriceCents,
      paymentStatus: "paid",
      impressions: 0,
      clicks: 0,
    })
    .returning();

  // Marca vendor com flag sponsored para consultas rápidas
  await db
    .update(vendors)
    .set({ sponsored: true })
    .where(eq(vendors.id, vendor.id));

  revalidatePath("/prestador");
  revalidatePath("/prestador/destaque");
  revalidatePath("/painel/servicos");
  return { success: true, promotionId: promo?.id };
}

/**
 * Cancelar campanha de destaque
 */
export async function cancelPromotionCampaignAction(promotionId: number) {
  const { vendor, session } = await requireProvider();
  const isStaff = session.role === "sindico" || session.role === "superadmin";

  const [promo] = await db
    .select()
    .from(providerPromotions)
    .where(eq(providerPromotions.id, promotionId))
    .limit(1);

  if (!promo) return { success: false, error: "Campanha não encontrada." };
  if (!isStaff && promo.vendorId !== vendor?.id) {
    return { success: false, error: "Sem permissão para cancelar esta campanha." };
  }

  await db
    .update(providerPromotions)
    .set({ status: "CANCELLED" })
    .where(eq(providerPromotions.id, promotionId));

  revalidatePath("/prestador/destaque");
  revalidatePath("/painel/admin/marketplace/destaques");
  revalidatePath("/painel/servicos");
  return { success: true };
}

/**
 * Admin cria um novo plano de publicidade interna
 */
export async function adminCreatePromotionPlanAction(payload: {
  name: string;
  type: string;
  durationDays: number;
  priceCents: number;
  description?: string;
}) {
  const session = await requireSession();
  const condoId = session.condo?.id ?? null;
  if (session.role !== "sindico" && session.role !== "superadmin") {
    return { success: false, error: "Apenas administradores podem criar planos de destaque." };
  }

  const [plan] = await db
    .insert(promotionPlans)
    .values({
      condoId,
      name: payload.name,
      type: payload.type,
      durationDays: payload.durationDays,
      priceCents: payload.priceCents,
      description: payload.description,
      active: true,
    })
    .returning();

  revalidatePath("/painel/admin/marketplace/destaques");
  revalidatePath("/prestador/destaque");
  return { success: true, planId: plan?.id };
}

/**
 * Admin ativa ou desativa um plano de destaque
 */
export async function adminTogglePromotionPlanAction(planId: number) {
  const session = await requireSession();
  if (session.role !== "sindico" && session.role !== "superadmin") {
    return { success: false, error: "Apenas administradores podem alterar planos." };
  }

  const [plan] = await db
    .select()
    .from(promotionPlans)
    .where(eq(promotionPlans.id, planId))
    .limit(1);

  if (!plan) return { success: false, error: "Plano não encontrado." };

  await db
    .update(promotionPlans)
    .set({ active: !plan.active })
    .where(eq(promotionPlans.id, planId));

  revalidatePath("/painel/admin/marketplace/destaques");
  revalidatePath("/prestador/destaque");
  return { success: true, active: !plan.active };
}
