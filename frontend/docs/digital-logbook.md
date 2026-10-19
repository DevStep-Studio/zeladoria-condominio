# Livro Digital da Portaria & Passagem de Turno — Zeladoria Condomínio

Este documento especifica a arquitetura, regras de imutabilidade e fluxos operacionais do Livro Digital da Portaria e do módulo de Passagem de Turno.

---

## 1. Objetivo

Substituir com total segurança jurídica e eficiência operacional o antigo livro físico de ocorrências da portaria, garantindo:
1. Imutabilidade dos registros históricos;
2. Classificação por sigilo e gravidade;
3. Registro de ciência formal do síndico;
4. Transformação rápida de anotações do livro em Ordens de Serviço;
5. Passagem de turno estruturada com checklist de conferência.

---

## 2. Estrutura do Registro

Cada entrada no Livro Digital armazena:
- **Código Único**: Identificador sequencial (ex: `OC-00102`);
- **Turno e Autor**: Porteiro que realizou a anotação e período do turno (Manhã, Tarde, Noite);
- **Data e Hora Exata**: Registro com fuso horário auditado;
- **Classificação de Visibilidade**:
  - `publica`: Visível para moradores da unidade e administração;
  - `administrativa`: Visível para portaria, zeladoria e síndico;
  - `sigilosa`: Visível exclusivamente para síndico, conselho e superadministrador.
- **Categoria**: Segurança, Manutenção, Convivência, Barulho, Acesso, Encomendas ou Outros;
- **Gravidade**: Baixa, Média, Alta ou Urgente;
- **Ações Tomadas**: Medidas adotadas imediatamente pela portaria;
- **Ciência do Síndico (`ackAt`, `ackById`)**: Carimbo de data/hora e identificação do síndico que tomou conhecimento do evento;
- **Anexos e Fotos**: Evidências fotográficas ou documentos vinculados.

---

## 3. Regra de Imutabilidade & Auditoria

- Registros no Livro Digital **não podem ser excluídos ou sobrescritos**.
- Quaisquer complementações ou atualizações adicionam novas entradas auditadas com timestamp e nome do autor, preservando o histórico integral para prestação de contas.

---

## 4. Passagem de Turno

1. **Abertura de Turno**:
   - Seleção do período;
   - Checklist de assunção: Rádios e baterias, Chavaria, CFTV/Câmeras, Extintores, Interfonia.

2. **Fechamento de Turno**:
   - Resumo automatizado:
     - Quantidade de visitantes/prestadores ainda dentro do condomínio;
     - Quantidade de encomendas aguardando retirada;
     - Ocorrências operacionais abertas no período.
   - Relato da passagem de serviço e registro de pendências;
   - Seleção do porteiro que assume o posto.

---

## 5. Código & Módulos

- **Página do Livro**: [src/app/painel/livro/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/livro/page.tsx)
- **Página de Turnos**: [src/app/painel/turnos/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/turnos/page.tsx)
- **Ações de Portaria**: [src/lib/actions/portaria.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/actions/portaria.ts)
