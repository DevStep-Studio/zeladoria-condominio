# Plano de Implementação: Auditoria e Implementação Responsiva Completa — Zeladoria Condomínio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realizar a auditoria técnica e visual completa do Zeladoria Condomínio e implementar todas as adaptações necessárias para uma experiência mobile de nível nativo (320px a 430px) e tablet fluida (768px a 1024px), preservando 100% da interface desktop atual (1280px a 1920px), sem quebrar regras de negócio e com suíte de testes automatizados via Playwright.

**Architecture:** Estabelecer uma arquitetura de componentes responsivos reutilizáveis (`ResponsiveTable`, `MobileDataCard`, cabeçalho responsivo com busca mobile, drawer com lock de scroll do body e modais adaptáveis). Aplicar esses padrões no layout global (`Shell`), Dashboard e módulos operacionais, cobrindo todo o inventário de rotas com testes Playwright em 12 resoluções.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, @playwright/test.

**Spec:** `docs/superpowers/specs/2026-10-20-auditoria-e-implementacao-responsiva-design.md`

## Global Constraints
- Sem remoção de funcionalidades, botões, colunas de dados ou filtros existentes.
- Sem alteração em regras de negócio, cálculos, dados, endpoints de API ou permissões RBAC.
- Proibido uso de `overflow-x: hidden` global no `body` como paliativo de layout; toda responsividade deve ser estrutural.
- Alvos de toque táteis mínimos de 44×44px nos controles principais de navegação e botões no mobile.
- Preservar a paleta oficial de cores: Azul `#1355FF`, Amarelo `#FFD000`, slate e superfícies limpas.

## Review Focus
1. Telas muito estreitas (320px / iPhone SE): verificar se cabeçalho, abas e cards não estouram a largura da tela (`scrollWidth > innerWidth`).
2. Tabelas ricas em dados (extratos, moradores, ordens): validar que no mobile não há textos truncados ou truncamento ilegível de ações essenciais.
3. Teclado virtual em formulários: conferir se `inputMode` e safe areas mantêm botões de salvar visíveis ao focar inputs.
4. Drawer lateral: garantir que o scroll do fundo seja bloqueado ao abrir o menu e restaurado imediatamente ao fechar.
5. Telas ultrawide (1920px): certificar que o container principal permaneça centralizado com largura máxima de 1440px sem esticar dados desproporcionalmente.

---

### Task 1: Infraestrutura de Testes Playwright & Baseline de Responsividade

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/e2e/responsive-audit.spec.ts`

**Interfaces:**
- Produz: Execução de testes de responsividade via `npx playwright test` em 12 viewports.

- [ ] **Step 1: Instalar `@playwright/test` como dependência de desenvolvimento no frontend**
```bash
npm install -D @playwright/test --prefix frontend
```

- [ ] **Step 2: Configurar `frontend/playwright.config.ts` com os 12 viewports obrigatórios**
Configurar projetos para:
- `mobile-320`: 320x568 (iPhone SE)
- `mobile-360`: 360x640 (Android Compacto)
- `mobile-375`: 375x667 (iPhone Clássico)
- `mobile-390`: 390x844 (iPhone Moderno)
- `mobile-414`: 414x896 (iPhone Plus)
- `mobile-430`: 430x932 (iPhone Grande)
- `tablet-768`: 768x1024 (iPad Vertical)
- `tablet-820`: 820x1180 (iPad Air)
- `tablet-1024`: 1024x768 (Tablet Horizontal)
- `desktop-1280`: 1280x800 (Notebook)
- `desktop-1440`: 1440x900 (Desktop Padrão)
- `desktop-1920`: 1920x1080 (Monitor Grande)

- [ ] **Step 3: Criar teste de auditoria `frontend/tests/e2e/responsive-audit.spec.ts`**
Implementar asserção de ausência de overflow horizontal:
```typescript
const isOverflowing = await page.evaluate(() => {
  return document.documentElement.scrollWidth > window.innerWidth;
});
expect(isOverflowing).toBe(false);
```

- [ ] **Step 4: Executar verificação de tipo e build de teste**
Executar: `npm run typecheck`
Esperado: 0 erros.

- [ ] **Step 5: Commit**
```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.ts frontend/tests/e2e/responsive-audit.spec.ts
git commit -m "feat(test): configurar Playwright para auditoria responsiva em 12 resolucoes"
```

---

### Task 2: Layout Global: Refatoração Responsiva do Shell (`components/shell.tsx` & `provider-shell.tsx`)

**Files:**
- Modify: `frontend/src/components/shell.tsx`
- Modify: `frontend/src/app/prestador/(portal)/provider-shell.tsx`

**Interfaces:**
- Consumes: `ShellCondo`, `NavGroup`, `NavItem`
- Produces: Layout responsivo adaptado com drawer lateral com scroll-lock, busca popover no mobile e header compacto.

- [ ] **Step 1: Adicionar controle de scroll lock ao abrir e fechar o drawer móvel**
No `frontend/src/components/shell.tsx`, adicionar `useEffect` que trava `document.body.style.overflow = "hidden"` quando `mobileOpen === true` e restaura quando `false`.

- [ ] **Step 2: Implementar botão de busca em popover/overlay no header mobile**
Em telas `< md`, substituir o campo de busca oculto por um botão de lupa que abre uma barra de busca suspensa de largura total sobre o header com foco automático e tecla `Escape` para fechar.

- [ ] **Step 3: Ajustar o seletor de condomínio para caber em telas estreitas**
Adicionar truncamento elegante e classe responsiva para que em telas de 320px a 360px o nome do condomínio não empurre ou sobreponha os botões de ação à direita.

- [ ] **Step 4: Adicionar safe area padding e respiro na navegação móvel inferior**
Garantir `padding-bottom: env(safe-area-inset-bottom)` e que o container `<main>` tenha `pb-28` para que nenhum botão fique oculto atrás da bottom bar.

- [ ] **Step 5: Replicar os aprimoramentos para o `provider-shell.tsx`**
Garantir o mesmo padrão de scroll-lock, header tátil e bottom bar para os prestadores.

- [ ] **Step 6: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/components/shell.tsx "frontend/src/app/prestador/(portal)/provider-shell.tsx"
git commit -m "fix(ui): aprimorar responsividade do Shell com drawer scroll-lock e busca mobile"
```

