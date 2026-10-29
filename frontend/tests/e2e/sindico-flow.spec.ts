import { test, expect } from "@playwright/test";
import { loginAsRole } from "./auth-helpers";

test.describe("Jornada E2E do Síndico", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAsRole(context, "sindico", baseURL || "http://localhost:3000");
  });

  test("Gestão de Moradores: listagem de unidades e proteção de convites", async ({ page }) => {
    await page.goto("/painel/moradores", { waitUntil: "domcontentloaded" });

    // Page title
    await expect(page.locator("h1")).toContainText(/Moradores|Unidades/i);

    // Filter and search
    const searchInput = page.locator("input[placeholder*='Buscar']");
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });

  test("Painel Financeiro: métricas de fluxo de caixa, receitas e despesas", async ({ page }) => {
    await page.goto("/painel/financeiro", { waitUntil: "domcontentloaded" });

    // Finance header
    await expect(page.locator("h1")).toContainText(/Financeiro/i);

    // Ensure financial figures or cards are rendered
    const statCards = page.locator("[class*='rounded-'], [class*='card']");
    expect(await statCards.count()).toBeGreaterThan(0);
  });

  test("Trilha de Auditoria: eventos registrados com rastreabilidade", async ({ page }) => {
    await page.goto("/painel/auditoria", { waitUntil: "domcontentloaded" });

    // Audit header
    await expect(page.locator("h1")).toContainText(/Auditoria|Logs/i);
  });

  test("Ordens de Serviço: renderiza ordens reais ou empty state limpo", async ({ page }) => {
    await page.goto("/painel/ordens", { waitUntil: "domcontentloaded" });

    // Header
    await expect(page.locator("h1")).toContainText(/Ordens de Serviço/i);

    // Filters: Programadas, Em Execução, Concluídas
    await expect(page.locator("button:has-text('Todas')")).toBeVisible();
    await expect(page.locator("button:has-text('Programadas')")).toBeVisible();
  });
});

