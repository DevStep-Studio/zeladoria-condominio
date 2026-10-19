# Central Operacional da Portaria — Zeladoria Condomínio

Este documento especifica a experiência de produto, fluxos operacionais em tempo real e regras de usabilidade construídas para porteiros e operadores de acesso.

---

## 1. Princípio de Experiência

> **Regra dos 3 Segundos**: O porteiro deve bater o olho e entender instantaneamente:
> 1. Quem está chegando;
> 2. Quem está dentro do condomínio;
> 3. O que precisa registrar (encomenda, acesso, ocorrência);
> 4. O que ficou pendente do turno anterior.

O porteiro **nunca** é sobrecarregado com relatórios analíticos, assembleias, gestão financeira ou formulários administrativos complexos.

---

## 2. Estrutura do Dashboard Operacional

1. **Barra de Turno Ativo**:
   - Status de abertura/encerramento de turno.
   - Nome do porteiro escalado e condomínio ativo.
   - Acesso rápido à abertura e encerramento com checklist.

2. **4 Ações Principais (Botões de Alta Acessibilidade)**:
   - **Autorizar Visitante**: Cadastro rápido de visitante, prestador ou entregador com unidade destino, documento e placa do veículo.
   - **Registrar Encomenda**: Entrada de pacotes com unidade, transportadora e prateleira. Notifica o morador instantaneamente via push/notificação.
   - **Consultar Morador / Unidade**: Busca em tempo real de contatos, veículos e autorizações por número de apartamento ou bloco.
   - **Registrar Ocorrência Rápida**: Formulário simplificado de eventos do turno com foto e relato para o Livro Digital.

3. **Seção “Agora na Portaria”**:
   - Contadores interativos e clicáveis:
     - Visitantes e prestadores dentro do condomínio no momento;
     - Visitantes esperados com entrada prevista para hoje;
     - Encomendas aguardando retirada;
     - Reservas de áreas comuns hoje;
     - Prestadores de serviço autorizados hoje.

4. **Painel “Quem Está Dentro”**:
   - Lista em tempo real de todas as pessoas que registraram entrada e ainda não efetuaram saída.
   - Botão direto de 1 clique: **Registrar Saída** (Check-out).

5. **Painel de Visitantes Esperados**:
   - Visitantes pré-autorizados pelos moradores.
   - Botão direto de 1 clique: **Confirmar Entrada** (Check-in).

6. **Contatos Rápidos de Emergência & Apoio**:
   - Polícia Militar (190), Bombeiros (193), Síndico, Zelador, Empresa de Manutenção de Elevadores e Portões Automáticos.

---

## 3. Código & Componentes

- **Componente**: [src/components/porteiro-dashboard.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/components/porteiro-dashboard.tsx)
- **Módulo de Visitantes**: [src/app/painel/visitantes/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/visitantes/page.tsx)
- **Módulo de Encomendas**: [src/app/painel/encomendas/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/encomendas/page.tsx)
- **Ações de Portaria**: [src/lib/actions/portaria.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/actions/portaria.ts)
