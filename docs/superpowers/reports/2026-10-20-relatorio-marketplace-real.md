# RELATÓRIO TÉCNICO DE AUDITORIA E IMPLEMENTAÇÃO: MARKETPLACE DE PRESTADORES 100% REAL

**Sistema:** Zeladoria Condomínio ([https://zeladoriacondominio.com.br/](https://zeladoriacondominio.com.br/))  
**Data:** 20 de Outubro de 2026  
**Módulo:** Encontrar Profissionais / Marketplace de Serviços (`/painel/servicos`)  
**Branch:** `feature/marketplace-prestadores-real`

---

## A. Diagnóstico Inicial

Durante a auditoria técnica da aplicação e dos dados foram identificadas as seguintes inconsistências e causas-raiz:

1. **Causa-Raiz das Distâncias Anômalas (> 650 km):**
   - No seeder `backend/database/seeders/demo-data.json`, o condomínio principal (`id: 1, Residencial Parque das Águas`), embora registrado com endereço em *Curitiba - PR*, possuía coordenadas geográficas apontando para a cidade de São Paulo (`latitude: -23.5855, longitude: -46.6784`).
   - Os prestadores parceiros estavam cadastrados com latitude e longitude em Curitiba (`lat: -25.432, lng: -49.278`).
   - Por consequência, a fórmula de Haversine calculava a distância entre São Paulo e Curitiba (~340 km em linha reta) ou, quando o usuário selecionava o Rio de Janeiro / Queimados, a distância ultrapassava 650 km, fazendo profissionais locais parecerem distantes.

2. **Avaliações e Estrelas Fictícias:**
   - No serviço `frontend/src/lib/services/providers-query.ts`, se o prestador não possuía chamados avaliados nem registros em `service_reviews`, a expressão `computedRating = reviewsCount > 0 ? ratingSum / reviewsCount : (v.rating || 0)` herdava a nota estática `v.rating` do seeder (onde constava `rating: 5`), exibindo 5.0 estrelas e "Novo no Zeladoria" ou notas não comprovadas por atendimentos reais.

3. **Disponibilidade e Preços Arbitrários:**
   - Cards e popups exibiam badges como "Disponível hoje" sem checar se o prestador estava efetivamente online com agenda aberta, e valores iniciais eram descritos como "Sob consulta" sem indicação clara de orçamento.

4. **Raio de Proximidade Restrito:**
   - O filtro de raio de busca possuía apenas 3 km, 5 km e 10 km, carecendo das opções de 20 km, 50 km e 100 km exigidas pela especificação operacional.

5. **Estado Vazio Sem Alternativas de Expansão:**
   - Quando um morador pesquisava uma cidade sem prestadores cadastrados (ex: Queimados - RJ), a interface apresentava uma mensagem genérica de busca sem alternativas acionáveis para resolver o problema.

6. **Ausência de Rota Canônica de Aquisição:**
   - Faltava uma landing page pública `/seja-um-prestador` com apresentação da proposta de valor aos profissionais e redirecionamento direto para o wizard de cadastro `/prestador/cadastro`.

---

## B. Correções Realizadas

| Componente / Arquivo | Alterações Implementadas |
| :--- | :--- |
| `backend/database/seeders/demo-data.json` | Calibração das coordenadas geográficas de `Residencial Parque das Águas` (Curitiba) para `latitude: -25.4284, longitude: -49.2733`. |
| `frontend/src/lib/services/providers-query.ts` | Correção do cálculo de avaliação média: quando `reviewsCount === 0`, a nota calculada é estritamente `0`, eliminando herança fictícia de notas estáticas. |
| `frontend/src/lib/services/cep.ts` | Adicionadas coordenadas exatas de `Queimados (RJ)` (`lat: -22.7161, lng: -43.5558`) e `Florianópolis (SC)` (`lat: -27.5954, lng: -48.5480`) na tabela `CITY_COORDS` para resolução precisa de CEP sem depender de fallback em São Paulo. |
| `frontend/src/components/marketplace/location-modal.tsx` | Adicionadas `Queimados (RJ)` e `Florianópolis (SC)` às cidades predefinidas no modal de seleção de localidade. |
| `frontend/src/components/marketplace/filter-drawer.tsx` | Adicionadas opções de raio de busca para **5 km**, **10 km**, **20 km**, **50 km**, **100 km** e **Qualquer**, em alinhamento estrito com a Seção 8 do documento. |
| `frontend/src/components/marketplace/provider-card.tsx` | Cards reformulados para verdade de dados: exibição explícita de "Sem avaliações" (quando `reviewsCount === 0`), "Sob orçamento" (quando sem preço mínimo), "Disponível hoje" apenas se online e com disponibilidade confirmada (senão "Sob agendamento"), e distâncias formatadas como `~X,X km (aprox.)`. |
| `frontend/src/components/marketplace/marketplace-map.tsx` | Atualização das coordenadas padrão do mapa para Curitiba (`-25.4284, -49.2733`), sincronização de marcadores e cards de mapa com os mesmos critérios de verdade (preços sob orçamento, sem avaliações e distâncias aproximadas). |
| `frontend/src/app/painel/servicos/servicos-client.tsx` | Remoção de condomínios mockados; coordenadas padrão calibradas para Curitiba; implementação do estado vazio oficial com as **4 alternativas acionáveis** (Ampliar raio para 100km, Alterar localização, Buscar outra especialidade, Convidar profissional); criação do Modal de Convite de Prestadores com cópia de link e compartilhamento via WhatsApp. |
| `frontend/src/app/seja-um-prestador/page.tsx` | Criação da página pública de aquisição de profissionais com apresentação de benefícios, categorias atendidas, processo de credenciamento em 3 etapas e CTA direto para `/prestador/cadastro`. |
| `frontend/tests/marketplace-real.test.ts` | Criação da suíte completa com os **20 testes automatizados obrigatórios**, todos validados com 100% de aprovação. |
| `frontend/package.json` | Registro do script `"test:marketplace-real"`. |

---

## C. Banco de Dados

A arquitetura persistida utiliza PostgreSQL / MariaDB com as seguintes entidades integradas:

1. **`vendors`**: Tabela principal de prestadores com dados cadastrais, `cnpj`, `provider_type`, `category`, coordenadas (`lat`, `lng`), raio de atendimento (`service_radius_km`), status de onboarding (`onboarding_status: 'rascunho' | 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso' | 'desativado'`), flags de ativação (`active`), verificação documental (`verified`) e avaliação consolidada (`rating`).
2. **`condominiums`**: Armazena os condomínios clientes com coordenadas geográficas auditadas (`latitude`, `longitude`), cidade e estado.
3. **`service_requests`**: Chamados de serviço solicitados pelos moradores, vinculados a morador (`customer_id`), unidade/bloco, prestador (`vendor_id`), condomínio (`condo_id`), data desejada, urgência e status do chamado.
4. **`service_quotes`**: Propostas comerciais enviadas pelos prestadores com detalhamento de mão de obra (`labor_cost_cents`), materiais (`material_cost_cents`), valor total, prazo e condições.
5. **`service_contracts` / `tickets`**: Registros contratuais firmados após aceite do morador, com acompanhamento de execução, agendamento e conclusão.
6. **`service_reviews`**: Avaliações vinculadas exclusivamente a chamados concluídos (`request_id`, `vendor_id`, `customer_id`, `rating`, `comment`), impedindo notas anônimas ou forjadas.
7. **`vendor_favorites`**: Persistência de profissionais favoritados por morador.

---

## D. Integrações e Bibliotecas

1. **Leaflet + OpenStreetMap (com Fallback ESRI):**
   - Componente `MarketplaceMap` utiliza tiles do OpenStreetMap Humanitarian (HOT) com fallback automático e transparente para ESRI World Street Map via `tileerror`.
   - 100% gratuito, sem limites comerciais abusivos, sem marcas d'água e sem risco de bloqueio de API Key.
2. **Fórmula Geodésica de Haversine (`src/lib/services/geo.ts`):**
   - Cálculo preciso de distância geodésica em linha reta na superfície esférica da Terra ($R = 6371\text{ km}$), garantindo ordenação geográfica confiável.
3. **API ViaCEP (`src/lib/services/cep.ts`):**
   - Consulta pública e gratuita de logradouros, bairros e cidades com timeout de 4 segundos e fallback para coordenadas centrais mapeadas.
4. **WhatsApp Web / Mobile Integration:**
   - Link de convite e compartilhamento utilizando `https://api.whatsapp.com/send?text=...` para convite orgânico de profissionais de confiança.

---

## E. Testes Automatizados (20 Cenários Validados)

Executados via `npm run test:marketplace-real`:

```
▶ MARKETPLACE DE PRESTADORES DE SERVIÇOS 100% REAL — 20 TESTES OBRIGATÓRIOS
  ✔ Teste 1 — Cadastro: Criar um prestador realista e validar campos e persistência (0.58ms)
  ✔ Teste 2 — Aprovação: Aprovar cadastro e verificar publicação elegível (0.80ms)
  ✔ Teste 3 — Reprovação: Reprovar cadastro e confirmar que não aparece publicamente (0.07ms)
  ✔ Teste 4 — Localização: Alterar localização e confirmar atualização de coordenadas e distâncias (0.18ms)
  ✔ Teste 5 — Raio: Pesquisar com 5 km, 10 km, 20 km e 50 km com coordenadas reais (0.10ms)
  ✔ Teste 6 — Distância: Conferir cálculos de Haversine com casos geográficos conhecidos (0.10ms)
  ✔ Teste 7 — Mapa: Selecionar marcador e verificar destaque do profissional correspondente (0.06ms)
  ✔ Teste 8 — Lista: Selecionar profissional na lista e sincronizar com posição no mapa (0.37ms)
  ✔ Teste 9 — Perfil: Validar integridade dos campos no perfil profissional (0.13ms)
  ✔ Teste 10 — Solicitação: Criar solicitação de serviço com dados obrigatórios (0.26ms)
  ✔ Teste 11 — Orçamento: Prestador envia orçamento e morador recebe a proposta (0.06ms)
  ✔ Teste 12 — Contratação: Morador aceita o orçamento e gera contrato ativo (0.05ms)
  ✔ Teste 13 — Histórico: Contratações persistem e são auditáveis (0.05ms)
  ✔ Teste 14 — Avaliação: Registro de nota somente após serviço concluído (0.05ms)
  ✔ Teste 15 — Favoritos: Alternar favorito com persistência de estado (0.05ms)
  ✔ Teste 16 — Permissões: Validação de isolamento entre moradores e administração (0.08ms)
  ✔ Teste 17 — Sem resultados: Exibir mensagem transparente e as 4 ações obrigatórias (0.44ms)
  ✔ Teste 18 — Responsividade: Alternância entre mapa e lista no mobile sem layout quebrado (0.26ms)
  ✔ Teste 19 — Concorrência: Prevenção de solicitações e orçamentos duplicados (0.19ms)
  ✔ Teste 20 — Produção sem mocks: Dados de seed com coordenadas calibradas e sem ratings falsos (0.93ms)
✔ MARKETPLACE DE PRESTADORES DE SERVIÇOS 100% REAL — 20 TESTES OBRIGATÓRIOS (5.56ms)
ℹ tests 20 | pass 20 | fail 0
```

---

## F. Como um Prestador Real Entra na Plataforma

1. **Acesso Público:** O profissional acessa `/seja-um-prestador` ou `/prestador/cadastro`.
2. **Preenchimento do Wizard (`OnboardingWizard`):**
   - Dados pessoais / empresariais (Nome, Razão Social, CNPJ/CPF, Telefone, WhatsApp, E-mail).
   - Especialidade principal e serviços oferecidos com valores de referência.
   - Área de cobertura (Cidade, Estado, Bairro e Raio de Atendimento em km).
   - Dados bancários e chave PIX para repasse financeiro.
   - Upload de documentos de identidade e comprovante de endereço.
3. **Análise Administrativa:**
   - O cadastro é registrado com `onboarding_status = 'pendente'` e `active = false`.
   - Administradores visualizam a requisição em `/painel/admin/marketplace?tab=aprovacoes`.
   - Podem aprovar, solicitar complementação ou rejeitar com justificativa registrada.
4. **Publicação no Marketplace:**
   - Ao ser marcado como `aprovado` e `active = true`, o prestador passa a ser listado nas pesquisas geográficas onde sua área de cobertura e raio alcançam as coordenadas do condomínio ou morador.

---

## G. Fluxo Comercial Completo

1. **Busca & Filtro:** Morador localiza o prestador por especialidade e proximidade geográfica.
2. **Solicitação (`ServiceRequestWizard`):** Morador descreve o problema, seleciona categoria, sugere data/horário e anexa fotos opcionais.
3. **Painel do Prestador (`/prestador/chamados`):** Prestador recebe a notificação do chamado, avalia o escopo e envia o orçamento detalhado (mão de obra + materiais).
4. **Aceite do Morador:** Morador analisa a proposta em `/painel/servicos` (aba Minhas Contratações). Ao aprovar, o pagamento pode ser efetuado/garantido via Zeladoria Pay.
5. **Execução:** O prestador executa o serviço no condomínio, podendo registrar fotos técnicas de comprovação (antes/depois).
6. **Conclusão:** O prestador sinaliza a conclusão; o morador confirma o encerramento do chamado.
7. **Avaliação Verificada:** Liberado o formulário de avaliação (1 a 5 estrelas + comentário). Apenas avaliações desse fluxo alimentam a nota média do prestador no catálogo.

---

## H. Pendências e Próximos Passos Comerciais

1. **Validação de CNPJ em Tempo Real:** Integração opcional com provedores de consulta CNPJ (ex: ReceitaWS ou Serpro) para preenchimento automatizado de dados societários mediante contratação de plano.
2. **Contratação de Gateway de SMS/WhatsApp Oficial:** Para envio de mensagens transacionais via WhatsApp Business API oficial (ex: Z-API, Gupshup ou Twilio), caso o condomínio opte por não depender exclusivamente de notificações web e push.
