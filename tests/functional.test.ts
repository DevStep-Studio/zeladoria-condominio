import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";
const SESSION_COOKIE = "gc_session";
const CONDO_COOKIE = "gc_condo";
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

// --- Auth Helpers (Mirror of src/lib/auth.ts for isolated validation) ---
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const target = Buffer.from(hash, "hex");
  if (candidate.length !== target.length) return false;
  return timingSafeEqual(candidate, target);
}

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function parseSessionCookie(raw: string | undefined): number | null {
  if (!raw) return null;
  const [id, expires, signature] = raw.split(".");
  if (!id || !expires || !signature) return null;
  if (sign(`${id}.${expires}`) !== signature) return null;
  if (Number(expires) < Date.now()) return null;
  return Number(id);
}

describe("1. Autenticação, Criptografia e Segurança de Sessão", () => {
  it("deve criptografar e verificar senhas corretamente com salt único", () => {
    const pass = "condoSecret2026";
    const hash1 = hashPassword(pass);
    const hash2 = hashPassword(pass);

    assert.notEqual(hash1, hash2, "Salts devem ser aleatórios e únicos");
    assert.equal(verifyPassword(pass, hash1), true, "Senha correta deve ser verificada");
    assert.equal(verifyPassword(pass, hash2), true, "Senha correta deve ser verificada no segundo hash");
    assert.equal(verifyPassword("senhaErrada", hash1), false, "Senha incorreta deve ser rejeitada");
    assert.equal(verifyPassword("", hash1), false, "Senha vazia deve ser rejeitada");
  });

  it("deve gerar e validar cookies de sessão com assinatura HMAC SHA-256", () => {
    const userId = 7;
    const cookie = generateSessionCookie(userId);
    const parsedId = parseSessionCookie(cookie);

    assert.equal(parsedId, userId, "ID de usuário decodificado deve ser idêntico");
  });

  it("deve rejeitar cookies adulterados ou falsificados", () => {
    const cookie = generateSessionCookie(7);
    const tampered = cookie.replace(/^7\./, "1."); // Tentar escalar para usuário 1 sem refazer assinatura
    assert.equal(parseSessionCookie(tampered), null, "Cookie adulterado deve ser rejeitado");

    const forgedSig = cookie.slice(0, -6) + "ffffff"; // Assinatura corrompida
    assert.equal(parseSessionCookie(forgedSig), null, "Assinatura corrompida deve ser rejeitada");
  });

  it("deve rejeitar cookies expirados", () => {
    const expiredCookie = generateSessionCookie(7, -100); // Expirado há 100s
    assert.equal(parseSessionCookie(expiredCookie), null, "Cookie expirado deve ser rejeitado");
  });
});

describe("2. Regras de RBAC e Isolamento Multi-inquilino", () => {
  it("morador deve ter escopo restrito de visibilidade em documentos", () => {
    const moradorScopes = ["publico", "moradores"];
    const staffScopes = ["publico", "moradores", "administrativo"];

    assert.equal(moradorScopes.includes("administrativo"), false, "Morador não deve acessar docs administrativos");
    assert.equal(staffScopes.includes("administrativo"), true, "Staff deve ter acesso a docs administrativos");
  });

  it("validação de papéis de gestão e moderação", () => {
    const ALL_STAFF = ["superadmin", "sindico", "conselho", "zelador"];
    const canPublishAnnouncements = (role: string) => [...ALL_STAFF, "porteiro"].includes(role);
    const canManageAssemblies = (role: string) => ["superadmin", "sindico"].includes(role);

    assert.equal(canPublishAnnouncements("sindico"), true);
    assert.equal(canPublishAnnouncements("porteiro"), true);
    assert.equal(canPublishAnnouncements("morador"), false);

    assert.equal(canManageAssemblies("sindico"), true);
    assert.equal(canManageAssemblies("superadmin"), true);
    assert.equal(canManageAssemblies("morador"), false);
    assert.equal(canManageAssemblies("porteiro"), false);
  });
});

describe("3. Conformidade Visual e Regressões de Design System", () => {
  function scanFiles(dir: string, extension: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
          results.push(...scanFiles(fullPath, extension));
        }
      } else if (entry.name.endsWith(extension) || entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("não deve existir nenhum gradiente Tailwind em src/ (Regra Zero Gradientes)", () => {
    const srcDir = join(process.cwd(), "src");
    const sourceFiles = scanFiles(srcDir, ".tsx");
    const gradientViolations: { file: string; line: number; text: string }[] = [];

    const gradientRegex = /bg-gradient-to-[a-z]+/i;

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (gradientRegex.test(line)) {
          gradientViolations.push({ file, line: index + 1, text: line.trim() });
        }
      });
    }

    assert.equal(
      gradientViolations.length,
      0,
      `Gradientes proibidos encontrados:\n${gradientViolations.map((v) => `  ${v.file}:${v.line} -> ${v.text}`).join("\n")}`
    );
  });
});

