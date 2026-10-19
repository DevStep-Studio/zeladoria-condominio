import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const frontendPath = '.env.local';
const backendPath = 'backend/.env';
const read = path => existsSync(path) ? readFileSync(path, 'utf8') : '';
const get = (text, key) => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
const put = (text, key, value) => new RegExp(`^${key}=.*$`, 'm').test(text) ? text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;

let frontend = read(frontendPath) || read('.env.example');
let backend = read(backendPath) || read('backend/.env.example');
const existingFrontend = get(frontend, 'BACKEND_SERVICE_TOKEN');
const existingBackend = get(backend, 'FRONTEND_SERVICE_TOKEN');
if (existingFrontend && existingBackend && existingFrontend !== existingBackend) {
  throw new Error('Os tokens existentes são diferentes. Alinhe BACKEND_SERVICE_TOKEN e FRONTEND_SERVICE_TOKEN antes de executar novamente.');
}
const token = existingFrontend || existingBackend || randomBytes(32).toString('hex');
if (token.length < 32) throw new Error('O token deve possuir pelo menos 32 caracteres.');
frontend = put(frontend, 'BACKEND_SERVICE_TOKEN', token);
backend = put(backend, 'FRONTEND_SERVICE_TOKEN', token);
if (!get(backend, 'APP_KEY')) backend = put(backend, 'APP_KEY', `base64:${randomBytes(32).toString('base64')}`);
writeFileSync(frontendPath, frontend, { mode: 0o600 });
writeFileSync(backendPath, backend, { mode: 0o600 });
console.log('Configuração da API criada. Ajuste as credenciais MySQL somente em backend/.env.');
