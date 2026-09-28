# Matriz de RBAC e Permissões — Zeladoria Serviços

## 1. Papéis Suportados (Roles)

1. **`superadmin`**: Administrador global da plataforma SaaS Zeladoria.
2. **`sindico`**: Administrador legal do condomínio com poder de aprovação e auditoria.
3. **`conselho`**: Membro fiscalizador do condomínio.
4. **`zelador`**: Gestor operacional de manutenção predial interna.
5. **`porteiro`**: Operador de portaria e controle de acessos de prestadores.
6. **`morador`**: Usuário condômino / residente final solicitante de serviços.
7. **`prestador`**: Profissional ou empresa autônoma parceira homologada.

---

## 2. Permissões Granulares do Marketplace

### Prestador (`prestador`)
| Permissão | Finalidade |
| :--- | :--- |
| `provider.calls.view` | Visualizar chamados sob demanda e solicitações de orçamento direcionadas |
| `provider.calls.accept` | Aceitar ou recusar chamados operacionais |
| `provider.quote.create` | Enviar cotações e propostas formais discriminando mão de obra e materiais |
| `provider.job.start` | Transicionar status para "a caminho" e "em atendimento" |
| `provider.job.complete` | Declarar conclusão do serviço com notas de encerramento |
| `provider.profile.update` | Editar dados de catálogo, especialidades, bio, capa e fotos |
| `provider.earnings.view` | Acessar painel de faturamento, ticket médio e extrato |

### Morador (`morador`)
| Permissão | Finalidade |
| :--- | :--- |
| `marketplace.request.create` | Criar chamados sob demanda ou solicitações de orçamento |
| `marketplace.request.view_own` | Acompanhar linha do tempo e status de suas contratações |
| `marketplace.quote.accept` | Aprovar propostas formais recebidas |
| `marketplace.job.confirm` | Confirmar finalização do serviço ou abrir mediação |
| `marketplace.review.create` | Avaliar prestadores em 4 critérios após a conclusão |
| `marketplace.favorite.toggle` | Favoritar ou desfavoritar profissionais para recontratação rápida |

### Síndico & Administrador (`sindico`, `superadmin`)
| Permissão | Finalidade |
| :--- | :--- |
| `vendors.view` | Listar fornecedores e parceiros cadastrados |
| `vendors.manage` | Editar dados de homologação e contratos prediais |
| `vendors.rate` | Avaliar qualidade de prestação para o condomínio |
| `vendors.onboarding.moderate` | Aprovar, rejeitar ou suspender prestadores do marketplace |
| `vendors.dispute.resolve` | Mediar disputas entre moradores e prestadores |