---

### Task 3: Componentes e Primitivas Reutilizáveis (`ResponsiveTable`, `ui.tsx`)

**Files:**
- Create: `frontend/src/components/responsive-table.tsx`
- Modify: `frontend/src/components/ui.tsx`

**Interfaces:**
- Produces:
  - `<ResponsiveTable<T> columns={...} data={...} renderCard={...} />`
  - `<MobileDataCard title={...} badge={...} items={...} actions={...} />`
  - `<PageHeader />` e `<StatCard />` otimizados para toque e telas estreitas.

- [ ] **Step 1: Criar o componente `ResponsiveTable` e `MobileDataCard`**
Implementar alternância limpa:
- No desktop (`md:block` / `lg:block`): renderiza a tabela completa com `<TableWrap>` e suporte a rolagem suave.
- No mobile (`block md:hidden`): renderiza lista de cartões `MobileDataCard` com cabeçalho, badges, linhas chave-valor e ações táteis.

- [ ] **Step 2: Aprimorar `PageHeader` em `frontend/src/components/ui.tsx`**
Adicionar suporte a alinhamento vertical flexível no mobile:
- Título e badge empilhados harmonicamente.
- Ações (`actions`) ocupando largura total no mobile com botões de toque confortável (`min-h-[40px]`).

- [ ] **Step 3: Aprimorar `StatCard` e `Card` para telas estreitas**
Garantir que números tabulares e legendas não quebrem desordenadamente em larguras de 320px a 375px.

