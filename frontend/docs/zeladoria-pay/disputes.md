# Contestações e Mediação — Zeladoria Protege

## 1. Conceito Operacional

O **Zeladoria Protege** oferece proteção operacional e mediação administrativa no condomínio. Ao final da execução de um serviço pelo prestador, o morador tem o direito de avaliar o resultado antes de autorizar o repasse.

## 2. Motivos Oficiais de Contestação

O morador pode abrir contestação selecionando um dos motivos padronizados:
- `SERVICO_INCOMPLETO`: O serviço acordado na proposta não foi totalmente executado.
- `DIVERGENCIA_PROPOSTA`: Itens ou materiais instalados diferem da proposta digital aceita.
- `DANO_PATRIMONIAL`: Ocorreu avaria em estruturas do imóvel ou condomínio.
- `QUALIDADE_INADEQUADA`: O acabamento ou funcionamento não atende aos padrões mínimos.
- `PRESTADOR_NAO_COMPARECEU`: O prestador declarou conclusão sem ter comparecido.
- `COBRANCA_INDEVIDA`: Tentativa de cobrança de valores fora da plataforma.
- `OUTRO`: Outros motivos descritos detalhadamente com fotos e evidências.

## 3. Fluxo de Bloqueio de Payout

```
[Prestador Finaliza Serviço]
            |
            v
[Morador Inspeciona]
     /             \
 [Tudo Certo!]    [Tenho um Problema]
      |                    |
[Repasse Liberado]    [Abertura de Disputa]
                           |
            +--------------v--------------+
            | Payout.status =             |
            |   "held_in_dispute"         |
            | Service.status = "DISPUTED" |
            +--------------+--------------+
                           |
                           v
            [Mediação da Administração]
              /            |            \
    [Acordo / Retrabalho] [Estorno]  [Repasse Liberado]
```

## 4. Painel de Contestações do Administrador

Localizado em `/painel/admin/zeladoria-pay` (aba "Contestações"):
Exibe contratos em disputa, motivo detalhado, histórico de mensagens no chat, evidências fotográficas anexadas por morador e prestador, permitindo a mediação justa e a tomada de decisão (liberar pagamento, autorizar retrabalho ou reembolsar).
