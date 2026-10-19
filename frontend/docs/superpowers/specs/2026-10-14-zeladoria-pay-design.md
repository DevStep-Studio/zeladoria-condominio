# Especificação Técnica — Zeladoria Pay

**Data:** 14 de Outubro de 2026  
**Status:** Aprovado para Implementação  
**Sub-sistema:** Zeladoria Pay (Módulo Zeladoria Serviços)  
**Autor:** Antigravity AI & Arquitetura de Software  

---

## 1. Visão Geral e Objetivos

O **Zeladoria Pay** é o subsistema transacional e financeiro do condomínio, projetado para permitir que todo o ciclo de contratação de serviços residenciais aconteça com segurança de ponta a ponta dentro da plataforma.

### O morador consegue:
1. Solicitar serviço residencial sob demanda ou por orçamento;
2. Receber do prestador resposta de vistoria técnica (**Gratuita** ou **Paga**);
3. Se paga, pagar a vistoria com reserva temporária de horário antes da visita;
4. Receber o prestador para diagnóstico no imóvel;
5. Receber proposta digital completa (mão de obra + peças + garantia);
6. Aceitar a proposta e firmar o contrato digital de intermediação;
7. Pagar o serviço principal online via Pix / Cartão protegido pelo **Zeladoria Protege**;
8. Acompanhar a execução em tempo real;
9. Confirmar a conclusão ou abrir contestação para mediação;
10. Avaliar com critérios múltiplos e obter o certificado de garantia.

### O prestador consegue:
1. Receber chamados em tempo real;
2. Informar se a vistoria é gratuita ou paga (com valor, duração e slots de horário);
3. Executar vistorias confirmadas;
4. Registrar laudo diagnóstico com fotos no aplicativo;
5. Montar propostas discriminadas e prazos;
6. Iniciar serviços garantidos por pagamento já retido no PSP parceiro;
7. Finalizar serviço com registro de evidências da entrega;
8. Receber o repasse líquido automático em sua subconta bancária/wallet via split do PSP.

---

## 2. Regra de Ouro: Proibição de Custódia Informal (Zero Escrow Local)

1. **A Zeladoria NÃO é instituição financeira nem carteira informal.**
2. É expressamente proibido reter fundos de usuários em conta bancária própria da plataforma sem licença do Bacen.
3. Não criar saldos fictícios nem balanços virtuais de crédito/débito.
4. Todo o fluxo de cobrança, divisão de valores (split) e repasses aos prestadores é processado por um **PSP homologado** (Provedor de Serviços de Pagamento).
5. O driver prioritário de referência adotado é o **Asaas** (subcontas/wallets e split nativo), projetado sob uma **camada de abstração (`PaymentGatewayAdapter`)** para permitir a troca ou acréscimo de Pagar.me ou Mercado Pago sem quebrar regras de negócio.

---

## 3. Não Confundir Dois Pagamentos (Isolamento Absoluto)

Um chamado (`service_requests`) possui potencialmente **dois eventos financeiros independentes**:

```
                              CHAMADO (SRV-YYYY-XXXX)
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
[PAGAMENTO A: VISTORIA TÉCNICA]                          [PAGAMENTO B: SERVIÇO PRINCIPAL]
• Antecedência: ANTES da visita ao local                 • Momento: SOMENTE após vistoria + proposta aceita
• Opção 1: Gratuita (R$ 0,00) → status VISTORIA_AGENDADA  • Valor: Mão de obra + Materiais
  (Nenhum checkout é criado)                             • Split: Líquido do prestador + Comissão Zeladoria
• Opção 2: Paga (Ex: R$ 80,00)                           • Retenção: Condicionado à entrega (Zeladoria Protege)
  - Reserva de horário (Hold de 10 min)                  • Repasse: Liberado na confirmação "Tudo Certo"
  - Pix / Cartão Asaas gerado (Order 'vistoria')         • Contestação: Janela de 48h para mediação
  - VISTORIA_CONFIRMADA após pagamento aprovado
```

Se o serviço principal não for contratado ou o orçamento for recusado, o Pagamento A da vistoria permanece liquidado e o prestador devidamente remunerado pelo deslocamento e diagnóstico técnico já realizados.

---

## 4. Reserva Temporária de Horário (Slot Hold)

- Durante o checkout de vistoria paga, o horário escolhido pelo morador recebe um bloqueio temporário (*lease*) configurável (padrão: **10 minutos**).
- O campo `hold_expires_at` é registrado na vistoria, e a cobrança Pix no PSP é emitida com tempo de expiração correspondente (600 segundos).
- Caso o pagamento não seja concluído em 10 minutos, o bloqueio expira automaticamente e o horário volta a ficar livre para os demais moradores, sem necessidade de rotinas de limpeza pesadas.

---

## 5. "Zeladoria Protege" — Segurança Operacional e Repasse Condicionado

A segurança da transação é tratada estritamente como **proteção operacional e contratual** (sem uso indevido do termo "seguro" regulado pela SUSEP):

1. **Prestador Verificado:** Onboarding com conferência de CPF/CNPJ, documentos e histórico.
2. **Proposta Registrada:** Registro digital congelado com escopo, materiais, prazo e fotos de antes.
3. **Evidências Fotográficas:** Fotos do problema (na vistoria) e da entrega realizada (na finalização).
4. **Garantia Informada:** Prazo de garantia formal informado pelo prestador (mínimo legal de 90 dias - CDC).
5. **Pagamento Protegido:** Valor retido no parceiro financeiro (PSP) enquanto o serviço é executado.
6. **Repasse Condicionado:** Prestador recebe após confirmação do morador ("Tudo Certo") ou decurso de prazo seguro (72h) sem contestação.
7. **Mediação de Disputas:** Caso haja contestação dentro de 48h, a disputa entra na mesa de mediação do síndico/administrador, mantendo o repasse bloqueado.

---

## 6. Comissão Configurável (Sem Hardcode)

- Taxa padrão inicial de 10% para intermediação da plataforma.
- A taxa é dinâmica e gerenciada pela tabela `marketplace_settings` no banco de dados.
- O Administrador/Síndico pode customizar a taxa geral ou por condomínio através do painel.

---

## 7. Modelagem do Banco de Dados (Schema PostgreSQL / Drizzle)

1. `payment_orders`: Tabela canônica de ordens de pagamento (purpose: `'vistoria'` | `'servico'`).
2. `payment_recipients`: Vínculo do prestador (`vendors.id`) com a subconta/wallet no PSP (`asaas`).
3. `service_inspections`: Gestão da vistoria técnica (gratuita vs paga, slots disponíveis, hold temporário, laudo e fotos).
4. `marketplace_settings`: Comissão configurável, prazos de hold, janela de contestação e regras de auto-liberação.
5. `payment_webhook_events`: Tabela de idempotência estrita para webhooks do gateway.
6. Enriquecimentos em `service_requests` e `service_quotes`.
