# Design System — Zeladoria Condomínio
**Versão:** 2.0 (Refinamento Visual e UX)  
**Pilares:** Minimalismo · Hierarquia Clara · Foco em Tarefas · Profissionalismo SaaS

---

## 1. Princípios de Design

1. **Progressive Disclosure:** Exibir imediatamente o que é crítico e operacional no momento; manter informações e ações secundárias acessíveis via sidebar, dropdowns, modais, drawers e "Ver todos".
2. **Cores com Função:**
   - Cada cor possui um significado funcional e previsível.
   - O **Azul** guia ações primárias, navegação e estados ativos.
   - O **Amarelo** atua como assinatura da marca e indicadores de atenção/destaque sutil.
   - O **Verde** é exclusivo para sucesso, itens concluídos ou disponíveis.
   - O **Vermelho** é exclusivo para emergências reais, erros e falhas críticas.
3. **Menos Ruído, Mais Estrutura:**
   - Evitar o encapsulamento desnecessário de dados em múltiplos cards coloridos.
   - Favorecer listas com separadores suaves, tabelas limpas e alinhamentos tipográficos precisos.
4. **Sem Artifícios Visuais Ruidosos:**
   - Proibidos: gradientes coloridos, glassmorphism, transparências em cards, sombras coloridas, luzes/glow, neon e bordas multicoloridas em cards.
   - Superfícies são sólidas (#FFFFFF sobre fundo neutro #F8FAFC).

---

## 2. Paleta de Cores e Tokens

### Marca e Ações
| Token | Cor Hex | Uso |
| :--- | :--- | :--- |
| `primary` | `#0055D4` | Botão CTA primário, links em destaque, navegação e ícones ativos |
| `primary-hover` | `#0047BA` | Hover de ações primárias |
| `primary-soft` | `#EFF6FF` | Fundo de itens ativos discretos, badges primários |
| `secondary` | `#FFD000` | Assinatura da marca, indicadores de atenção, detalhe lateral ativo |
| `secondary-soft` | `#FFFBEB` | Fundo sutil de avisos de atenção |

### Superfícies e Neutros
| Token | Cor Hex | Uso |
| :--- | :--- | :--- |
| `canvas` | `#F8FAFC` | Plano de fundo geral da aplicação |
| `surface` | `#FFFFFF` | Superfície de cards, modais, drawers e tabelas |
| `surface-muted` | `#F1F5F9` | Cabeçalhos de tabela, inputs desabilitados, fundos secundários |
| `line` | `#E2E8F0` | Bordas neutras padrão (1px solid) |
| `line-strong` | `#CBD5E1` | Bordas em hover ou separadores com maior contraste |
| `ink` | `#0F172A` | Títulos principais, dados tabulares e texto de alto contraste |
| `muted` | `#64748B` | Textos de apoio, descrições secundárias e metadados |
| `subtle` | `#94A3B8` | Placeholders, ícones inativos e rótulos terciários |

### Semântica
| Token | Cor Hex | Uso |
| :--- | :--- | :--- |
| `success` | `#10B981` | Status positivo, concluído, resolvido, disponível |
| `success-soft` | `#ECFDF5` | Fundo de badge ou callout de sucesso |
| `warning` | `#F59E0B` | Status pendente, aguardando aprovação |
| `warning-soft` | `#FFFBEB` | Fundo de badge ou pendência de atenção moderada |
| `danger` | `#DC2626` | Emergência, erro, alta prioridade, cancelado |
| `danger-soft` | `#FEF2F2` | Fundo de badge ou linha de prioridade alta |

---

## 3. Escala Tipográfica

Tipografia base: **Inter**, sistema sans-serif.

| Nível | Tamanho | Peso | Line Height | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Título Página** | 24px–28px | Bold (700/800) | 1.2 | Boas-vindas (`Olá, Marina`), títulos de páginas |
| **Título Seção** | 13px–14px | Black/Bold (700) | 1.3 | Títulos de módulos (`Precisa da sua atenção`, `Avisos`) |
| **Título Item** | 13px–14px | Semibold (600) | 1.4 | Linhas de lista, nomes de prestadores, avisos |
| **Corpo / Dados** | 13px–14px | Regular/Medium | 1.5 | Textos corridos, tabelas, inputs |
| **Metadados** | 11px–12px | Regular/Medium | 1.4 | Datas, categorias, legendas de apoio |
| **Micro Labels** | 10px–11px | Bold/Black | 1.2 | Badges de status, contadores, tags de alerta |

---

## 4. Escala de Espaçamento (Spacing)

Escala proporcional baseada em múltiplos de 4:
- `4px` (`space-1`): micro espaçamento entre ícone e texto curto.
- `8px` (`space-2`): espaçamento interno de botões compactos e tags.
- `12px` (`space-3`): padding de itens de lista compacta e inputs.
- `16px` (`space-4`): padding interno de cards de lista, modais e gaps.
- `20px` (`space-5`): padding de cards métricos e blocos principais.
- `24px` (`space-6`): separação vertical entre seções da Home.
- `32px` (`space-8`): margem entre grandes grupos de conteúdo.

---

## 5. Border Radius

- **Botões e Ações:** `8px` ou `10px`
- **Inputs e Controles de Formulário:** `8px` ou `10px`
- **Cards, Seções e Modais:** `10px` ou `12px`
- **Pills e Badges:** `9999px` (exclusivo para chips de status, contadores e tags)

*Regra:* Não utilizar raios gigantes (20px–26px) em caixas quadradas ou retangulares comuns.

---

## 6. Sombras e Bordas

- **Bordas:** Neutras e discretas: `1px solid #E2E8F0` (`slate-200`).
- **Sombras:**
  - `shadow-2xs`: `0 1px 2px rgba(15, 23, 42, 0.03)`
  - `shadow-xs`: `0 1px 3px rgba(15, 23, 42, 0.05)`
  - `shadow-sm`: `0 2px 4px rgba(15, 23, 42, 0.06)`
  - `shadow-md` (apenas modais/dropdowns): `0 8px 24px rgba(15, 23, 42, 0.08)`
- *Sem sombras com cor azul ou amarela.*

---

## 7. Componentes Padronizados

### A. Botões (Buttons)
- **Primary:** Fundo azul sólido `#0055D4`, texto branco, sem gradiente, raio 8–10px. Usado para a ação prioritária da página.
- **Secondary:** Fundo branco, borda `1px solid #E2E8F0`, texto `#0F172A`, hover `#F8FAFC`.
- **Danger:** Fundo vermelho sólido `#DC2626`, texto branco. Exclusivo para emergência, cancelamento ou exclusão.
- **Ghost:** Sem fundo e sem borda estática, hover sutil com `#F1F5F9`.

### B. Barra de Ações Rápidas (Quick Actions Bar)
- Uma linha compacta e horizontal (~42px de altura).
- Apenas **1 ação primária destacada** (`+ Registrar ocorrência`).
- Até **3 ações secundárias** com botões limpos (`Reserva`, `Ordens`, `Prestadores`).

### C. Lista Operacional de Pendências (Attention List)
- Bloco unificado com cabeçalho contendo o contador total (`15 pendências`).
- Linhas divididas por `divide-y divide-slate-100`.
- Cada item exibe ícone sutil, contador em destaque, texto explicativo, severidade e seta lateral `>`.

### D. Avisos do Condomínio (Notice List)
- Formato de lista com data, badge discreto de categoria (Assembleia, Comunicado, Alerta), título em negrito e resumo direto em uma linha.

### E. Sidebar (Navegação Lateral)
- Fundo azul escuro corporativo `#0055D4` sem ruído visual.
- Grupos em **accordion inteligente**: somente o grupo correspondente à rota ativa permanece expandido por padrão; os demais começam fechados.
- Item ativo: `bg-white/12`, detalhe lateral amarelo discreto (`border-l-2 border-[#FFD000]`), texto branco e ícone com traço refinado.
- Badges somente para informações não lidas reais. Sem pílulas decorativas estáticas.

### F. Mobile Bottom Navigation
- Fixa na base, 5 atalhos essenciais conforme o papel do usuário (Morador vs Síndico).
- Altura ergonômica de toque (~56px com safe-area).
