"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import { num, str } from "@/lib/utils";

export async function createOccurrenceAction(formData: FormData) {
  const title = str(formData, "title");
  const description = str(formData, "description");
  if (!title || !description) {
    return { success: false, error: "Título e descrição são obrigatórios." };
  }

  const category = str(formData, "category", "seguranca");
  const severity = str(formData, "severity", "media");
  const visibility = str(formData, "visibility", "publica");
  const exactLocation = str(formData, "exactLocation");
  const unitId = num(formData, "unitId") || null;

  let attachments: string[] = [];
  const rawAttachments = str(formData, "attachments");
  if (rawAttachments) {
    try {
      const parsed = JSON.parse(rawAttachments);
      if (Array.isArray(parsed)) {
        attachments = parsed
          .filter((v): v is string => typeof v === "string")
          .filter((v) => /^(data:image\/|https?:\/\/)/.test(v))
          .slice(0, 4);
      }
    } catch {
      attachments = [];
    }
  }

  const rawLat = str(formData, "latitude");
  const rawLng = str(formData, "longitude");
  const parsedLat = rawLat ? parseFloat(rawLat) : null;
  const parsedLng = rawLng ? parseFloat(rawLng) : null;
  const latitude = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
  const longitude = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

  const result = await domainAction<{ success: boolean; error?: string; code?: string; id?: number }>("/ocorrencias", "POST", {
    title,
    description,
    category,
    severity,
    visibility,
    exactLocation,
    unitId,
    latitude,
    longitude,
    attachments,
  });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
    revalidatePath("/painel");
  }
  return result;
}

export async function updateOccurrenceStatusAction(formData: FormData) {
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/ocorrencias/${id}/status`, "PATCH", {
    status: str(formData, "status") || undefined,
    actionsTaken: str(formData, "actionsTaken") || undefined,
    assignedToId: num(formData, "assignedToId") || undefined,
    comment: str(formData, "comment") || undefined,
  });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
    revalidatePath("/painel");
  }
  return result;
}

export async function addOccurrenceCommentAction(formData: FormData) {
  const occurrenceId = num(formData, "occurrenceId");
  const body = str(formData, "body");

  if (!occurrenceId || !body) return { success: false, error: "Comentário inválido." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/ocorrencias/${occurrenceId}/comentarios`, "POST", { body });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
  }
  return result;
}

export async function rateOccurrenceAction(formData: FormData) {
  const id = num(formData, "id");
  const rating = num(formData, "rating");
  const comment = str(formData, "residentComment");

  if (!id || !rating) return { success: false, error: "Avaliação inválida." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/ocorrencias/${id}/avaliacao`, "POST", {
    rating,
    residentComment: comment,
  });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
  }
  return result;
}

export async function reopenOccurrenceAction(formData: FormData) {
  const id = num(formData, "id");
  const reason = str(formData, "reason") || "Morador indicou que o problema ainda persiste.";

  if (!id) return { success: false, error: "ID inválido." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/ocorrencias/${id}/reabrir`, "POST", { reason });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
  }
  return result;
}

export async function updateOccurrenceDetailsAction(formData: FormData) {
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/ocorrencias/${id}`, "PATCH", {
    status: str(formData, "status") || undefined,
    severity: str(formData, "severity") || undefined,
    assignedToId: str(formData, "assignedToId") || undefined,
    actionsTaken: str(formData, "actionsTaken") || undefined,
    comment: str(formData, "comment") || undefined,
  });

  if (result.success) {
    revalidatePath("/painel/ocorrencias");
  }
  return result;
}
