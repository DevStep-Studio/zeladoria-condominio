import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { condominiums, occurrences } from "../src/db/schema";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";
const SESSION_COOKIE = "gc_session";
const CONDO_COOKIE = "gc_condo";
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

describe("Módulo Mapa do Condomínio — Testes Funcionais & E2E", () => {
  const sessionCookieSindico = generateSessionCookie(2); // Marina Duarte (Síndica)
  const condoId = 1;
  const authHeaderSindico = `${SESSION_COOKIE}=${sessionCookieSindico}; ${CONDO_COOKIE}=${condoId}`;

  it("1. Síndico: GET /painel deve renderizar o Mapa do Condomínio com status 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/painel`, {
      headers: { Cookie: authHeaderSindico },
    });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.equal(html.includes("MAPA DO CONDOMÍNIO"), true);
    assert.equal(html.includes("Buscar ocorrência, local ou número..."), true);
    assert.equal(html.includes("Minha localização"), true);
    assert.equal(html.includes("Centralizar condomínio"), true);
  });

  it("2. Ocorrências no Banco de Dados possuem coordenadas geográficas ou suporte a lat/lng", async () => {
    const occs = await db
      .select({
        id: occurrences.id,
        code: occurrences.code,
        title: occurrences.title,
        category: occurrences.category,
        severity: occurrences.severity,
        status: occurrences.status,
        latitude: occurrences.latitude,
        longitude: occurrences.longitude,
      })
      .from(occurrences)
      .where(eq(occurrences.condoId, condoId));

    assert.ok(occs.length > 0, "Deve haver ocorrências cadastradas para o condomínio");
    for (const occ of occs) {
      assert.ok(occ.code.startsWith("OC-"), `Código inválido: ${occ.code}`);
      assert.ok(occ.title.length > 0, `Título vazio na ocorrência ${occ.code}`);
      assert.ok(occ.category.length > 0, `Categoria vazia na ocorrência ${occ.code}`);
    }
  });

  it("3. Fonte de Tiles: Deve utilizar CartoDB Positron para evitar erros 403 e garantir alta estabilidade", () => {
    const mapFilePath = path.join(process.cwd(), "src/components/condo-map.tsx");
    const content = fs.readFileSync(mapFilePath, "utf8");

    assert.equal(
      content.includes("basemaps.cartocdn.com"),
      true,
      "CondoMap deve usar CartoDB Positron como provedor de tiles"
    );
    assert.equal(
      content.includes("tile.openstreetmap.org"),
      false,
      "CondoMap NÃO deve usar tile.openstreetmap.org direto para evitar 403 Access Blocked"
    );
  });

  it("4. Mapeamento de Cores Funcionais: Alta 🔴 (#EF4444), Média 🟡 (#F59E0B), Baixa 🔵 (#0055D4)", () => {
    const mapFilePath = path.join(process.cwd(), "src/components/condo-map.tsx");
    const content = fs.readFileSync(mapFilePath, "utf8");

    assert.equal(content.includes("#EF4444"), true, "Cor de alta prioridade #EF4444 presente");
    assert.equal(content.includes("#F59E0B"), true, "Cor de média prioridade #F59E0B presente");
    assert.equal(content.includes("#0055D4"), true, "Cor de baixa prioridade #0055D4 presente");
  });

  it("5. Regra Zero Gradientes: Componente de mapa e dashboard não devem conter gradientes Tailwind", () => {
    const mapFilePath = path.join(process.cwd(), "src/components/condo-map.tsx");
    const content = fs.readFileSync(mapFilePath, "utf8");
    assert.equal(
      /bg-gradient-to-[a-z]+/i.test(content),
      false,
      "Gradiente proibido encontrado em condo-map.tsx"
    );
  });
});
