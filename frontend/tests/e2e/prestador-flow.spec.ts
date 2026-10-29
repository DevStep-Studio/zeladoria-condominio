import { test, expect } from "@playwright/test";
import { loginAsRole } from "./auth-helpers";

test.describe("Jornada E2E do Prestador de Serviços", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    // Authenticate as superadmin who has provider access or demo provider context
    await loginAsRole(context, "superadmin", baseURL || "http://localhost:3000");
  });

  test("Portal do Prestador: visualização de chamados e oportunidades", async ({ page }) => {
    await page.goto("/prestador/chamados", { waitUntil: "domcontentloaded" });

    // Page title / header
    await expect(page.locator("h1, h2")).toBeVisible();
  });

  test("Portal do Prestador: métricas financeiras e extrato de repasses", async ({ page }) => {
    await page.goto("/prestador/ganhos", { waitUntil: "domcontentloaded" });

    // Financial header or cards
    await expect(page.locator("h1, h2")).toBeVisible();
  });

  test("Catálogo Admin: tela de moderação de prestadores com status e moderação", async ({ page }) => {
    await page.goto("/painel/admin/prestadores", { waitUntil: "domcontentloaded" });

    // Header
    await expect(page.locator("h1")).toContainText(/Prestadores/i);

    // Filters: todos, ativos, inativos
    await expect(page.locator("button:has-text('todos')")).toBeVisible();
    await expect(page.locator("button:has-text('ativos')")).toBeVisible();
  });
});

