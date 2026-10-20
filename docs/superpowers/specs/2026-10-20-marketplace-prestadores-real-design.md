# DESIGN SPEC: MARKETPLACE DE PRESTADORES DE SERVIÇOS 100% REAL

**Sistema:** Zeladoria Condomínio ([https://zeladoriacondominio.com.br/](https://zeladoriacondominio.com.br/))  
**Data:** 20 de Outubro de 2026  
**Objetivo:** Eliminar prestadores e avaliações fictícias, calibrar cálculos de geolocalização e proximidade, integrar mapa e lista, e garantir fluxo comercial completo (cadastro -> moderação administrativa -> busca geográfica -> solicitação -> orçamento -> contratação -> conclusão -> avaliação).

---

## 1. Problema Diagnosticado

1. **Inconsistência de Coordenadas de Semente (Seeders):**
   - O condomínio principal (`id: 1, Residencial Parque das Águas`) em `backend/database/seeders/demo-data.json` possuía cidade cadastrada como *"Curitiba - PR"*, mas suas coordenadas geográficas estavam apontando para São Paulo (`latitude: -23.5855, longitude: -46.6784`).
   - Os prestadores foram cadastrados em Curitiba (`lat: -25.432, lng: -49.278`).
   - Consequência: distâncias calculadas entre o condomínio e os prestadores locais resultavam em 350 km a 670 km!
2. **Avaliações e Notas Padrão Fictícias:**
   - Prestadores sem avaliações reais recebiam nota padrão de `5.0` devido ao fallback `computedRating = v.rating || 5`.
   - Cards exibiam "Disponível hoje" e preços mesmo quando o prestador não havia definido disponibilidade ou tabela de valores.
3. **Ausência de Raio de Busca Padronizado:**
   - O filtro de raio possuía apenas 3km, 5km e 10km, sem as faixas de 20km, 50km e 100km exigidas pela especificação.
4. **Estado Vazio Inadequado:**
   - Quando não há prestadores em uma localidade (ex: Queimados - RJ), a tela exibia uma mensagem genérica de busca em vez de orientar o usuário com ações concretas (ampliar raio, alterar localidade, buscar outra especialidade, convidar prestador).
5. **Necessidade de Rota de Acesso Público:**
   - Garantir que `/seja-um-prestador` aponte perfeitamente para `/prestador/cadastro` sem loops de redirecionamento.

---

## 2. Princípios e Regras Inegociáveis

1. **Zero Mocks em Produção:** Nenhum profissional fictício, nota inventada ou preço simulado. Se não houver prestadores na região, a interface apresenta o estado vazio transparente com ações de expansão.
2. **Precisão Geográfica Real (Fórmula de Haversine):**
   - Coordenadas do condomínio e dos prestadores calibradas.
   - Distâncias formatadas como aproximações em linha reta (`~X,X km (aprox.)`).
   - Sem coordenadas conhecidas, exibe "Atende a região" ou "Consulte deslocamento", jamais `0 km` ou distâncias absurdas.
3. **Transparência de Avaliações:**
   - Prestadores sem avaliações são marcados explicitamente como "Sem avaliações" ou "Novo parceiro".
   - Avaliações só podem ser geradas a partir de atendimentos concluídos na plataforma.
4. **Preço e Disponibilidade Reais:**
   - Preço exibido somente quando informado pelo prestador (`startingPriceCents > 0`). Caso contrário, exibir "Sob orçamento".
   - "Disponível hoje" apenas se `isOnline` e `availableNow` estiverem confirmados.
5. **Aprovação e Moderação:**
   - Somente prestadores com `onboarding_status === 'aprovado'` e `active === true` são listados no marketplace para moradores.
   - Administradores têm controle total de aprovação, suspensão e reativação.
6. **Ciclo Completo Integrado:**
   - Morador solicita -> Chamado criado em `service_requests` -> Prestador recebe no painel `/prestador/chamados` -> Prestador envia proposta -> Morador aceita e paga/aprova em `/painel/servicos` -> Serviço executado e concluído -> Avaliação registrada.

---

## 3. Arquitetura Técnica e Componentes

### A. Backend e Dados (`backend/`)
- Correção de coordenadas dos condomínios em `backend/database/seeders/demo-data.json`:
  - `Curitiba`: `lat: -25.4284, lng: -49.2733`
  - `São Paulo`: `lat: -23.5505, lng: -46.6333`
  - `Queimados / Baixada Fluminense`: `lat: -22.7161, lng: -43.5558`
  - `Florianópolis`: `lat: -27.5954, lng: -48.5480`
- `ServiceController::providers`: Garante filtragem de prestadores com `onboarding_status = 'aprovado'` e `active = true`.

### B. Frontend e Marketplace (`frontend/`)
- `frontend/src/lib/services/providers-query.ts`:
  - Cálculo de rating ponderado estrito: se `reviewsCount === 0`, `rating` é 0 e marcado como sem avaliações.
  - Distância calculada dinamicamente entre coordenadas do prestador e a localização ativa do cliente.
- `frontend/src/app/painel/servicos/servicos-client.tsx`:
  - Estado dinâmico de localização (GPS nativo via `navigator.geolocation`, CEP via `lookupCep`, condomínio do usuário ou cidades predefinidas com coordenadas exatas).
  - Raio de busca ajustável: `5 km`, `10 km`, `20 km`, `50 km`, `100 km`, `Qualquer`.
  - Filtro geográfico inteligente: prestadores fora da região de atendimento não aparecem como opções locais.
  - Estado vazio com as 4 alternativas obrigatórias:
    1. *Ampliar o raio de busca*
    2. *Alterar a localização*
    3. *Buscar outra especialidade*
    4. *Convidar um profissional para se cadastrar*
- `frontend/src/components/marketplace/provider-card.tsx`:
  - Exibição de "Sem avaliações", "Sob orçamento", "Atende a região".
  - Distâncias formatadas como `~X,X km (aprox.)`.
- `frontend/src/components/marketplace/filter-drawer.tsx`:
  - Opções de raio: 5km, 10km, 20km, 50km, 100km.
- `frontend/src/app/seja-um-prestador/page.tsx`:
  - Rota canônica pública de aquisição de profissionais redirecionando para `/prestador/cadastro`.

---

## 4. Plano de Validação e Testes Automatizados (20 Cenários)

1. **Teste 1 — Cadastro:** Criação e persistência de prestador.
2. **Teste 2 — Aprovação:** Habilitação e publicação na região.
3. **Teste 3 — Reprovação:** Rejeição impede exibição pública.
4. **Teste 4 — Localização:** Alteração de endereço/GPS atualiza mapa e lista.
5. **Teste 5 — Raio de busca:** Pesquisa com 5km, 10km, 20km, 50km e 100km.
6. **Teste 6 — Distâncias:** Cálculo de Haversine preciso entre coordenadas reais.
7. **Teste 7 — Mapa:** Seleção de marcador destaca o prestador na lista.
8. **Teste 8 — Lista:** Seleção de card centraliza e destaca marcador no mapa.
9. **Teste 9 — Perfil:** Exibição completa de serviços, bio, portfólio e avaliações.
10. **Teste 10 — Solicitação:** Envio de solicitação e persistência de chamado.
11. **Teste 11 — Orçamento:** Envio de orçamento pelo prestador e recebimento pelo cliente.
12. **Teste 12 — Contratação:** Aprovação de proposta e início do atendimento.
13. **Teste 13 — Histórico:** Persistência em "Minhas contratações".
14. **Teste 14 — Avaliação:** Registro de nota e comentário somente após conclusão.
15. **Teste 15 — Favoritos:** Adicionar e remover dos favoritos com persistência.
16. **Teste 16 — Permissões & RBAC:** Isolamento multi-condomínio e regras de perfil.
17. **Teste 17 — Sem resultados:** Estado vazio com as 4 ações obrigatórias.
18. **Teste 18 — Responsividade:** Suporte a 320px até 1920px (alternância mapa/lista no mobile).
19. **Teste 19 — Concorrência:** Prevenção de solicitações e pagamentos duplicados.
20. **Teste 20 — Produção sem Mocks:** Ausência de dados fictícios em produção.
