import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ApiError, backendRequest } from "../src/lib/api/server";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}

describe("Separação entre interface e backend", () => {
  it("não permite ORM, driver, conexão ou SQL no código da interface", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of ["drizzle-orm", "drizzle-kit", "pg", "postgres", "mysql2", "better-sqlite3", "@libsql/client", "@neondatabase/serverless"]) assert.equal(dependencies[name], undefined, name);
    assert.equal(existsSync("src/db"), false);
    for (const file of sourceFiles("src")) {
      const source = readFileSync(file, "utf8");
      assert.doesNotMatch(source, /(?:from\s*["'](?:@\/db|drizzle-orm|pg["']|mysql2)|\bsql`|process\.env\.(?:DATABASE_URL|DB_HOST|DB_PASSWORD))/, file);
    }
  });

  it("preserva datas, booleanos e JSON na comunicação HTTP sem enviar campos indefinidos", async (t) => {
    const date = new Date("2026-10-19T12:00:00.000Z");
    t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
      assert.equal((init.headers as Record<string, string>)["X-Service-Token"], process.env.BACKEND_SERVICE_TOKEN);
      assert.equal(init.cache, "no-store");
      assert.deepEqual(JSON.parse(String(init.body)), { date: { $date: date.toISOString() }, enabled: false, items: [], nested: { name: "Teste" } });
      return Response.json({ data: { date: { $date: date.toISOString() }, enabled: false, items: [] } });
    });
    const result = await backendRequest<{ date: Date; enabled: boolean; items: unknown[] }>("/test", { method: "POST", body: { date, enabled: false, items: [], nested: { name: "Teste", optional: undefined } } });
    assert.equal(result.date.getTime(), date.getTime());
    assert.equal(result.enabled, false);
    assert.deepEqual(result.items, []);
  });

  it("oculta detalhes internos de falhas do backend", async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json({ message: "SQLSTATE secret-database-password" }, { status: 500 }));
    await assert.rejects(backendRequest("/test"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 500);
      assert.doesNotMatch(error.message, /SQLSTATE|secret-database-password/);
      return true;
    });
  });
});
