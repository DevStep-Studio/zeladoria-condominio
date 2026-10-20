# PLANO DE IMPLEMENTAÇÃO: MARKETPLACE DE PRESTADORES 100% REAL

**Projeto:** Zeladoria Condomínio  
**Data:** 20 de Outubro de 2026  
**Branch:** `feature/marketplace-prestadores-real`  
**Referência da Especificação:** `docs/superpowers/specs/2026-10-20-marketplace-prestadores-real-design.md`

---

## 1. Visão Geral e Objetivos

Eliminar completamente a dependência de prestadores, dados geográficos e avaliações fictícias no módulo **Encontrar Profissionais** (`/painel/servicos`). Tornar o marketplace 100% operacional com dados reais, persistidos e auditáveis:
- Corrigir a causa-raiz das distâncias anômalas (> 650 km): condomínio em Curitiba possuía coordenadas em São Paulo no seeder e os prestadores estavam em Curitiba.
- Corrigir cálculo de notas: prestadores sem avaliação devem exibir "Sem avaliações", e não nota 5.0 padrão.
- Corrigir preços: prestadores sem tabela devem exibir "Sob orçamento", e não preços fictícios.
- Raio de busca em 5 faixas reais: 5 km, 10 km, 20 km, 50 km, 100 km.
- Estado vazio autêntico: quando não há prestadores em uma localidade (ex: Queimados - RJ), exibir mensagem clara com 4 ações (ampliar raio, alterar localização, buscar outra especialidade, convidar prestador).
- Rota canônica pública `/seja-um-prestador` direcionando para `/prestador/cadastro`.
- Criar suíte de testes com os 20 cenários obrigatórios especificados.
- Elaborar relatório técnico de auditoria e implementação.

---

## 2. Etapas de Execução

### Etapa 1: Calibração de Dados de Semente e Coordenadas
- **Arquivo:** `backend/database/seeders/demo-data.json`
- **Ações:**
  - Ajustar condomínio `1` (`Residencial Parque das Águas` - Curitiba) para coordenadas reais de Curitiba: `latitude: -25.4284`, `longitude: -49.2733`.
  - Garantir coordenadas exatas para cidades suportadas (São Paulo, Curitiba, Rio de Janeiro, Florianópolis, Queimados).
  - Limpar flags fictícias de avaliações que não possuam registros de reviews vinculados.

### Etapa 2: Camada de Consulta e Dados do Marketplace
- **Arquivo:** `frontend/src/lib/services/providers-query.ts`
- **Ações:**
  - Garantir que se `reviewsCount === 0`, a nota não herde 5.0.
  - Distância calculada exclusivamente com base nas coordenadas ativas do cliente e nas coordenadas do prestador ou base comercial declarada.

### Etapa 3: Componentes de Exibição de Cards e Filtros
- **Arquivos:**
  - `frontend/src/components/marketplace/provider-card.tsx`
  - `frontend/src/components/marketplace/filter-drawer.tsx`
- **Ações:**
  - No `provider-card.tsx`:
    - Formatar distância como `~X,X km (aprox.)`.
    - Se sem avaliações, exibir badge ou texto "Sem avaliações" (sem estrelas cheias 5.0).
    - Se preço ausente, exibir "Sob orçamento".
    - Exibir "Disponível hoje" apenas se `isOnline` e `availableNow` forem verdadeiros; caso contrário "Sob agendamento" ou "Atende a região".
  - No `filter-drawer.tsx`:
    - Adicionar botões de raio para 5 km, 10 km, 20 km, 50 km, 100 km e Qualquer raio.

### Etapa 4: Tela Principal do Marketplace e Estado Vazio
- **Arquivo:** `frontend/src/app/painel/servicos/servicos-client.tsx`
- **Ações:**
  - Remover dados mockados de condomínios que mascaravam as coordenadas.
  - Implementar cálculo dinâmico de distância em relação à localização atual (GPS ou condomínio selecionado).
  - Implementar o componente de estado vazio completo com as 4 ações obrigatórias quando nenhum prestador for encontrado na região:
    1. Ampliar raio de busca (ajustar raio para 50km/100km).
    2. Alterar localização (abrir modal de endereço/CEP/GPS).
    3. Buscar outra especialidade (resetar filtro de categoria).
    4. Convidar profissional (abrir modal de convite ou copiar link de cadastro).

### Etapa 5: Rota Pública `/seja-um-prestador`
- **Arquivo:** `frontend/src/app/seja-um-prestador/page.tsx`
- **Ações:**
  - Criar página que introduz os benefícios para o prestador e redireciona ou inclui botão direto para `/prestador/cadastro`.

### Etapa 6: Suíte de Testes Automatizados (20 Cenários)
- **Arquivo:** `frontend/tests/marketplace-real.test.ts`
- **Ações:**
  - Cobrir integralmente os 20 cenários obrigatórios da especificação:
    1. Cadastro de prestador e persistência
    2. Aprovação e publicação
    3. Reprovação e ocultação
    4. Geolocalização (GPS e CEP) e atualização conjunta
    5. Raio de busca (5km, 10km, 20km, 50km, 100km)
    6. Distância precisa (Haversine sem distâncias irreais)
    7. Mapa interativo (marcador destaca lista)
    8. Lista interativa (card destaca marcador)
    9. Perfil completo com dados autênticos
    10. Solicitação de serviço com dados válidos
    11. Orçamento enviado pelo prestador
    12. Contratação e confirmação
    13. Histórico e permanência em "Minhas contratações"
    14. Avaliações reais após conclusão
    15. Favoritos com persistência
    16. Permissões e RBAC
    17. Estado vazio informativo (4 ações)
    18. Responsividade (mobile alternando lista/mapa)
    19. Concorrência e prevenção de duplicidades
    20. Produção sem mocks e integridade de dados

### Etapa 7: Validação, Tipagem e Build
- Executar testes automatizados.
- Executar `npm run typecheck` e `npm run build`.

### Etapa 8: Relatório Técnico de Entrega e Auto-Commit
- Criar `docs/superpowers/reports/2026-10-20-relatorio-marketplace-real.md`.
- Efetuar commit com mensagem descritiva no padrão convencional.
