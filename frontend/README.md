# Zeladoria Condomínio

Next.js 16 e React 19 para a interface; Laravel 13 e MySQL 8.4 para a API e persistência.

## Executar localmente

Requisitos: Node.js 22+, PHP 8.3+ com `pdo_mysql` e `sodium`, Composer 2 e MySQL 8.4+.

```bash
npm ci
composer --working-dir=backend install
npm run setup:api
```

Configure `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` em `backend/.env`. Crie o banco MySQL indicado com charset `utf8mb4`.

```bash
cd backend
php artisan migrate
php artisan db:seed
```

O seed é opcional, destinado a desenvolvimento, e não altera bancos que já contêm usuários ou condomínios. As contas de demonstração usam `demo1234`: `sindico@portariamais.com.br`, `portaria@portariamais.com.br`, `morador@portariamais.com.br`, `admin@portariamais.com.br` e `carlos@eletrica.com.br`.

Em terminais separados, na raiz:

```bash
npm run dev:backend
npm run dev
```

Interface: http://localhost:3000. API: http://127.0.0.1:8000/api/v1.

## Separação entre interface e API

- `src/`: telas, componentes, contratos TypeScript e adaptação das ações para HTTP. Sem ORM, drivers, schema, SQL ou credenciais de banco.
- `src/lib/api/server.ts`: cliente HTTP exclusivo do servidor Next.js. As requisições do navegador passam por Server Components e Server Actions.
- `backend/`: aplicação Laravel independente, migrations, MySQL, autenticação Sanctum e operações de persistência.
- `backend/resources/api/operations.json`: catálogo fechado de operações. SQL e identificadores nunca são aceitos do cliente; o Laravel monta consultas parametrizadas a partir do catálogo.

O Next.js atua como BFF confiável: mantém as validações e regras dos fluxos existentes nas Server Actions e solicita dados ao Laravel por HTTP. A autenticação, validação da sessão e seleção de perfil por condomínio são executadas no Laravel. As operações internas exigem a credencial de serviço do BFF; não constituem uma API pública para acesso direto do navegador ou de aplicativos externos.

A raiz contém somente `BACKEND_API_URL` e `BACKEND_SERVICE_TOKEN` em `.env.local`. O segredo deve coincidir com `FRONTEND_SERVICE_TOKEN` do Laravel, ter pelo menos 32 caracteres e jamais usar o prefixo `NEXT_PUBLIC_`. O comando de configuração cria os segredos sem sobrescrever valores existentes. Em produção, use HTTPS e mantenha a API privada/restrita ao servidor da interface.

Não há seed nem criação de tabelas durante a renderização de páginas. Mudanças de estrutura são aplicadas por migrations no Laravel. Dados de uma instalação anterior não são importados automaticamente.

## Verificação

Com a API e o MySQL locais em execução:

```bash
npm run typecheck
npm test
npm run build
```

Para os testes do Laravel, crie também um banco MySQL **separado**, chamado `zeladoria_test`, acessível pelas credenciais de `backend/.env`:

```bash
npm run test:backend
```

A suíte Laravel aplica migrations e transações no banco de teste. Ela cobre autenticação, tokens, perfis por condomínio, consultas, tipos JSON/boolean/data, parâmetros, gravações e sintaxe MySQL do catálogo de leituras.
