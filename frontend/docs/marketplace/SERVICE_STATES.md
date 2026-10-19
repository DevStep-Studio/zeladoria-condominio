# Máquina de Estados Centralizada — Zeladoria Serviços

## 1. Estados da Solicitação (`serviceRequests.status`)

```
               [solicitado]
                    │
                    ▼
         [buscando_prestador]
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
[aguardando_orcamento]    [prestador_encontrado]
         │                     │
         ▼                     ▼
[orcamento_aprovado]        [aceito]
         └──────────┬──────────┘
                    ▼
               [a_caminho]
                    │
                    ▼
                [chegou]
                    │
                    ▼
            [em_atendimento]
                    │
                    ▼
          [concluido_prestador]
                    │
                    ▼
               [concluido]
                    │
           ┌────────┴────────┐
           ▼                 ▼
      [avaliado]        [em_disputa]
```

---

## 2. Dicionário de Transições Permitidas

| De | Para | Disparado Por | Validação / Efeito |
| :--- | :--- | :--- | :--- |
| `solicitado` | `buscando_prestador` | Sistema | Dispara notificações push/in-app para prestadores do raio |
| `buscando_prestador` | `aceito` | Prestador | Valida se chamado ainda não foi aceito por outro profissional |
| `buscando_prestador` | `aguardando_orcamento` | Sistema | Modo orçamento ativado |
| `aguardando_orcamento` | `orcamento_aprovado` | Morador | Morador aprova uma das propostas recebidas |
| `orcamento_aprovado` | `aceito` | Sistema | Transforma proposta aprovada em chamado ativo |
| `aceito` | `a_caminho` | Prestador | Notifica morador com estimativa de deslocamento |
| `a_caminho` | `chegou` / `em_atendimento` | Prestador / Portaria | Registra início efetivo da mão de obra |
| `em_atendimento` | `concluido_prestador` | Prestador | Envia formulário de fechamento ao morador |
| `concluido_prestador` | `concluido` | Morador | Confirmação formal da entrega |
| `concluido` | `avaliado` | Morador | Submissão de review com 4 critérios |
| `*` (qualquer) | `cancelado` | Morador / Prestador | Requer justificativa textual |
| `concluido_prestador` | `em_disputa` | Morador | Aciona moderação do síndico/administrador |