- [ ] **Step 4: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/components/responsive-table.tsx frontend/src/components/ui.tsx
git commit -m "feat(ui): criar primitivas ResponsiveTable e MobileDataCard para apresentacao adaptativa"
```

---

### Task 4: Auditoria e Refatoração do Dashboard Principal (`dashboard-client.tsx`, `porteiro-dashboard.tsx`, `sindico-dashboard.tsx`)

**Files:**
- Modify: `frontend/src/app/painel/dashboard-client.tsx`
- Modify: `frontend/src/components/porteiro-dashboard.tsx`
- Modify: `frontend/src/components/sindico-dashboard.tsx`

**Interfaces:**
- Consumes: `DashboardClient`, `PorteiroDashboard`, `SindicoDashboard`
- Produces: Dashboard 100% responsivo para moradores, porteiros e síndicos em todas as 12 resoluções.

- [ ] **Step 1: Ajustar seção de cabeçalho do Dashboard do Morador**
- Saudação `Olá, {userName}` com `text-lg sm:text-2xl` e identificação do condomínio / unidade.
- Botões "Emergência 24h" e "Zeladoria IA" organizados em linha responsiva com botões de toque ≥ 40px.

- [ ] **Step 2: Ajustar as Ações Rápidas do Dashboard**
- Em telas compactas (320px): grid de 1 coluna.
- Em telas a partir de 360px: grid de 2 colunas.
- Em telas desktop (lg): grid de 4 colunas.
- Textos com `truncate` inteligente e ícones proporcionais.

- [ ] **Step 3: Ajustar Cards de Visão Geral e Pendências**
- Cards de "Ocorrências", "Próxima reserva" e "Encomendas" empilhados verticalmente no mobile e em grid de 3 colunas a partir de `md:`.
- Lista de pendências e comunicados de largura total com quebra de títulos multiline sem clipping.

- [ ] **Step 4: Refatorar o Dashboard da Portaria (`porteiro-dashboard.tsx`)**
- Estatísticas de turno e ações rápidas (Registrar Visitante, Encomenda, Ocorrência) fluidas no mobile.
- Listas de visitantes presentes e encomendas adaptadas para cards móveis.

- [ ] **Step 5: Refatorar o Dashboard do Síndico (`sindico-dashboard.tsx`)**
- Indicadores de SLA, ocorrências graves e despesas organizados em grid 2 colunas no mobile e 4 no desktop.
- Alertas inteligentes preventivos sem quebras de texto.

- [ ] **Step 6: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/app/painel/dashboard-client.tsx frontend/src/components/porteiro-dashboard.tsx frontend/src/components/sindico-dashboard.tsx
git commit -m "fix(ui): refatorar Dashboard principal com suporte mobile nativo para morador, portaria e sindico"
```

---

### Task 5: Auditoria e Adaptação dos Módulos Minha Rotina & Condomínio

**Files:**
- Modify: `frontend/src/app/painel/ocorrencias/ocorrencias-client.tsx`
- Modify: `frontend/src/app/painel/ocorrencias/nova/page.tsx`
- Modify: `frontend/src/app/painel/reservas/reservas-client.tsx`
- Modify: `frontend/src/app/painel/visitantes/page.tsx`
- Modify: `frontend/src/app/painel/encomendas/page.tsx`
- Modify: `frontend/src/app/painel/comunicados/page.tsx`
- Modify: `frontend/src/app/painel/assembleias/page.tsx`
- Modify: `frontend/src/app/painel/documentos/page.tsx`
- Modify: `frontend/src/app/painel/sugestoes/page.tsx`

**Interfaces:**
- Produces: Listagens e formulários adaptativos em todos os módulos de rotina do condomínio.

- [ ] **Step 1: Ocorrências e Nova Ocorrência**
- Abas de status (`Todas`, `Recebidas`, `Em atendimento`, `Concluídas`) com rolagem suave borda-a-borda no mobile.
- Lista com alternância entre cards mobile e tabela desktop.
- Formulário de nova ocorrência com campos de largura total, fotos da câmera e botões táteis.

- [ ] **Step 2: Reservas de Espaços**
- Cards de áreas de lazer em grid 1 coluna no mobile / 2 no tablet / 3 no desktop.
- Calendário de reservas e seleção de horários compatíveis com toque e sem overflow.

- [ ] **Step 3: Visitantes e Encomendas**
- Apresentação das tabelas de visitantes e encomendas em cards no mobile com botões de liberação e código de barras nítidos.

- [ ] **Step 4: Comunicados, Assembleias, Documentos e Sugestões**
- Filtros em carrossel horizontal sem quebra brusca.
- Cards informativos com cabeçalhos legíveis e botões de download e votação acessíveis.

