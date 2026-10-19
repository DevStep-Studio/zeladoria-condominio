# State Machine — Zeladoria Serviços e Zeladoria Pay

## 1. Estados Canônicos (`SERVICE_STATUSES`)

A State Machine centraliza 19 estados canônicos definidos em `src/lib/services/payments/state-machine.ts`:

| Estado | Significado Operacional | Visual / Badge |
|---|---|---|
| `REQUESTED` | Morador solicitou o serviço na plataforma | Azul claro |
| `PROVIDER_REVIEWING` | Prestador está analisando o escopo | Amarelo |
| `VISIT_OFFERED` | Prestador ofereceu vistoria (gratuita ou paga) | Azul |
| `VISIT_PAYMENT_PENDING` | Aguardando pagamento da vistoria paga | Âmbar |
| `VISIT_SCHEDULED` | Vistoria agendada e confirmada | Verde |
| `VISIT_COMPLETED` | Vistoria realizada e diagnóstico registrado | Verde escuro |
| `QUOTE_DRAFT` | Elaboração da proposta técnica | Slate |
| `QUOTE_SENT` | Proposta enviada para o morador analisar | Roxo |
| `QUOTE_REVISION_REQUESTED` | Morador solicitou revisão da proposta | Laranja |
| `QUOTE_ACCEPTED` | Morador aceitou a proposta formalmente | Esmeralda |
| `SERVICE_PAYMENT_PENDING` | Checkout do serviço gerado, aguardando compensação | Âmbar |
| `PAID` | Pagamento aprovado via webhook confiável | Verde |
| `SERVICE_SCHEDULED` | Execução do serviço agendada | Azul escuro |
| `IN_PROGRESS` | Prestador em trânsito ou executando no condomínio | Azul primário |
| `PROVIDER_COMPLETED` | Prestador finalizou e registrou evidências | Índigo |
| `CUSTOMER_CONFIRMED` | Morador confirmou conclusão ("Tudo Certo!") | Verde esmeralda |
| `DISPUTED` | Morador abriu contestação; repasse retido | Vermelho |
| `COMPLETED` | Contratação concluída e repasse finalizado | Verde suave |
| `CANCELLED` | Chamado cancelado por qualquer das partes | Cinza |

## 2. Matriz de Transições Permitidas (`ALLOWED_TRANSITIONS`)

```
REQUESTED                  -> PROVIDER_REVIEWING, VISIT_OFFERED, QUOTE_SENT, CANCELLED
PROVIDER_REVIEWING         -> VISIT_OFFERED, QUOTE_SENT, CANCELLED
VISIT_OFFERED              -> VISIT_PAYMENT_PENDING, VISIT_SCHEDULED (gratuita), CANCELLED
VISIT_PAYMENT_PENDING      -> VISIT_SCHEDULED, CANCELLED
VISIT_SCHEDULED            -> VISIT_COMPLETED, CANCELLED
VISIT_COMPLETED            -> QUOTE_SENT, CANCELLED
QUOTE_DRAFT                -> QUOTE_SENT, CANCELLED
QUOTE_SENT                 -> QUOTE_ACCEPTED, QUOTE_REVISION_REQUESTED, CANCELLED
QUOTE_REVISION_REQUESTED   -> QUOTE_SENT, CANCELLED
QUOTE_ACCEPTED             -> SERVICE_PAYMENT_PENDING, PAID, CANCELLED
SERVICE_PAYMENT_PENDING    -> PAID, CANCELLED
PAID                       -> SERVICE_SCHEDULED, IN_PROGRESS, CANCELLED
SERVICE_SCHEDULED          -> IN_PROGRESS, CANCELLED
IN_PROGRESS                -> PROVIDER_COMPLETED, DISPUTED, CANCELLED
PROVIDER_COMPLETED         -> CUSTOMER_CONFIRMED, DISPUTED, COMPLETED
CUSTOMER_CONFIRMED         -> COMPLETED, DISPUTED
DISPUTED                   -> CUSTOMER_CONFIRMED, CANCELLED, IN_PROGRESS
COMPLETED                  -> DISPUTED (garantia pós-serviço)
CANCELLED                  -> (estado terminal)
```

## 3. Métodos Utilitários

- `canTransition(current, next): boolean` — Avalia se a transição entre dois estados é permitida.
- `assertTransition(current, next): void` — Lança exceção amigável e impede alteração irregular.
- `normalizeServiceStatus(status: string): ServiceLifecycleStatus` — Converte status legados do banco para o padrão canônico mantendo 100% de compatibilidade retroativa.
