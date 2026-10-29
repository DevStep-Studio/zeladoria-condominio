# Plano de Implementação — Prioridade 3: Módulos Incompletos, Portaria e Suíte E2E Playwright

Data: 29 de Outubro de 2026  
Status: Aprovado  
Fase: Prioridade 3 — Módulos incompletos, testes E2E e esteira de qualidade  

---

## Metas de Implementação

### Tarefa 3.1: Completar "Meu Perfil" (`/painel/perfil`)
1. Adicionar formulário de edição de dados cadastrais (nome, telefone, documento).
2. Adicionar formulário de alteração de senha com `currentPassword`, `newPassword`, `confirmPassword`.
3. Substituir atalhos que abriam `NextStepModal` por links de navegação reais e botões funcionais.
4. Adicionar loading e feedback via `AppButton` e `AppInput`.

### Tarefa 3.2: Completar "Documentos" (`/painel/documentos`)
1. Implementar botões de download direto para documentos com suporte a links externos e downloads seguros.
2. Atualizar formulário de publicação com loading e validação.

### Tarefa 3.3: Completar "Ordens de Serviço" (`/painel/ordens`)
1. Alterar `OrdensPage` para carregar `maintenance_orders` reais do condomínio.
2. Eliminar o array hardcoded `SAMPLE_ORDERS` de `ordens-client.tsx`.
3. Adicionar suporte a exibição de dados reais ou empty state adequado.

### Tarefa 3.4: Aprimorar "Portaria" (`/painel/portaria`)
1. Substituir `window.prompt` por modal dedicado de PIN para baixa de encomendas com `AppModal` e `AppInput`.
2. Adicionar feedback visual e acessibilidade para o fluxo de portaria.

### Tarefa 3.5: Moderar Prestadores em "Admin Prestadores" (`/painel/admin/prestadores`)
1. Criar componente interativo para aprovação/rejeição/revisão de prestadores.
2. Integrar com `setVendorOnboardingStatusAction` e badges de verificação.

### Tarefa 3.6: Criar Suíte E2E Playwright
1. Configurar helper de sessão autenticada para Playwright.
2. Criar testes E2E para:
   - `morador-flow.spec.ts`: Notificações, Marketplace, Solicitação de serviço.
   - `sindico-flow.spec.ts`: Gestão de moradores, Financeiro, Auditoria.
   - `portaria-flow.spec.ts`: Encomendas com PIN, Visitantes.
   - `prestador-flow.spec.ts`: Acesso ao portal do prestador e chamados.

### Tarefa 3.7: Verificação, Auto-Commit e Relatório Final
1. Executar `typecheck`, `lint` e testes unitários/integração.
2. Executar testes E2E Playwright.
3. Gerar o Relatório Final de Auditoria e Entrega (`relatorio-final-auditoria-entrega.md`).
4. Commit final no git.

