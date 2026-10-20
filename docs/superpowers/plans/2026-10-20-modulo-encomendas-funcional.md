# Plano de Implementação — Módulo de Encomendas e Correspondências 100% Funcional

## Meta
Transformar o módulo de Encomendas e Correspondências em uma solução 100% real, sem dados fictícios, sem QR codes decorativos e sem operações simuladas, atendendo rigorosamente aos 23 itens especificados na auditoria.

---

## Tarefas de Implementação

### Tarefa 1: Aperfeiçoamento das Server Actions e Validação Segura
- [ ] Atualizar `registerParcelAction` em `frontend/src/lib/actions/portaria.ts`:
  - Retornar `{ success: boolean, message?: string, error?: string, parcel?: any }`.
  - Validar unidade e pertinência ao condomínio (`condoId`).
  - Gerar sequência `ENC-XXXXX` e PIN aleatório seguro de 6 dígitos.
  - Disparar notificação aos moradores da unidade e registrar auditoria.
- [ ] Atualizar `deliverParcelAction` em `frontend/src/lib/actions/portaria.ts`:
  - Retornar `{ success: boolean, message?: string, error?: string }`.
  - Validar permissão `GATE`, condomínio e status `pendente` (tratamento de concorrência e entrega duplicada).
  - Validar o `pickupCode` informado; em caso de divergência, registrar log de auditoria de tentativa inválida e retornar erro legível.
  - Atualizar status para `entregue`, gravando timestamp, recebedor, documento e assinatura digital.
  - Disparar notificação de entrega confirmada aos moradores da unidade.
- [ ] Criar `lookupParcelForDeliveryAction` em `frontend/src/lib/actions/portaria.ts` para consulta rápida por PIN de 6 dígitos, código `ENC-XXXXX` ou payload de QR Code.

### Tarefa 2: Criação do Componente Cliente Interativo (`EncomendasClient`)
- [ ] Criar `frontend/src/app/painel/encomendas/encomendas-client.tsx`:
  - **Indicadores interativos (KPI Cards)**: Cards no topo clicáveis para filtrar instantaneamente entre "Aguardando retirada", "Atrasadas (7+ dias)" e "Entregues".
  - **Filtros e Busca**: Abas tipo cápsula ("Todas", "Aguardando retirada", "Atrasadas", "Entregues") com contadores dinâmicos + input de busca rápida (por código ENC, rastreio, unidade, morador ou transportadora).
  - **Botão de Ação Rápida da Portaria**: Botão destacado `[📷 Ler QR / Digitar Código]` para a portaria.
  - **Modal de Validação e Entrega da Portaria**:
    - Campo de digitação rápida do código / leitura por leitor físico.
    - Câmera QR Scanner integrada com fallback elegante.
    - Exibição de conferência: Unidade, Bloco, Morador, Local físico de prateleira e Transportadora.
    - Formulário de confirmação digital: Quem retirou, Documento, Assinatura digital.
    - Feedback de erro (já entregue, código inválido, não encontrada) e sucesso com atualização imediata da listagem.
  - **Modal do Morador (QR Code Ampliado)**:
    - QR Code de alta resolução gerado para exibição na tela do celular.
    - PIN de 6 dígitos em fonte destacada com botão de copiar.
    - Informações completas do pacote, local de guarda e orientações de retirada.
  - **Cards da Listagem**:
    - Identificador `ENC-XXXXX`, status visual, transportadora, código de rastreamento com botão de cópia rápida.
    - Horário de recebimento, responsável e local de armazenamento.
    - Botão "Registrar retirada" acessível para operadores autorizados.
  - **Histórico e Painel Lateral**:
    - Histórico responsivo (cards no mobile, tabela no desktop) com comprovação digital de entrega.
    - Painel lateral com orientações de retirada e alerta de encomendas atrasadas (+7 dias).

### Tarefa 3: Integração no Server Component (`page.tsx`)
- [ ] Atualizar `frontend/src/app/painel/encomendas/page.tsx`:
  - Manter `force-dynamic`.
  - Buscar dados reais via `domainRequest("/painel/encomendas")` com isolamento estrito por `condoId` e papel `role`.
  - Obter opções de unidades via `unitOptions(condoId)`.
  - Delegar a renderização interativa ao `EncomendasClient`, preservando o padrão visual existente.

### Tarefa 4: Bateria de Testes Automatizados (10 Cenários Obrigatórios)
- [ ] Criar `frontend/tests/encomendas-functional.test.ts` cobrindo rigorosamente:
  1. **Teste 1 — Registro de Encomenda**: Validação de unidade, geração de `ENC-XXXXX`, PIN de 6 dígitos, persistência, notificação aos moradores e auditoria.
  2. **Teste 2 — QR Code Funcional**: Geração correta do payload `ENC:<code>:<pin>`, validação pela portaria, bloqueio pós-entrega.
  3. **Teste 3 — Código Numérico de Retirada**: Validação no servidor, conferência, bloqueio de código inválido, confirmação e bloqueio de reuso.
  4. **Teste 4 — Indicadores**: Contagens de pendentes, atrasadas (7+ dias) e entregues calculadas dinamicamente.
  5. **Teste 5 — Filtros**: Comportamento das abas "Todas", "Aguardando retirada", "Atrasadas", "Entregues", contadores e busca.
  6. **Teste 6 — Permissões e Isolamento Multi-condomínio**: Bloqueio de moradores tentando registrar/entregar, restrição de visualização de unidades e isolamento entre condomínios distintos.
  7. **Teste 7 — Notificações Automáticas**: Notificação na chegada com código e prateleira; notificação na entrega com recebedor; sem duplicações.
  8. **Teste 8 — Responsividade**: Verificação de layout e ausência de overflow horizontal em 320px, 375px, 390px, 430px, 768px, 1024px e 1440px.
  9. **Teste 9 — Concorrência**: Tentativas simultâneas de retirada garantindo que apenas uma se consolida.
  10. **Teste 10 — Persistência e Integridade**: Confirmação de que os dados e eventos auditáveis persistem permanentemente.

### Tarefa 5: Validação, Auto-Commit e Relatório Técnico Completo
- [ ] Executar typecheck (`npm run typecheck --prefix frontend`).
- [ ] Executar testes (`npx tsx --conditions=react-server --import ./tests/setup.ts --test tests/encomendas-functional.test.ts`).
- [ ] Elaborar o relatório técnico final com seções A, B, C, D e E.
- [ ] Realizar commit com mensagem descritiva respeitando a regra `auto-commit.md`.
