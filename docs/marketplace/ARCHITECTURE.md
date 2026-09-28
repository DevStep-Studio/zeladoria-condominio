# Arquitetura do Marketplace — Zeladoria Serviços

## 1. Visão Geral
O **Zeladoria Serviços** é a plataforma de intermediação e contratação sob demanda de prestadores de serviços residenciais e prediais para condôminos e condomínios.

Diferente de marketplaces genéricos de mobilidade ou delivery, ele opera sobre dois modos essenciais de contratação:
1. **Modo Sob Demanda (Rápido / Emergencial)**: Atendimento imediato para reparos urgentes (troca de disjuntor, vazamento, chaveiro). Fluxo: Solicitação imediata → Matching com prestador disponível online → Aceite do chamado → Deslocamento → Execução → Conclusão → Avaliação.
2. **Modo Orçamento (Projetos / Reformas)**: Cotação e comparação de propostas para obras planejadas (pintura, marcenaria, gesso). Fluxo: Descrição de escopo + fotos/vídeos → Envio de propostas formais pelos prestadores da região → Comparação lado a lado pelo morador → Aprovação da melhor proposta → Agendamento → Execução → Conclusão → Avaliação.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Frontend Web** | Next.js 16 (App Router + Turbopack) | Server Components por padrão, Client Components isolados (`"use client"`), Server Actions para mutações com revalidação estrita |
| **Linguagem** | TypeScript 5.9 | Tipagem estrita com checagem estática em tempo de compilação |
| **Estilização** | CSS Nativo (Design System 2.0) | Paleta Azul Institucional (`#0055D4`) e Amarelo Destaque (`#FFD000`), sem gradientes, sem glassmorphism, mobile-first |
| **Banco de Dados** | PostgreSQL 16+ | Schema dedicado `condominio_app`, gerenciado por Drizzle ORM |
| **Autenticação & RBAC** | HMAC SHA-256 Stateless Cookies | Camada centralizada de permissões granulares (`src/lib/permissions.ts`) e papéis (`src/lib/rbac.ts`) |
| **Geolocalização & Mapas**| Leaflet / OpenStreetMap | Renderização dinâmica no cliente com anonimização de localização privada |

---

## 3. Topologia de Pastas e Componentes

```
src/
├── app/
│   ├── painel/
│   │   ├── servicos/             # Portal do Morador: busca, mapa, contratações e chat
│   │   └── fornecedores/         # Portal do Síndico/Admin: moderação e homologação
│   ├── prestador/                # Portal Exclusivo do Prestador Parceiro
│   │   ├── login/                # Autenticação do prestador
│   │   ├── cadastro/             # Onboarding em 8 etapas guiadas
│   │   ├── chamados/             # Gestor de chamados imediatos e orçamentos
│   │   ├── agenda/               # Calendário de visitas e execuções
│   │   ├── servicos/             # Catálogo de serviços e tabelas de preço
│   │   ├── perfil/               # Editor da vitrine pública (loja)
│   │   └── ganhos/               # Extrato de faturamento e repasses
│   └── servicos/[slug]/          # Storefront Pública / Loja do Prestador
├── components/
│   ├── marketplace/
│   │   ├── marketplace-map.tsx   # Mapa regional interativo com Leaflet
│   │   └── service-request-wizard.tsx # Assistente de solicitação (Sob Demanda vs Orçamento)
│   └── ui.tsx                    # Design System (Cards, Badges, Botões, Tabelas)
├── db/
│   ├── schema.ts                 # Schemas Drizzle ORM
│   └── setup.ts                  # DDL e migrações idempotentes do PostgreSQL
└── lib/
    ├── actions/
    │   ├── marketplace.ts        # Server Actions do Morador (solicitar, aceitar, avaliar, chat)
    │   └── prestador.ts          # Server Actions do Prestador (online/offline, aceitar, orçar)
    ├── services/
    │   ├── providers-query.ts    # Consultas agregadas e métricas reais de reputação
    │   ├── ranking.ts            # Algoritmo de score ponderado (qualidade x pontualidade x reviews)
    │   └── matching.ts           # Motor de matching e raio geográfico
    ├── permissions.ts            # Matriz de RBAC e permissões de marketplace
    └── auth.ts                   # Gestão de sessão segura e resolução de perfis
```
