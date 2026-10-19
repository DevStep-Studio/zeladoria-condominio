# Segurança, Permissões e Auditoria — Zeladoria Pay

## 1. Controle de Acesso e Isolamento de Recursos (Anti-IDOR)

Todas as Server Actions e rotas de API executam validação estrita de identidade, perfil e condomínio:

- **Autenticação Obrigatória**: `requireSession()`, `requireCondo()` ou `requireProvider()`.
- **Ownership Check**:
  - Morador A só pode visualizar, aceitar ou pagar suas próprias solicitações (`customerId === session.user.id`).
  - Prestador A só pode visualizar, responder, enviar propostas e anexar evidências em chamados a ele atribuídos (`vendorId === currentVendor.id`).
  - Tentativas de acesso cruzado (cross-tenant) resultam em `403 Forbidden` imediato.
- **Isolamento Multi-Tenant**: O `condoId` do usuário logado é verificado em todas as queries. Usuários de um condomínio não têm visibilidade de dados de outro condomínio.

## 2. Integridade dos Valores Financeiros (Zero Client Trust)

- **Imutabilidade de Preços**: O total cobrado em uma transação é obtido diretamente do contrato congelado (`serviceContracts.totalCents` ou `serviceInspections.priceCents`).
- **Sanitização de Payloads**: Campos como `amount`, `commissionRate`, `recipientId` ou `status` enviados pelo cliente no corpo da requisição são estritamente ignorados.
- **Anti-Tampering Hash**: O contrato digital é submetido a hash SHA-256 no momento do aceite. Qualquer divergência entre os dados do contrato e o hash invalidaria a transação.

## 3. Conformidade PCI-DSS e Dados Sensíveis

- **Zero Armazenamento de Cartão**: Números de cartão de crédito (PAN) e códigos de segurança (CVV) nunca trafegam em texto claro nem são persistidos em tabelas locais ou logs de aplicação.
- **Minimização de Dados**: Prestadores só têm acesso a informações detalhadas do morador (como número da unidade e telefone) após o aceite e agendamento da vistoria/serviço.

## 4. Onboarding e KYC Obrigatório para Prestadores

Prestadores que desejam receber pagamentos através do Zeladoria Pay devem estar com a conta financeira aprovada no parceiro (`payoutOnboardingStatus = "approved"`). Caso contrário, são orientados a concluir o cadastro financeiro antes de poder aceitar contratações pagas online.

## 5. Trilha de Auditoria (Audit Events)

Ações críticas geram registros imutáveis em `auditEvents`:
- `QUOTE_SENT`: Envio de proposta pelo prestador
- `QUOTE_ACCEPTED`: Aceite da proposta pelo morador
- `PAYMENT_CREATED`: Ordem de cobrança gerada
- `PAYMENT_APPROVED`: Pagamento confirmado via webhook do PSP
- `PAYMENT_FAILED`: Pagamento recusado ou vencido
- `SERVICE_STARTED`: Prestador iniciou execução
- `SERVICE_COMPLETED`: Prestador finalizou o serviço
- `CUSTOMER_CONFIRMED`: Morador confirmou a conclusão
- `DISPUTE_OPENED`: Morador abriu contestação
- `PAYOUT_RELEASED`: Repasse financeiro liberado ao prestador
