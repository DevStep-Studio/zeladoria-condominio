# Plano de Implementação: Módulo de Prestadores — Zeladoria Condomínio

> **Status:** Concluído com Sucesso e Validado (Commit `0740723`)

**Goal:** Implementar integralmente o Módulo de Prestadores do Zeladoria Condomínio com base no fluxo de referência Houser Pro adaptado, integrando ativação de contas existentes, seleção granular de serviços, cobertura com mapa interativo, recebimentos, verificação de identidade com câmera/selfie, dashboard operacional, notificações WhatsApp, oportunidades com aceite concorrente e execução de ordens em campo.

**Architecture:** Arquitetura Next.js 15 App Router no frontend integrada via Server Actions e Domain Client com a API REST do Laravel 12 (Sanctum/Cookies). Persistência no banco de dados com lock transacional (`lockForUpdate`) para concorrência de vagas em ordens de serviço diretas e cálculos geoespaciais por Haversine.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS / Design System Minimalista Zeladoria v2, Lucide Icons, Leaflet / OpenStreetMap, Laravel 12, PHP 8.5, MySQL / SQLite.

**Spec:** `/Users/pumapunku/.gemini/antigravity-ide/brain/f873c08f-aa49-4952-8b07-71e31ae70996/spec_modulo_prestadores.md`

## Global Constraints
- Preservar todas as funcionalidades existentes de moradores, ocorrências, reservas, visitantes e encomendas sem qualquer regressão.
- Não duplicar cadastro de usuários: se um usuário morador já existe, vincular o perfil de prestador ao seu `user_id` sem criar nova conta.
- Identidade visual estrita: fundo `#F8FAFC`, cartões `#FFFFFF`, cor de ação primária `#0055D4` / `#1355FF`, detalhes em amarelo `#FFD000` / `#F59E0B`, sem gradientes nem cartões decorativos excessivos.
- Validação real de dígitos de CPF e CNPJ antes de avançar.
- Concorrência de aceite único garantida por transação no banco de dados (`lockForUpdate`).
- Auto-Commit: ao finalizar todas as tarefas e validações com sucesso, realizar commit atômico no Git com mensagem descritiva.

---

### Task 1: Backend — Suporte à Ativação de Perfil para Usuário Existente & Resolução de E-mail Único

- [x] **Step 1:** Atualizar a validação em `ProviderRegistrationController.php` para aceitar cadastro com token de usuário já logado (`auth()->check()`) ou vincular conta existente quando as credenciais conferirem.
- [x] **Step 2:** Se o usuário estiver autenticado, reutilizar `auth()->id()`, gravar dados em `vendors` associados e retornar sucesso imediatamente sem criar novo registro em `users`.
- [x] **Step 3:** No frontend `frontend/src/app/prestador/cadastro/page.tsx`, repassar a sessão do usuário logado ao assistente de cadastro.
- [x] **Step 4:** Validação sintática e verificação do fluxo sem conflitos de chave de e-mail duplicada.

---

### Task 2: Frontend — Catálogo Granular de Categorias e Serviços (Telas 04 e 05)

- [x] **Step 1:** Expandir o catálogo oficial em `categories-catalog.ts` com as categorias e serviços específicos detalhados no briefing (Eletricista, Encanador, Chaveiro, Diarista, Instalações, Estofados, Assistência Técnica, Limpeza Residencial).
- [x] **Step 2:** Cada serviço possui: `id`, `name`, `description`, `priceFromCents`, `priceType`, `estimatedDurationMinutes` e `warrantyDays`.
- [x] **Step 3:** Atualizar `onboarding-wizard.tsx` para apresentar a tela de Categorias (Tela 04) com busca em tempo real e contador de serviços selecionados.
- [x] **Step 4:** Implementar detalhamento de serviços (Tela 05) por categoria, com toggles individuais para ativar/desativar cada atividade específica.
- [x] **Step 5:** Criar e executar teste automatizado (`frontend/tests/catalog-services.test.ts`) validando que serviços granulares selecionados são persistidos e totalizados corretamente.

---

### Task 3: Frontend — Área de Cobertura com Mapa Interativo & Slider de Raio (Tela 06)

- [x] **Step 1:** Garantir que o componente `ProviderCoverageMap` atualize dinamicamente o centro e o círculo azul de cobertura quando as coordenadas mudarem ou o slider de raio (5 a 50 km) for ajustado.
- [x] **Step 2:** Integrar a busca de CEP com auto-preenchimento de logradouro, bairro, cidade, estado e coordenadas via ViaCEP no `onboarding-wizard.tsx`.
- [x] **Step 3:** Adicionar o slider intuitivo de raio de atendimento com passos de 1km e feedback visual da distância selecionada.
- [x] **Step 4:** Testar a resposta do mapa na interface do assistente de cadastro.

---

