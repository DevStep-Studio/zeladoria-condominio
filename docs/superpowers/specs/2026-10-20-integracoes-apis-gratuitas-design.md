# Especificação Técnica: Integração de APIs Gratuitas e Tecnologias Open-Source

**Projeto:** Zeladoria Condomínio ([https://zeladoriacondominio.com.br/](https://zeladoriacondominio.com.br/))  
**Data:** 20/10/2026  
**Status:** Aprovado para Implementação  
**Branch:** `feature/integracoes-apis-gratuitas`  

---

## 1. Visão Geral e Princípios Fundamentais

O objetivo deste projeto é integrar profissionalmente APIs gratuitas e soluções open-source ao ecossistema do **Zeladoria Condomínio**, substituindo dados estáticos e enriquecendo fluxos reais sem gerar custos para a administração ou usuários.

### Regras Financeiras e Operacionais Inegociáveis
1. **Custo Zero:** Aderência estrita aos planos gratuitos dos provedores externos (Geoapify 3.000 créditos/dia; Resend 100 e-mails/dia e 3.000/mês; BrasilAPI e ViaCEP 100% open-source e gratuitos; PostGIS/MySQL Spatial sem custo de licença).
2. **Nenhum Cartão ou Cobrança:** Não cadastrar meios de pagamento nem habilitar upgrades automáticos ou "pay-as-you-go".
3. **Pagamentos Fora de Escopo:** Nenhuma integração com intermediadores financeiros de pagamento nesta fase.
4. **Resiliência e Fallbacks:** O sistema nunca deve travar se uma API externa estiver fora do ar ou se a cota diária for atingida. Dados informados pelo usuário são preservados e o fluxo prossegue com fallbacks operacionais.
5. **Privacidade (LGPD):** Não expor endereço residencial exato de prestadores sem permissão explícita; filtrar dados sensíveis de sócios nas consultas de CNPJ; isolar notificações estritamente por condomínio.

---

## 2. Arquitetura das 6 Integrações

```
                     ┌──────────────────────────────────────────────────┐
                     │          Zeladoria Condomínio Core               │
                     └─────────┬──────────────────────────────┬─────────┘
                               │                              │
         Frontend (Next.js 16) │                              │ Backend (Laravel 11)
                               ▼                              ▼
        ┌────────────────────────────────────┐       ┌────────────────────────────────────┐
        │ frontend/src/lib/services/         │       │ backend/app/Services/              │
        │ ├── integrations/                  │       │ ├── ProviderService.php            │
        │ │   ├── geoapify.ts (Geocoding)    │       │ ├── OperationService.php           │
        │ │   ├── brasilapi.ts (CNPJ)        │       │ └── Spatial Distance Helpers       │
        │ │   ├── resend.ts (Email)          │       └────────────────────────────────────┘
        │ │   ├── onesignal.ts (Push)        │
        │ │   └── usage-tracker.ts (Quotas)  │
        │ ├── cep.ts (ViaCEP + Geoapify)     │
        │ └── geo.ts (Spatial Distance)      │
        └────────────────────────────────────┘
```

### 2.1. Geoapify (Geocodificação e Busca de Endereços)
- **Credencial:** `3efd22bac33a489b901ed171e4ec8609`
- **Endpoints:**
  - Forward Geocoding: `https://api.geoapify.com/v1/geocode/search?text={query}&apiKey={key}&lang=pt`
  - Reverse Geocoding: `https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lon}&apiKey={key}&lang=pt`
- **Mecanismos de Otimização e Proteção:**
  - Cache em memória (LRU com TTL de 24h) para evitar requisições idênticas.
  - Debounce de 400ms em buscas digitadas.
  - Tratamento de status 429 (Too Many Requests) e timeout de 4000ms.
  - Fallback gracioso: permite ao usuário ajustar manualmente o pin no mapa sem inventar coordenadas arbitrárias.
  - Atribuição obrigatória: OpenStreetMap & Geoapify renderizada no mapa.

### 2.2. PostGIS / Spatial Equivalent (Busca Geográfica por Raio)
- **Regra Fundamental:** O raio pertence ao prestador. Um prestador só atende um condomínio se a distância entre a base do prestador e o condomínio for menor ou igual ao seu raio configurado.
- **Unidade:** Metros (com suporte a conversão intuitiva em km).
- **Presets de Raio:** 1.000m (1km), 3.000m (3km), 5.000m (5km), 10.000m (10km), 20.000m (20km), 30.000m (30km), 50.000m (50km), 100.000m (100km).
- **Implementação Geoespacial:**
  - No frontend: Cálculo esférico Haversine com alta precisão (`geo.ts`), validando `isWithinCoverage(providerLat, providerLng, providerRadiusMeters, targetLat, targetLng)`.
  - No backend: Filtro geoespacial utilizando coordenadas de referência `lat`/`lng` e raio em metros.

### 2.3. ViaCEP (Automação de Endereços)
- **Endpoint:** `https://viacep.com.br/ws/{cep}/json/`
- **Fluxo:** Validação de 8 dígitos -> Consulta com timeout de 3.5s -> Preenchimento automático (logradouro, bairro, localidade, uf) -> Chamada em cadeia ao Geoapify para obtenção de coordenadas geográficas precisas -> Fallback caso a API esteja instável.

### 2.4. BrasilAPI (Consulta Cadastral de CNPJ)
- **Endpoint:** `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
- **Fluxo:** Validação de 14 dígitos (com cálculo de dígitos verificadores) -> Consulta em tempo real -> Preenchimento de Razão Social, Nome Fantasia, CNAE principal, telefone e endereço comercial -> Filtragem estrita de dados de sócios (LGPD) -> Fallback transparente caso a empresa seja recém-aberta ou a API esteja indisponível.

### 2.5. OneSignal / Web Push (Notificações em Tempo Real)
- **Princípio:** Notificações internas no banco de dados (`notifications`) são SEMPRE criadas primeiro com persistência garantida.
- **Despacho Externo:**
  - Identificação de destinatário via `external_id` (ID interno do usuário).
  - Isolamento rigoroso por condomínio (`condo_id`).
  - Fallback inteligente para Web Push nativo VAPID ou conclusão suave sem perda de dados caso o serviço externo falhe.

### 2.6. Resend (E-mails Transacionais)
- **Credencial:** Configurada via variável de ambiente `RESEND_API_KEY` (Plano Free)
- **Remetente Padrão:** `onboarding@resend.dev`
- **Destinatário Homologado:** `ian.mellofla@gmail.com`
- **Mecanismos:**
  - Biblioteca oficial `resend`.
  - Rate limiting diário interno para respeitar o teto de 100 e-mails/dia.
  - Templates HTML responsivos com identidade visual Zeladoria (Azul `#1355FF`, fundo branco, botões de ação e rodapé seguro).

---

## 3. Painel Administrativo de Monitoramento e Consumo (`/painel/admin/integracoes`)

Painel dedicado para síndicos e administradores acompanharem a saúde e limites das integrações:
1. **Cards de Status das 6 APIs:**
   - Status operacional (`Operacional`, `Atenção`, `Limite Atingido`, `Desativado`).
   - Total de chamadas no dia.
   - Cota máxima configurada.
   - Percentual de consumo com barras de progresso dinâmicas.
   - Badges de alerta nos patamares configuráveis: 70%, 85%, 95% e 100%.
2. **Histórico de Logs Recentes:**
   - Horário, API, ação, status HTTP e tempo de resposta em milissegundos.
3. **Simulador e Teste de Conexão:**
   - Botões interativos para testar cada integração individualmente (Geoapify Geocode, ViaCEP, BrasilAPI CNPJ, Resend Email, Push Notification).
4. **Controles de Emergência:**
   - Toggles para pausar chamadas externas e ativar modo 100% offline/cache se a cota do dia estiver próxima do fim.

---

## 4. Plano de Validação e Testes
- Testes unitários e funcionais em `frontend/tests/integracoes-apis.test.ts`.
- Verificação de tipos TypeScript (`npm run typecheck`).
- Teste de boundary arquitetural (`npm run test` cobrindo `api-boundary.test.ts`).
- Validação no navegador e evidências de funcionamento.
