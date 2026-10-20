# Plano de Implementação — Módulo de Visitantes e Prestadores 100% Funcional

## Meta
Tornar o módulo de Visitantes e Prestadores 100% funcional, eliminando operações simuladas, QR codes estáticos e dados fixos, cobrindo integralmente os 30 requisitos da auditoria.

---

## Tarefas de Implementação

### Tarefa 1: Aperfeiçoamento das Server Actions e Regras de Negócio
- [ ] Atualizar `frontend/src/lib/actions/portaria.ts`:
  - `gateMoveAction`: Retornar `{ success: boolean, message?: string, error?: string }`.
    - Tratar concorrência (impedir duas entradas simultâneas ou saída sem entrada).
    - Validar vigência temporal (`validFrom` e `validUntil`).
    - Validar se o visitante está bloqueado.
    - Disparar notificações de entrada e saída aos moradores.
    - Gravar auditoria detalhada.
  - `createVisitAction`: Retornar `{ success: boolean, message?: string, error?: string, visit?: any }`.
    - Auto-preenchimento ou vinculação correta ao visitante existente.
    - Se morador cadastrar, auto-autorizar. Se portaria cadastrar sem morador, marcar como aguardando e notificar.
    - Se visitante estiver bloqueado, marcar como negado com a razão do bloqueio.
  - `decideVisitAction`: Retornar `{ success: boolean, message?: string, error?: string }`.
    - Validar se o anfitrião é o usuário logado ou operador autorizado.
    - Notificar o condomínio/portaria sobre a aprovação ou recusa.
  - `toggleBlockVisitorAction`: Permitir envio de justificativa customizada.
  - Criar `lookupVisitByQrOrTokenAction`: Consulta rápida para o scanner da portaria por token, nome, documento ou placa.

### Tarefa 2: Criação do Componente Interativo (`VisitantesClient`)
- [ ] Criar `frontend/src/app/painel/visitantes/visitantes-client.tsx`:
  - **Filtros e Contadores em Tempo Real**: Abas superiores ("Todos", "Aguardando", "Autorizados", "No condomínio", "Finalizados", "Negados") com contadores dinâmicos sincronizados.
  - **Barra de Busca Instantânea**: Busca por nome, documento, empresa, placa, unidade e anfitrião.
  - **Formulário com Auto-preenchimento**: Ao selecionar um visitante existente, preenche automaticamente Nome, Documento, Tipo, Empresa e Placa.
  - **Modal de Detalhes e Compartilhamento de Convite**:
    - QR Code ampliado com alta resolução.
    - Botão "Copiar Link Seguro" (`/v/[token]`).
    - Botão "Compartilhar no WhatsApp" com mensagem formatada.
    - Ação de revogar convite antes do uso.
  - **Modal da Portaria (Scanner / Token)**:
    - Entrada rápida para leitor de código de barras USB ou digitação.
    - Câmera para leitura em tempo real via navegador.
    - Conferência prévia: Nome, Empresa, Placa, Unidade, Anfitrião, Validade.
    - Botões de ação rápida: "Registrar Entrada", "Registrar Saída" e "Decisão de Acesso".
  - **Gestão de Bloqueios e Prestadores Recorrentes**:
    - Modal de justificativa para bloqueio administrativo.
    - Lista de prestadores frequentes autorizados e restrições.
  - **Histórico Responsivo**: Tabela no desktop e cards dinâmicos no mobile.

### Tarefa 3: Integração no Server Component (`page.tsx`)
- [ ] Atualizar `frontend/src/app/painel/visitantes/page.tsx`:
  - Carregamento de dados reais via `domainRequest("/painel/visitantes")`.
  - Pré-geração de QR Codes com biblioteca `qrcode`.
  - Busca de opções de unidades (`unitOptions`) e anfitriões (`peopleOptions`).
  - Renderização do `VisitantesClient`.

### Tarefa 4: Bateria de Testes Automatizados (18 Cenários Obrigatórios)
- [ ] Criar `frontend/tests/visitantes-functional.test.ts` cobrindo:
  1. Cadastro de visitante novo com persistência.
  2. Reutilização de cadastro existente com auto-preenchimento.
  3. Geração de convite e token QR Code seguro.
  4. Validação de link público compartilhado.
  5. Registro de entrada pela portaria (Check-in).
  6. Registro de saída pela portaria (Check-out).
  7. Negação de autorização.
  8. Bloqueio administrativo prevalecendo sobre convite.
  9. Expiração de validade temporal.
  10. Prestadores recorrentes com múltiplos acessos.
  11. Contadores e KPIs sincronizados.
  12. Filtros e busca rápida.
  13. Permissões RBAC e isolamento multi-condomínio.
  14. Prevenção de concorrência e duplicidade.
  15. Persistência de dados e auditoria.
  16. Responsividade (320px a 1440px+).
  17. Notificações automáticas sem duplicidade.
  18. Permissões de câmera e fallback manual.

### Tarefa 5: Validação, Auto-Commit e Relatório Técnico Completo
- [ ] Executar typecheck (`npm run typecheck --prefix frontend`).
- [ ] Executar testes (`npx tsx --conditions=react-server --import ./tests/setup.ts --test tests/visitantes-functional.test.ts`).
- [ ] Elaborar o relatório técnico final com seções A, B, C, D, E e F.
- [ ] Realizar commit automático no Git com mensagem descritiva.
