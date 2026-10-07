# Central de Gestão do Síndico — Zeladoria Condomínio

Este documento especifica a experiência de produto, arquitetura de decisão e módulos estratégicos dedicados aos Síndicos e membros da Administração.

---

## 1. Princípio de Experiência

> **Regra da Decisão Eficiente**: O Síndico deve entender em menos de 3 segundos:
> 1. O que está atrasado ou pendente de aprovação;
> 2. Quais ocorrências são de alta gravidade;
> 3. Quem é o responsável designado para cada ordem;
> 4. Qual é a próxima ação recomendada.

A Home do Síndico é desenhada como uma central executiva de priorização e ação rápida, e não apenas um acumulado de gráficos decorativos.

---

## 2. Estrutura do Dashboard de Gestão

1. **Hero: “Precisa da sua Atenção”**:
   - Exibe exclusivamente pendências reais que demandam ação (cards zerados desaparecem automaticamente):
     - **Ocorrências Abertas** (com destaque para alta prioridade);
     - **Reservas Aguardando Aprovação**;
     - **Sugestões / Ouvidoria Aguardando Análise**;
     - **Manutenções Preventivas Atrasadas ou Vencendo em 7 Dias**;
     - **Ordens de Serviço sem Responsável Atribuído**;
     - **Documentos Próximos do Vencimento**.

2. **Ações Ráridas de Gestão**:
   - **Criar Comunicado**: Envio de aviso para todos, torre, bloco ou grupo específico com controle de confirmação de leitura.
   - **Criar Ordem de Serviço**: Criação de OS corretiva ou técnica com prazo e custo.
   - **Cadastrar Manutenção**: Planejamento preventivo periódico de equipamentos.
   - **Contratar Prestador**: Acesso ao Marketplace de profissionais verificados.

3. **Hoje no Condomínio (Resumo Compacto)**:
   - 5 indicadores essenciais: Visitantes previstos, Prestadores autorizados, Reservas de hoje, Manutenções agendadas, Ocorrências em andamento.

4. **Prevenção Inteligente & Ativos Críticos**:
   - Diagnóstico automatizado que identifica equipamentos e áreas comuns com recorrência de chamados (ex: *Elevador Social com 3 ocorrências no mês*).
   - Sugere ações preventivas imediatas com 1 clique para agendar ordem técnica.

5. **Livro Digital da Portaria (Visão Síndico)**:
   - Visualização cronológica dos registros dos porteiros.
   - Botão **Dar Ciência**: Registro formal de ciência do síndico na ocorrência.
   - Botão **Criar Ordem a partir do Registro**: Transforma um relato da portaria diretamente em uma Ordem de Serviço de manutenção vinculada.

6. **Mapa Operacional & Ocorrências**:
   - Mapa interativo (Leaflet / CartoDB) com localização dos incidentes e equipamentos.

---

## 3. Código & Componentes

- **Componente**: [src/components/sindico-dashboard.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/components/sindico-dashboard.tsx)
- **Ordens de Serviço**: [src/app/painel/ordens/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/ordens/page.tsx)
- **Manutenção Preventiva**: [src/app/painel/manutencao/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/manutencao/page.tsx)
- **Ações Administrativas**: [src/lib/actions/admin.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/actions/admin.ts)
