# Redesign Mobile-First do Tião Zelador + Painel Tião Parceiros — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a experiência mobile do Tião Zelador (contratante/morador) em um marketplace ágil, limpo e direto, e refinar a experiência do profissional no Tião Parceiros (mobile e web) focada em oportunidades, orçamentos e recebimentos, utilizando a identidade visual do Tião em laranja sólido `#FB6B01`.

**Architecture:** A arquitetura mantém 100% da infraestrutura atual (Next.js 16 App Router, Tailwind CSS v4, autenticação via sessão Laravel/cookies, State Machine de chamados e Zeladoria Pay). No cliente morador (`/painel/servicos`), unificamos a hierarquia visual em componentes modulares compactos com carrosséis horizontais, toolbar sticky e deduplicação estrita. No portal do prestador (`/prestador`), transformamos a Home em uma central de oportunidades orientada a trabalho e ganhos, com bottom nav de 5 itens focada em Oportunidades no centro e sidebar desktop estruturada.

**Tech Stack:** Next.js 16 (Turbopack, Server Actions), React 19, TypeScript, Tailwind CSS v4, Lucide/Icon customizado, Node test runner (`tsx --test`).

**Spec:** Baseado nas 61 diretrizes do documento `# REDESIGN MOBILE-FIRST DO TIÃO ZELADOR + PAINEL TIÃO PARCEIROS`.

---

## Global Constraints

- **Cores Oficiais:** Tião Laranja sólido `#FB6B01`, hover `#E05F00`, fundo branco e off-white `#F8FAFC`, texto grafite `#0F172A`. Sem gradientes, sem glassmorphism.
- **Identidade da Disponibilidade:** Verde `#10B981` exclusivo para status "Disponível para novos serviços". Laranja não deve ser usado para disponibilidade.
- **Identidade Financeira:** Processamento mantido e rotulado com clareza como **Zeladoria Pay** (sem criar marca duplicada).
- **Deduplicação Estrita:** Um profissional listado em "Seus Profissionais" ou "Patrocinados" não pode ser repetido em "Recomendados".
- **Mobile-First:** Testado e calibrado para 375px, 390px, 430px e 768px sem quebras de layout ou sobreposição da bottom navigation.

---

## Review Focus

1. **Deduplicação Visual:** Um prestador contratado anteriormente que também tem anúncio patrocinado não deve ser duplicado em Recomendados.
2. **Sticky Toolbar & Rolagem:** No mobile, a toolbar de filtros/ordenação deve fixar suavemente ao rolar sem engolir os cards nem conflitar com o header.
3. **CTA Fixo no Perfil:** A barra inferior do perfil não pode cobrir nem colidir com a bottom navigation do sistema.
4. **Isolamento de Contexto Morador vs Prestador:** Moradores com perfil de prestador conseguem alternar entre "Morador" e "Tião Parceiros" sem misturar dashboards.
5. **CTA Contextual do Atendimento:** O botão de ação no chamado do prestador deve exibir apenas a ação da etapa atual (Orçar -> Confirmar -> A Caminho -> Iniciar -> Finalizar).

---

## Estrutura de Arquivos

### Arquivos Modificados / Criados:
- **Design Tokens:** `frontend/src/lib/theme/tiao-tokens.ts` (constantes de cor e layout do Tião).
- **Morador / Busca Tião:**
  - `frontend/src/app/painel/servicos/servicos-client.tsx` (Reestruturação mobile: hero colapsável, busca antecipada, local compacto, carrossel de categorias 100-130px, toolbar sticky, carrossel de seus profissionais, carrossel de patrocinados, deduplicação e lista compacta).
  - `frontend/src/components/marketplace/provider-card.tsx` (Card compacto 16:9, foto ~112px, dados prioritários, botões Ver Perfil e Orçamento).
  - `frontend/src/components/marketplace/provider-profile-modal.tsx` (Página/modal profissional completa com barra inferior fixa `A partir de R$ XX [Solicitar orçamento]`).
  - `frontend/src/components/shell.tsx` (Bottom nav morador com pill Tião discreta; menu do perfil com seletor "Usar como: Morador | Tião Parceiros").
- **Prestador / Tião Parceiros:**
  - `frontend/src/app/prestador/login/page.tsx` & `login-form.tsx` (Login exclusivo Tião Parceiros em laranja com logo Tião).
  - `frontend/src/app/prestador/(portal)/provider-shell.tsx` (Navegação mobile 5 itens: Início | Oportunidades | Atendimentos | Financeiro | Perfil; Sidebar desktop estruturada em 4 blocos).
  - `frontend/src/app/prestador/(portal)/dashboard-client.tsx` (Home direta: Olá Carlos, toggle verde de disponibilidade, 4 métricas limpas, feed de Oportunidades com ação rápida [Enviar orçamento]).
  - `frontend/src/app/prestador/(portal)/chamados/chamados-client.tsx` (Atendimentos com tabs Orçamentos, Contratados, Em andamento, Concluídos + CTA contextual).
  - `frontend/src/app/prestador/(portal)/ganhos/ganhos-client.tsx` (Página Ganhos limpa: A receber, Em processamento, Recebido este mês + detalhe com split transparente Zeladoria Pay).
  - `frontend/src/app/prestador/(portal)/perfil/perfil-editor-client.tsx` (Perfil profissional com botão "Ver meu perfil como cliente" e status de recebimento).
