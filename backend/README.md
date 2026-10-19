# Zeladoria API — Laravel 13

API privada, independente do processo Next.js, com MySQL 8.4. Consulte [as instruções de instalação](../README.md).

- `POST /api/v1/auth/login`: valida credenciais e emite token Sanctum com expiração de 30 dias.
- `GET /api/v1/auth/session`: retorna usuário, vínculos ativos e perfil autorizado no condomínio selecionado.
- `GET /api/v1/auth/provider`: resolve o prestador da sessão.
- `PUT /api/v1/auth/password`: verifica a senha atual, atualiza e revoga as demais sessões.
- `POST /api/v1/auth/logout`: revoga o token atual.
- `POST /api/v1/operations/{operation}`: executa uma operação interna cadastrada com `{ "parameters": [...] }`.

Todos esses endpoints exigem `X-Service-Token`. Os endpoints de sessão, prestador, senha e logout exigem também `Authorization: Bearer ...`. `POST /auth/sessions` é exclusivo do BFF confiável para concluir o cadastro de prestadores.

O catálogo é interno, composto por operações nomeadas e tipos de entidades do servidor. Para acrescentar um fluxo, registre a operação em `resources/api/operations.json`, declare seu retorno em `../src/lib/api/contracts.ts`, consuma pelo cliente HTTP e valide o comportamento em testes. Nunca aceite SQL, tabelas, nomes de campos ou operadores arbitrários pela API.

Os filtros de autorização dos fluxos existentes permanecem nas Server Actions do BFF; o segredo de serviço dá acesso às operações internas. Uma futura API pública para outros clientes precisará de endpoints de domínio e políticas de autorização por usuário para cada fluxo, sem reutilizar diretamente esse acesso de serviço.

Credenciais MySQL e `APP_KEY` existem somente em `.env` deste diretório. Configure `APP_ENV=production`, `APP_DEBUG=false` e execute `php artisan config:cache` no deploy. O seed é exclusivamente de demonstração e se recusa a executar em produção.
