# Especificação Técnica — Prioridade 3: Módulos Incompletos, Portaria e Suíte E2E Playwright

Data: 29 de Outubro de 2026  
Status: Aprovado  
Fase: Prioridade 3 — Módulos incompletos, testes E2E e esteira de qualidade  

---

## 1. Contexto e Objetivos

Após a conclusão bem-sucedida da Prioridade 1 (Estabilidade, Segurança, RBAC e Zeladoria Pay) e da Prioridade 2 (Design System `AppUI`, Loading Skeletons e Central de Notificações), a Prioridade 3 tem como missão erradicar quaisquer funcionalidades incompletas, telas estáticas com dados falsos (*stubs*) e gaps operacionais no sistema **Zeladoria Condomínio**, além de instituir a esteira automatizada de testes E2E com Playwright cobrindo os 4 perfis centrais (`Morador`, `Síndico`, `Porteiro` e `Prestador`).

### 1.1 Regra Absoluta: Não Quebrar o Backend
- Nenhuma alteração destrutiva em tabelas, colunas ou contratos de API `/api/v1/*`.
- Manter compatibilidade com os envelopes `{ data: ... }` e autenticação com cookies de sessão assinados (`gc_session`).
- Preservar a comissão institucional da plataforma (10%) no Zeladoria Pay.

---

## 2. Módulos Auditados e Correções Arquiteturais

### 2.1 Meu Perfil (`/painel/perfil`)
- **Problema Atual:** Atalhos rápidos de perfil disparavam um modal estático de "próxima etapa" (`NextStepModal`), e não havia formulário para edição de dados pessoais ou alteração de senha, mesmo existindo endpoints funcionais no backend (`PATCH /perfil`, `PUT /auth/password`).
- **Solução Técnica:**
  - Substituir atalhos fictícios por links de navegação contextuais diretos (`/painel/comunicados`, `/painel/encomendas`, `/painel/documentos`, `/painel/assembleias`, `/painel/portaria`, `/painel/reservas`, `/painel/notificacoes`).
  - Implementar abas e formulários estruturados em `PerfilClient`:
    1. **Dados Pessoais:** Nome, telefone, documento, contatos de emergência e veículos, integrados a `updateProfileInfoAction`.
    2. **Segurança e Senha:** Alteração de senha (`currentPassword`, `newPassword`, `confirmPassword`) com validação de força, feedback visual e tratamento de erro 422 via `updatePasswordAction`.
    3. **Preferências de Notificação:** Toggles de email, push e canais de aviso via `updateNotificationPreferencesAction`.
  - Estados de loading nos botões de submissão via `AppButton` e `AppInput`.

### 2.2 Documentos da Biblioteca (`/painel/documentos`)
- **Problema Atual:** Os cards de documentos na biblioteca exibiam apenas uma tag de texto "Disponível" / "Restrito", sem botão ou link de download. O formulário de publicação não fornecia feedback de carregamento.
- **Solução Técnica:**
  - Adicionar botão de ação primária "Baixar documento" em cada card, suportando URLs remotas ou geração de download seguro do arquivo (`.pdf`, `.docx`).
  - Integrar botão com feedback discreto de download e registro de auditoria.

### 2.3 Ordens de Serviço (`/painel/ordens`)
- **Problema Atual:** O arquivo `ordens-client.tsx` utilizava uma lista estática mockada em memória (`SAMPLE_ORDERS`), desvinculada do banco de dados e da tabela `maintenance_orders`.
- **Solução Técnica:**
  - Atualizar `OrdensPage` para buscar as ordens de manutenção reais do condomínio (`orderRows`, `assetRows`, `planRows`, `vendorRows`).
  - Passar as ordens reais para `OrdensClient`.
  - Exibir `AppEmptyState` elegante quando não houver ordens cadastradas, sem substituir por dados falsos.
  - Oferecer filtros dinâmicos por status (`aguardando`, `em_execucao`, `concluida`, `cancelada`) e busca assistida.

### 2.4 Central de Sugestões (`/painel/sugestoes`)
- **Problema Atual:** Sugestões armazenadas em estado local (`INITIAL_SUGGESTIONS`), desaparecendo ao atualizar a página.
- **Solução Técnica:**
  - Integrar o envio de sugestões à ação oficial de chamados (`createTicketAction` com categoria `sugestao`), persistindo no banco de dados com protocolo rastreável.
  - Permitir listagem de sugestões com status oficial e contagem de apoio comunitário.

### 2.5 Portaria & Controle de Acesso (`/painel/portaria`)
- **Problema Atual:** Entrega de encomenda usava `window.prompt()`, que quebrava em dispositivos móveis e testes automatizados.
- **Solução Técnica:**
  - Substituir `window.prompt` por um modal dedicado de liberação de encomenda com `AppModal` e `AppInput`, exigindo o código PIN de 4 a 6 dígitos do morador.
  - Exibir botão de cópia de passe e confirmação visual de liberação de visitantes.

### 2.6 Credenciamento & Moderação de Prestadores (`/painel/admin/prestadores`)
- **Problema Atual:** Tabela de prestadores no painel administrativo era puramente informativa, sem botão para aprovar, reprovar ou revisar documentos KYC de novos prestadores.
- **Solução Técnica:**
  - Criar componente de moderação `AdminPrestadoresClient` conectado a `setVendorOnboardingStatusAction` e ao endpoint de verificação do backend (`PATCH /admin/prestadores/{vendor}/verificacao`).
  - Exibir badge com status de verificação e modal de auditoria/aprovação.

---

## 3. Arquitetura da Suíte E2E Playwright

Para assegurar cobertura total sem fragilidade, a suíte de testes Playwright será organizada em fluxos de jornada por perfil em `frontend/tests/e2e/`:

1. `e2e/morador-flow.spec.ts`:
   - Login / autenticação com sessão de morador (User ID 7).
   - Navegação na Central de Notificações (`/painel/notificacoes`), alternância de abas e filtros.
   - Navegação no Marketplace de Serviços (`/painel/servicos`) e visualização de prestadores habilitados.
   - Solicitação de orçamento e validação da máquina de estados do Zeladoria Pay.

2. `e2e/sindico-flow.spec.ts`:
   - Login com sessão de síndico (User ID 2).
   - Gestão de Moradores (`/painel/moradores`) e validação da proteção de convites (impedindo elevação para superadmin).
   - Painel Financeiro (`/painel/financeiro`), verificação de saldos e receitas.
   - Trilha de Auditoria (`/painel/auditoria`).

3. `e2e/portaria-flow.spec.ts`:
   - Login com sessão de porteiro (User ID 3).
   - Acesso à Portaria (`/painel/portaria`).
   - Registro de nova encomenda com geração de PIN.
   - Validação da entrega de encomenda com modal de PIN (sem `window.prompt`).
   - Autorização e check-in de visitante.

4. `e2e/prestador-flow.spec.ts`:
   - Login com sessão de prestador.
   - Acesso ao portal do prestador (`/prestador/chamados`, `/prestador/agenda`, `/prestador/ganhos`).
   - Análise de oportunidade e avanço de status de atendimento.

---

## 4. Critérios de Aceitação e Verificação
- `npm --prefix frontend run typecheck` sem nenhum erro.
- `npm --prefix frontend run lint` com 0 erros.
- Execução completa da suíte unitária e de integração (`tests/*.test.ts`) com 100% de aprovação.
- Execução da suíte E2E Playwright validando os fluxos dos 4 perfis.
- Geração do relatório final de auditoria em conformidade com a Seção 14 das diretrizes.
