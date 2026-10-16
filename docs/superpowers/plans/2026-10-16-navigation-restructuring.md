# Reestruturação Completa da Navegação por Perfil — Zeladoria Condomínio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar completamente a navegação, dashboards, header, bottom navigation e controle de acesso por perfil (Morador, Síndico, Prestador, Admin da Plataforma) em uma arquitetura única config-driven baseada em ROLE + PERMISSIONS + CONDOMÍNIO ATUAL + CONTEXTO.

**Architecture:** Navegação orientada a configuração centralizada (`src/lib/navigation.ts`) consumida pelo `Shell` e pelos layouts de cada contexto. Segurança em camadas com Route Guards server-side (403 nas rotas proibidas para cada perfil) e contexto multi-role persistente (`gc_role` e `gc_condo`) permitindo alternância instantânea de papel com recálculo de permissões, sem espalhar `if (role)` pelo frontend.

**Tech Stack:** Next.js 15 (App Router, Server Actions, Server Components), Drizzle ORM, PostgreSQL, TypeScript, TailwindCSS (Vanilla aesthetic tokens, sem gradientes), Vitest.

**Spec:** Prompt Master da Reestruturação Completa da Navegação por Perfil (59 seções).

## Global Constraints
- NÃO criar quatro sistemas independentes; manter arquitetura única baseada em Role + Permissions + Condomínio + Contexto.
- NÃO espalhar `if (role === ...)` por múltiplos componentes; utilizar configuração centralizada em `src/lib/navigation.ts`.
- NÃO proteger somente no frontend; toda rota e backend valida autorização e retorna 403.
- Identidade visual estrita Zeladoria: Azul `#0055D4`, Amarelo `#FFD000`, Branco, Slate neutros. PROIBIDO o uso de gradientes.
- Item ativo: background azul, texto branco, ícone branco, pequeno detalhe amarelo quando apropriado.
- Header adaptativo por perfil: Morador/Síndico com seletor de condomínio; Prestador com status disponível/online e sem condomínio global; Admin com busca administrativa e sem condomínio global.
- Bottom navigation mobile específica com no máximo 5 itens prioritários por perfil.

---

### Task 1: Auditoria e Matrizes de Acesso (RBAC & Permissões)
**Files:**
- Modify: `src/lib/permissions.ts`
- Modify: `src/lib/rbac.ts`
- Test: `tests/navigation-rbac.test.ts`

**Interfaces:**
- Consumes: `Role` de `src/lib/auth.ts`, `hasPermission` de `src/lib/permissions.ts`
- Produces: Permissões de plataforma adicionais (`platform.admin`, `platform.marketplace.manage`, `platform.finance.manage`) e mapeamento completo `ROLE_PERMISSIONS_MAP`.

- [ ] **Step 1: Escrever teste de matriz de permissões para os 4 perfis principais**
- [ ] **Step 2: Executar teste e validar falhas esperadas**
- [ ] **Step 3: Atualizar `src/lib/permissions.ts` e `src/lib/rbac.ts` com as permissões da plataforma e papéis estritos**
- [ ] **Step 4: Executar testes de permissões e validar aprovação**
- [ ] **Step 5: Commit parcial**

---

### Task 2: Configuração Central de Navegação (`src/lib/navigation.ts`)
**Files:**
- Modify: `src/lib/navigation.ts`
- Test: `tests/navigation-rbac.test.ts`

**Interfaces:**
- Consumes: `Role`, `Permission`, `IconName`
- Produces: `MORADOR_NAVIGATION`, `SINDICO_NAVIGATION`, `PRESTADOR_NAVIGATION`, `ADMIN_NAVIGATION`, `getNavigationGroups(role, badges)`, `getMobileNavItems(role)`

- [ ] **Step 1: Escrever teste para `getNavigationGroups` e `getMobileNavItems` validando itens exatos de Morador, Síndico, Prestador e Admin**
- [ ] **Step 2: Executar teste e verificar falhas**
- [ ] **Step 3: Implementar grupos de navegação estritos conforme seções 4, 7, 9 e 20 da especificação**
- [ ] **Step 4: Implementar navegação mobile (máx 5 itens) conforme seções 34, 35, 36 e 37**
- [ ] **Step 5: Executar testes e garantir aprovação completa**
- [ ] **Step 6: Commit parcial**

---