- **Testes:**
  - `frontend/tests/tiao-redesign.test.ts` (Testes cobrindo deduplicação, cálculo financeiro, transições e regras mobile).

---

## Tarefas de Execução

### Task 1: Tokens do Tião & Deduplicação de Dados do Marketplace
**Files:**
- Create: `frontend/src/lib/theme/tiao-tokens.ts`
- Create: `frontend/tests/tiao-redesign.test.ts`
- Modify: `frontend/src/lib/services/providers-data.ts`

- [ ] Criar arquivo de tokens `tiao-tokens.ts` com cores hexadecimais canônicas (`#FB6B01`, `#E05F00`, `#FFF7ED`, `#0F172A`).
- [ ] Implementar utilitário de deduplicação estrita `deduplicateProviders(hired, sponsored, organic)` para garantir que um profissional nunca se repita entre seções.
- [ ] Escrever testes unitários em `frontend/tests/tiao-redesign.test.ts` validando a regra de prioridade: 1. Seus profissionais, 2. Patrocinados, 3. Recomendados.
- [ ] Executar testes com `cd frontend && npx tsx --test tests/tiao-redesign.test.ts`.

### Task 2: Parte A — Redesign Mobile do Tião Zelador (Morador)
**Files:**
- Modify: `frontend/src/app/painel/servicos/servicos-client.tsx`
- Modify: `frontend/src/components/marketplace/provider-card.tsx`
- Modify: `frontend/src/components/marketplace/provider-profile-modal.tsx`

- [ ] **Hero Tião Compacto e Colapsável:** Reduzir altura do banner Tião no mobile para fundo laranja sólido `#FB6B01` com logo branca e transição suave na rolagem (itens 4, 5).
- [ ] **Busca Antecipada & Local Compacto:** Inserir `O que você precisa resolver?` com input `Buscar eletricista, vazamento...` antes dos resultados, e transformar a localização em uma barra compacta `📍 Residencial Parque das Águas · Unidade 302 [Alterar]` (itens 6, 7).
- [ ] **Carrossel de Categorias Compacto:** Ajustar cards de categorias para largura de 110-130px com imagem, nome e contador (item 8).
- [ ] **"Precisa resolver agora?":** Compactar para banner discreto de 1 linha com CTA `[ Ver disponíveis ]` (item 9).
- [ ] **Seus Profissionais & Patrocinados:** Converter ambas as seções em carrosséis horizontais deslizáveis, evitando rolagem vertical excessiva (itens 12, 13).
- [ ] **Deduplicação Ativa:** Integrar `deduplicateProviders` para que a lista de Recomendados exclua profissionais já exibidos em "Seus profissionais" ou "Patrocinados" (item 14).
- [ ] **Toolbar Sticky:** Implementar barra de controle fixa na rolagem com contagem de profissionais, Filtros, Ordenar e Alternância Lista/Mapa (itens 10, 11).
- [ ] **Perfil do Profissional com CTA Fixo:** Garantir barra inferior fixa `A partir de R$ XX [ Solicitar orçamento ]` respeitando a safe area sem sobrepor a barra de navegação (itens 19, 20).

### Task 3: Bottom Navigation do Morador & Seletor de Perfil
**Files:**
- Modify: `frontend/src/components/shell.tsx`

- [ ] Refinar o item Tião na bottom navigation do morador para usar pill compacta e discreta, sem deformar a barra (item 21).
- [ ] Adicionar seletor de contexto no dropdown do perfil (`Usar como: Morador | Tião Parceiros`) permitindo troca rápida caso o usuário possua ambos os papéis (item 54).
- [ ] Verificar que o botão SOS não sobrepõe os cards nem a barra inferior (item 22).

### Task 4: Parte B — Login & Onboarding do Prestador no Tião Parceiros
**Files:**
- Modify: `frontend/src/app/prestador/login/page.tsx`
- Modify: `frontend/src/app/prestador/login/login-form.tsx`
- Modify: `frontend/src/app/prestador/cadastro/onboarding-wizard.tsx`

- [ ] Atualizar tela de login do prestador com a marca **Tião Parceiros**: logo do Tião, título "Bem-vindo ao Tião Parceiros", texto "Encontre oportunidades e gerencie seus atendimentos", e botão "Entrar" em laranja sólido `#FB6B01` (item 25).
- [ ] No onboarding, exibir progresso simples ("Seu perfil está 80% completo") com etapas claras (Perfil, Serviços, Região, Disponibilidade, Recebimentos) (item 26).

