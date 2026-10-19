import { backendRequest } from "../src/lib/api/server";

/** Test-only login through the private API; no database connection or fabricated session signatures. */
export async function testSessionCookie(userId: number): Promise<string> {
  const { token } = await backendRequest<{ token: string }>("/auth/sessions", { method: "POST", body: { userId } });
  return token;
}