### Task 4: Frontend — Recebimentos e Dados Financeiros com Mascaramento (Tela 07)

- [x] **Step 1:** Criar formulário alternável entre **Chave PIX** e **Conta Bancária**.
- [x] **Step 2:** Para PIX: suporte a CPF, CNPJ, Celular, E-mail e Chave Aleatória, com validação de formato e máscara aplicável.
- [x] **Step 3:** Para Conta Bancária: campos de Banco (com lista rápida das principais instituições financeiras brasileiras), Agência, Conta, Tipo de Conta (Corrente ou Poupança), Nome do Titular e Documento.
- [x] **Step 4:** Implementar mascaramento de exibição para proteger dados sensíveis.

---

### Task 5: Frontend & Backend — Verificação de Identidade com Câmera e Selfie (Telas 08, 09 e 10)

- [x] **Step 1:** Criar o componente `CameraCaptureModal` com `navigator.mediaDevices.getUserMedia` para captura de foto via webcam/câmera do celular, alternância frontal/traseira e opção de upload direto de PDF/arquivo.
- [x] **Step 2:** Incluir moldura retangular para captura de documentos (frente e verso) e moldura oval com guia facial para a selfie.
- [x] **Step 3:** Permitir a opção "Agora não (Lembrar mais tarde)" no onboarding para não travar o fluxo caso o profissional não tenha o documento em mãos no momento.
- [x] **Step 4:** Integrar os modais de captura e visualização na etapa 8 e no resumo da etapa 9 do onboarding.

---

### Task 6: Frontend — Aba "Documentos" no Portal do Prestador (Tela 12 - Documentos)

- [x] **Step 1:** Criar a página do servidor `frontend/src/app/prestador/(portal)/documentos/page.tsx` que carrega os dados de verificação e documentos do prestador autenticado.
- [x] **Step 2:** Criar o componente cliente `documentos-client.tsx` exibindo o status atual (`Pendente`, `Em Análise`, `Aprovado`, `Rejeitado`), lista de arquivos enviados e botão para enviar/reenviar novos documentos com o `CameraCaptureModal`.
- [x] **Step 3:** Atualizar `provider-shell.tsx` para incluir "Documentos" no menu secundário e no dropdown de perfil.

---

### Task 7: Frontend & Backend — Notificações de Oportunidades via WhatsApp (Tela 13)

- [x] **Step 1:** Assegurar que o gerador de mensagens WhatsApp em `whatsapp-service.ts` inclua os templates oficiais formatados para novas oportunidades com escopo, endereço resumido, código do chamado e link de ação direto.
- [x] **Step 2:** Criar helper `generateWhatsAppDirectLink()` para redirecionamento direto no WhatsApp Web / App (Click-to-chat).
- [x] **Step 3:** Criar teste validando a renderização do template, links diretos e idempotência de envio (`frontend/tests/whatsapp-and-verification.test.ts`).

---

### Task 8: Frontend & Backend — Oportunidades com Aceite Concorrente & Detalhes (Tela 14 & Fluxos A, B, C)

- [x] **Step 1:** Em `ProviderRequestController.php`, garantir que o método `accept` utilize `lockForUpdate` e lance erro amigável (409) se a vaga de valor fixo já tiver sido preenchida por outro prestador.
- [x] **Step 2:** No frontend `chamados-client.tsx`, distinguir visualmente ordens de **Valor Fixo** (Aceite Imediato) de solicitações de **Orçamento** (onde o botão abre envio de proposta com mão de obra, materiais e prazo).
- [x] **Step 3:** Adicionar modal de detalhes completos da oportunidade (`OpportunityDetailModal`) com mapa de localização, escopo detalhado, itens inclusos e excluídos.

---

### Task 9: Frontend & Backend — Execução do Atendimento em Campo (Seção 18)

- [x] **Step 1:** Disponibilizar botões de transição rápida de status para o prestador:
  - `a_caminho`: avisa morador e portaria.
  - `chegou`: check-in no condomínio.
  - `em_atendimento`: início dos trabalhos.
  - `prestador_concluiu`: solicita validação de conclusão pelo morador.
- [x] **Step 2:** Permitir anexo de evidências fotográficas (antes/depois) e anotação de materiais utilizados.
- [x] **Step 3:** Garantir que o morador possa validar a conclusão no painel de serviços do condomínio.

---

### Task 10: Validação Completa, Testes Integrados e Auto-Commit

- [x] **Step 1:** Executar checagem de tipos do frontend (`npx tsc --noEmit`) sem erros.
- [x] **Step 2:** Executar testes unitários do catálogo e WhatsApp (`npx tsx --test`) com 100% de sucesso.
- [x] **Step 3:** Executar `git add` em todos os arquivos modificados e criados.
- [x] **Step 4:** Realizar commit automático com mensagem descritiva (`feat(prestador): implementacao completa do modulo de prestadores e integracao de chamados`).
