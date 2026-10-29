# Plano de Implementação — Prioridade 1: Estabilidade, Segurança Multi-Tenant & Desbloqueio Funcional (P0/P1)

**Data:** 29/10/2026  
**Especificação:** `docs/superpowers/specs/2026-10-29-prioridade1-estabilidade-seguranca-design.md`  
**Objetivo:** Eliminar vulnerabilidades críticas P0/P1 no Backend e Frontend, destravar o fluxo Zeladoria Pay e estabilizar a base de código com zero erros de ESLint e testes automatizados.

---

## Tarefa 1.1: Backend Laravel — Tipos, Segurança Multi-Tenant, RBAC e Desbloqueio Pós-Pagamento

### Arquivos Envolvidos:
- `backend/config/database.php`
- `backend/tests/Unit/.gitkeep`
- `backend/app/Http/Controllers/Api/SystemAlertController.php`
- `backend/app/Http/Controllers/Api/ProviderRegistrationController.php`
- `backend/app/Services/OperationService.php`
- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Controllers/Api/PasswordResetController.php`
- `backend/app/Http/Controllers/Api/PanelController.php`
- `backend/app/Http/Controllers/Api/CondoController.php`
- `backend/app/Http/Controllers/Api/ServiceController.php`
- `backend/app/Http/Controllers/Api/ProviderRequestController.php`
- `backend/app/Services/ProviderService.php`
- `backend/tests/Feature/Priority1SecurityAndStabilityTest.php`

### Passos:
1. Adicionar suporte a SQLite em `backend/config/database.php` (mantendo MySQL como default) e criar `backend/tests/Unit/.gitkeep`.
2. Corrigir tipagem fatal `: boolean` -> `: bool` em `SystemAlertController.php` e validar escopo de permissões `$allowedRoles`.
3. Corrigir verificação de senha existente em `ProviderRegistrationController.php` (`$passwords->verify`) e garantir que novo cadastro público fique `active = false` (ou moderação aprovada).
4. Em `OperationService.php`, bloquear operações com prefixo `tests.` fora do ambiente `testing`.
5. Em `routes/api.php` e `AuthController.php`, adicionar rate limiting e suporte a `condoId` em `ler-todas`.
6. Em `PanelController.php`:
   - Corrigir vazamento de comentários de ocorrências (`occurrence_comments` com join e filtro por condomínio e sigilo para morador).
   - Remover escalonamento indevido de privilégio para superadmin em `ajuda()`.
   - Remover captura silenciosa em `adminZeladoriaPay()`.
   - Validar perfil nas rotas administrativas (`abort_unless superadmin`).
   - Remover mutação de `read_at = NOW()` em `GET /painel/notificacoes`.
   - Corrigir visibilidade no livro de ocorrências.
7. Em `ProviderRequestController.php` e `ProviderService.php`:
   - Permitir transição de `SERVICO_PAGO_LIBERADO` para `a_caminho` e `execution()`.
   - Mascarar dados pessoais de clientes em chamados ainda não contratados.
8. Criar teste de regressão em `backend/tests/Feature/Priority1SecurityAndStabilityTest.php`.
9. Executar Pint (`vendor/bin/pint --dirty --format agent`).

---

## Tarefa 1.2: Frontend BFF, Validação Zod e Segurança nas Server Actions

### Arquivos Envolvidos:
- `frontend/package.json`
- `frontend/src/lib/validation/schemas.ts`
- `frontend/src/lib/actions/gestao.ts`
- `frontend/src/lib/actions/assemblies.ts`
- `frontend/src/lib/actions/admin.ts`
- `frontend/src/lib/actions/portaria.ts`
- `frontend/src/app/painel/portaria/page.tsx`
- `frontend/src/app/api/sistema/avisos-erros/route.ts`
- `frontend/src/app/api/sistema/avisos-erros/[id]/route.ts`
- `frontend/src/app/api/sistema/avisos-erros/report-error/route.ts`
- `frontend/src/app/api/assemblies/[id]/minutes/download/route.ts`
- `frontend/src/lib/actions/password-reset.ts`
- `frontend/src/lib/services/integrations/geoapify.ts`
- `frontend/src/lib/services/integrations/cep.ts`

### Passos:
1. Instalar `zod` no frontend.
2. Criar schemas de validação estrita em `schemas.ts`.
3. Corrigir `gestao.ts`:
   - `bulkMembershipAction`: não bloquear usuário globalmente, atualizar apenas vínculo no condomínio.
   - `inviteResidentAction`: impedir atribuição arbitrária de `superadmin` por síndico, remover senha padrão hardcoded "demo1234" e gerar token aleatório.
4. Corrigir `assemblies.ts` e `admin.ts`:
   - Validar que a assembleia pertence ao condomínio da sessão antes de qualquer mutação.
   - Separar visualização financeira (`conselho`, `sindico`) de mutação financeira (`sindico`, `superadmin`).
   - Corrigir cálculo de saldo do fundo de reserva em `financeiro-client.tsx`.
5. Em `portaria.ts` e `/painel/portaria/page.tsx`:
   - Exigir perfil de portaria/administração.
   - Corrigir comandos `entrada`/`saida`.
   - Exigir conferência real do `pickupCode` de encomendas sem exibi-lo na tela da portaria.
6. Em rotas `/api/**`:
   - Corrigir variável `module` em avisos-erros e impor validação de sessão e condomínio.
   - Corrigir download de ata de assembleia para preservar binário PDF.
7. Conectar `password-reset.ts` com Resend quando o backend operar com `MAIL_MAILER=log`.
8. Remover chaves hardcoded e fallbacks falsos de CEP.

---

## Tarefa 1.3: Zeladoria Pay — Integridade das Transições, Asaas e Modais

### Arquivos Envolvidos:
- `frontend/src/lib/services/payments/asaas-adapter.ts`
- `frontend/src/lib/services/payments/payment-service.ts`
- `frontend/src/components/modals/zeladoria-pay-modals.tsx`
- `frontend/src/app/painel/servicos/servicos-client.tsx`
- `frontend/src/app/prestador/chamados/chamados-client.tsx`
- `frontend/src/app/prestador/avaliacoes/avaliacoes-client.tsx`
- `frontend/src/app/prestador/ganhos/ganhos-client.tsx`

### Passos:
1. Em `asaas-adapter.ts`, impor verificação rigorosa do token de webhook e resolução correta do ID de cliente Asaas.
2. Em `payment-service.ts`:
   - Não sobrescrever orçamentos de concorrentes ao atualizar proposta de um prestador.
   - Adicionar rejeição individual de propostas.
   - Garantir liberação de todos os pagamentos retidos (serviço principal + aditivos).
3. Em `zeladoria-pay-modals.tsx` e `servicos-client.tsx`:
   - Remover aba decorativa de cartão e simulação indevida em produção.
   - Adicionar botão para retomar pagamento PIX caso o modal tenha sido fechado.
   - Exigir que o prestador conclua antes de permitir liberação de conclusão pelo morador.
4. Em `chamados-client.tsx` e telas do prestador:
   - Evitar transições inválidas antes da confirmação do pagamento.
   - Exibir erros reais em caso de falha da API em vez de silenciar.

---

## Tarefa 1.4: Estabilidade React, ESLint Limpo e Correções de Navegação

### Arquivos Envolvidos:
- `frontend/src/app/painel/dashboard-client.tsx`
- `frontend/src/app/painel/reservas/components/space-details-modal.tsx`
- `frontend/src/app/painel/ajuda/page.tsx`
- `frontend/src/app/painel/chamados/page.tsx`
- `frontend/src/lib/navigation.ts`
- `frontend/src/components/shell.tsx`
- `frontend/src/components/provider-shell.tsx`

### Passos:
1. Mover hooks posicionados após retornos condicionais em `dashboard-client.tsx` e `space-details-modal.tsx`.
2. Corrigir todos os erros apontados por `npm run lint`.
3. Remover supressão silenciosa com `.catch(() => [])` em `ajuda/page.tsx` e `chamados/page.tsx`.
4. Corrigir links 403 e inconsistências de navegação por perfil em `navigation.ts`, `shell.tsx` e `provider-shell.tsx`.
5. Validar suites com `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`.

