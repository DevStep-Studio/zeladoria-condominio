# Especificação Técnica — Redesign do Módulo de Serviços: Tião Zelador

Data: 30 de Outubro de 2026  
Status: Aprovado  
Fase: Especificação Arquitetural de Marca e UX  

---

## 1. Visão Geral e Objetivos

O sistema **Zeladoria Condomínio** passa a incorporar formalmente a submarca **Tião Zelador** para toda a jornada de serviços, contratações e conexão com prestadores.

### A Divisão de Identidades:
- **Zeladoria Condomínio:** Gestão condominial, portaria, comunicados, assembleias, reservas, ocorrências e governança. Cores: Azul institucional (`#1355FF`) e Amarelo institucional (`#FFD000` / `#FAB800`).
- **Tião Zelador:** Marketplace de serviços, orçamentos, acompanhamento de ordens e contratação de profissionais. Cores: Laranja Tião (`#FB6B01`), Preto grafite (`#0F172A`), Branco (`#FFFFFF`) e Cinzas neutros (`#F8FAFC`, `#E2E8F0`).
- **Tião Parceiros:** Visão do prestador de serviços (`/prestador`), voltada a oportunidades, orçamentos e atendimentos.
- **Zeladoria Pay:** Infraestrutura financeira e garantia de custódia compartilhada (taxa de 10% da plataforma), atuando como o motor financeiro seguro do Tião Zelador.

---

## 2. Regras Invioláveis do Projeto

1. **Mesmo Sistema, Mesma Autenticação e Mesmo Backend:**
   - Não criar aplicação separada.
   - Não renomear modelos no backend (`ServiceRequest`, `Vendor`, `PaymentOrder`).
   - Não alterar URLs existentes (`/painel/servicos`, `/painel/chamados`, `/prestador`).
   - Manter a regra absoluta: **NÃO QUEBRAR O BACKEND**.
2. **Preservação Semântica Rigorosa:**
   - Verde (`#10B981` / `#059669`) permanece exclusivo para status positivo (disponível, concluído, aprovado).
   - Vermelho (`#EF4444`) permanece exclusivo para erros e cancelamentos.
   - Amarelo (`#F59E0B`) permanece exclusivo para avaliações e alertas.
   - Laranja (`#FB6B01`) é exclusivo para marca, seleção, foco e chamadas para ação (CTAs).
3. **Sem Gradientes Decorativos e Sem Excesso de Cores:**
   - Fundo predominante claro (branco/neutro ~80%), tipografia escura (~15%), laranja Tião estratégico (~5%).
   - Zero gradientes nos botões, cards ou barras.
4. **Assets Oficiais Utilizados Sem Distorção:**
   - `/public/brands/tiao/logo-black.png`
   - `/public/brands/tiao/logo-white.png`
   - `/public/brands/tiao/logo-orange.png`
   - `/public/brands/tiao/mascot-black.png`
   - `/public/brands/tiao/mascot-white.png`
   - `/public/brands/tiao/mascot-orange.png`

---

## 3. Arquitetura de Tema Contextual (`BrandContext`)

Para evitar estilos manuais hardcoded em dezenas de páginas:

### 3.1 Design Tokens
```ts
export const TIAO_TOKENS = {
  primary: "#FB6B01",
  primaryHover: "#E05F00",
  primaryPressed: "#C75400",
  primarySoft: "#FFF7ED",
  primaryBorder: "#FED7AA",
  text: "#0F172A",
  textMuted: "#64748B",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
} as const;
```

### 3.2 Provedor de Marca (`BrandProvider`)
Um contexto React `BrandContext` que lê o pathname atual ou aceita override explícito:
- Pathname contendo `/painel/servicos`, `/painel/chamados` ou iniciando com `/prestador` define `brand = "tiao"`.
- Demais rotas definem `brand = "zeladoria"`.
- O layout do painel aplica `data-brand={brand}` no container raiz.
- As classes globais e componentes (`AppButton`, `AppInput`, `AppSearch`, tabs, etc.) herdam os tokens adequados através de variáveis CSS ou classes condicionadas ao atributo `data-brand="tiao"`.

