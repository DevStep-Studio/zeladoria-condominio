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
      { id: "minhas_contratacoes", label: "Minhas contratações", href: "/painel/servicos?tab=minhas-contratacoes", icon: "sparkles", permission: "marketplace.request.view_own" },
    ],
  },
];

const PORTEIRO_NAVIGATION: NavGroup[] = [
  {
    id: "operacao_portaria",
    title: "Central de Portaria",
    items: [
      { id: "visitantes", label: "Visitantes & Acessos", href: "/painel/visitantes", icon: "users", permission: "visitor.view_all" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_all" },
      { id: "quem_esta_dentro", label: "Agora na Portaria", href: "/painel/portaria", icon: "shield", permission: "visitor.checkin" },
      { id: "livro", label: "Livro Digital", href: "/painel/livro", icon: "book", permission: "logbook.view" },
      { id: "turnos", label: "Passagem de Turno", href: "/painel/turnos", icon: "refresh", permission: "shift.view" },
    ],
  },
  {
    id: "apoio_operacional",
    title: "Apoio & Consultas",
    items: [
      { id: "ocorrencias", label: "Ocorrência Rápida", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "reservas", label: "Reservas de Hoje", href: "/painel/reservas", icon: "calendar", permission: "reservation.view_all" },
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
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
      { id: "sugestoes", label: "Sugestões & Ouvidoria", href: "/painel/sugestoes", icon: "megaphone", permission: "suggestion.view_all" },
    ],
  },
  {
    id: "operacao",
    title: "Operação & Manutenção",
    items: [
      { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "ordens", label: "Ordens de Serviço", href: "/painel/ordens", icon: "wrench", permission: "service_order.view" },
      { id: "manutencao", label: "Manutenção Preventiva", href: "/painel/manutencao", icon: "shield", permission: "maintenance.view" },
      { id: "livro", label: "Livro Digital", href: "/painel/livro", icon: "book", permission: "logbook.view" },
    ],
  },
  {
    id: "portaria_comunidade",
    title: "Portaria & Comunidade",
    items: [
      { id: "reservas", label: "Reservas", href: "/painel/reservas", icon: "calendar", permission: "reservation.view_all" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_all" },
      { id: "visitantes", label: "Visitantes & Acessos", href: "/painel/visitantes", icon: "users", permission: "visitor.view_all" },
      { id: "turnos", label: "Passagem de Turno", href: "/painel/turnos", icon: "refresh", permission: "shift.view" },
    ],
  },
  {
    id: "servicos",
    title: "Serviços & Parceiros",
    items: [
      { id: "prestadores", label: "Prestadores de Serviços", href: "/painel/servicos", icon: "briefcase", permission: "provider.view" },
      { id: "fornecedores", label: "Fornecedores Cadastrados", href: "/painel/fornecedores", icon: "sparkles", permission: "provider.manage" },
    ],
  },
  {
    id: "gestao_condominio",
    title: "Administração",
    items: [
      { id: "moradores", label: "Moradores & Unidades", href: "/painel/moradores", icon: "users", permission: "user.manage" },
      { id: "financeiro", label: "Financeiro", href: "/painel/financeiro", icon: "wallet", permission: "financial.view" },
      { id: "auditoria", label: "Auditoria & Logs", href: "/painel/auditoria", icon: "lock", permission: "audit.view" },
      { id: "relatorios", label: "Relatórios & Métricas", href: "/painel/relatorios", icon: "chart", permission: "report.view" },
      { id: "configuracoes", label: "Configurações", href: "/painel/configuracoes", icon: "settings", permission: "condominium.settings.manage" },
    ],
  },
];

const ZELADOR_NAVIGATION: NavGroup[] = [
  {
    id: "operacao",
    title: "Operação Predial",
    items: [
      { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "ordens", label: "Ordens de Serviço", href: "/painel/ordens", icon: "wrench", permission: "service_order.view" },
      { id: "manutencao", label: "Manutenção Preventiva", href: "/painel/manutencao", icon: "shield", permission: "maintenance.view" },
      { id: "livro", label: "Livro Digital", href: "/painel/livro", icon: "book", permission: "logbook.view" },
    ],
  },
  {
    id: "portaria_apoio",
    title: "Portaria & Apoio",
    items: [
      { id: "visitantes", label: "Visitantes", href: "/painel/visitantes", icon: "users", permission: "visitor.view_all" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_all" },
      { id: "turnos", label: "Turnos", href: "/painel/turnos", icon: "refresh", permission: "shift.view" },
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
    ],
  },
];

const CONSELHO_NAVIGATION: NavGroup[] = [
  {
    id: "acompanhamento",
    title: "Acompanhamento do Conselho",
    items: [
      { id: "documentos", label: "Documentos & Atas", href: "/painel/documentos", icon: "folder", permission: "document.view" },
      { id: "financeiro", label: "Prestação de Contas", href: "/painel/financeiro", icon: "wallet", permission: "financial.view" },
      { id: "auditoria", label: "Auditoria", href: "/painel/auditoria", icon: "lock", permission: "audit.view" },
      { id: "relatorios", label: "Relatórios", href: "/painel/relatorios", icon: "chart", permission: "report.view" },
      { id: "livro", label: "Livro de Ocorrências", href: "/painel/livro", icon: "book", permission: "logbook.view" },
    ],
  },
  {
    id: "condominio",
    title: "Condomínio",
    items: [
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
      { id: "assembleias", label: "Assembleias", href: "/painel/assembleias", icon: "scale", permission: "assembly.view" },
    ],
  },
];

const PRESTADOR_NAVIGATION: NavGroup[] = [
  {
    id: "servicos_prestador",
    title: "Atendimentos",
    items: [
      { id: "chamados", label: "Meus Atendimentos", href: "/painel/servicos?tab=prestador", icon: "briefcase", permission: "provider.calls.view" },
      { id: "perfil", label: "Perfil Profissional", href: "/painel/perfil", icon: "user", permission: "provider.profile.update" },
    ],
  },
];

/**
 * Retorna os grupos de navegação filtrados para o papel atual.
 * Grupos com zero itens autorizados são omitidos automaticamente.
 */
export function getNavigationGroups(role: Role, unreadAnnouncements = 0): NavGroup[] {
  let baseGroups: NavGroup[];

  switch (role) {
    case "morador":
      baseGroups = MORADOR_NAVIGATION;
      break;
    case "porteiro":
      baseGroups = PORTEIRO_NAVIGATION;
      break;
    case "zelador":
      baseGroups = ZELADOR_NAVIGATION;
      break;
    case "conselho":
      baseGroups = CONSELHO_NAVIGATION;
      break;
    case "prestador":
      baseGroups = PRESTADOR_NAVIGATION;
      break;
    case "sindico":
    case "superadmin":
    default:
      baseGroups = SINDICO_NAVIGATION;
      break;
  }

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
  if (role === "porteiro") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "visitantes", href: "/painel/visitantes", label: "Visitantes", icon: "users", permission: "visitor.view_all" },
      { id: "encomendas", href: "/painel/encomendas", label: "Encomendas", icon: "package", permission: "package.view_all" },
      { id: "livro", href: "/painel/livro", label: "Livro", icon: "book", permission: "logbook.view" },
      { id: "turnos", href: "/painel/turnos", label: "Turno", icon: "refresh", permission: "shift.view" },
    ];
  }

  if (role === "morador") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard", permission: "occurrence.view_own" },
      { id: "reservas", href: "/painel/reservas", label: "Reservas", icon: "calendar", permission: "reservation.view_own" },
      { id: "servicos", href: "/painel/servicos", label: "Serviços", icon: "briefcase", permission: "provider.view" },
      { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" },
    ];
  }

  if (role === "zelador") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "ordens", href: "/painel/ordens", label: "Ordens", icon: "wrench", permission: "service_order.view" },
      { id: "manutencao", href: "/painel/manutencao", label: "Manutenção", icon: "shield", permission: "maintenance.view" },
      { id: "livro", href: "/painel/livro", label: "Livro", icon: "book", permission: "logbook.view" },
    ];
  }

  if (role === "prestador") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "chamados", href: "/painel/servicos?tab=prestador", label: "Chamados", icon: "briefcase", permission: "provider.calls.view" },
      { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" },
    ];
  }

  // Síndico / Superadmin
  return [
    { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
    { id: "ocorrencias", href: "/painel/ocorrencias", label: "Ocorrências", icon: "clipboard", permission: "occurrence.view_all" },
    { id: "ordens", href: "/painel/ordens", label: "Ordens", icon: "wrench", permission: "service_order.view" },
    { id: "gestao", href: "/painel/assembleias", label: "Gestão", icon: "scale", permission: "assembly.view" },
    { id: "perfil", href: "/painel/perfil", label: "Perfil", icon: "user" },
  ];
}