### Task 5: Home do Prestador — Foco em Oportunidades & Disponibilidade
**Files:**
- Modify: `frontend/src/app/prestador/(portal)/dashboard-client.tsx`

- [ ] **Header Direto:** Saudação "Olá, Carlos" acompanhada do toggle verde de disponibilidade `[ ● Disponível para novos serviços ]` com estado ativo em verde `#10B981` (itens 27, 47).
- [ ] **4 Métricas Claras:** Cards limpos para:
  - `Oportunidades novas` (ex: 5)
  - `Orçamentos aguardando` (ex: 2)
  - `Serviços hoje` (ex: 1)
  - `A receber` (ex: R$ 450) (item 27).
- [ ] **Feed Central de Oportunidades:** Lista/cards com Categoria, Problema, Distância aproximada (km), Urgência, Fotos e Condomínio, com botão direto `[ Enviar orçamento ]` (itens 29, 30).
- [ ] **Modal de Orçamento Rápido:** Formulário simplificado com Valor (R$), O que será feito, Quando pode atender e Garantia com botão de envio rápido (item 31).
- [ ] **Aviso de Perfil Incompleto:** Se faltar informação crítica, mostrar tarefa clara única: `Complete seu perfil para começar a receber chamados [ Completar perfil ]` (item 48).

### Task 6: Navegação Mobile & Desktop do Prestador (Tião Parceiros)
**Files:**
- Modify: `frontend/src/app/prestador/(portal)/provider-shell.tsx`

- [ ] **Bottom Navigation Mobile (5 Itens):**
  - Início
  - Oportunidades (destaque central)
  - Atendimentos
  - Financeiro
  - Perfil (itens 32, 33).
- [ ] **Sidebar Desktop Estruturada:**
  - INÍCIO (Início)
  - TRABALHO (Oportunidades, Atendimentos, Orçamentos, Agenda)
  - MEU NEGÓCIO (Perfil profissional, Serviços, Portfólio, Área de atendimento, Disponibilidade)
  - FINANCEIRO (Ganhos, Repasses)
  - CONTA (Avaliações, Configurações, Ajuda) (itens 50, 51).

### Task 7: Atendimentos & Fluxo de Execução com CTA Contextual
**Files:**
- Modify: `frontend/src/app/prestador/(portal)/chamados/chamados-client.tsx`

- [ ] Organizar em 4 tabs claras: `Orçamentos` | `Contratados` | `Em andamento` | `Concluídos` (item 34).
- [ ] Implementar CTA contextual único por etapa:
  - Aguardando: `Enviar orçamento`
  - Aceito: `Confirmar agenda`
  - No dia: `Estou a caminho`
  - Chegou: `Iniciar serviço`
  - Executando: `Finalizar serviço` (item 38).
- [ ] Suporte a Fotos Antes/Depois e solicitação de adicional durante a execução (itens 40, 41).
- [ ] Chat interno para comunicação com o morador após contratação (item 39).

### Task 8: Financeiro Transparente & Perfil com Preview
**Files:**
- Modify: `frontend/src/app/prestador/(portal)/ganhos/ganhos-client.tsx`
- Modify: `frontend/src/app/prestador/(portal)/perfil/perfil-editor-client.tsx`

- [ ] **Página Ganhos:** Topo com `A receber`, `Em processamento` e `Recebido este mês`, seguido do histórico detalhado com split transparente (valor bruto, comissão de 10%, taxas e valor líquido) processado via **Zeladoria Pay** (itens 42, 43, 44).
- [ ] **Perfil Profissional:** Adicionar botão `[ Ver meu perfil como cliente ]` para visualização pública da vitrine (`/servicos/${vendor.slug}`) (item 46).
- [ ] **Status de Recebimentos / KYC:** Card dedicado exibindo `Recebimentos: ✓ Configurado` ou `Dados bancários pendentes` (item 49).

### Task 9: Validação Global, Mobile QA e Auto-Commit
**Files:**
- All touched files

- [ ] Executar checagem de tipos: `npm --prefix frontend run typecheck`.
- [ ] Executar todos os testes automatizados: `cd frontend && npx tsx --test tests/tiao-redesign.test.ts tests/tiao-brand-context.test.ts tests/marketplace.test.ts tests/marketplace-real.test.ts tests/marketplace-pillars.test.ts tests/zeladoria-pay.test.ts`.
- [ ] Executar build de produção: `npm --prefix frontend run build`.
- [ ] Testar visualmente a responsividade em 375px, 390px, 430px e desktop.
- [ ] Adicionar com `git add` e criar commit com mensagem descritiva per auto-commit rule.
- [ ] Sincronizar com `git push origin main`.
