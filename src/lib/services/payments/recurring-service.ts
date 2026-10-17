import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  contracts,
  financialLedgerEntries,
  paymentOrders,
  payouts,
  vendors,
} from "@/db/schema";
import { getMarketplaceSettings, recordLedgerEntry } from "./payment-service";
import { notify } from "@/lib/audit";
import { sendWhatsAppNotification } from "../whatsapp/whatsapp-service";

export interface RecurringBillingResult {
  success: boolean;
  orderId: number;
  code: string;
  grossAmountCents: number;
  platformFeeCents: number;
  netVendorCents: number;
  status: string;
  alreadyGenerated?: boolean;
}

/**
 * Gera fatura e ciclo mensal de cobrança para contrato de manutenção preventiva predial
 * (Bombas, geradores, portões, elevadores)
 */
export async function generateRecurringContractCycle(params: {
  contractId: number;
  condoId: number;
  cycleDate?: Date;
}): Promise<RecurringBillingResult> {
  const { contractId, condoId, cycleDate = new Date() } = params;

  // 1. Busca contrato ativo
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.condoId, condoId)))
    .limit(1);

  if (!contract) {
    throw new Error("Contrato não encontrado ou não pertence a este condomínio.");
  }

  if (contract.status !== "vigente") {
    throw new Error(`Contrato não está vigente (status atual: ${contract.status}).`);
  }

  const yearMonth = `${cycleDate.getFullYear()}-${String(cycleDate.getMonth() + 1).padStart(2, "0")}`;
  const code = `REC-${contract.id}-${yearMonth}`;

  // 2. Idempotência: verifica se o ciclo já foi emitido
  const [existingOrder] = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.code, code))
    .limit(1);

  if (existingOrder) {
    return {
      success: true,
      orderId: existingOrder.id,
      code: existingOrder.code,
      grossAmountCents: existingOrder.amountGrossCents,
      platformFeeCents: existingOrder.platformFeeCents,
      netVendorCents: existingOrder.netVendorCents,
      status: existingOrder.status,
      alreadyGenerated: true,
    };
  }

  // 3. Busca regras de taxa configuradas (nunca hardcoded)
  const settings = await getMarketplaceSettings(condoId);
  const grossAmountCents = contract.valueCents || 0;
  if (grossAmountCents <= 0) {
    throw new Error("Valor do contrato inválido ou zerado.");
  }

  const commissionPercent = settings.commissionPercent ?? 10;
  const platformFeeCents = Math.round((grossAmountCents * commissionPercent) / 100);
  const netVendorCents = grossAmountCents - platformFeeCents;

  // 4. Criação da ordem de pagamento recorrente
  const [order] = await db
    .insert(paymentOrders)
    .values({
      condoId,
      requestId: 0,
      contractId: contract.id,
      customerId: contract.condoId, // O condomínio é o tomador do serviço
      vendorId: contract.vendorId,
      purpose: "servico",
      code,
      amountGrossCents: grossAmountCents,
      platformFeeCents,
      netVendorCents,
      commissionPercent,
      pspProvider: "asaas",
      status: "pending",
    })
    .returning();

  // 5. Criação do repasse previsto para a empresa prestadora
  await db.insert(payouts).values({
    condoId,
    vendorId: contract.vendorId,
    paymentOrderId: order.id,
    grossAmountCents,
    platformFeeCents,
    processingFeeCents: 0,
    netAmountCents: netVendorCents,
    status: "ELIGIBLE",
  });

  // 6. Registro no Ledger Imutável
  await recordLedgerEntry({
    condoId,
    paymentOrderId: order.id,
    eventType: "RECURRING_CONTRACT_INVOICE",
    amountCents: grossAmountCents,
    balanceType: "credit",
    entityType: "platform",
    referenceCode: code,
    description: `Fatura mensal gerada: ${contract.title} (${yearMonth})`,
    metadata: {
      contractId: contract.id,
      billingCycle: contract.billingCycle,
      commissionPercent,
    },
  });

  return {
    success: true,
    orderId: order.id,
    code,
    grossAmountCents,
    platformFeeCents,
    netVendorCents,
    status: order.status,
    alreadyGenerated: false,
  };
}

/**
 * Server action para disparar geração de fatura de contrato pelo síndico
 */
export async function triggerContractMonthlyCycleAction(contractId: number, condoId: number) {
  try {
    const res = await generateRecurringContractCycle({ contractId, condoId });
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao gerar ciclo recorrente." };
  }
}