- [ ] **Step 5: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/app/painel/ocorrencias/ frontend/src/app/painel/reservas/ frontend/src/app/painel/visitantes/ frontend/src/app/painel/encomendas/ frontend/src/app/painel/comunicados/ frontend/src/app/painel/assembleias/ frontend/src/app/painel/documentos/ frontend/src/app/painel/sugestoes/
git commit -m "fix(ui): adaptar modulos de ocorrencias, reservas, visitantes e condominio para mobile e tablet"
```

---

### Task 6: Auditoria e Adaptação do Marketplace & Portal do Prestador

**Files:**
- Modify: `frontend/src/app/painel/servicos/servicos-client.tsx`
- Modify: `frontend/src/components/marketplace/provider-card.tsx`
- Modify: `frontend/src/components/marketplace/provider-profile-modal.tsx`
- Modify: `frontend/src/components/marketplace/location-modal.tsx`
- Modify: `frontend/src/app/prestador/(portal)/chamados/chamados-client.tsx`
- Modify: `frontend/src/app/prestador/(portal)/ganhos/ganhos-client.tsx`
- Modify: `frontend/src/app/prestador/(portal)/servicos/servicos-editor-client.tsx`

**Interfaces:**
- Produces: Marketplace e Portal do Prestador refinados com touch fluido e sem cortes de layout.

- [ ] **Step 1: Marketplace - Grid de Categorias e Cards de Profissionais**
- Grid de categorias: 2 colunas no mobile / 3 no tablet / 6 no desktop.
- Cards de fornecedores: fotos proporcionais, informações de garantia "Zeladoria Protege", badges e botões de contato com alvos confortáveis.
- Modal de perfil do prestador e modal de localização 100% responsivos.

- [ ] **Step 2: Portal do Prestador - Chamados, Catálogo e Ganhos**
- Kanban/lista de chamados com abas fluidas e ações rápidas ("Aceitar", "Enviar Orçamento", "Finalizar").
- Tabela de preços do prestador editável no celular sem comprimir campos de valores.
- Extrato financeiro de repasses Zeladoria Pay com visualização em cards no mobile e tabela no desktop.

- [ ] **Step 3: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/app/painel/servicos/ frontend/src/components/marketplace/ "frontend/src/app/prestador/(portal)/"
git commit -m "fix(ui): otimizar responsividade do marketplace de servicos e portal do prestador"
```

---

### Task 7: Telas Públicas, Autenticação e Gestão Administrativa

**Files:**
- Modify: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/esqueci-senha/page.tsx`
- Modify: `frontend/src/app/redefinir-senha/page.tsx`
- Modify: `frontend/src/app/prestador/login/page.tsx`
- Modify: `frontend/src/app/prestador/cadastro/page.tsx`
- Modify: `frontend/src/app/painel/admin/condominios/page.tsx`
- Modify: `frontend/src/app/painel/admin/usuarios/page.tsx`
- Modify: `frontend/src/app/painel/admin/prestadores/page.tsx`
- Modify: `frontend/src/app/painel/admin/zeladoria-pay/zeladoria-pay-admin-client.tsx`

**Interfaces:**
- Produces: Telas públicas e painel de superadmin totalmente adaptados.

- [ ] **Step 1: Telas de Login e Recuperação de Senha**
- Centralização dos formulários no mobile, ajuste de espaçamento com teclado virtual e preservação visual do desktop.

- [ ] **Step 2: Cadastro de Prestadores**
- Formulário em etapas de cadastro adaptado para telas de celular, sem cortar botões de próximo/concluir.

- [ ] **Step 3: Painéis de Administração da Plataforma (`/painel/admin/*`)**
- Tabelas de condomínios, usuários, prestadores e taxas com suporte ao `ResponsiveTable`.

- [ ] **Step 4: Executar typecheck e commit**
```bash
npm run typecheck --prefix frontend
git add frontend/src/app/login/ frontend/src/app/esqueci-senha/ frontend/src/app/redefinir-senha/ frontend/src/app/prestador/login/ frontend/src/app/prestador/cadastro/ frontend/src/app/painel/admin/
git commit -m "fix(ui): adaptar telas de autenticacao e painel administrativo para resolucoes moveis"
```

---

### Task 8: Execução da Suíte Playwright e Relatório Técnico Final

**Files:**
- Create: `docs/superpowers/reports/2026-10-20-relatorio-auditoria-responsiva.md`

**Interfaces:**
- Produces: Execução dos testes automatizados nas 12 resoluções, evidências de zero overflow e entrega do relatório final.

- [ ] **Step 1: Executar suíte de testes Playwright para validação de overflow e integridade**
```bash
npx playwright test --config=frontend/playwright.config.ts
```
Verificar que todas as rotas passam com 0 overflow horizontal (`isOverflowing === false`).

- [ ] **Step 2: Executar a suíte de testes unitários e de integração do projeto**
```bash
npm test --prefix frontend
```

- [ ] **Step 3: Gerar e redigir o Relatório Técnico Obrigatório de Conclusão**
Criar `docs/superpowers/reports/2026-10-20-relatorio-auditoria-responsiva.md` contendo:
- Inventário de todas as rotas auditadas por perfil.
- Estado de cada tela (Responsiva e validada).
- Problemas encontrados e correções aplicadas.
- Lista completa de arquivos modificados e componentes criados.
- Resultados dos testes Playwright nas 12 resoluções.
- Instruções passo a passo de como o usuário pode reexecutar os testes futuramente.

- [ ] **Step 4: Commit e finalização**
```bash
git add docs/superpowers/reports/2026-10-20-relatorio-auditoria-responsiva.md
git commit -m "docs: adicionar relatorio final de auditoria e implementacao responsiva"
```
