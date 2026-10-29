import { z } from "zod";

/**
 * Roles permitidas para atribuição dentro de um condomínio pelo Síndico ou Gestor.
 * Proíbe estritamente a elevação para 'superadmin'.
 */
export const AllowedCondoRoles = [
  "morador",
  "sindico",
  "conselho",
  "zelador",
  "porteiro",
] as const;

export const CondoRoleSchema = z.enum(AllowedCondoRoles);

export const InviteResidentSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  role: CondoRoleSchema.default("morador"),
  unitId: z.coerce.number().int().positive("Unidade inválida").optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  document: z.string().trim().max(32).optional().nullable(),
});

export const DataUrlImageSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      const match = val.match(/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return false;
      const base64Data = match[2];
      const approxBytes = (base64Data.length * 3) / 4;
      return approxBytes <= 8 * 1024 * 1024; // 8MB
    },
    { message: "Formato de imagem inválido ou excede o limite máximo de 8MB." }
  );

export const ParcelPickupPinSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "O código de retirada deve ter entre 4 e 6 dígitos numéricos.");

export const AssemblyVoteSchema = z.object({
  assemblyId: z.coerce.number().int().positive(),
  agendaId: z.coerce.number().int().positive(),
  choice: z.string().trim().min(1, "Voto obrigatório").max(60),
  unitId: z.coerce.number().int().positive("Voto em assembleia requer unidade vinculada."),
});

export const AssemblyMinutesSchema = z.object({
  assemblyId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(10, "A ata deve conter o registro formal das deliberações."),
});
