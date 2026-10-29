import { createHmac } from "node:crypto";
import type { BrowserContext } from "@playwright/test";

const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";

export const USER_IDS = {
  superadmin: 1,
  sindico: 2,
  porteiro: 3,
  morador: 7,
} as const;

export function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

export function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export async function loginAsRole(
  context: BrowserContext,
  role: keyof typeof USER_IDS,
  baseURL: string = "http://localhost:3000"
) {
  const userId = USER_IDS[role];
  const cookieValue = generateSessionCookie(userId);
  const urlObj = new URL(baseURL);

  await context.addCookies([
    {
      name: "gc_session",
      value: cookieValue,
      domain: urlObj.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
