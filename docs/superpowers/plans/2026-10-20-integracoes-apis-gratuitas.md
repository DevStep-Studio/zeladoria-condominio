# Plano de Implementação: APIs Gratuitas e Integrações Reais

**Projeto:** Zeladoria Condomínio  
**Data:** 20/10/2026  
**Status:** Em Execução  
**Branch:** `feature/integracoes-apis-gratuitas`  

---

## Metodologia de Execução

O trabalho está estruturado em 9 fases incrementais, com validação de código a cada etapa para garantir estabilidade e ausência de regressões:

### Fase 1: Diagnóstico e Preparação de Ambiente
- [x] Auditoria de arquitetura: Frontend Next.js 16 + Laravel 11 Backend + MySQL.
- [x] Confirmação de regras de boundary: Frontend nunca acessa banco diretamente.
- [x] Confirmação de branch de trabalho (`feature/integracoes-apis-gratuitas`).
- [x] Instalação do SDK `resend` ou implementação do client HTTP oficial.

### Fase 2: Serviços Centrais de Integração (`frontend/src/lib/services/integrations/`)
- [ ] Criar `usage-tracker.ts`: Registro de telemetria, contadores de cota diária/mensal, verificação de limites (70%, 85%, 95%, 100%) e modo fallback/offline.
- [ ] Criar `geoapify.ts`: Geocodificação direta e reversa, cache local em memória com TTL, tratamento de 429 e debounce.
- [ ] Criar `brasilapi.ts`: Consulta de CNPJ, validação de dígitos verificadores, filtragem de dados sensíveis (LGPD) e fallback transparente.
- [ ] Criar `resend.ts`: Envio de e-mails transacionais via API Resend, controle de cota (100/dia, 3.000/mês), templates em HTML com design profissional Zeladoria.
- [ ] Criar `onesignal.ts`: Integração com API REST OneSignal vinculada a `external_id` de usuários com fallback para Web Push e notificações internas.

### Fase 3: Aprimoramento de Endereços e Coordenadas (ViaCEP + Geoapify)
- [ ] Atualizar `frontend/src/lib/services/cep.ts`: Integrar busca no ViaCEP com geocodificação automática via Geoapify para obtenção de coordenadas reais.
- [ ] Garantir que falhas de rede preservem dados preenchidos manualmente pelo usuário.

### Fase 4: Cobertura Geoespacial de Prestadores (Spatial / PostGIS Equivalent)
- [ ] Atualizar `frontend/src/lib/services/geo.ts`: Cálculos esféricos em metros e quilômetros, função `isWithinCoverageRadius`, presets de raio (1.000m a 100.000m).
- [ ] Atualizar `frontend/src/components/map/provider-coverage-map.tsx`: Suporte a presets rápidos de raio em metros/km, atribuição visual explícita a Geoapify & OpenStreetMap.
- [ ] Atualizar `frontend/src/app/painel/servicos/servicos-client.tsx`: Aplicar regra estrita onde o raio de atendimento pertence ao prestador.

### Fase 5: Cadastro e Onboarding do Prestador (`onboarding-wizard.tsx`)
- [ ] Etapa 3 (Empresa): Adicionar botão "Consultar CNPJ" via BrasilAPI, preenchendo automaticamente Razão Social, Nome Fantasia e Endereço Comercial.
- [ ] Etapa 6 (Área de Atendimento): Conectar busca de CEP integrada ao Geoapify, sincronizando coordenadas com o mapa e exibindo o círculo em metros.

### Fase 6: Painel Administrativo de Monitoramento (`/painel/admin/integracoes`)
- [ ] Criar página do dashboard com cards de status das 6 integrações.
- [ ] Exibir barras de progresso de consumo, contadores diários e badges de alerta de cota (70%, 85%, 95%, 100%).
- [ ] Disponibilizar botões de teste interativo para cada serviço (testar CEP, testar CNPJ, testar Geocodificação, testar E-mail, testar Notificação).
- [ ] Adicionar botão de alternância (toggle) para desativar temporariamente chamadas externas sem afetar o sistema.

### Fase 7: Suíte de Testes Automatizados
- [ ] Criar arquivo de teste `frontend/tests/integracoes-apis.test.ts` cobrindo:
  - Consulta ViaCEP e tratamento de CEP inválido/inexistente.
  - Geocodificação Geoapify com cache e tratamento de limites.
  - Consulta BrasilAPI com validação e filtragem LGPD.
  - Cálculo de raio geoespacial em metros (prestador dentro do raio vs fora do raio).
  - Controle de cotas e alertas de limite do `usage-tracker`.
  - Envio e formatação de e-mails transacionais via Resend.
  - Persistência e despacho de notificações.

### Fase 8: Validação Técnica Completa
- [ ] Executar `npm run typecheck` no frontend.
- [ ] Executar suíte de testes `npm test` garantindo integridade de boundary.
- [ ] Testar rotas no navegador e capturar evidências.

### Fase 9: Relatório Final e Auto-Commit
- [ ] Criar relatório detalhado em `docs/superpowers/reports/2026-10-20-relatorio-integracoes-apis.md`.
- [ ] Atualizar `.env.example` com todas as novas variáveis e documentação de obtenção de chaves.
- [ ] Executar git commit conforme `.gemini/config/rules/auto-commit.md`.
