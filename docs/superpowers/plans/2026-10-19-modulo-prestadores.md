# Plano de Implementação: Módulo de Prestadores — Zeladoria Condomínio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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

## Review Focus
1. Concorrência: dois prestadores tentando aceitar o mesmo serviço de valor fixo simultaneamente (o primeiro assume, o segundo recebe aviso amigável).
2. Sessão: morador autenticado ativando prestador sem ser desconectado e sem erro de email duplicado.
3. Permissões: prestador só acessa dados de serviços para os quais foi convidado ou aceito; morador não vê dados bancários privados do prestador.
4. Geolocalização: cálculo de raio bloqueia oportunidades fora do perímetro do prestador.
5. Verificação adiada: profissional que clica em "Agora não" pode operar e navegar, mas recebe aviso claro sobre pendência de documentos.

---

### Task 1: Backend — Suporte à Ativação de Perfil para Usuário Existente & Resolução de E-mail Único

**Files:**
- Modify: `backend/app/Http/Controllers/Api/ProviderRegistrationController.php`
- Modify: `frontend/src/lib/actions/prestador.ts`
- Test: `frontend/tests/fase2-prestador.test.ts`

- [ ] **Step 1:** Atualizar a validação em `ProviderRegistrationController.php` para aceitar cadastro com token de usuário já logado (`auth()->check()`) ou vincular conta existente quando as credenciais conferirem.
- [ ] **Step 2:** Se o usuário estiver autenticado, reutilizar `auth()->id()`, gravar dados em `vendors` associados e retornar sucesso imediatamente sem criar novo registro em `users`.
- [ ] **Step 3:** No frontend `frontend/src/lib/actions/prestador.ts`, enviar o cabeçalho de autenticação atual na Server Action de cadastro de prestador para repassar o usuário da sessão.
- [ ] **Step 4:** Executar teste de registro de prestador para certificar que a regra de unicidade não barra moradores existentes.

---

### Task 2: Frontend — Catálogo Granular de Categorias e Serviços (Telas 04 e 05)

**Files:**
- Modify: `frontend/src/lib/services/categories-catalog.ts`
- Modify: `frontend/src/app/prestador/cadastro/onboarding-wizard.tsx`
- Create / Test: `frontend/tests/catalog-services.test.ts`

- [ ] **Step 1:** Expandir o catálogo oficial em `categories-catalog.ts` com as categorias e serviços específicos detalhados no briefing (Eletricista: instalação de lâmpada/reator, luminária de jardim, luminária sobrepor, tomada, chuveiro; Encanador: reparo de vazamento, troca de sifão/torneira, desentupimento; Chaveiro: cópia de chave, troca de miolo, fechadura digital; Diarista: limpeza padrão, pesada, pós-obra; Instalação: cortina, persiana, bandô, suporte TV; Estofados; Assistência técnica; Pintura).
- [ ] **Step 2:** Cada serviço deve conter: `id`, `name`, `description`, `priceFromCents`, `priceType`, `estimatedDurationMinutes` e `warrantyDays`.
- [ ] **Step 3:** Atualizar `onboarding-wizard.tsx` para apresentar a tela de Categorias (Tela 04) com busca em tempo real e contador de serviços selecionados.
- [ ] **Step 4:** Implementar o Drawer / Modal de Detalhamento de Serviços (Tela 05) por categoria, com toggles individuais para ativar/desativar cada atividade específica.
- [ ] **Step 5:** Executar teste automatizado validando que serviços granulares selecionados são persistidos e totalizados corretamente.

---

### Task 3: Frontend — Área de Cobertura com Mapa Interativo & Slider de Raio (Tela 06)

**Files:**
- Modify: `frontend/src/components/map/provider-coverage-map.tsx`
- Modify: `frontend/src/app/prestador/cadastro/onboarding-wizard.tsx`
- Modify: `frontend/src/lib/services/geo.ts`

- [ ] **Step 1:** Garantir que o componente `ProviderCoverageMap` atualize dinamicamente o centro e o círculo azul de cobertura quando as coordenadas mudarem ou o slider de raio (5 a 50 km) for ajustado.
- [ ] **Step 2:** Integrar a busca de CEP com auto-preenchimento de logradouro, bairro, cidade, estado e coordenadas via ViaCEP no `onboarding-wizard.tsx`.
- [ ] **Step 3:** Adicionar o slider intuitivo de raio de atendimento com passos de 1km e feedback visual da distância selecionada.
- [ ] **Step 4:** Testar a resposta do mapa na interface do assistente de cadastro.

---

### Task 4: Frontend — Recebimentos e Dados Financeiros com Mascaramento (Tela 07)

**Files:**
- Modify: `frontend/src/app/prestador/cadastro/onboarding-wizard.tsx`
- Modify: `frontend/src/lib/services/payments/payment-service.ts`

- [ ] **Step 1:** Criar formulário alternável entre **Chave PIX** e **Conta Bancária**.
- [ ] **Step 2:** Para PIX: suporte a CPF, CNPJ, Celular, E-mail e Chave Aleatória, com validação de formato e máscara aplicável.
- [ ] **Step 3:** Para Conta Bancária: campos de Banco (com lista rápida das principais instituições financeiras brasileiras), Agência, Conta, Tipo de Conta (Corrente ou Poupança), Nome do Titular e Documento.
- [ ] **Step 4:** Implementar mascaramento de exibição para proteger dados sensíveis.

---

### Task 5: Frontend & Backend — Verificação de Identidade com Câmera e Selfie (Telas 09, 10 e 11)

