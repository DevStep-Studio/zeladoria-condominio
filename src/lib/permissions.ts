import type { Role } from "@/lib/auth";

export type Permission =
  // Dashboard
  | "dashboard.view"
  | "dashboard.management_metrics"

  // Ocorrências
  | "occurrence.view_own"
  | "occurrence.view_all"
  | "occurrence.create"
  | "occurrence.update_status"
  | "occurrence.manage"

  // Reservas
  | "reservation.view_own"
  | "reservation.view_all"
  | "reservation.create"
  | "reservation.manage"

  // Visitantes
  | "visitor.view_own"
  | "visitor.view_all"
  | "visitor.create"
  | "visitor.manage"

  // Encomendas
  | "package.view_own"
  | "package.view_all"
  | "package.manage"

  // Comunicados
  | "announcement.view"
  | "announcement.create"
  | "announcement.manage"

  // Assembleias
  | "assembly.view"
  | "assembly.participate"
  | "assembly.create"
  | "assembly.manage"

  // Documentos
  | "document.view"
  | "document.create"
  | "document.manage"

  // Sugestões
  | "suggestion.view_own"
  | "suggestion.view_all"
  | "suggestion.create"
  | "suggestion.manage"

  // Prestadores & Serviços
  | "provider.view"
  | "provider.request"
  | "provider.manage"

  // Ordens de Serviço
  | "service_order.view"
  | "service_order.create"
  | "service_order.manage"

  // Manutenção Preventiva
  | "maintenance.view"
  | "maintenance.manage"

  // Gestão Financeira & Orçamento
  | "financial.view"
  | "financial.manage"

  // Relatórios & Auditoria
  | "report.view"
  | "audit.view"

  // Configurações e Membros
  | "settings.manage";

/**
 * Matriz de permissões por papel.
 * Arquitetura preparada para fácil expansão (administrador, porteiro, funcionario, prestador).
 */
const MORADOR_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "occurrence.view_own",
  "occurrence.create",
  "reservation.view_own",
  "reservation.create",
  "visitor.view_own",
  "visitor.create",
  "package.view_own",
  "announcement.view",
  "assembly.view",
  "assembly.participate",
  "document.view",
  "suggestion.view_own",
  "suggestion.create",
  "provider.view",
  "provider.request",
];

const SINDICO_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "dashboard.management_metrics",
  "occurrence.view_own",
  "occurrence.view_all",
  "occurrence.create",
  "occurrence.update_status",
  "occurrence.manage",
  "reservation.view_own",
  "reservation.view_all",
  "reservation.create",
  "reservation.manage",
  "visitor.view_own",
  "visitor.view_all",
  "visitor.create",
  "visitor.manage",
  "package.view_own",
  "package.view_all",
  "package.manage",
  "announcement.view",
  "announcement.create",
  "announcement.manage",
  "assembly.view",
  "assembly.participate",
  "assembly.create",
  "assembly.manage",
  "document.view",
  "document.create",
  "document.manage",
  "suggestion.view_own",
  "suggestion.view_all",
  "suggestion.create",
  "suggestion.manage",
  "provider.view",
  "provider.request",
  "provider.manage",
  "service_order.view",
  "service_order.create",
  "service_order.manage",
  "maintenance.view",
  "maintenance.manage",
  "financial.view",
  "financial.manage",
  "report.view",
  "audit.view",
  "settings.manage",
];

const CONSELHO_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "dashboard.management_metrics",
  "occurrence.view_own",
  "occurrence.view_all",
  "reservation.view_own",
  "reservation.view_all",
  "announcement.view",
  "assembly.view",
  "assembly.participate",
  "document.view",
  "suggestion.view_all",
  "provider.view",
  "service_order.view",
  "maintenance.view",
  "financial.view",
  "report.view",
  "audit.view",
];

const ZELADOR_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "occurrence.view_all",
  "occurrence.create",
  "occurrence.update_status",
  "service_order.view",
  "service_order.manage",
  "maintenance.view",
  "maintenance.manage",
  "package.view_all",
  "package.manage",
  "visitor.view_all",
  "visitor.manage",
  "announcement.view",
  "provider.view",
];

const PORTEIRO_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "occurrence.view_all",
  "occurrence.create",
  "visitor.view_all",
  "visitor.manage",
  "package.view_all",
  "package.manage",
  "announcement.view",
  "provider.view",
];

export const ROLE_PERMISSIONS_MAP: Record<Role, Set<Permission>> = {
  superadmin: new Set([
    ...SINDICO_PERMISSIONS,
  ]),
  sindico: new Set(SINDICO_PERMISSIONS),
  conselho: new Set(CONSELHO_PERMISSIONS),
  zelador: new Set(ZELADOR_PERMISSIONS),
  porteiro: new Set(PORTEIRO_PERMISSIONS),
  morador: new Set(MORADOR_PERMISSIONS),
};

/**
 * Verifica se um papel possui uma permissão específica.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "superadmin") return true;
  const permissions = ROLE_PERMISSIONS_MAP[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Verifica se um papel possui pelo menos uma das permissões listadas.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  if (role === "superadmin") return true;
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Verifica se um papel possui todas as permissões listadas.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  if (role === "superadmin") return true;
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Atalho legível para verificação de permissão.
 */
export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission);
}
