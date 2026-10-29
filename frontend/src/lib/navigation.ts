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
  href?: string;
  icon?: IconName;
  permission?: Permission;
  badge?: number;
  items: NavItem[];
};

/**
 * 1. NAVEGAÇÃO DO MORADOR
 * Objetivo principal: Resolver a própria rotina
 */
export const MORADOR_NAVIGATION: NavGroup[] = [
  {
    id: "rotina",
    title: "Minha rotina",
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
      { id: "prestadores", label: "Encontrar profissional", href: "/painel/servicos", icon: "briefcase", permission: "provider.view" },
      { id: "minhas_contratacoes", label: "Minhas contratações", href: "/painel/servicos?tab=minhas-contratacoes", icon: "sparkles", permission: "marketplace.request.view_own" },
      { id: "favoritos", label: "Favoritos", href: "/painel/servicos?tab=favoritos", icon: "star", permission: "marketplace.favorite.toggle" },
    ],
  },
  {
    id: "conta",
    title: "Conta",
    items: [
      { id: "perfil", label: "Meu perfil", href: "/painel/perfil", icon: "user" },
      { id: "notificacoes", label: "Notificações", href: "/painel/notificacoes", icon: "bell" },
      { id: "ajuda", label: "Ajuda", href: "/painel/ajuda", icon: "help" },
    ],
  },
];

/**
 * 2. NAVEGAÇÃO DO SÍNDICO
 * Objetivo principal: Administrar o condomínio
 */
export const SINDICO_NAVIGATION: NavGroup[] = [
  {
    id: "operacao",
    title: "Operação",
    items: [
      { id: "ocorrencias", label: "Ocorrências", href: "/painel/ocorrencias", icon: "clipboard", permission: "occurrence.view_all" },
      { id: "ordens", label: "Ordens de serviço", href: "/painel/ordens", icon: "wrench", permission: "service_order.view" },
      { id: "manutencao", label: "Manutenção preventiva", href: "/painel/manutencao", icon: "shield", permission: "maintenance.view" },
    ],
  },
  {
    id: "comunidade",
    title: "Comunidade",
    items: [
      { id: "reservas", label: "Reservas", href: "/painel/reservas", icon: "calendar", permission: "reservation.view_all" },
      { id: "visitantes", label: "Visitantes", href: "/painel/visitantes", icon: "users", permission: "visitor.view_all" },
      { id: "encomendas", label: "Encomendas", href: "/painel/encomendas", icon: "package", permission: "package.view_all" },
    ],
  },
  {
    id: "comunicacao",
    title: "Comunicação",
    items: [
      { id: "comunicados", label: "Comunicados", href: "/painel/comunicados", icon: "mail", permission: "announcement.view" },
      { id: "assembleias", label: "Assembleias", href: "/painel/assembleias", icon: "scale", permission: "assembly.view" },
      { id: "sugestoes", label: "Sugestões", href: "/painel/sugestoes", icon: "megaphone", permission: "suggestion.view_all" },
      { id: "documentos", label: "Documentos", href: "/painel/documentos", icon: "folder", permission: "document.view" },
    ],
  },
  {
    id: "servicos",
    title: "Serviços",
    items: [
      { id: "prestadores", label: "Encontrar prestador", href: "/painel/servicos", icon: "briefcase", permission: "provider.view" },
      { id: "contratacoes", label: "Contratações do condomínio", href: "/painel/servicos?tab=contratacoes", icon: "sparkles", permission: "marketplace.request.view_own" },
      { id: "fornecedores", label: "Prestadores utilizados", href: "/painel/fornecedores", icon: "user-check", permission: "provider.manage" },
    ],
  },
  {
    id: "gestao",
    title: "Gestão",
    items: [
      { id: "moradores", label: "Moradores e unidades", href: "/painel/moradores", icon: "users", permission: "user.manage" },
      { id: "financeiro", label: "Financeiro & Contas", href: "/painel/financeiro", icon: "wallet", permission: "financial.view" },
      { id: "equipe", label: "Equipe e porteiros", href: "/painel/portaria", icon: "shield", permission: "shift.view" },
      { id: "equipamentos", label: "Equipamentos", href: "/painel/manutencao?tab=equipamentos", icon: "package", permission: "maintenance.view" },
      { id: "relatorios", label: "Relatórios", href: "/painel/relatorios", icon: "chart", permission: "report.view" },
      { id: "livro", label: "Livro digital", href: "/painel/livro", icon: "book", permission: "logbook.view" },
    ],
  },
  {
    id: "administracao",
    title: "Administração",
    items: [
      { id: "avisos_erros", label: "Avisos e erros", href: "/painel/sistema/avisos-erros", icon: "alert-triangle" },
      { id: "implantacao", label: "Implantação & Onboarding", href: "/painel/implantacao", icon: "sparkles", permission: "condominium.settings.manage" },
      { id: "configuracoes", label: "Configurações do condomínio", href: "/painel/configuracoes", icon: "settings", permission: "condominium.settings.manage" },
      { id: "usuarios_acessos", label: "Usuários e acessos", href: "/painel/moradores?tab=acessos", icon: "lock", permission: "user.manage" },
      { id: "auditoria", label: "Auditoria", href: "/painel/auditoria", icon: "activity", permission: "audit.view" },
    ],
  },
  {
    id: "conta",
    title: "Conta",
    items: [
      { id: "perfil", label: "Meu perfil", href: "/painel/perfil", icon: "user" },
      { id: "notificacoes", label: "Notificações", href: "/painel/notificacoes", icon: "bell" },
      { id: "ajuda", label: "Ajuda & Suporte", href: "/painel/ajuda", icon: "help" },
    ],
  },
];

