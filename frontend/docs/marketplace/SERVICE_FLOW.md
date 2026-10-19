# Fluxos de Contratação e Atendimento — Zeladoria Serviços

## 1. Fluxo A: Atendimento Rápido / Sob Demanda (Emergencial)

Indicado para: *Troca de disjuntor, torneira pingando, desentupimento de ralo, chaveiro, pequenos reparos*.

```mermaid
sequenceDiagram
    autonumber
    actor M as Morador
    participant S as Zeladoria Serviços
    actor P as Prestador (Online)
    
    M->>S: Abre busca e filtra por "Disponível Hoje"
    M->>S: Seleciona "Preciso agora / hoje" + Descrição + Fotos
    S->>P: Notifica novo chamado urgente com contagem regressiva
    P->>S: Aceita o chamado
    S->>M: Notifica "Prestador aceitou seu chamado!"
    P->>S: Atualiza status para "A caminho"
    P->>S: Atualiza status para "Em atendimento"
    P->>S: Finaliza serviço com relatório/fotos
    S->>M: Notifica conclusão pendente de liberação
    M->>S: Confirma conclusão
    M->>S: Envia avaliação verificada (4 critérios)
```

---

## 2. Fluxo B: Orçamento e Propostas (Projetos / Reformas)

Indicado para: *Pintura de apartamento, móveis planejados, automação residencial, reforma de banheiro*.

```mermaid
sequenceDiagram
    autonumber
    actor M as Morador
    participant S as Zeladoria Serviços
    actor P as Prestadores Qualificados
    
    M->>S: Cria solicitação com escopo, fotos e prazos desejados
    S->>P: Disponibiliza chamado para envio de propostas na região
    P->>S: Envia Proposta Formal (mão de obra + materiais + prazo + validade)
    S->>M: Notifica novas propostas recebidas
    M->>S: Compara orçamentos lado a lado
    M->>S: Aprova a proposta escolhida
    S->>P: Notifica proposta aprovada e data agendada
    P->>S: Executa o serviço agendado
    P->>S: Marca como concluído
    M->>S: Confirma e avalia
```
