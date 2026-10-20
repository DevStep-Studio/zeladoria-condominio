# Especificação Técnica: Auditoria e Implementação Responsiva Completa — Zeladoria Condomínio

**Data:** 2026-10-20  
**Status:** Aprovado  
**Escopo:** Todo o sistema Zeladoria Condomínio (rotas públicas, autenticadas, moradores, síndicos, portaria, prestadores e administração).

---

## 1. Visão Geral e Objetivos

O objetivo deste projeto é auditar e implementar uma experiência responsiva e mobile-first de nível de aplicativo nativo em todo o sistema **Zeladoria Condomínio**, garantindo:
- Perfeição visual e usabilidade tátil em smartphones compactos e modernos (`320px` a `430px`).
- Adaptação fluida e inteligente em tablets verticais e horizontais (`768px` a `1024px`).
- Estabilidade e preservação rigorosa da interface profissional existente em notebooks e desktops (`1280px` a `1920px`).

### Requisitos Inegociáveis
1. **Preservação Funcional:** Zero remoção de funcionalidades, botões, filtros ou opções existentes.
2. **Preservação de Dados e Regras:** Nenhuma alteração em regras de negócio, cálculos, validações, endpoints de API ou RBAC.
3. **Responsividade Real vs. Mascarada:** Não utilizar `overflow-x: hidden` global no body para ocultar quebras de layout. Toda rolagem deve ser contida em seus próprios containers intencionais.
4. **Preservação de Colunas:** Dados de tabelas não serão descartados para caber na tela; telas pequenas converterão a apresentação em `MobileDataCard` ou container com scroll interno e cabeçalho fixo.
5. **Identidade Visual:** Manter a paleta oficial (Azul `#1355FF`, Amarelo `#FFD000`, tons de slate e superfícies brancas minimalistas).

---

## 2. Escala de Breakpoints e Dispositivos

| Resolução | Cenário de Teste | Comportamento Esperado |
|---|---|---|
| **320px** | Celular ultracompacto (iPhone SE / telas antigas) | Coluna única, controles compactos, rótulos adaptativos |
| **360px** | Android compacto | Espaçamentos fluidos, alvos de toque ≥ 44px |
| **375px** | iPhone padrão clássico | Grid de 2 colunas para ações rápidas, drawer lateral |
| **390px** | Smartphone moderno (iPhone 13/14/15/16) | Equilíbrio perfeito entre respiro e densidade de dados |
| **414px** | Smartphone maior (iPhone Plus/Max) | Cards com visual expandido e tipografia nítida |
| **430px** | Smartphone grande moderno | Aproveitamento de largura para cards informativos |
| **768px** | Tablet vertical (iPad mini / tablet Android) | 2 colunas de cards, tabelas adaptadas, sidebar colapsável |
| **820px** | Tablet intermediário (iPad Air) | Modais centralizados, transição fluida para desktop |
| **1024px** | Tablet horizontal / notebook compacto | Menu lateral visível ou colapsado, layout em grade |
| **1280px** | Notebook padrão | Layout completo desktop |
| **1440px** | Desktop corporativo | Experiência de referência nativa |
| **1920px** | Monitor grande / ultrawide | Container principal limitado a `1440px` centralizado |

---

## 3. Arquitetura de Layout Global

### 3.1 Sidebar Lateral (`components/shell.tsx` & `provider-shell.tsx`)
* **Desktop (`≥ 1024px`):** Mantém sidebar fixa de `240px` (ou `72px` no modo recolhido), persistindo o estado no `localStorage`.
* **Tablet (`768px` a `< 1024px`):** Suporte nativo ao modo recolhido com tooltips acessíveis.
* **Mobile (`< 768px`):**
  - Drawer deslizante a partir da esquerda (`slide-in-from-left duration-200`) com largura de `270px`.
  - **Scroll lock:** Aplica `overflow: hidden` no `document.body` enquanto o menu estiver aberto.
  - Fechamento por backdrop, botão fechar (X), clique em rota ou tecla `Escape`.
  - Foco gerenciado acessivelmente.

### 3.2 Cabeçalho do Sistema (Header)
* **Desktop:** Seletor de condomínio, input global de busca (`⌘K`), central de notificações com dropdown e avatar do usuário.
* **Mobile:**
  - Linha compacta de 56px (`h-14`):
    - [Esquerda]: Botão de menu (44×44px) + Marca compacta + Seletor de condomínio truncado.
    - [Direita]: Botão de busca (ícone lupa) + Notificações (badge) + Avatar do usuário.
  - **Busca Mobile:** Ao tocar no ícone de lupa, exibe um painel de busca suspenso de largura total com campo focado automaticamente.
  - **Troca de Condomínio Mobile:** Abre lista em modal ou sheet sem cortar nomes longos de condomínios.

### 3.3 Barra de Navegação Inferior (Mobile Bottom Nav)
* Fixada na base da tela para residentes (`/painel`) e prestadores (`/prestador`), com suporte a `env(safe-area-inset-bottom)`.
* Compensação no container de conteúdo com padding inferior adequado (`pb-24`) para evitar sobreposição de elementos ou botões flutuantes.

---

## 4. Primitivas Responsivas Reutilizáveis

### 4.1 `ResponsiveTable` & `MobileDataCard`
* **Problema:** Tabelas largas em telas pequenas provocam quebra da viewport ou exibem textos comprimidos ilegíveis.
* **Solução Estrutural:**
  - Componente que renderiza a visualização em `table` tradicional no desktop (`md:block` / `lg:block`), e no mobile (`< md`) renderiza uma lista elegante de cartões (`MobileDataCard`), mantendo todos os dados, badges e botões de ação (editar, visualizar, excluir).
  - Para tabelas onde a estrutura tabular é indispensável (ex: extratos financeiros e auditoria), utiliza-se container com rolagem horizontal intencional com classes `.table-wrap`, sombras indicativas de scroll e identificadores fixos.

