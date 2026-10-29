# Plano de Implementação — Prioridade 2: UX, Loading Global, Central de Notificações & Busca Global

## Tarefas de Execução

- [ ] **Tarefa 2.1: Catálogo de Componentes do Design System (`App*`)**
  - Criar `frontend/src/components/app-ui.tsx` com os componentes padronizados:
    - `AppButton` (com spinner de loading, variantes, prevenção contra double-click)
    - `AppInput` (estilo institucional, label, suporte a erro)
    - `AppModal` (diálogo acessível, trap de foco, escape)
    - `AppConfirmDialog` (confirmação com título, mensagem e ações)
    - `AppTable` (envoltório responsivo, sticky header)
    - `AppSkeleton` (variantes: card, table, stat, feed, text)
    - `AppEmptyState` (estado vazio elegante)
    - `AppErrorState` (mensagem humanizada com botão de retentativa)
    - `AppPagination` (controles de paginação com contador)
    - `AppSearch` (busca com debounce e botão de limpar)
    - `AppFilter` (chips de filtro rápidos)
  - Escrever testes unitários em `frontend/tests/priority2-app-ui.test.ts`.

- [ ] **Tarefa 2.2: Sistema Global de Skeletons e Error Boundaries**
  - Criar `frontend/src/app/painel/loading.tsx` (Dashboard skeleton)
  - Criar `frontend/src/app/painel/notificacoes/loading.tsx`
  - Criar `frontend/src/app/painel/reservas/loading.tsx`
  - Criar `frontend/src/app/painel/ocorrencias/loading.tsx`
  - Criar `frontend/src/app/painel/financeiro/loading.tsx`
  - Criar `frontend/src/app/painel/moradores/loading.tsx`
  - Criar `frontend/src/app/prestador/(portal)/loading.tsx`
  - Criar `frontend/src/app/painel/error.tsx` com botão "Tentar novamente".

- [ ] **Tarefa 2.3: Central de Notificações Completa (`/painel/notificacoes`)**
  - Atualizar `frontend/src/app/painel/notificacoes/page.tsx` e `notificacoes-client.tsx`:
    - Listagem de notificações reais da API
    - Tabs: Todas | Não lidas | Lidas
    - Filtros por categoria (Ocorrências, Reservas, Visitantes, Encomendas, Serviços, Financeiro, Comunicados, Assembleias, Sistema)
    - Filtro por período (Hoje, Esta semana, Este mês, Todas)
    - Ação de marcar individual como lida
    - Ação de marcar todas como lidas
    - Links contextuais inteligentes para os registros relacionados
    - Estados de Loading, Empty e Error integrados

- [ ] **Tarefa 2.4: Sino da Navbar em Tempo Real e Busca Global (`⌘K`)**
  - No `shell.tsx` e `provider-shell.tsx`:
    - Atualizar o sino de notificações para exibir contagem real e lista das últimas não lidas
    - Ação rápida no dropdown para marcar todas como lidas
    - Substituir `MOCK_SEARCHABLE_ITEMS` por índice dinâmico respeitando RBAC do usuário
    - Implementar atalhos de teclado (`⌘K` / `Ctrl+K`, setas e enter)

- [ ] **Tarefa 2.5: Verificação e Auto-Commit**
  - Executar typecheck, lint e suíte de testes.
  - Criar commit descritivo: `feat(ux): componentes de design system, loading skeletons, central de notificacoes e busca global`.

