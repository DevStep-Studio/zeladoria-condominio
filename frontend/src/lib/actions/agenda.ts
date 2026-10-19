"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import { num, str } from "@/lib/utils";

export async function createAgendaEventAction(formData: FormData) {
  const title = str(formData, "title");
  const date = str(formData, "date");
  const startTime = str(formData, "startTime", "08:00");
  const endTime = str(formData, "endTime", "10:00");
  const category = str(formData, "category", "evento");
  const location = str(formData, "location", "Área Comum");
  const description = str(formData, "description");
  const responsible = str(formData, "responsible");
  const audienceScope = str(formData, "audienceScope", "todos");
  const reminder = str(formData, "reminder", "1d");
  const recurrence = str(formData, "recurrence", "nenhuma");
  const amenityId = num(formData, "amenityId") || null;

  if (!title || !date) {
    return { success: false, error: "Título e data são obrigatórios." };
  }

  const result = await domainAction<{ success: boolean; error?: string; id?: number }>("/agenda", "POST", {
    title,
    date,
    startTime,
    endTime,
    category,
    location,
    description,
    responsible: responsible || undefined,
    audienceScope,
    reminder,
    recurrence,
    amenityId,
  });

  if (result.success) {
    revalidatePath("/painel/agenda");
    revalidatePath("/painel");
  }
  return result;
}

export async function deleteAgendaEventAction(formData: FormData) {
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID não informado." };

  const result = await domainAction<{ success: boolean; error?: string }>(`/agenda/${id}`, "DELETE");

  if (result.success) {
    revalidatePath("/painel/agenda");
    revalidatePath("/painel");
  }
  return result;
}
