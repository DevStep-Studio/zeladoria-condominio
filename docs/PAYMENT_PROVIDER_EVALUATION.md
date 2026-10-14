# Avaliação Técnica de Provedores de Pagamento (PSPs) para Marketplace
**Projeto:** Zeladoria Condomínio — Módulo Zeladoria Pay  
**Data:** 14/10/2026  
**Autores:** Arquiteto de Software & Especialista em Pagamentos / Fintech

---

## 1. Visão Geral e Critérios Regulatórios

O Zeladoria Pay é uma infraestrutura de pagamentos integrada ao marketplace de serviços residenciais em condomínios.
Por conformidade com as normas do Banco Central do Brasil (Resoluções BCB 80 e 150) e boas práticas de arranjos de pagamento:

1. **A Zeladoria NÃO realiza custódia financeira informal**, não retém saldos em conta bancária operacional própria e não atua como instituição de pagamento (IP) não homologada.
2. Todo o fluxo de **Split de Pagamentos**, **Recebedores**, **KYC** e **Liquidação** deve ser operado através de um PSP homologado.
3. Repasses condicionados (Zeladoria Protege) devem ser operados dentro das capacidades técnicas reais da API do PSP, sem simulação artificial de escrow bancário.

---

## 2. Matriz Comparativa Oficial (18 Critérios Técnicos)

| # | Critério Técnico | ASAAS (Referência MVP) | PAGAR.ME (Stone Co.) | MERCADO PAGO |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Onboarding / KYC Prestadores** | Nativo via API de Subcontas (`/v3/accounts`). Suporta envio de documentos e webhook de status. | Nativo via API de Recebedores (`/recipients`). KYC completo com dados bancários. | Exige fluxo OAuth individual onde o vendedor conecta sua conta MP existente. |
| **2** | **Pessoa Física (CPF) e Jurídica (CNPJ)** | Suporte completo a autônomos (CPF) e MEI/LTDA (CNPJ). | Suporte a PF e PJ. | Suporte a PF e PJ (com conta Mercado Pago ativa). |
| **3** | **Split de Pagamentos** | Split nativo entre carteiras (`walletId`) por valor fixo ou percentual na criação da cobrança. | Split nativo e robusto entre `recipients` na criação da transação/ordem. | Split 1:1 via Marketplace OAuth e Checkout Pro / Transparente. |
| **4** | **PIX** | QR Code dinâmico instantâneo, Copia e Cola padronizado, webhook em tempo real. | Pix dinâmico via API com conciliação automática. | Pix dinâmico rápido com QR Code e Copia e Cola. |
| **5** | **Cartão de Crédito** | Tokenização via API, Checkout transparente e links de fatura seguros. | Tokenização avançada com Stone CardSDK, Hosted Fields e iFrame PCI nível 1. | Tokenização com MercadoPago.js e Checkout Pro/Transparente. |
| **6** | **Parcelamento** | Suporte a 1x até 12x com repasse das taxas ao cliente ou prestador configurável. | Parcelamento flexível com parametrização de juros e tabela de antecipação. | Parcelamento tradicional do ecossistema Mercado Pago. |
| **7** | **Débito Online** | Não é o foco principal; foco em Pix e Cartão de Crédito. | Suporta débito via 3DS (3D Secure). | Débito virtual Caixa e cartões com 3DS. |
| **8** | **Gestão de Recebedores** | Subcontas completas com saldo, chave Pix e transferência bancária própria. | `recipients` com contas bancárias cadastradas e regras de transferência automática. | Cada prestador precisa de conta Mercado Pago vinculada. |
| **9** | **Política de Chargeback** | Webhook de chargeback; permite definir quem assume a responsabilidade. | Parametrização explícita de `chargeback_liable` no split da transação. | Chargeback gerenciado pelo Mercado Pago; regras da conta vendedor. |
| **10** | **Reembolso (Total e Parcial)** | Suporta estorno total e parcial via API (`/payments/{id}/refund`). | Suporta estorno total e parcial com devolução proporcional de split. | Suporta estorno via API com reversão da taxa de aplicação. |
| **11** | **Antecipação de Recebíveis** | Disponível no painel da subconta ou via API para prestadores elegíveis. | Módulo nativo de antecipação pontual ou automática para recebedores. | Antecipação nativa segundo termos do Mercado Pago. |
| **12** | **Prazo de Repasse** | D+1 para Pix; D+30 para Cartão (ou D+2 mediante taxa de antecipação). | D+1 para Pix; D+30 para Cartão de Crédito (customizável no contrato). | D+0 a D+14 conforme taxa escolhida pelo vendedor no painel MP. |
| **13** | **Repasse Condicionado (Hold)** | Suporta retenção via saldo da subconta com bloqueio/transferência programada. | Suporta repasses manuais desativando transferência automática (`transfer_enabled: false`). | Dificuldade de retenção arbitrária sem integração customizada de autorização. |
| **14** | **Subcontas vs OAuth** | Modelo de **Subcontas Transparentes**: a plataforma gerencia o onboarding direto na API. | Modelo de **Recebedores Transparentes**: cadastro transparente sem forçar saída do app. | Modelo de **OAuth Obrigatório**: prestador precisa sair e autorizar conta Mercado Pago. |
| **15** | **Webhooks & Idempotência** | Webhook token configurável, assinaturas e eventos detalhados (`PAYMENT_CONFIRMED`, etc.). | Assinatura HMAC no header `X-Hub-Signature`, webhooks ricos em JSON. | Webhooks de tópicos (`payment`, `merchant_order`) com validação de secret. |
| **16** | **Sandbox / Ambiente de Testes** | Excelente sandbox (`sandbox.asaas.com`) com geração de chaves instantânea e simulações. | Sandbox completo via Dashboard Stone / Pagar.me com cartões de teste. | Sandbox via credenciais de teste, porém dependente de contas vinculadas de teste. |
| **17** | **Custos Médios de Mercado** | Pix: ~R$ 0,99 a R$ 1,99 fixo por transação.<br>Cartão: ~1,99% a 2,99% + R$ 0,49. | Pix: ~0,99% a 1,19% ou fixo sob volume.<br>Cartão: ~2,49% a 3,49% + R$ 0,50. | Pix: ~0,99%.<br>Cartão: ~3,99% a 4,99% conforme prazo de recebimento. |
| **18** | **Aderência ao Modelo Zeladoria** | **Altíssima**: API focada em prestadores de serviço autônomos e gestão simples de subcontas. | **Alta**: Robusto para grandes volumes e regras avançadas de risco Stone. | **Média**: Menos transparente devido ao atrito do OAuth para o prestador. |

