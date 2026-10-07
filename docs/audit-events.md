# Trilha de Auditoria & Eventos Críticos — Zeladoria Condomínio

Este documento cataloga todos os eventos auditados e gravados de forma imutável na tabela `audit_logs` do Zeladoria Condomínio.

---

## 1. Princípios da Trilha de Auditoria

1. **Imutabilidade**: Registros de auditoria são `append-only`. Não existem operações de `UPDATE` ou `DELETE` em `audit_logs`.
2. **Contexto Completo**: Todo log registra:
   - `userId` e `userName`: Usuário executor;
   - `condoId`: Condomínio onde ocorreu a ação;
   - `action`: Verbo da operação (`checkin`, `checkout`, `entregar`, `aprovar`, `criar`, `atualizar`, `excluir`, `bloquear`, `ciencia`);
   - `entity` e `entityId`: Entidade afetada (`visita`, `encomenda`, `reserva`, `ocorrencia`, `ordem_manutencao`, `usuario`, `condominio`);
   - `summary`: Descrição legível em português;
   - `before` e `after`: Payloads JSON com snapshots dos dados antes e depois da operação;
   - `ip` e `userAgent`: Origem da requisição para auditoria pericial;
   - `critical`: Flag booleana para eventos de alta relevância jurídica/financeira.

---

## 2. Tabela de Eventos Críticos

| Evento | Ação Auditada | Entidade | Nível Crítico |
| :--- | :--- | :--- | :---: |
| **Check-in de Visitante** | `checkin` | `visita` | Sim |
| **Check-out de Visitante** | `checkout` | `visita` | Sim |
| **Bloqueio de Visitante** | `bloquear` / `desbloquear` | `visitante` | Sim |
| **Entrega de Encomenda** | `entregar` | `encomenda` | Sim |
| **Código Inválido na Retirada** | `codigo_invalido` | `encomenda` | Sim |
| **Abertura de Turno** | `abrir_turno` | `turno` | Sim |
| **Encerramento de Turno** | `encerrar_turno` | `turno` | Sim |
| **Registro no Livro Digital** | `criar` | `ocorrencia` | Sim |
| **Ciência do Síndico** | `ciencia` | `ocorrencia` | Sim |
| **Complemento em Ocorrência** | `complementar` | `ocorrencia` | Sim |
| **Criação de Ordem de Serviço** | `criar_ordem_de_ocorrencia` | `ordem_manutencao` | Sim |
| **Aprovação / Recusa de Reserva** | `aprovar` / `recusar` | `reserva` | Sim |
| **Convite / Alteração de Usuário** | `convidar_usuario` | `usuario` | Sim |
| **Alteração de Configuração** | `atualizar_configuracoes` | `condominio` | Sim |

---

## 3. Consulta & Relatórios de Auditoria

- **Módulo de Auditoria**: [src/app/painel/auditoria/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/auditoria/page.tsx)
- **Mecanismo de Gravação**: [src/lib/audit.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/audit.ts)
