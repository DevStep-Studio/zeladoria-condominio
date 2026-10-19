# Roles and Permissions (RBAC) — Zeladoria Condomínio

Este documento especifica a arquitetura centralizada de Controle de Acesso Baseado em Papéis (RBAC) do ecossistema Zeladoria Condomínio.

---

## 1. Princípios Fundamentais

1. **Separação de Contexto por Papel**:
   - **Porteiro**: Operação imediata em tempo real (visitantes, encomendas, acessos, livro digital, rondas e turnos).
   - **Síndico**: Gestão executiva, tomada de decisão, aprovação, acompanhamento financeiro, ordens de serviço e governança.
   - **Morador**: Rotina pessoal restrita à sua própria unidade (minhas encomendas, minhas reservas, ocorrências próprias).
   - **Prestador**: Atendimentos atribuídos, orçamentos, cotações e perfil parceiro.
   - **Zelador**: Apoio operacional predial, ordens de serviço e manutenção preventiva.
   - **Conselho**: Acompanhamento de prestação de contas, atas, relatórios e auditoria.

2. **Segurança no Backend**:
   - Nenhuma permissão é validada apenas no frontend ou na omissão de itens de menu.
   - Toda Server Action e API route valida o condomínio ativo (`condoId`), o papel do usuário na associação (`memberships.role`) e permissões granulares via `requireRole` e `requirePermission`.

3. **Multi-Condomínio Estrito**:
   - A role do usuário é calculada dinamicamente com base no condomínio selecionado (`activeMembership.role`).
   - Um usuário pode ser **Porteiro** no Condomínio A e **Síndico** ou **Morador** no Condomínio B sem vazamento de privilégios.

---

## 2. Matriz de Permissões Granulares

| Permissão | Morador | Porteiro | Zelador | Síndico | Conselho | Prestador |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dashboard.portaria_view` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `dashboard.management_metrics` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `visitor.view_own` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `visitor.view_all` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `visitor.checkin` / `checkout` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `package.view_own` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `package.view_all` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `package.register` / `release` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `shift.open` / `close` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `logbook.view` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `logbook.create` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `logbook.ack` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `occurrence.view_own` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `occurrence.view_all` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `occurrence.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `occurrence.manage` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `reservation.view_own` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `reservation.view_all` | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `reservation.approve` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `service_order.view` | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `service_order.manage` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `maintenance.view` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `maintenance.manage` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `financial.view` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `financial.manage` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `audit.view` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `report.view` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `settings.manage` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 3. Implementação e Código

- **Matriz de permissões**: [src/lib/permissions.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/permissions.ts)
- **Navegação por perfil**: [src/lib/navigation.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/navigation.ts)
- **Guarda de Sessão & Auth**: [src/lib/auth.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/auth.ts)