---

## 3. Análise Detalhada dos 3 Candidatos

### 3.1. Asaas (Recomendado para o MVP & Fase 1)
- **Vantagens Principais:**
  1. Experiência de onboarding sem fricção para pessoas físicas (autônomos) e MEIs sem exigir que tenham conta prévia em outro banco.
  2. O prestador pode cadastrar sua chave Pix de qualquer banco existente para receber as transferências das subcontas.
  3. Suporte robusto a Split com parâmetros diretos de valor fixo e percentual.
  4. Facilidade de criação de cobranças Pix com BR Code padronizado e QR Code SVG/PNG nativo.
  5. Documentação em português clara, com SDK e Webhooks objetivos.

### 3.2. Pagar.me (Stone Co.) (Excelente para Escala e Grandes Volumes)
- **Vantagens Principais:**
  1. Referência nacional em split complexo e liquidação financeira multirecebedor.
  2. Suporte avançado à definição de responsabilidade por chargeback (`chargeback_liable`) e taxas de processamento (`fee_payer`).
  3. Hosted fields e checkout PCI Nível 1.
- **Ressalvas:**
  - Contrato comercial PSP pode exigir homologação prévia e volume mínimo de faturamento para certas funcionalidades de split avançado.

### 3.3. Mercado Pago (Viável, mas com atrito no Onboarding)
- **Vantagens Principais:**
  1. Marca reconhecida nacionalmente com Checkout Pro familiar.
  2. Pix dinâmico estável.
- **Ressalvas:**
  - O prestador é obrigado a criar/vincular uma conta Mercado Pago através de fluxo OAuth externo, o que gera atrito de conversão no aplicativo Zeladoria Condomínio.

---

## 4. Decisão de Arquitetura

1. **Driver Principal (Fase 1 - MVP):** `AsaasGatewayAdapter` selecionado como implementação padrão.
2. **Abstração Canônica:** A interface [`PaymentGatewayAdapter`](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/services/payments/types.ts) garante que nenhuma regra de negócio do Zeladoria acesse endpoints proprietários diretamente.
3. **Plano de Expansão:** Quando houver necessidade de migração para Pagar.me ou Mercado Pago, basta criar a classe correspondente (`PagarmeGatewayAdapter`) e registrá-la no [`gateway-factory.ts`](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/services/payments/gateway-factory.ts), sem alterações no schema ou nas regras de contratação do condomínio.
