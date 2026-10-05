import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "../src/db";
import { amenities, reservations, amenityBlocks } from "../src/db/schema";
import { and, eq } from "drizzle-orm";
import {
  createReservationAction,
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
  saveAmenityAction,
  createBlockAction,
  deleteBlockAction,
} from "../src/lib/actions/reservas";

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

describe("Módulo de Reservas — Testes Funcionais & E2E", () => {
  const sessionCookieMoradorA = generateSessionCookie(7); // Ana Ribeiro (Moradora)
  const sessionCookieMoradorB = generateSessionCookie(8); // Bruno Tavares (Morador)
  const sessionCookieSindico = generateSessionCookie(2); // Marina Duarte (Síndica)
  const condoId = 1;

  const authHeaderMoradorA = `${SESSION_COOKIE}=${sessionCookieMoradorA}; ${CONDO_COOKIE}=${condoId}`;
  const authHeaderSindico = `${SESSION_COOKIE}=${sessionCookieSindico}; ${CONDO_COOKIE}=${condoId}`;

  it("1. Morador: GET /painel/reservas deve renderizar com status 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/painel/reservas`, {
      headers: { Cookie: authHeaderMoradorA },
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text.includes("Reservas"), true);
    assert.equal(text.includes("Áreas disponíveis"), true);
  });

  it("2. Síndico: GET /painel/reservas deve renderizar abas administrativas", async () => {
    const res = await fetch(`${BASE_URL}/painel/reservas`, {
      headers: { Cookie: authHeaderSindico },
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text.includes("Calendário"), true);
    assert.equal(text.includes("Solicitações"), true);
    assert.equal(text.includes("Novo espaço"), true);
  });

  it("3. Regra Zero Gradientes: Componentes de Reservas não devem possuir gradientes Tailwind", () => {
    const fs = require("node:fs");
    const path = require("node:path");

    const reservasDir = path.join(process.cwd(), "src/app/painel/reservas");
    const files = fs.readdirSync(reservasDir, { recursive: true });

    for (const f of files) {
      if (typeof f === "string" && (f.endsWith(".tsx") || f.endsWith(".ts"))) {
        const fullPath = path.join(reservasDir, f);
        const content = fs.readFileSync(fullPath, "utf8");
        assert.equal(
          /bg-gradient-to-[a-z]+/i.test(content),
          false,
          `Gradiente proibido encontrado em ${f}`
        );
      }
    }
  });
});
