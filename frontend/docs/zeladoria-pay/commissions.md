# Comissões, Split e Payouts — Zeladoria Pay

## 1. Regra de Split e Não-Hardcoding

A divisão financeira entre a Zeladoria e o Prestador não é fixada em código (sem `90/10` hardcoded). O percentual de comissão é configurável via painel administrativo (`marketplaceSettings`) e congelado no momento da contratação:

```
Valor Bruto Pago pelo Morador: R$ 1.000,00 (100000 centavos)
(-) Taxa de Comissão Aplicada (10%): R$ 100,00 (10000 centavos)
(=) Valor Líquido do Prestador: R$ 900,00 (90000 centavos)
```

## 2. Snapshot da Comissão no Contrato (`commissionRateSnapshot`)

No exato momento em que o morador aceita a proposta digital:
- O percentual de comissão vigente no condomínio é gravado na coluna `commissionRateSnapshot` da tabela `serviceContracts`.
- Qualquer alteração futura na taxa padrão feita pelo Administrador NÃO afeta contratos já aceitos ou em andamento.

## 3. Modelo de Absorção de Taxas (`feePayer`)

Configurado no painel do administrador:
- `PLATFORM`: A taxa cobrada pelo PSP (ex: 3,5% do cartão ou R$ 1,99 do Pix) é descontada da receita da Zeladoria.
- `PROVIDER`: A taxa do PSP é descontada do valor líquido do prestador.
- `SHARED`: A taxa do PSP é dividida igualmente entre a Zeladoria e o prestador.

## 4. Tabela de Repasses (`payouts`)

Os repasses são registrados de forma independente:
- `providerId`: Prestador credenciado
- `contractId`: Contrato de origem
- `paymentOrderId`: Ordem de cobrança
- `grossAmountCents`: Valor bruto recebido
- `platformFeeCents`: Comissão da Zeladoria
- `processingFeeCents`: Taxa de gateway
- `netAmountCents`: Montante final a transferir
- `status`: `"pending"`, `"eligible"`, `"released"`, `"held_in_dispute"`, `"cancelled"`
- `eligibleAt`: Momento em que o prestador se tornou elegível (após confirmação "Tudo Certo!")
- `releasedAt`: Momento do repasse efetivo via PSP

## 5. Simulador Financeiro Interno

Disponível no painel administrativo (`/painel/admin/zeladoria-pay` na aba "Simulador"):
Permite ao administrador simular cenários de preços (R$ 100 a R$ 20.000), variando taxa de comissão da plataforma, taxa estimada do PSP e pagador de taxas para avaliar a rentabilidade antes de publicar novas regras.
