# Modelo Financeiro, Comissões e Repasses — Zeladoria Serviços

## 1. Princípios de Segurança Financeira
1. **Dados de Cartão**: Nenhum dado de cartão de crédito/débito transita ou é armazenado nos servidores do Zeladoria. Todo processamento ocorre via tokenização PCI-DSS do gateway oficial.
2. **Separação de Valores**:
   - `laborCents`: Valor da mão de obra técnica.
   - `materialsCents`: Reembolso ou custo de materiais comprovados por nota.
   - `platformFeeCents`: Taxa de conveniência/serviço da plataforma.
   - `commissionRatePercent`: Percentual retido pela plataforma sobre a mão de obra (configurável, default 10%).

---

## 2. Modelos de Liquidação

| Modelo | Funcionamento |
| :--- | :--- |
| **Direto com o Prestador** *(Fase Inicial)* | Pagamento no local (PIX, dinheiro ou máquina do prestador). Morador apenas confirma o valor final para efeito de histórico e liberação de avaliação. |
| **Marketplace Split / Escrow** *(Fase Avançada)* | Pagamento retido na plataforma via PIX ou Cartão; o valor é liberado para a conta bancária do prestador apenas após a confirmação formal de entrega do serviço pelo morador. |

---

## 3. Extrato e Faturamento do Prestador (`/prestador/ganhos`)
- Métricas em tempo real:
  - Faturamento do Dia
  - Faturamento da Semana
  - Faturamento do Mês
  - Ticket Médio por Serviço
  - Histórico de liquidações com detalhamento de taxas retidas
