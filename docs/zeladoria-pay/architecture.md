# Arquitetura — Zeladoria Pay & Zeladoria Protege

## 1. Visão Geral
O **Zeladoria Pay** é a camada de intermediação financeira e automação de cobranças/repasses do marketplace **Zeladoria Serviços**, integrada ao ecossistema condominal.
O **Zeladoria Protege** constitui a camada de confiança operacional e garantia de execução do serviço contratado (Art. 26 do Código de Defesa do Consumidor — CDC), operando de forma desvinculada de qualquer produto securitário financeiro.

```
+-----------------------------------------------------------------------------------+
|                                  APLICAÇÃO WEB                                    |
|   Morador (Painel /servicos)  <====>  Prestador (/prestador/chamados & ganhos)    |
|                          Admin (/painel/admin/zeladoria-pay)                      |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                         SERVER ACTIONS & PERMISSION CHECK                         |
|   (customerAcceptProposalAction, customerConfirmCompletionAction, etc.)           |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                                 PAYMENT SERVICE                                   |
|   State Machine Canonical  |  Contract Snapshot Hash  |  Financial Ledger         |
+-----------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+----------------------------------+        +-------------------------------------+
|        BANCO DE DADOS            |        |          GATEWAY ADAPTER            |
|   (PostgreSQL condominio_app)    |        |        (AsaasGatewayAdapter)        |
| - serviceRequests                |        | - createCharge (PIX / Cartão)       |
| - serviceQuotes                  |        | - parseWebhookEvent                 |
| - serviceContracts               |        | - releasePayout                     |
| - paymentOrders                  |        +-------------------------------------+
| - serviceEvidences               |                           |
| - payouts                        |                           v
| - disputes                       |                +--------------------+
| - marketplaceSettings            |                |      PSP EXTERNO   |
+----------------------------------+                |     (Asaas Sandbox |
                                                    |      ou Produção)  |
                                                    +--------------------+
```

## 2. Princípios Arquiteturais Fundamentais
1. **Never Trust the Client**: Nenhum valor monetário, comissão, split ou status é aceito a partir de payloads do frontend. O backend recalcula e valida exclusivamente contra a proposta/contrato armazenado no banco.
2. **Separação Rígida de Pagamentos**:
   - `Payment Type 1: VISIT_PAYMENT` (Vistoria técnica presencial)
   - `Payment Type 2: SERVICE_PAYMENT` (Execução do serviço principal)
   - Cada tipo possui sua própria ordem em `paymentOrders` com código único e status independente.
3. **Imutabilidade Contratual**: Após aceite do morador, a proposta gera um registro em `serviceContracts` com snapshot completo e hash criptográfico SHA-256. Aditivos de escopo geram novos contratos/transações em vez de sobrescrever o contrato base.
4. **Reserva de Horários com Expiração (Hold)**: Horários de vistoria paga recebem pré-reserva temporária de 10 minutos (`holdExpiresAt`) enquanto o morador conclui o checkout via Pix.
5. **Ledger Append-Only**: Trilha de auditoria contábil e operacional imutável. Eventos de compensação e estorno geram novas entradas, sem deleção ou mutação do histórico.
