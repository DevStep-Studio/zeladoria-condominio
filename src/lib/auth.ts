import "server-only";
import { cache } from "react";
import { randomBytes, scryptSync } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { DomainModels } from "@/lib/api/models";
import { ApiError, backendRequest } from "@/lib/api/server";

const SESSION_COOKIE = "gc_session";
const CONDO_COOKIE = "gc_condo";
const ROLE_COOKIE = "gc_role";
const MAX_AGE = 60 * 60 * 24 * 30;
export type Role = "superadmin" | "sindico" | "conselho" | "zelador" | "porteiro" | "morador" | "prestador";

// Compatibility for existing account creation forms; verification and sessions belong to Laravel.
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

export async function storeSessionToken(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function createSession(userId: number) {
  const result = await backendRequest<{ token: string }>("/auth/sessions", { method: "POST", body: { userId } });
  await storeSessionToken(result.token);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try { await backendRequest("/auth/logout", { method: "POST", token }); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(CONDO_COOKIE);
  jar.delete(ROLE_COOKIE);
}

export async function setActiveCondo(condoId: number) {
  const jar = await cookies();
  jar.set(CONDO_COOKIE, String(condoId), { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE, sameSite: "lax" });
}

export async function setActiveRole(role: Role) {
  const jar = await cookies();
  jar.set(ROLE_COOKIE, role, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE, sameSite: "lax" });
}

export type Membership = {
  id: number;
  condoId: number;
  condoName: string;
  condoSlug: string;
  plan: string;
  role: Role;
  unitId: number | null;
  unitLabel: string | null;
  status: string;
};

export type Session = {
  user: DomainModels["users"];
  memberships: Membership[];
  condo: DomainModels["condominiums"] | null;
  role: Role;
  availableRoles: Role[];
  unitId: number | null;
  vendorId?: number | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const params = new URLSearchParams({ condoId: jar.get(CONDO_COOKIE)?.value ?? "", role: jar.get(ROLE_COOKIE)?.value ?? "" });
  try { return await backendRequest<Session>(`/auth/session?${params}`, { token }); }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireProvider() {
  const session = await requireSession();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const vendor = await backendRequest<DomainModels["vendors"] | null>("/prestador/perfil", { token });
    return { session: { ...session, role: "prestador" as Role }, vendor };
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) redirect("/prestador/login");
    throw error;
  }
}

export async function requireCondo() {
  const session = await requireSession();
  if (!session.condo) redirect("/login?erro=sem-condominio");
  return { session, condo: session.condo, condoId: session.condo.id };
}

import { hasPermission, hasAnyPermission, type Permission } from "@/lib/permissions";

export async function requireRole(roles: Role[]) {
  const ctx = await requireCondo();
  if (!roles.includes(ctx.session.role)) redirect("/painel/403");
  return ctx;
}

export async function requirePermission(permission: Permission | Permission[]) {
  const ctx = await requireCondo();
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(ctx.session.role, permission)
    : hasPermission(ctx.session.role, permission);

  if (!allowed) {
    redirect("/painel/403");
  }
  return ctx;
}

export async function authenticate(email: string, password: string, provider = false) {
  try {
    const result = await backendRequest<{ token: string; user: DomainModels["users"] }>(provider ? "/prestador/login" : "/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), password } });
    await storeSessionToken(result.token);
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function clientInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
    userAgent: (h.get("user-agent") ?? "desconhecido").slice(0, 230),
  };
}