---

## 4. Mapa das Telas e Modificações

### 4.1 Dashboard do Morador (`/painel`)
- **Card de Entrada:** Substituição do card de maleta azul por um card exclusivo:
  - Mascote Tião em destaque.
  - Título: **Tião Zelador**
  - Subtexto: *"Encontre profissionais avaliados para serviços e reparos no seu condomínio."*
  - Botão CTA: `Encontrar profissional →` com fundo Laranja Tião (`#FB6B01`).

### 4.2 Navegação Global (`shell.tsx`)
- **Sidebar Desktop:**
  - Grupo renomeado de `SERVIÇOS` para `TIÃO ZELADOR`.
  - Ícone do item "Encontrar profissional" usa o mascote oficial do Tião (`mascot-black.png` / `mascot-white.png`).
  - Item ativo quando em rotas Tião: background **Laranja Tião (`#FB6B01`)**, texto branco, sem azul.
- **Mobile Bottom Navigation:**
  - Item renomeado de `Serviços` para `Tião`.
  - Ícone do mascote Tião integrado.
  - Fundo branco neutro com borda superior suave.
  - Quando ativo na aba Tião: cor e ícone em Laranja Tião.

### 4.3 Marketplace de Serviços (`/painel/servicos`)
- **Header:** Logotipo oficial do Tião Zelador.
- **Hero Compacto:** Mascote Tião com texto humanizado:
  - *"Precisando de uma mão? Encontre profissionais avaliados que atendem sua região."*
- **Barra de Pesquisa:** Placeholder *"Qual serviço você precisa? Ex.: eletricista, vazamento, pintura..."* com anel de foco em Laranja Tião.
- **Categorias:** Cápsulas de categorias com estado ativo em Laranja Tião sólido e texto branco.
- **Cards dos Prestadores:**
  - Fundo branco, foto real de alta qualidade, avaliações com estrelas douradas.
  - Botão CTA principal: `Solicitar Orçamento` em Laranja Tião.
  - Botão secundário: `Ver Perfil` em fundo branco/neutro.
  - Coração de favorito: Laranja Tião quando favoritado.

### 4.4 Minhas Contratações & Acompanhamento (`/painel/chamados`)
- **Título & Identidade:** Header com assinatura Tião Zelador.
- **Tabs de Filtro:** Em andamento, Orçamentos, Concluídos, Cancelados com indicador ativo em Laranja Tião.
- **Timeline de Atendimento:**
  - Etapas: Solicitado → Orçamento recebido → Pagamento → Prestador a caminho → Em execução → Concluído.
  - Etapa corrente em Laranja Tião; etapas passadas em Verde; canceladas em Vermelho.
- **Garantia de Pagamento:** Selo informativo discreto:
  - *"Contratação pelo Tião Zelador · Pagamento em custódia protegido pelo Zeladoria Pay"*.

### 4.5 Portal do Prestador (`/prestador`)
- Header e boas-vindas com a submarca **Tião Parceiros** (*"Conectando profissionais a novos clientes"*).
- CTAs de aceitar oportunidade, enviar orçamento e atualizar status estilizados em Laranja Tião.
- Status "Disponível agora" preservado em verde semântico.

---

## 5. Critérios de Sucesso & Testes
1. `npm --prefix frontend run typecheck` com 0 erros.
2. `npm --prefix frontend run lint` com 0 erros.
3. Suíte de testes unitários e de integração aprovada (100% pass).
4. Suíte E2E Playwright validando a transição de marcas:
   - Ao acessar `/painel`, vê o card do Tião.
   - Ao entrar em `/painel/servicos`, o tema assume Laranja Tião.
   - Ao navegar para `/painel/ocorrencias`, o tema reverte instantaneamente para o Azul Zeladoria sem contaminação.

