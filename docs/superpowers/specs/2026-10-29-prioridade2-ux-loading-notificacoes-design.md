# Especificação Técnica — Prioridade 2: Experiência Profissional, Loading Global, Central de Notificações & Busca Global

## 1. Contexto e Objetivos

O sistema Zeladoria Condomínio opera com perfis distintos (`Morador`, `Síndico`, `Porteiro`, `Zelador`, `Conselho`, `Prestador`, `Superadmin`). A Prioridade 2 foca na padronização visual e de interação da interface com o Design System institucional:
- **Design System Profissional:** Consolidação de componentes atômicos reutilizáveis `App*` (`AppButton`, `AppInput`, `AppModal`, `AppConfirmDialog`, `AppTable`, `AppSkeleton`, `AppToast`, `AppEmptyState`, `AppErrorState`, `AppPagination`, `AppSearch`, `AppFilter`).
- **Loading Global & Estados de Interface:** Eliminação de telas em branco e travamentos visuais através de `loading.tsx` estruturados com skeletons que espelham o layout real das páginas, e `error.tsx` resilientes com botão "Tentar novamente".
- **Central de Notificações Completa (`/painel/notificacoes`):** Notificações reais da API, filtros por status (todas, não lidas, lidas), filtro por categoria e período, marcação individual e em massa como lida, links de navegação contextual.
- **Sino da Navbar em Tempo Real:** Sincronização do contador de não lidas e dropdown de notificações na Navbar do Painel e do Portal do Prestador.
- **Busca Global (`⌘K` / `Ctrl+K`):** Substituição de dados mockados por índice dinâmico respeitando RBAC estrito.

---

## 2. Design System: Componentes `App*` (`frontend/src/components/app-ui.tsx`)

### Diretrizes Visuais Estritas
- **Cores:** Fundo neutro claro (`#F8FAFC`), Cards e superfícies brancas (`#FFFFFF`), Azul institucional primário (`#1355FF`), Amarelo destaque da marca (`#FFD000`), Borda padrão (`#E2E8F0` / `border-slate-200`).
- **Proibições:** Zero gradientes chamativos, zero sombras coloridas ou difusas pesadas, zero transparências decorativas ou overlays pesados de backdrop-blur.
- **Bordas e Tipografia:** Raios de 8px a 12px (`rounded-lg` a `rounded-xl`). Tipografia padrão com hierarquia tipográfica clara.

### Catálogo de Componentes
1. `AppButton`:
   - Prop `isLoading`: exibe spinner discreto e desabilita clique.
   - Variantes: `primary` (`bg-[#1355FF] text-white hover:bg-[#0D47E6]`), `secondary` (`bg-slate-100 text-slate-700 hover:bg-slate-200`), `outline` (`border border-slate-200 hover:bg-slate-50`), `danger` (`bg-rose-600 text-white hover:bg-rose-700`), `ghost`.
   - Prevenção contra múltiplos envios acidentais.
2. `AppInput`:
   - Input estilizado com rótulo, indicador obrigatório, suporte a ícone à esquerda/direita, e mensagem de erro em vermelho abaixo.
3. `AppModal`:
   - Modal com acessibilidade: `role="dialog"`, `aria-modal="true"`, foco gerenciado, listener `Escape`, backdrop `bg-slate-900/50`.
4. `AppConfirmDialog`:
   - Diálogo com título, mensagem descritiva, botão de cancelamento e botão de ação confirmatória.
5. `AppTable`:
   - Envoltório de tabela com scroll horizontal suave no mobile, cabeçalhos `sticky`, linhas com hover suave.
6. `AppSkeleton`:
   - Variações: `card`, `table`, `stat`, `text`, `avatar`, `feed`. Respeita as proporções reais da tela.
7. `AppEmptyState`:
   - Ícone centralizado em container sutil, título em negrito, descrição e CTA opcional.
8. `AppErrorState`:
   - Mensagem de erro humanizada com botão de retentativa ("Tentar novamente").
9. `AppPagination`:
   - Controles de página com página anterior, próxima, botões numerados e contador de registros.
10. `AppSearch`:
    - Campo de busca com debounce configurável, botão de limpeza rápida (`✕`) e atalho de teclado.
11. `AppFilter`:
    - Barra de filtros com chips selecionáveis.

---

## 3. Loading Skeletons & Error Boundaries

Rotas com `loading.tsx` e `error.tsx` dedicados:
- `frontend/src/app/painel/loading.tsx` (Dashboard skeleton)
- `frontend/src/app/painel/notificacoes/loading.tsx` (Central de Notificações skeleton)
- `frontend/src/app/painel/reservas/loading.tsx` (Grade de áreas comuns e calendário)
- `frontend/src/app/painel/ocorrencias/loading.tsx` (Cards de chamados e timeline)
- `frontend/src/app/painel/financeiro/loading.tsx` (Saldos, gráfico e tabela contábil)
- `frontend/src/app/painel/moradores/loading.tsx` (Tabela de unidades e moradores)
- `frontend/src/app/prestador/(portal)/loading.tsx` (Portal do Prestador)

---

## 4. Central de Notificações (`/painel/notificacoes`)

### Dados e Estado
- Busca via `domainRequest<{ notifications: any[] }>("/painel/notificacoes")`.
- Backend endpoint `POST /api/v1/auth/notificacoes/ler`:
  - Parâmetro opcional `id`: marca notificação específica como lida.
  - Sem `id`: marca todas as notificações do usuário no condomínio ativo como lidas.

### Interface
- **Tabs de Status:** Todas | Não lidas | Lidas.
- **Filtro de Categoria:** Ocorrências | Reservas | Visitantes | Encomendas | Serviços | Financeiro | Comunicados | Assembleias | Sistema.
- **Filtro de Período:** Todas | Hoje | Esta semana | Este mês.
- **Ações Contextuais de Link:**
  - `servicos` / `cotacao`: "Ver proposta" -> `/painel/servicos?id=X`
  - `encomendas`: "Ver encomenda" -> `/painel/encomendas?highlight=X`
  - `visitantes`: "Ver visitante" -> `/painel/visitantes?highlight=X`
  - `ocorrencias`: "Ver ocorrência" -> `/painel/ocorrencias?highlight=X`
  - `comunicados`: "Ver comunicado" -> `/painel/comunicados?id=X`

---

## 5. Navbar Bell & Sincronização

- Componente `NavbarNotifications` em `shell.tsx` e `provider-shell.tsx`:
  - Busca inicial e polling suave (30s) ou atualização sob evento.
  - Badge vermelho/azul com contagem real de não lidas.
  - Dropdown com as 5 notificações mais recentes, botão "Marcar todas como lidas", e link "Ver todas as notificações" para `/painel/notificacoes`.

---

## 6. Busca Global (`⌘K` / `Ctrl+K`)

- Modal ativado por clique na barra de busca da navbar ou teclado `⌘K` / `Ctrl+K`.
- Indexa dinamicamente módulos acessíveis pelo perfil ativo do usuário (`MORADOR`, `SINDICO`, `CONSELHO`, `PORTEIRO`, `ZELADOR`, `SUPERADMIN`).
- Agrupamento em:
  1. **Navegação & Módulos** (rotas permitidas)
  2. **Ações Rápidas** (abrir chamado, reservar espaço, convidar visitante, novo comunicado)
- Navegação fluida com teclado (Seta Cima/Baixo, Enter, Escape).