/**
 * 3. NAVEGAÇÃO DO PRESTADOR
 * Objetivo principal: Conseguir e executar serviços (zero gestão de condomínio)
 */
export const PRESTADOR_NAVIGATION: NavGroup[] = [
  {
    id: "trabalho",
    title: "Trabalho",
    items: [
      { id: "oportunidades", label: "Oportunidades", href: "/prestador/chamados?tab=oportunidades", icon: "search", permission: "provider.calls.view" },
      { id: "atendimentos", label: "Meus atendimentos", href: "/prestador/chamados?tab=atendimentos", icon: "clipboard", permission: "provider.calls.view" },
      { id: "orcamentos", label: "Orçamentos", href: "/prestador/chamados?tab=orcamentos", icon: "file", permission: "provider.quote.create" },
      { id: "agenda", label: "Agenda", href: "/prestador/agenda", icon: "calendar", permission: "provider.calls.view" },
    ],
  },
  {
    id: "meu_negocio",
    title: "Meu negócio",
    items: [
      { id: "perfil_profissional", label: "Perfil profissional", href: "/prestador/perfil", icon: "user", permission: "provider.profile.update" },
      { id: "servicos_precos", label: "Serviços e preços", href: "/prestador/servicos", icon: "wrench", permission: "provider.profile.update" },
      { id: "portfolio", label: "Portfólio", href: "/prestador/portfolio", icon: "camera", permission: "provider.profile.update" },
      { id: "area_atendimento", label: "Área de atendimento", href: "/prestador/disponibilidade?tab=area", icon: "map-pin", permission: "provider.profile.update" },
      { id: "disponibilidade", label: "Disponibilidade", href: "/prestador/disponibilidade", icon: "clock", permission: "provider.profile.update" },
    ],
  },
  {
    id: "reputacao",
    title: "Reputação",
    items: [
      { id: "avaliacoes", label: "Avaliações", href: "/prestador/avaliacoes", icon: "star", permission: "provider.calls.view" },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    items: [
      { id: "ganhos", label: "Ganhos", href: "/prestador/ganhos", icon: "wallet", permission: "provider.earnings.view" },
      { id: "repasses", label: "Repasses", href: "/prestador/ganhos?tab=repasses", icon: "refresh", permission: "provider.earnings.view" },
      { id: "dados_recebimento", label: "Dados de recebimento", href: "/prestador/ganhos?tab=banco", icon: "check-circle", permission: "provider.earnings.view" },
    ],
  },
  {
    id: "crescimento",
    title: "Crescimento",
    items: [
      { id: "promover_perfil", label: "Promover meu perfil", href: "/prestador/destaque", icon: "sparkles", permission: "provider.profile.update" },
    ],
  },
  {
    id: "conta",
    title: "Conta",
    items: [
      { id: "configuracoes", label: "Configurações", href: "/prestador/configuracoes", icon: "settings" },
      { id: "ajuda", label: "Ajuda", href: "/prestador/ajuda", icon: "help" },
    ],
  },
];

/**
 * 4. NAVEGAÇÃO DO ADMIN DA PLATAFORMA
 * Objetivo principal: Administrar o ecossistema Zeladoria como negócio
 */
export const ADMIN_NAVIGATION: NavGroup[] = [
  {
    id: "plataforma",
    title: "Plataforma",
    items: [
      { id: "condominios", label: "Condomínios", href: "/painel/admin/condominios", icon: "building", permission: "platform.condos.manage" },
      { id: "usuarios", label: "Usuários", href: "/painel/admin/usuarios", icon: "users", permission: "platform.users.manage" },
      { id: "sindicos", label: "Síndicos", href: "/painel/admin/sindicos", icon: "user-check", permission: "platform.users.manage" },
      { id: "prestadores", label: "Prestadores", href: "/painel/admin/prestadores", icon: "briefcase", permission: "platform.marketplace.manage" },
      { id: "administradores", label: "Administradores", href: "/painel/admin/administradores", icon: "shield", permission: "platform.admin" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    href: "/painel/admin/marketplace",
    icon: "briefcase",
    permission: "platform.marketplace.manage",
    items: [],
  },
  {
    id: "zeladoria_pay",
    title: "Zeladoria Pay",
    items: [
      { id: "visao_geral", label: "Visão Geral", href: "/painel/admin/zeladoria-pay", icon: "grid", permission: "platform.finance.manage" },
      { id: "pagamentos", label: "Pagamentos", href: "/painel/admin/zeladoria-pay?tab=pagamentos", icon: "wallet", permission: "platform.finance.manage" },
      { id: "vistorias_pagas", label: "Vistorias Pagas", href: "/painel/admin/zeladoria-pay?tab=vistorias", icon: "check-circle", permission: "platform.finance.manage" },
      { id: "repasses", label: "Repasses", href: "/painel/admin/zeladoria-pay?tab=repasses", icon: "refresh", permission: "platform.finance.manage" },
      { id: "comissoes", label: "Comissões", href: "/painel/admin/zeladoria-pay?tab=comissoes", icon: "chart", permission: "platform.finance.manage" },
      { id: "reembolsos", label: "Reembolsos", href: "/painel/admin/zeladoria-pay?tab=reembolsos", icon: "x-circle", permission: "platform.finance.manage" },
      { id: "contestacoes", label: "Contestações", href: "/painel/admin/zeladoria-pay?tab=contestacoes", icon: "alert", permission: "platform.finance.manage" },
      { id: "prestadores_financeiros", label: "Prestadores financeiros", href: "/painel/admin/zeladoria-pay?tab=prestadores", icon: "shield", permission: "platform.finance.manage" },
      { id: "configuracoes_flags", label: "Configurações & Flags", href: "/painel/admin/zeladoria-pay?tab=configuracoes", icon: "settings", permission: "platform.finance.manage" },
      { id: "simulador_financeiro", label: "Simulador Financeiro", href: "/painel/admin/zeladoria-pay?tab=simulador", icon: "sparkles", permission: "platform.finance.manage" },
    ],
  },
  {
    id: "operacao",
    title: "Operação",
    items: [
      { id: "chamados", label: "Chamados", href: "/painel/chamados", icon: "clipboard" },
      { id: "contratacoes", label: "Contratações", href: "/painel/admin/zeladoria-pay?tab=contratos", icon: "sparkles", permission: "platform.finance.manage" },
      { id: "ocorrencias_criticas", label: "Ocorrências críticas", href: "/painel/ocorrencias?criticas=1", icon: "alert", permission: "occurrence.view_all" },
      { id: "suporte", label: "Suporte", href: "/painel/ajuda", icon: "help" },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    items: [
      { id: "notificacoes", label: "Notificações", href: "/painel/notificacoes", icon: "bell" },
      { id: "avisos_erros", label: "Avisos e erros", href: "/painel/sistema/avisos-erros", icon: "alert-triangle" },
      { id: "configuracoes", label: "Configurações", href: "/painel/configuracoes", icon: "settings" },
      { id: "permissoes", label: "Permissões", href: "/painel/admin/permissoes", icon: "key", permission: "platform.admin" },
      { id: "auditoria", label: "Auditoria", href: "/painel/auditoria", icon: "activity", permission: "audit.view" },
      { id: "monitoramento", label: "Logs/monitoramento", href: "/status", icon: "trending" },
    ],
  },
];

/**
 * 5. NAVEGAÇÃO DE APOIO OPERACIONAL (Portaria, Zeladoria, Conselho)
 */
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
      { id: "auditoria", label: "Auditoria", href: "/painel/auditoria", icon: "activity", permission: "audit.view" },
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
  {
    id: "conta",
    title: "Conta",
    items: [
      { id: "perfil", label: "Meu perfil", href: "/painel/perfil", icon: "user" },
      { id: "notificacoes", label: "Notificações", href: "/painel/notificacoes", icon: "bell" },
      { id: "ajuda", label: "Ajuda & Suporte", href: "/painel/ajuda", icon: "help" },
    ],
  },
];

/**
 * Retorna os grupos de navegação filtrados para o papel atual.
 * Grupos com zero itens autorizados são omitidos automaticamente.
 */
export function getNavigationGroups(role: Role, unreadAnnouncements = 0, criticalIncidentsCount = 0): NavGroup[] {
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
    case "superadmin":
      baseGroups = ADMIN_NAVIGATION;
      break;
    case "sindico":
    default:
      baseGroups = SINDICO_NAVIGATION;
      break;
  }

  const resolved: NavGroup[] = [];

  for (const group of baseGroups) {
    if (group.href) {
      const allowed = group.permission ? hasPermission(role, group.permission) : true;
      if (allowed) {
        resolved.push({
          id: group.id,
          title: group.title,
          href: group.href,
          icon: group.icon,
          permission: group.permission,
          badge: group.badge,
          items: [],
        });
      }
      continue;
    }

    const authorizedItems: NavItem[] = [];

    for (const item of group.items) {
      const allowed = item.permission ? hasPermission(role, item.permission) : true;
      if (allowed) {
        let badge: number | undefined = undefined;
        if (item.id === "comunicados" && unreadAnnouncements > 0) {
          badge = unreadAnnouncements;
        } else if (item.id === "avisos_erros" && criticalIncidentsCount > 0) {
          badge = criticalIncidentsCount;
        }

        authorizedItems.push({
          ...item,
          badge,
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
      { id: "inicio", href: "/prestador", label: "Início", icon: "grid" },
      { id: "oportunidades", href: "/prestador/chamados?tab=oportunidades", label: "Oportunidades", icon: "search" },
      { id: "atendimentos", href: "/prestador/chamados?tab=atendimentos", label: "Atendimentos", icon: "clipboard" },
      { id: "financeiro", href: "/prestador/ganhos", label: "Financeiro", icon: "wallet" },
      { id: "perfil", href: "/prestador/perfil", label: "Perfil", icon: "user" },
    ];
  }

  if (role === "conselho") {
    return [
      { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
      { id: "documentos", href: "/painel/documentos", label: "Documentos", icon: "folder", permission: "document.view" },
      { id: "financeiro", href: "/painel/financeiro", label: "Contas", icon: "wallet", permission: "financial.view" },
      { id: "auditoria", href: "/painel/auditoria", label: "Auditoria", icon: "activity", permission: "audit.view" },
      { id: "mais", href: "#drawer", label: "Mais", icon: "more" },
    ];
  }

  if (role === "superadmin") {
    return [
      { id: "dashboard", href: "/painel/admin", label: "Dashboard", icon: "grid" },
      { id: "marketplace", href: "/painel/admin/marketplace", label: "Marketplace", icon: "briefcase" },
      { id: "financeiro", href: "/painel/admin/zeladoria-pay", label: "Financeiro", icon: "wallet" },
      { id: "alertas", href: "/painel/auditoria", label: "Alertas", icon: "alert" },
      { id: "mais", href: "#drawer", label: "Mais", icon: "more" },
    ];
  }

  // Síndico / Gestor
  return [
    { id: "inicio", href: "/painel", label: "Início", icon: "grid" },
    { id: "pendencias", href: "/painel/ocorrencias", label: "Pendências", icon: "alert" },
    { id: "operacao", href: "/painel/ordens", label: "Operação", icon: "wrench" },
    { id: "comunidade", href: "/painel/reservas", label: "Comunidade", icon: "calendar" },
    { id: "mais", href: "#drawer", label: "Mais", icon: "more" },
  ];
}