### 4.2 `PageHeader`
* Em telas pequenas, o título, badges e botões de ação reorganizam-se verticalmente (`flex-col sm:flex-row`), permitindo que ações principais (ex: "+ Nova Ocorrência", "+ Nova Reserva") ocupem a largura útil ou fiquem acessíveis sem estourar a tela.

### 4.3 Formulários e Inputs Móveis
* Todos os inputs ocupam `100%` da largura útil de sua coluna.
* Atributos semânticos corretos aplicados para disparar o teclado virtual adequado nos smartphones:
  - `inputMode="numeric"` em CPF, CNPJ, CEP, telefone e valores.
  - `inputMode="email"` em e-mails.
  - `enterKeyHint="next"` ou `"done"` para navegação rápida entre campos.
* Espaçamentos confortáveis para toque (altura mínima de 40px a 44px nos inputs e botões).

### 4.4 Modais e Bottom Sheets
* No desktop: Diálogos flutuantes centralizados com backdrop blur.
* No mobile: Diálogos que se ajustam para até 96% da largura útil ou bottom sheets, com cabeçalho fixo, área de rolagem interna (`overflow-y-auto max-h-[85vh]`) e botões de ação sempre visíveis no rodapé.

---

## 5. Adaptação dos Módulos Principais

### 5.1 Dashboard Principal (`/painel`)
* **Saudação e Condomínio:** Tipografia responsiva (`text-lg sm:text-2xl`) com dados reais do morador.
* **Botões de Destaque:** "Emergência 24h" e "Zeladoria IA" adaptados para botões táteis lado a lado ou empilhados harmonicamente.
* **Ações Rápidas:** Grid de 2 colunas nos celulares modernos e 1 coluna em telas estreitas (320px).
* **Visão Geral:** Cards empilhados verticalmente no mobile com contadores nítidos e links de ação direta.
* **Pendências e Avisos:** Lista vertical de largura total com quebra de linha inteligente para comunicados longos.

### 5.2 Ocorrências (`/painel/ocorrencias` e `/nova`)
* Listagem de ocorrências com alternância entre cards e tabela, filtros em gaveta/scroll horizontal e formulário de abertura adaptado para upload de fotos com a câmera do celular.

### 5.3 Reservas de Espaços (`/painel/reservas`)
* Seletor de áreas comuns em carrossel ou grid adaptativo; calendário com navegação amigável por toque e lista clara de horários disponíveis.

### 5.4 Visitantes e Encomendas (`/painel/visitantes`, `/painel/encomendas`)
* Apresentação em cards no mobile para leitura imediata de encomendas pendentes de retirada com código de barras/QR e autorização rápida de visitantes.

### 5.5 Marketplace de Serviços (`/painel/servicos`)
* Grid de 2 colunas para categorias no mobile, cards de profissionais com informações comerciais legíveis, botões de contato/orçamento com alvos táteis confortáveis e modal de localização com GPS e cidades rápidas.

### 5.6 Portal do Prestador (`/prestador/*`)
* Gestão de chamados (kanban mobile com abas de status fluidas), catálogo de serviços com tabela de preços adaptativa e extrato de ganhos com leitura limpa.

### 5.7 Telas Públicas e de Autenticação (`/login`, `/esqueci-senha`, etc.)
* Formulários centralizados, remoção de painéis ilustrativos que roubem espaço no mobile e foco garantido no input ao abrir o teclado.

---

## 6. Estratégia de Testes Automatizados com Playwright

Integrar `@playwright/test` como ferramenta de auditoria automatizada:
1. **Configuração de Viewports:**
   - Script dedicado de testes que itera pelas 12 resoluções estipuladas.
2. **Checagem de Estouro de Viewport (Overflow Check):**
   - Executa no navegador: `document.documentElement.scrollWidth > window.innerWidth` (tolerância zero para rolagem horizontal indesejada).
3. **Checagem de Alvos de Toque:**
   - Mede se os botões interativos principais possuem pelo menos `44px` de dimensão clicável.
4. **Verificação de Integridade de Console:**
   - Garante que nenhum erro de JavaScript ou exceção de hidratação seja emitido durante a navegação.
5. **Captura de Evidências:**
   - Gravação de screenshots automatizados organizados por resolução.

---

## 7. Fases de Execução

1. **Fase 1: Infraestrutura de Testes e Diagnóstico Inicial**
   - Instalação e configuração do `@playwright/test`.
   - Criação da suíte de varredura das rotas nas 12 resoluções para levantar o baseline de problemas.
2. **Fase 2: Layout Global (Shell, Header, Sidebar e Navegação)**
   - Implementação das melhorias de drawer, header móvel com busca, e remoção de pontos de overflow no container principal.
3. **Fase 3: Primitivas Reutilizáveis e Componentes de UI**
   - Criação do `ResponsiveTable` e aprimoramento de `PageHeader`, `Card`, `StatCard`, modais e inputs.
4. **Fase 4: Refatoração dos Módulos Principais**
   - Aplicação consistente nas rotas do Morador, Síndico, Portaria, Prestador e Admin.
5. **Fase 5: Execução da Suíte de Testes e Validação**
   - Rodada completa de testes em todas as resoluções e captura de evidências.
6. **Fase 6: Relatório de Conclusão e Documentação de Uso**
   - Entrega do relatório técnico detalhado e instrução de reexecução dos testes para o usuário.
