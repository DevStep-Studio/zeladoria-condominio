import type { Role } from "@/lib/auth";

export type { Role };

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Super administrador",
  sindico: "Síndico(a)",
  conselho: "Conselho",
  zelador: "Zelador(a)",
  porteiro: "Portaria",
  morador: "Morador(a)",
  prestador: "Prestador(a) Parceiro",
};

export const ALL_STAFF: Role[] = ["superadmin", "sindico", "conselho", "zelador"];
export const GATE: Role[] = ["superadmin", "sindico", "porteiro", "zelador"];
export const EVERYONE: Role[] = ["superadmin", "sindico", "conselho", "zelador", "porteiro", "morador"];

import type { IconName } from "@/components/icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  roles: Role[];
  primary?: boolean;
};

/* Primary navigation — The 8 core system modules */
const PRIMARY_NAV: NavItem[] = [
  { href: "/painel", label: "Início", icon: "grid", roles: EVERYONE, primary: true },
  { href: "/painel/agenda", label: "Agenda", icon: "calendar", roles: EVERYONE, primary: true },
  { href: "/painel/servicos", label: "Serviços", icon: "wrench", roles: EVERYONE, primary: true },
  { href: "/painel/reservas", label: "Reservas", icon: "building", roles: EVERYONE, primary: true },
  { href: "/painel/ocorrencias", label: "Ocorrências", icon: "book", roles: EVERYONE, primary: true },
  { href: "/painel/assembleias", label: "Assembleias", icon: "scale", roles: EVERYONE, primary: true },
  { href: "/painel/portaria", label: "Portaria", icon: "shield", roles: EVERYONE, primary: true },
  { href: "/painel/perfil", label: "Perfil", icon: "user", roles: EVERYONE, primary: true },
];

/* Secondary navigation */
const MORE_NAV: NavItem[] = [
  { href: "/painel/notificacoes", label: "Notificações", icon: "bell", roles: EVERYONE },
  { href: "/painel/auditoria", label: "Auditoria", icon: "lock", roles: ["superadmin", "sindico"] },
];

export type NavGroup = { primary: NavItem[]; more: NavItem[] };

export function navFor(role: Role): NavGroup {
  return {
    primary: PRIMARY_NAV.filter((i) => i.roles.includes(role)),
    more: MORE_NAV.filter((i) => i.roles.includes(role)),
  };
}

/** Flat list used to resolve the page title in the header. */
export function allNavItems(role: Role): NavItem[] {
  const { primary, more } = navFor(role);
  return [...primary, ...more];
}

/** Mobile bottom-nav subset — the 5 core destinations: Início, Ocorrências, Reservas, Serviços, Perfil. */
export function mobileNavItems(role: Role): NavItem[] {
  const orderedHrefs = [
    "/painel",
    "/painel/ocorrencias",
    "/painel/reservas",
    "/painel/servicos",
    "/painel/perfil",
  ];
  return orderedHrefs
    .map((h) => PRIMARY_NAV.find((item) => item.href === h))
    .filter((item): item is NavItem => Boolean(item && item.roles.includes(role)));
}

export function can(role: Role, roles: Role[]) {
  return roles.includes(role);
}
