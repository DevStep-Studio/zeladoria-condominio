# Controle de Acesso & Visitantes — Zeladoria Condomínio

Este documento especifica a mecânica de controle de acessos, validação de tokens QR e gerenciamento de visitantes e prestadores.

---

## 1. Fluxo de Entrada de Visitantes

### A. Visitante Pré-Cadastrado (Esperado)
1. Morador cadastra o visitante pelo aplicativo informando nome, unidade, data/horário e placa opcional.
2. O sistema gera um código de liberação e token temporário com validade pré-definida.
3. Ao chegar na portaria, o porteiro localiza o visitante por nome, unidade ou código.
4. Porteiro clica em **Confirmar Entrada** (`visitor.checkin`).
5. O morador é notificado automaticamente: *"Visitante deu entrada no condomínio"*.
6. O visitante entra no painel operacional **Quem Está Dentro**.

### B. Visitante Não Cadastrado
1. Visitante se apresenta na portaria.
2. Porteiro abre o modal **Autorizar Visitante** e informa nome, documento, unidade e placa.
3. Porteiro faz o contato com a unidade e confirma a liberação.
4. Ao salvar, a entrada é registrada imediatamente.

---

## 2. Fluxo de Saída (Check-out)

1. Ao deixar o condomínio, o porteiro localiza o visitante no painel **Quem Está Dentro**.
2. Clica em **Registrar Saída** (`visitor.checkout`).
3. O sistema registra o carimbo de data/hora de saída e o porteiro responsável.

---

## 3. Prestadores & Terceirizados

- A portaria conta com uma visão dedicada para prestadores de serviço com autorização no dia.
- Permite controle de crachá/identificação, empresa contratada, unidade de destino e janela de horário permitida para obras.

---

## 4. Segurança & Prevenção IDOR

- Tokens QR e códigos de retirada são verificados com chave no backend com expiração e verificação de `condoId`.
- Validações de acesso impedem que um porteiro valide acessos de condomínios aos quais não pertence.

---

## 5. Código & Módulos

- **Página de Visitantes**: [src/app/painel/visitantes/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/visitantes/page.tsx)
- **Central de Portaria**: [src/app/painel/portaria/page.tsx](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/app/painel/portaria/page.tsx)
- **Ações de Portaria**: [src/lib/actions/portaria.ts](file:///Users/pumapunku/Documents/GitHub/zeladoria-condominio/src/lib/actions/portaria.ts)
