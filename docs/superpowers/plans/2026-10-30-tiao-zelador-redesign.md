# Tião Zelador Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar a submarca e nova identidade visual do **Tião Zelador** no módulo de serviços e marketplace do Zeladoria Condomínio, preservando backend, autenticação e transações do Zeladoria Pay.

**Architecture:** Implementação orientada a tokens contextuais (`BrandContext` e atributo `data-brand="tiao"`) que alternam a paleta para Laranja Tião (`#FB6B01`), preto e branco exclusivamente nas rotas do Tião (`/painel/servicos*`, `/painel/chamados*`, `/prestador*`), enquanto o restante do Zeladoria Condomínio preserva o azul institucional (`#1355FF`).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript, Playwright, assets oficiais em `/public/brands/tiao/`.

**Spec:** `docs/superpowers/specs/2026-10-30-tiao-zelador-redesign.md`

## Global Constraints
- Laranja oficial extraído dos assets: `#FB6B01`.
- Sem gradientes decorativos, sem transparências excessivas, sem modo escuro forçado.
- Sem duplicar apps, sem renomear rotas `/painel/servicos`, `/painel/chamados` ou models de backend.
- Preservar semântica de status: Verde para concluído/disponível, Vermelho para erro/cancelado, Amarelo para avaliações.
- Manter Zeladoria Pay integrado com taxa de 10% da plataforma.

---

## Tasks

### Task 1: Tokens de Marca, CSS Variables e BrandContext
- [ ] 1.1 Criar tokens de marca e contexto em `frontend/src/lib/brand-context.tsx` exportando `BrandProvider`, hook `useBrand` e `TIAO_TOKENS`.
- [ ] 1.2 Atualizar `frontend/src/app/globals.css` com variáveis para `[data-brand="tiao"]` sobrescrevendo `--color-primary` para `#FB6B01` e `--color-primary-soft` para `#FFF7ED`.
- [ ] 1.3 Criar teste unitário em `frontend/tests/tiao-brand-context.test.ts` verificando resolução de rota para marca correta.
- [ ] 1.4 Integrar `BrandProvider` no layout do painel (`frontend/src/app/painel/layout.tsx`).

### Task 2: Card da Home do Morador e Navegação Global (Sidebar & Bottom Nav)
- [ ] 2.1 Refatorar o card de serviços na dashboard do morador (`frontend/src/app/painel/dashboard-client.tsx`) com o Mascote Tião, título "Tião Zelador" e CTA em Laranja Tião.
- [ ] 2.2 Refatorar a Sidebar em `frontend/src/components/shell.tsx`:
  - Renomear agrupamento `SERVIÇOS` para `TIÃO ZELADOR`.
  - Usar ícone oficial do mascote Tião (`mascot-black.png` / `mascot-white.png`).
  - Item ativo nas rotas do Tião utiliza background `#FB6B01` com texto branco.
- [ ] 2.3 Refatorar a Mobile Bottom Navigation em `frontend/src/components/shell.tsx`:
  - Trocar "Serviços" por "Tião" com ícone do mascote Tião.
  - Fundo branco limpo e estado ativo em Laranja Tião.

### Task 3: Marketplace de Serviços & Perfil dos Profissionais
- [ ] 3.1 Atualizar `frontend/src/app/painel/servicos/servicos-client.tsx`:
  - Header com logotipo do Tião Zelador.
  - Hero humanizado e compacto com mascote Tião.
  - Campo de busca com anel de foco em Laranja Tião.
  - Seleção de categorias com fundo Laranja Tião sólido e texto branco.
  - Cards dos prestadores com botão principal "Solicitar Orçamento" em Laranja Tião e coração de favorito em Laranja Tião.
- [ ] 3.2 Atualizar modais de solicitação e orçamentos em `frontend/src/components/marketplace/zeladoria-pay-modals.tsx` para adotar os tokens Tião em botões de ação e timeline.

### Task 4: Minhas Contratações & Portal do Prestador (Tião Parceiros)
- [ ] 4.1 Atualizar `frontend/src/app/painel/chamados/chamados-client.tsx`:
  - Header assinado pelo Tião Zelador com selo informativo: *"Contratação pelo Tião Zelador · Pagamento protegido pelo Zeladoria Pay"*.
  - Tabs e timeline de acompanhamento com etapa atual em Laranja Tião.
- [ ] 4.2 Atualizar o layout e componentes do portal do prestador (`frontend/src/app/prestador/(portal)/layout.tsx` e páginas associadas) para exibir a identidade **Tião Parceiros** (*"Conectando profissionais a novos clientes"*).

### Task 5: Testes Automatizados E2E Playwright, Validação e Commit
- [ ] 5.1 Criar teste E2E `frontend/tests/e2e/tiao-zelador-flow.spec.ts` cobrindo o fluxo completo de morador no Tião Zelador e a alternância de temas entre Tião (laranja) e Zeladoria (azul).
- [ ] 5.2 Executar `npm --prefix frontend run typecheck` e garantir 0 erros.
- [ ] 5.3 Executar `npm --prefix frontend run lint` e garantir 0 erros.
- [ ] 5.4 Executar suíte de testes unitários com `npx tsx --test`.
- [ ] 5.5 Criar commit com mensagem descritiva conforme a regra de auto-commit.