**Files:**
- Create: `frontend/src/components/camera/camera-capture-modal.tsx`
- Modify: `frontend/src/app/prestador/cadastro/onboarding-wizard.tsx`
- Create: `frontend/src/app/prestador/verificacao/page.tsx`
- Create: `frontend/src/app/prestador/verificacao/verificacao-client.tsx`

- [ ] **Step 1:** Criar o componente `CameraCaptureModal` com `navigator.mediaDevices.getUserMedia` para captura de foto via webcam/câmera do celular, alternância frontal/traseira e opção de upload direto de PDF/arquivo.
- [ ] **Step 2:** Incluir moldura retangular para captura de documentos (frente e verso) e moldura oval com guia facial para a selfie.
- [ ] **Step 3:** Permitir a opção "Agora não (Lembrar mais tarde)" no onboarding para não travar o fluxo caso o profissional não tenha o documento em mãos no momento.
- [ ] **Step 4:** Criar a rota dedicada `/prestador/verificacao` para retorno e retomada da validação em qualquer momento.

---

### Task 6: Frontend — Aba "Documentos" no Portal do Prestador (Tela 12 - Documentos)

**Files:**
- Create: `frontend/src/app/prestador/(portal)/documentos/page.tsx`
- Create: `frontend/src/app/prestador/(portal)/documentos/documentos-client.tsx`
- Modify: `frontend/src/app/prestador/(portal)/provider-shell.tsx`

- [ ] **Step 1:** Criar a página do servidor `frontend/src/app/prestador/(portal)/documentos/page.tsx` que carrega os dados de verificação e documentos do prestador autenticado.
- [ ] **Step 2:** Criar o componente cliente `documentos-client.tsx` exibindo o status atual (`Pendente`, `Em Análise`, `Aprovado`, `Rejeitado`, `Reenvio Solicitado`), lista de arquivos enviados e botão para enviar/reenviar novos documentos.
- [ ] **Step 3:** Atualizar `provider-shell.tsx` para incluir "Documentos" tanto na barra de navegação desktop quanto no menu mobile.

---

### Task 7: Frontend & Backend — Notificações de Oportunidades via WhatsApp (Tela 13)

**Files:**
- Modify: `frontend/src/lib/services/whatsapp/whatsapp-service.ts`
- Modify: `backend/app/Services/ServiceRequestNotifier.php`
- Create / Test: `frontend/tests/whatsapp-notification.test.ts`

- [ ] **Step 1:** Assegurar que o gerador de mensagens WhatsApp em `whatsapp-service.ts` inclua o template oficial formatado para novas oportunidades com escopo, endereço resumido, código do chamado e link de ação direto.
- [ ] **Step 2:** Gerar URLs autenticadas seguras com tokens temporários para acesso rápido pelo WhatsApp.
- [ ] **Step 3:** Criar teste validando a renderização do template, sanitização de telefone e idempotência de envio.

---

### Task 8: Frontend & Backend — Oportunidades com Aceite Concorrente & Detalhes (Tela 14 & Fluxos A, B, C)

**Files:**
- Modify: `backend/app/Http/Controllers/Api/ProviderRequestController.php`
- Modify: `frontend/src/app/prestador/(portal)/chamados/chamados-client.tsx`
- Modify: `frontend/src/app/prestador/(portal)/dashboard-client.tsx`

- [ ] **Step 1:** Em `ProviderRequestController.php`, garantir que o método `accept` utilize `lockForUpdate` e lance erro amigável (409) se a vaga de valor fixo já tiver sido preenchida por outro prestador.
- [ ] **Step 2:** No frontend `chamados-client.tsx` e `dashboard-client.tsx`, distinguir visualmente ordens de **Valor Fixo** (Aceite Imediato) de solicitações de **Orçamento** (onde o botão abre envio de proposta com mão de obra, materiais e prazo).
- [ ] **Step 3:** Adicionar gaveta/modal de detalhes completos da oportunidade com mapa de localização, escopo detalhado, itens inclusos e excluídos.

---

### Task 9: Frontend & Backend — Execução do Atendimento em Campo (Seção 18)

**Files:**
- Modify: `frontend/src/app/prestador/(portal)/chamados/chamados-client.tsx`
- Modify: `backend/app/Http/Controllers/Api/ProviderRequestController.php`

- [ ] **Step 1:** Disponibilizar botões de transição rápida de status para o prestador:
  - `a_caminho`: avisa morador e portaria.
  - `chegou`: check-in no condomínio.
  - `em_atendimento`: início dos trabalhos.
  - `prestador_concluiu`: solicita validação de conclusão pelo morador.
- [ ] **Step 2:** Permitir anexo de evidências fotográficas (antes/depois) e anotação de materiais utilizados.
- [ ] **Step 3:** Garantir que o morador possa validar a conclusão no painel de serviços do condomínio.

---

### Task 10: Validação Completa, Testes Integrados e Auto-Commit

**Files:**
- All touched files
- Run test suite: `npm test` no frontend e `php artisan test` no backend (se ambiente PHP ativo).
- Auto-commit rule execution.

- [ ] **Step 1:** Executar build e testes do frontend (`npm run build` ou `npm test`) para verificar ausência de erros de compilação TypeScript e regressões.
- [ ] **Step 2:** Testar o fluxo completo de ponta a ponta: cadastro de prestador -> seleção granular -> cobertura em mapa -> recebimentos -> verificação -> dashboard -> oportunidade -> aceite -> execução.
- [ ] **Step 3:** Executar `git add` em todos os arquivos modificados e criados.
- [ ] **Step 4:** Realizar commit automático com mensagem descritiva (ex: `feat(prestador): implementacao completa do modulo de prestadores e integracao de chamados`).
