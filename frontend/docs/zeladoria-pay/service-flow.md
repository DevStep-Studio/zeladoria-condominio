# Fluxo Operacional Completo do Zeladoria Serviços

## Fluxograma de Contratação

```mermaid
sequenceDiagram
    autonumber
    actor M as Morador
    actor P as Prestador
    participant S as Zeladoria Serviços (Backend)
    participant Z as Zeladoria Pay (PSP)

    M->>S: 1. Solicita Serviço (categoria, descrição, fotos)
    S-->>P: 2. Notifica prestador compatível
    alt Vistoria Gratuita
        P->>S: 3a. Oferece Vistoria Gratuita (slots de horários)
        M->>S: 4a. Seleciona horário
        S->>S: 5a. Transiciona para VISIT_SCHEDULED
    else Vistoria Paga
        P->>S: 3b. Oferece Vistoria Paga (R$ X + slots + opção de abatimento)
        M->>S: 4b. Seleciona horário (hold de 10 min)
        S->>Z: 5b. Gera cobrança Pix da vistoria
        M->>Z: 6b. Efetua pagamento
        Z-->>S: 7b. Webhook PAYMENT_CONFIRMED
        S->>S: 8b. Transiciona para VISIT_SCHEDULED
    end

    P->>S: 9. Comparece ao local e registra Diagnóstico + Fotos
    P->>S: 10. Envia Proposta Digital detalhada (Mão de obra, Materiais, Prazo, Garantia)
    Note over S: Desconto automático da vistoria paga aplicada se configurado
    M->>S: 11. Aceita Proposta Digital
    S->>S: 12. Congela ServiceContract (hash SHA-256 + snapshot da comissão)
    S->>Z: 13. Gera Checkout Zeladoria Pay (Pix / Cartão com Split)
    M->>Z: 14. Efetua pagamento
    Z-->>S: 15. Webhook PAYMENT_CONFIRMED
    S->>S: 16. Transiciona para PAID & autoriza início do serviço
    
    P->>S: 17. Registra Evidências Técnicas (ANTES, DURANTE, DEPOIS)
    P->>S: 18. Finaliza serviço (resumo + fotos finais)
    
    alt Morador confirma (Tudo Certo!)
        M->>S: 19a. Confirma Conclusão
        S->>S: 20a. Transiciona para COMPLETED
        S->>Z: 21a. Libera Payout/Repasse ao prestador
        M->>S: 22a. Avaliação e Emissão de Comprovante de Contratação
    else Morador Contesta
        M->>S: 19b. Abre Contestação (motivo, descrição, evidências)
        S->>S: 20b. Transiciona para DISPUTED
        Note over S: Payout retido automaticamente até mediação
    end
```

## Etapas Principais

1. **Solicitação de Serviço**: Morador relata a necessidade, adiciona fotos e endereço no condomínio.
2. **Definição da Vistoria**: O prestador avalia a complexidade e oferece vistoria gratuita ou técnica remunerada.
3. **Agendamento e Hold**: Vistorias pagas bloqueiam o horário por 10 minutos. O agendamento definitivo só é consolidado após confirmação do webhook do PSP.
4. **Diagnóstico Técnico**: Registro de causas, riscos identificados e lista de materiais necessários.
5. **Proposta Digital Itemizada**: Composição discriminada entre mão de obra, materiais, custos operacionais e abatimento da vistoria.
6. **Aceite e Contrato Imutável**: O morador aceita digitalmente, gerando contrato auditável com hash SHA-256.
7. **Checkout Zeladoria Pay**: Geração de Pix com QR Code dinâmico e código copia-e-cola via Asaas.
8. **Execução e Evidências**: Prestador anexa evidências com selo temporal em três estágios: ANTES, DURANTE e DEPOIS.
9. **Finalização e Confirmação**: Morador inspeciona a conclusão e tem duas opções: "Está tudo certo" (libera repasse) ou "Tenho um problema" (abre disputa).
10. **Pós-Serviço & Garantia**: Acompanhamento do prazo legal de garantia (mínimo 90 dias conforme CDC), emissão de comprovante e avaliação com critérios detalhados.