### Task 3: Contexto Multi-Role e Troca de Perfil (`src/lib/auth.ts` & `src/lib/actions/session.ts`)
**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/actions/session.ts`
- Test: `tests/navigation-rbac.test.ts`

**Interfaces:**
- Consumes: Cookies `gc_session`, `gc_condo`, `gc_role`
- Produces: `Session.availableRoles`, `switchRoleAction(role: Role)`

- [ ] **Step 1: Escrever teste simulando usuário com múltiplos papéis (Morador no condomínio A, Síndico no B, Prestador) e alternância**
- [ ] **Step 2: Executar teste e verificar falhas**
- [ ] **Step 3: Atualizar `getSession()` em `src/lib/auth.ts` para ler cookie `gc_role` (validado contra permissões reais do usuário) e calcular `availableRoles`**
- [ ] **Step 4: Implementar Server Action `switchRoleAction(role)` em `src/lib/actions/session.ts`**
- [ ] **Step 5: Executar testes e validar aprovação**
- [ ] **Step 6: Commit parcial**

---

### Task 4: Refatoração do Shell e Header Adaptativo (`src/components/shell.tsx`)
**Files:**
- Modify: `src/components/shell.tsx`
- Modify: `src/app/painel/layout.tsx`

**Interfaces:**
- Consumes: `Session`, `NavGroup[]`, `NavItem[]`, `availableRoles`
- Produces: Desktop sidebar recolhível (compacta/expandida com tooltip), grupos recolhíveis, seletor de perfil "Usar Zeladoria como", Header adaptativo por perfil (ocultar seletor de condomínio para Prestador e Admin da plataforma).

- [ ] **Step 1: Adicionar props `availableRoles` e `switchRoleAction` ao componente `Shell`**
- [ ] **Step 2: Renderizar seletor discreto "Usar Zeladoria como: Morador | Síndico | Prestador" no menu do usuário quando possuir mais de 1 perfil**
- [ ] **Step 3: Adaptar Header conforme papel: ocultar seletor de condomínio para Prestador e Admin, exibindo status disponível para prestador e busca contextual**
- [ ] **Step 4: Ajustar visual do item ativo para azul com indicador amarelo, sem gradientes**
- [ ] **Step 5: Atualizar `src/app/painel/layout.tsx` para passar `availableRoles` e `switchRoleAction`**
- [ ] **Step 6: Commit parcial**

---

### Task 5: Route Guards e Proteção Server-Side (403 e 404)
**Files:**
- Create: `src/app/painel/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/not-found.tsx`
- Modify: `src/app/prestador/(portal)/layout.tsx`
- Modify: `src/lib/auth.ts`
- Test: `tests/navigation-rbac.test.ts`

**Interfaces:**
- Consumes: `requireSession()`, `requireRole()`, `requireProvider()`
- Produces: Bloqueio estrito com 403 para acessos não autorizados (/admin por morador/síndico, /prestador por morador/síndico sem papel de prestador ativo).

- [ ] **Step 1: Escrever testes de guard para rotas protegidas validando redirecionamento para `/painel/403`**
- [ ] **Step 2: Criar `src/app/painel/admin/layout.tsx` bloqueando qualquer papel diferente de `superadmin`**
- [ ] **Step 3: Criar `src/app/admin/page.tsx` encaminhando para `/painel/admin` ou 403**
- [ ] **Step 4: Atualizar `src/app/prestador/(portal)/layout.tsx` para rejeitar morador/síndico que não estejam atuando como prestador com 403**
- [ ] **Step 5: Criar `src/app/not-found.tsx` com visual oficial Zeladoria**
- [ ] **Step 6: Executar testes e validar que tentativas não autorizadas resultam em 403**
- [ ] **Step 7: Commit parcial**

---

### Task 6: Dashboards por Perfil e Páginas de Suporte / Admin
**Files:**
- Create: `src/app/painel/admin/page.tsx`
- Modify: `src/app/painel/page.tsx`
- Create: `src/app/prestador/(portal)/ajuda/page.tsx`

**Interfaces:**
- Consumes: DB queries de condomínios, prestadores, faturamento, pedidos e chamados
- Produces: Dashboard da Plataforma para Admin (`/painel/admin`), redirecionamento automático de Prestador para `/prestador`, página de ajuda do prestador.

- [ ] **Step 1: Criar `src/app/painel/admin/page.tsx` com indicadores de plataforma (Condomínios ativos, Prestadores cadastrados, GMV processado, Receita Zeladoria, Repasses pendentes e Contestações ativas)**
- [ ] **Step 2: Em `src/app/painel/page.tsx`, redirecionar usuário com papel `prestador` para `/prestador`**
- [ ] **Step 3: Criar `src/app/prestador/(portal)/ajuda/page.tsx` para apoio operacional do prestador**
- [ ] **Step 4: Validar build e integridade de tipos com `npm run typecheck`**
- [ ] **Step 5: Commit parcial**

---

### Task 7: Validação Final, Suíte de Testes e Entregável
**Files:**
- All modified and created files
- Test: `npm test` & `npm run typecheck`

- [ ] **Step 1: Executar suíte completa de testes (`npm test`)**
- [ ] **Step 2: Executar validação de tipos TypeScript (`npm run typecheck`)**
- [ ] **Step 3: Fazer commit final no git cumprindo a regra de auto-commit**
- [ ] **Step 4: Estruturar e apresentar o relatório final contendo todas as 13 seções solicitadas na especificação**