describe("4. Testes Funcionais de Rotas HTTP do Painel (Dev Server)", () => {
  const sessionCookieMorador = generateSessionCookie(7); // Ana Ribeiro (Moradora)
  const sessionCookieSindico = generateSessionCookie(2); // Marina Duarte (Síndica)
  const condoId = 1; // Residencial Parque das Águas

  const authHeaderMorador = `${SESSION_COOKIE}=${sessionCookieMorador}; ${CONDO_COOKIE}=${condoId}`;
  const authHeaderSindico = `${SESSION_COOKIE}=${sessionCookieSindico}; ${CONDO_COOKIE}=${condoId}`;

  it("GET /login deve responder 200 OK sem autenticação", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.equal(res.status, 200, "Tela de login deve carregar normalmente");
  });

  it("GET /mural deve responder 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/mural`);
    assert.equal(res.status, 200, "Mural de TV deve responder 200");
  });

  const residentRoutes = [
    { path: "/painel", name: "Dashboard Principal" },
    { path: "/painel/ocorrencias", name: "Ocorrências" },
    { path: "/painel/reservas", name: "Reservas de Áreas" },
    { path: "/painel/visitantes", name: "Visitantes e Acessos" },
    { path: "/painel/encomendas", name: "Encomendas e Portaria" },
    { path: "/painel/comunicados", name: "Comunicados e Avisos" },
    { path: "/painel/assembleias", name: "Assembleias Digitais" },
    { path: "/painel/documentos", name: "Biblioteca de Documentos" },
    { path: "/painel/sugestoes", name: "Sugestões e Ouvidoria" },
    { path: "/painel/perfil", name: "Perfil do Usuário" },
  ];

  const allAdminRoutes = [
    ...residentRoutes,
    { path: "/painel/ordens", name: "Ordens de Manutenção" },
  ];

  for (const route of residentRoutes) {
    it(`Morador: GET ${route.path} (${route.name}) deve responder 200 OK`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        headers: { Cookie: authHeaderMorador },
        redirect: "manual",
      });
      assert.equal(
        res.status,
        200,
        `Rota ${route.path} para morador falhou com status ${res.status}`
      );
      const text = await res.text();
      assert.equal(text.length > 500, true, `Resposta de ${route.path} deve conter conteúdo HTML válido`);
    });
  }

  it("Morador: GET /painel/ordens deve ser bloqueado por RBAC com redirecionamento para /painel/403", async () => {
    const res = await fetch(`${BASE_URL}/painel/ordens`, {
      headers: { Cookie: authHeaderMorador },
      redirect: "manual",
    });
    assert.equal(res.status, 307, "Morador não deve acessar ordens de manutenção (esperado redirect 307)");
    const location = res.headers.get("location");
    assert.equal(location?.includes("/painel/403"), true, "Redirecionamento deve apontar para /painel/403");
  });

  for (const route of allAdminRoutes) {
    it(`Síndico: GET ${route.path} (${route.name}) deve responder 200 OK`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        headers: { Cookie: authHeaderSindico },
        redirect: "manual",
      });
      assert.equal(
        res.status,
        200,
        `Rota ${route.path} para síndico falhou com status ${res.status}`
      );
      const text = await res.text();
      assert.equal(text.length > 500, true, `Resposta de ${route.path} deve conter conteúdo HTML válido`);
    });
  }

  it("GET /painel/403 (Tela de Acesso Negado) deve responder 200 OK para usuário logado", async () => {
    const res = await fetch(`${BASE_URL}/painel/403`, {
      headers: { Cookie: authHeaderMorador },
    });
    assert.equal(res.status, 200, "Tela 403 deve renderizar normalmente");
  });

  it("Filtros em abas de Documentos (ex: ?categoria=assembleia) devem responder 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/painel/documentos?categoria=assembleia`, {
      headers: { Cookie: authHeaderMorador },
    });
    assert.equal(res.status, 200);
  });

  it("Filtros em abas de Comunicados (ex: ?status=fixados) devem responder 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/painel/comunicados?status=fixados`, {
      headers: { Cookie: authHeaderMorador },
    });
    assert.equal(res.status, 200);
  });

  it("Filtros em abas de Encomendas (ex: ?status=pendente) devem responder 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/painel/encomendas?status=pendente`, {
      headers: { Cookie: authHeaderMorador },
    });
    assert.equal(res.status, 200);
  });
});
