# Especificação Técnica — Prioridade 1: Estabilidade, Segurança Multi-Tenant & Desbloqueio Funcional (P0/P1)

**Projeto:** Zeladoria Condomínio ([https://zeladoriacondominio.com.br](https://zeladoriacondominio.com.br))  
**Data:** 29/10/2026  
**Status:** Aguardando Aprovação de Especificação  
**Ponto de Recuperação Git:** Tag `backup/pre-auditoria-2026-10-29` (sobre `2038ce5`)  
**Diagnóstico de Referência:** Fase 1 — Auditoria Full Stack (12 grupos P0 e 6 grupos P1)

---

## 1. Objetivo e Regras Inegociáveis

Eliminar todas as vulnerabilidades críticas de segurança multi-condomínio (IDOR, vazamento cross-tenant, escalonamento de privilégio), corrigir falhas fatais de execução no Backend (PHP 8.5 / Laravel 13) e no Frontend (Next.js 16 / React 19), destravar o ciclo completo de contratação e pagamento do **Zeladoria Pay** (preservando a comissão padrão de 10%) e estabilizar autenticação, recuperação de senha e navegação por perfil.

### Restrições Arquiteturais ("Não Quebrar o Backend")
1. **Zero Migrações Destrutivas:** Nenhuma tabela, coluna ou registro existente será removido ou renomeado.
2. **Compatibilidade de Contratos:** Todos os endpoints Laravel existentes preservam seus caminhos `/api/v1/*` e envelope `{ "data": ... }`.
3. **Mudanças Mínimas no Backend:** Restritas exclusivamente a correções de tipos fatais PHP 8, filtros obrigatórios de `condo_id` e `$ctx['role']`, remoção de mutação indevida em `GET /painel/notificacoes`, liberação da transição pós-pagamento `SERVICO_PAGO_LIBERADO` e proteção do executor `operations`.
4. **Proibição de Erros Silenciosos:** Nenhum erro HTTP/SQL pode ser capturado e convertido em lista vazia `[]` ou falso sucesso `{ success: true }`.
5. **Dependências:** Adição exclusiva de `zod` em `frontend/package.json` nesta etapa.

---

## 2. Escopo Detalhado por Camada

### 2.1. Backend Laravel (`backend/`) — Mudanças Mínimas e Compatíveis

1. **Isolamento Multi-Condomínio e Sigilo em Comentários de Ocorrências (`PanelController::ocorrencias`)**
   - Em `backend/app/Http/Controllers/Api/PanelController.php`, substituir a chamada sem filtro `app.painel.ocorrencias.page.002` por consulta parametrizada com `JOIN occurrences ON occurrences.id = occurrence_comments.occurrence_id WHERE occurrences.condo_id = ?`.
   - Para `role === 'morador'`, excluir comentários com `occurrence_comments.is_internal = 1` e comentários de ocorrências `privada`/`sigilosa` cujo `reported_by_id !== $userId`.

2. **Remoção de Escalonamento Indevido e de Mascaramento de Erros (`PanelController`)**
   - Em `PanelController::ajuda()`: remover o bloco `catch (\Throwable $e)` que promovia falhas de contexto/usuários bloqueados a `role = 'superadmin'`; propagar exceções HTTP `401`/`403`.
   - Em `PanelController::adminZeladoriaPay()`: remover o `catch (\Throwable $e)` que retornava listas vazias `[]` com HTTP 200; permitir que `superadmin` visualize ordens, repasses e disputas de todos os condomínios quando `condoId` não for restringido.

3. **Enforcement RBAC Server-Side e Isolamento Multi-Tenant (`PanelController`, `CondoController`, `ServiceController`)**
   - Em todas as 10 ações `PanelController::admin*`: exigir `abort_unless($ctx['user']->is_super_admin || $ctx['role'] === 'superadmin', 403)`.
   - Em `financeiro`, `moradores`, `auditoria`, `fornecedores`, `manutencao` e `relatorios`: validar `$ctx['role']` contra os perfis autorizados em `permissions.ts` (`403` para `morador` e perfis sem permissão).
   - Em `PanelController::chamados()`: utilizar sempre `$this->condoId($ctx)` para não-superadmins, impedindo leitura de outros condomínios via `?condoId=`.
   - Em `PanelController::livro()`: restringir entradas `'sigilosa'` exclusivamente a `['superadmin', 'sindico']`, `'administrativa'` a equipe/conselho, e entregar apenas `['publica']` para `'morador'`.
   - Em `CondoController::paymentOrderByCode()`: validar que o usuário autenticado é `superadmin`, `sindico` do `condo_id` da ordem, `customer_id` da ordem ou `user_id` do `vendor_id` vinculado.
   - Em `CondoController::storeAgenda()`: exigir `in_array($ctx['role'], ['superadmin', 'sindico', 'zelador'], true)`.
   - Em `CondoController::rateOccurrence()` e `ServiceController::notifyQuote()`: validar autoria/vínculo com o `condo_id` da sessão.

4. **Correção de `GET /painel/notificacoes` Não-Destrutivo (`PanelController::notificacoes` e `AuthController`)**
   - Remover a execução de `app.painel.notificacoes.page.001` (`UPDATE notifications SET read_at = NOW()`) de dentro do endpoint `GET /api/v1/painel/notificacoes`, preservando `read_at = NULL` até ação explícita do usuário.
   - Em `POST /api/v1/notificacoes/ler-todas` (`AuthController`), aceitar `condoId` opcional para marcar como lidas apenas as notificações do condomínio ativo (sem afetar outros vínculos do usuário) e validar `user_id` em `PATCH /notificacoes/{notification}/lida`.

5. **Correção de Crashes Fatais PHP 8, Cadastro de Prestador, Login e Catálogo `operations`**
   - Em `SystemAlertController.php`: corrigir assinatura `isSchemaReady(): boolean` para `isSchemaReady(): bool`; implementar verificação efetiva de `$allowedRoles` em `context(Request $request, array $allowedRoles = [])`; validar `role` e `condo_id` em `storeManual`, `show`, `updateStatus`, `updateAssignee`, `updatePriority` e `addComment`.
   - Em `ProviderRegistrationController.php`: substituir `$passwords->check(...)` por `$passwords->verify(...)`; definir `'active' => false` para novos cadastros públicos (`onboarding_status = 'em_analise'`), evitando publicação na vitrine antes da moderação.
   - Em `OperationService.php`: bloquear qualquer operação com prefixo `tests.` fora do ambiente `testing` (`abort_if(!app()->environment('testing') && str_starts_with($id, 'tests.'), 403)`).
   - Em `routes/api.php` e `AuthController.php`: aplicar `throttle:10,1` em `POST /auth/login` e `POST /prestador/login`; impedir login por senha enquanto `user->status === 'convidado'` (orientando redefinição/ativação de senha).
   - Em `PasswordResetController::forgot()`: manter geração segura de token em `password_reset_tokens` e retornar ao BFF autenticado (`X-Service-Token`) metadados internos opcionais (`resetUrl` apenas para o BFF server-only, nunca exposto ao cliente) para envio transacional via Resend caso `MAIL_MAILER=log`.
   - Adicionar `backend/tests/Unit/.gitkeep` para execução limpa de `php artisan test`.

6. **Desbloqueio Pós-Pagamento no Portal do Prestador (`ProviderRequestController` e `ProviderService`)**
   - Em `ProviderRequestController.php`: adicionar `'SERVICO_PAGO_LIBERADO'` às origens válidas para transição a `'a_caminho'` e para registro de checklist/evidências em `execution()`.
   - Em `ProviderService::requestRows()`: incluir `'SERVICO_PAGO_LIBERADO'` nos compromissos ativos da agenda e mascarar `customerName`, `customerPhone` e unidade exata (`location`) para chamados ainda não pagos/não atribuídos ao prestador.

---

### 2.2. Camada BFF, Server Actions e Segurança Multi-Tenant (`frontend/src/lib/**` e `app/api/**`)

1. **Validação Estruturada com `zod` (`frontend/src/lib/validation/schemas.ts`)**
   - Criar schemas reutilizáveis para convites de usuários/moradores (whitelist de `role` proibindo `superadmin` por síndicos), mutações de portaria, assembleias, ocorrências e validação de Data URLs Base64 (`^data:image\/(jpeg|png|webp);base64,`, tamanho máximo compatível com `8mb`).

2. **Eliminação de IDORs e Bloqueio Cross-Tenant nas Server Actions**
   - `gestao.ts`:
     - Em `bulkMembershipAction`: verificar que todos os IDs pertencem ao `condoId` ativo e atualizar exclusivamente `memberships.active` naquele condomínio (jamais `users.status = 'bloqueado'` global).
     - Em `inviteResidentAction` e `importResidentsAction`: substituir senha hardcoded `"demo1234"` por hash de token criptograficamente aleatório (`crypto.randomBytes(24)`), validar `unit.condoId === condoId` e disparar e-mail de convite/redefinição via Resend quando configurado.
     - Em `updateTicketAction`, `commentTicketAction`, `rateTicketAction` e `votePollAction`: validar `role`, `ticket.condoId === condoId`, autoria na avaliação e enquete aberta (`endsAt`).
   - `assemblies.ts` e `admin.ts`:
     - Criar helper `requireAssemblyInCondo(assemblyId, condoId)` aplicado em `saveAssemblyAction` (antes de `DELETE assembly_agenda`), `confirmAttendanceAction`, `adminRecordAttendanceAction`, `saveAgendaItemResultAction`, `saveMinutesAction`, `generateAISummaryAction`, `approveAndPublishMinutesAction` e `updateMinutesVersionAction`.
     - Restringir votação por `(agendaId, unitId)` em assembleias com status `'em_andamento'`, proibindo voto de perfis sem unidade (`porteiro`, `zelador`) e computando `weight` (fração ideal) quando disponível.
     - Em `rateSupportAction`: validar `ticket.userId === session.user.id` (ou `sindico` do `ticket.condoId`).
     - Em `admin.ts` e `financeiro/page.tsx`: separar `FINANCE_VIEW` (`superadmin`, `sindico`, `conselho`) de `FINANCE_MANAGE` (`superadmin`, `sindico`), impedindo escrita financeira pelo `conselho` e corrigindo o cálculo do Fundo de Reserva (`receita - despesa`) e categorias do DRE em `financeiro-client.tsx`.
   - `portaria.ts`, `painel/portaria/**`, `porteiro-dashboard.tsx` e `encomendas/**`:
     - Adicionar `requireRole(["superadmin", "sindico", "zelador", "porteiro"])` em `/painel/portaria/page.tsx` e `requirePermission("report.view")` em `/painel/relatorios/eficiencia/page.tsx`.
     - Alinhar `move` (`"entrada"` / `"saida"`), nomes de campos (`shelf`, `visitPlate`, `validUntil`) e exigir verificação real do `pickupCode` na entrega de encomendas (sem enviar nem pré-preencher o `pickupCode` secreto do morador na interface da portaria).
     - Exibir erro real (`res.error`) em vez de falso sucesso nos formulários da portaria e reservas (corrigindo também o `window.prompt` cancelado em `admin-calendar.tsx` e `admin-requests.tsx`).
   - Route Handlers `/api/**`:
     - `/api/sistema/avisos-erros/**`: impor `session.condo.id` para não-superadmins em `GET`/`POST`, exigir perfil `['superadmin', 'sindico', 'zelador']` em `PATCH`/`POST` de `[id]/route.ts` validando `incident.condoId`, e exigir sessão autenticada + rate-limit por IP/usuário em `report-error/route.ts`.
     - `/api/push/subscribe` (`DELETE`) e `/api/modelos/[tipo]`: exigir `requireSession()`.
     - `/api/assemblies/[id]/minutes/download`: usar `requireCondo()` e `await response.arrayBuffer()` para não corromper binários PDF.

3. **Integridade do Fluxo Zeladoria Pay e Portal do Prestador**
   - **Checkout e Webhook Seguros**:
     - Remover a aba decorativa de Cartão de Crédito sem processamento real e nunca acionar `simulateWebhookPaymentAction` em produção; exibir botão explícito `"Simular Confirmação PIX (Ambiente Sandbox)"` somente quando a ordem for simulada (`pspPaymentId` prefixado com `pay_sim_` e `NODE_ENV !== "production"`).
     - Em `asaas-adapter.ts`: exigir `ASAAS_WEBHOOK_TOKEN` válido em `verifyWebhookSignature` (sem bypass por ausência de header ou substring `"zeladoria"` fora de testes explicitamente configurados) e implementar resolução/criação de cliente (`POST /v3/customers` -> `cus_...`) antes de `POST /v3/payments` quando `ASAAS_API_KEY` estiver ativa.
   - **Continuidade dos 13 Passos**:
     - Filtrar `vendor_id` ao substituir proposta pendente (`payment-service.ts`), preservando orçamentos de concorrentes.
     - Adicionar `customerRejectProposalAction` (recusa individual de orçamento) e botão **"Retomar Pagamento PIX"** quando `status === "aguardando_pagamento_servico"`.
     - Remover `"aguardando_pagamento_servico"` da aba `"Contratados"` do prestador (bloqueando início de deslocamento antes do pagamento).
     - Exibir **"Confirmar Conclusão"** ao morador somente quando `status === "prestador_concluiu"`, removendo o fallback legado que marcava `concluido` sem liberar `payment_orders`/`payouts`, e iterar sobre **todas** as `payment_orders` retidas da contratação (serviço principal + aditivos) na liberação/disputa.
     - Corrigir `"+ Solicitar novo serviço"` (`servicos-client.tsx`) para abrir com `budgetVendor = null`; corrigir nota do prestador (escala `1–5` sem dividir por `10`), comparação `req.mode === "quote"`, filtro de status em `chamados-client.tsx`/`ganhos-client.tsx` e chave `identityVerification` em `documentos-client.tsx`.
   - **Recuperação de Senha + Integrações**:
     - Conectar `forgotPasswordAction` (`password-reset.ts`) ao serviço `sendTransactionalEmail` (`resend.ts`) quando `RESEND_API_KEY` estiver configurada e o backend operar com `MAIL_MAILER=log`, entregando o link real de redefinição com proteção de cota e anti-enumeração.
     - Remover a chave hardcoded do Geoapify em `geoapify.ts` e o endereço falso de fallback em `cep.ts`.

4. **Estabilidade React, ESLint Limpo e Correções de Navegação**
   - Mover todos os hooks (`useState`, `useMemo`, `useCallback`, `useEffect`) para antes de qualquer `return` condicional em `dashboard-client.tsx` e `space-details-modal.tsx`, e corrigir todos os 47 erros apontados por `npm run lint`.
   - Em `painel/ajuda/page.tsx`, remover o bloco `catch` de autenticação que promovia erros para `isSupport = true` (`role: "superadmin"`) e o `try/catch` que mascarava falhas da API como `[]`; em `painel/chamados/page.tsx`, remover `.catch(() => [])` para que erros reais cheguem aos `error.tsx`.
   - Em `navigation.ts` e `shell.tsx`:
     - Corrigir bottom bar mobile para `conselho` (sem link 403) e converter a ação `"Mais"` mobile para abrir o drawer lateral completo (`setMobileOpen(true)`).
     - Remover botão `"Destaques Admin"` (403) para `sindico` em `servicos-client.tsx` e formulário `"Novo comunicado"` (403) para `porteiro` em `comunicados/page.tsx`.
     - Incluir links para `/painel/financeiro`, `/painel/implantacao`, `/painel/notificacoes` e `/painel/ajuda` nos menus correspondentes (`sindico`, `porteiro`, `zelador`, `conselho`, e `/prestador/ajuda` no `ProviderShell`).
     - Sincronizar leitura de `searchParams` (`?tab=equipamentos` em Manutenção, `?tab=acessos` em Moradores, `?criticas=1` em Ocorrências) e corrigir `isRouteActive` para evitar dupla marcação na sidebar.

---

## 3. Estratégia de Testes e Critérios de Aceite da Prioridade 1

1. **Testes Automatizados Backend (PHPUnit):**
   - Cobrir bloqueio 403 de `morador`/`sindico` em rotas `PanelController::admin*`, isolamento multi-condomínio em `occurrence_comments`, `chamados` e `SystemAlertController`, preservação de `read_at = null` em `GET /painel/notificacoes`, cadastro de prestador com e-mail existente (`PasswordService::verify`), bloqueio de `tests.*` fora de `testing` e transição `SERVICO_PAGO_LIBERADO -> a_caminho`.
2. **Testes Automatizados Frontend (`tsx --test`):**
   - Testar schemas `zod` e proteções anti-IDOR/escalonamento em convites, assembleias, custódia de PIN de encomendas, não-sobrescrita de orçamentos concorrentes, retomada de checkout, cálculo do Fundo de Reserva e navegação RBAC sem links 403.
3. **Portões de Qualidade Obrigatórios:**
   - `npm --prefix frontend run typecheck` -> **0 erros**
   - `npm --prefix frontend run lint` -> **0 erros**
   - `npm --prefix frontend test` e suítes específicas -> **100% aprovados**
   - `npm --prefix frontend run build` -> **build de produção Next.js concluído com código 0**
   - `vendor/bin/pint --dirty --format agent` (no `backend/`) -> **formatação limpa**.
