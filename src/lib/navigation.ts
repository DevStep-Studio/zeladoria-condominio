import type { IconName } from "@/components/icon";
import type { Role } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  permission?: Permission;
  badge?: number;
};

export type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

/**
 * Estrutura base de navegação configurável por perfil e permissões.
 */
const MORADOR_NAVIGATION: NavGroup[] = [
  {
    id: "rotina",
    title: "Minha Rotina",
    items: [
      { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_own" },
      { id: "reservas", label: "Reservas", href: "/painel/reservas", icon: "calendar", permission: "reservation.view_own" },
      { id: "visitantes", label: "Visitantes", href: "/painel/visitantes", icon: "users", permission: "visitor.view_own" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_own" },
    ],
  },
  {
    id: "condominio",
    title: "Condomínio",
    items: [
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
      { id: "assembleias", label: "Assembleias", href: "/painel/assembleias", icon: "scale", permission: "assembly.view" },
      { id: "documentos", label: "Documentos", href: "/painel/documentos", icon: "folder", permission: "document.view" },
      { id: "sugestoes", label: "Sugestões", href: "/painel/sugestoes", icon: "megaphone", permission: "suggestion.view_own" },
    ],
  },
  {
    id: "servicos",
    title: "Serviços",
    items: [
      { id: "prestadores", label: "Encontrar prestador", href: "/painel/servicos", icon: "briefcase", permission: "provider.view" },
      { id: "minhas_contratacoes", label: "Minhas contratações", href: "/painel/servicos?tab=minhas-contratacoes", icon: "sparkles", permission: "provider.request" },
    ],
  },
];

const SINDICO_NAVIGATION: NavGroup[] = [
  {
    id: "gestao",
    title: "Gestão",
    items: [
      { id: "assembleias", label: "Assembleias", href: "/painel/assembleias", icon: "scale", permission: "assembly.view" },
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
      { id: "documentos", label: "Documentos", href: "/painel/documentos", icon: "folder", permission: "document.view" },
      { id: "sugestoes", label: "Sugestões", href: "/painel/sugestoes", icon: "megaphone", permission: "suggestion.view_all" },
    ],
  },
  {
    id: "servicos",
    title: "Serviços",
    items: [
      { id: "prestadores", label: "Prestadores", href: "/painel/servicos", icon: "briefcase", permission: "provider.view" },
      { id: "solicitar_orcamento", label: "Solicitar orçamento", href: "/painel/servicos?solicitar=true", icon: "sparkles", permission: "provider.request" },
    ],
  },
  {
    id: "operacao",
    title: "Operação",
    items: [
      { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "ordens", label: "Ordens de Serviço", href: "/painel/ordens", icon: "wrench", permission: "service_order.view" },
      { id: "manutencao", label: "Manutenção Preventiva", href: "/painel/manutencao", icon: "shield", permission: "maintenance.view" },
    ],
  },
  {
    id: "comunidade",
    title: "Comunidade",
    items: [
      { id: "reservas", label: "Reservas", href: "/painel/reservas", icon: "calendar", permission: "reservation.view_all" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_all" },
      { id: "visitantes", label: "Visitantes", href: "/painel/visitantes", icon: "users", permission: "visitor.view_all" },
    ],
  },
  {
    id: "gestao_condominio",
    title: "Gestão do Condomínio",
    items: [
      { id: "financeiro", label: "Financeiro", href: "/painel/financeiro", icon: "wallet", permission: "financial.view" },
      { id: "auditoria", label: "Auditoria", href: "/painel/auditoria", icon: "lock", permission: "audit.view" },
      { id: "relatorios", label: "Relatórios", href: "/painel/relatorios", icon: "chart", permission: "report.view" },
    ],
  },
];

/**
 * Retorna os grupos de navegação filtrados para o papel atual.
 * Grupos com zero itens autorizados são omitidos automaticamente.
 */
export function getNavigationGroups(role: Role, unreadAnnouncements = 0): NavGroup[] {
  const baseGroups = role === "morador" ? MORADOR_NAVIGATION : SINDICO_NAVIGATION;

  const resolved: NavGroup[] = [];

  for (const group of baseGroups) {
    const authorizedItems: NavItem[] = [];

    for (const item of group.items) {
      const allowed = item.permission ? hasPermission(role, item.permission) : true;
      if (allowed) {
        authorizedItems.push({
          ...item,
          badge: item.id === "comunicados" && unreadAnnouncements > 0 ? unreadAnnouncements : undefined,
        });
      }
    }

    // Regra dos Grupos Inteligentes: Não renderiza grupo vazio
    if (authorizedItems.length > 0) {
      resolved.push({
        id: group.id,
        title: group.title,
        items: authorizedItems,
      });
    }
  }

  return resolved;
}

/**
 * Retorna os 5 itens principais da barra de navegação móvel (Bottom Nav) conforme o perfil.
 */
export function getMobileNavItems(role: Role): NavItem[] {
  if (role === "morador") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard", permission: "occurrence.view_own" },
      { id: "reservas", href: "/painel/reservas", label: "Reservas", icon: "calendar", permission: "reservation.view_own" },
      { id: "servicos", href: "/painel/servicos", label: "Serviços", icon: "briefcase", permission: "provider.view" },
      { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" },
    ];
  }

  return [
    { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
    { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard", permission: "occurrence.view_all" },
    { id: "servicos", href: "/painel/servicos", label: "Serviços", icon: "briefcase", permission: "provider.view" },
    { id: "ordens", href: "/painel/ordens", label: "Ordens", icon: "wrench", permission: "service_order.view" },
    { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" },
  ];
}
