"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import { num, str } from "@/lib/utils";
import { assistNote, suggestCategory, suggestPriority } from "@/lib/ai";

export async function createServiceRequestAction(formData: FormData) {
  const title = str(formData, "title");
  const description = str(formData, "description");
  if (!title || !description) {
    return { success: false, error: "Título e descrição são obrigatórios." };
  }

  const category = str(formData, "category") || suggestCategory(`${title} ${description}`) || "manutencao";
  const priority = str(formData, "priority") || suggestPriority(`${title} ${description}`) || "media";
  const location = str(formData, "location", "Unidade do Morador");
  const preferredTime = str(formData, "preferredTime");
  const vendorId = num(formData, "vendorId") || null;
  const unitId = num(formData, "unitId") || null;

  const result = await domainAction<{ success: boolean; error?: string; id?: number; code?: string }>("/chamados-servico", "POST", {
    title,
    description,
    category,
    priority,
    location,
    preferredTime,
    vendorId,
    unitId,
    aiPriority: priority,
    aiSummary: assistNote(priority, category),
  });

  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/painel");
  }
  return result;
}

export async function updateServiceStatusAction(formData: FormData) {
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/chamados-servico/${id}/status`, "PATCH", {
    status: str(formData, "status") || undefined,
    vendorId: num(formData, "vendorId") || undefined,
    assignedToId: num(formData, "assignedToId") || undefined,
    scheduledFor: str(formData, "scheduledFor") || undefined,
    costCents: num(formData, "costCents") || undefined,
    report: str(formData, "report") || undefined,
    comment: str(formData, "comment") || undefined,
  });

  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/painel");
  }
  return result;
}

export async function rateServiceAction(formData: FormData) {
  const id = num(formData, "id");
  const rating = num(formData, "rating");
  const ratingComment = str(formData, "ratingComment");

  if (!id || !rating) return { success: false, error: "Avaliação inválida." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/chamados-servico/${id}/avaliacao`, "POST", {
    rating,
    ratingComment,
  });

  if (result.success) {
    revalidatePath("/painel/servicos");
  }
  return result;
}
