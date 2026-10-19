# Motor de Matching e Geolocalização — Zeladoria Serviços

## 1. Princípios de Matching Operacional

1. **Isolamento e Segurança de Dados**:
   - As coordenadas GPS exatas da residência do prestador **nunca** são expostas publicamente no mapa.
   - O condomínio atua como ponto âncora central. Os prestadores são mapeados por **raio de cobertura homologado** (em quilômetros a partir de sua base cadastrada) até o condomínio.
   - A unidade/apartamento do morador só é revelada ao prestador após o aceite formal do chamado.

2. **Matching Progressivo em Ondas**:
   - **Onda 1 (Imediata)**: Prestadores com status `isOnline = true` e `availableNow = true` dentro do raio de até 5 km com ranking superior.
   - **Onda 2 (Após 3 minutos sem aceite)**: Expansão do raio para até 15 km cobrindo prestadores online da mesma categoria.
   - **Onda 3 (Fallback)**: Caso nenhum prestador aceite no modo imediato, o sistema sugere automaticamente alternar para **Modo Agendamento** ou **Modo Orçamento**, prevenindo dead ends.

---

## 2. Critérios de Elegibilidade

```
Elegível = (
    onboardingStatus === 'aprovado' AND
    active === true AND
    condoId === requestCondoId AND
    category === requestCategory AND
    (mode !== 'on_demand' OR (isOnline === true AND availableNow === true)) AND
    distanceKm <= serviceRadiusKm
)
```
