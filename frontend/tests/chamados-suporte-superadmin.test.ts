import fs from "node:fs";
import path from "node:path";
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { getNavigationGroups } from "../src/lib/navigation";
import { hasPermission } from "../src/lib/permissions";
import { statusLabel, statusTone } from "../src/lib/status";

describe("Abas de Operação para Super Admin — Chamados e Suporte", () => {
  test("Superadmin possui itens de Operação: Chamados e Suporte no menu lateral", () => {
    const groups = getNavigationGroups("superadmin");
    const operacaoGroup = groups.find((g) => g.id === "operacao" || g.title.toLowerCase() === "operação");

    assert.ok(operacaoGroup, "Grupo Operação deve existir na navegação do Superadmin");
    const hrefs = operacaoGroup.items.map((i) => i.href);
    const labels = operacaoGroup.items.map((i) => i.label.toLowerCase());

    assert.ok(hrefs.includes("/painel/chamados"), "Deve conter rota /painel/chamados");
    assert.ok(labels.includes("chamados"), "Deve conter item Chamados");

    assert.ok(hrefs.includes("/painel/ajuda"), "Deve conter rota /painel/ajuda");
    assert.ok(labels.includes("suporte"), "Deve conter item Suporte");
  });

  test("Itens de Operação respeitam controle de permissões do Superadmin", () => {
    const groups = getNavigationGroups("superadmin");
    const operacaoGroup = groups.find((g) => g.id === "operacao");
    assert.ok(operacaoGroup);

    for (const item of operacaoGroup.items) {
      if (item.permission) {
        assert.equal(
          hasPermission("superadmin", item.permission),
          true,
          `Superadmin deve ter permissão para ${item.label} (${item.permission})`
        );
      }
    }
  });

  test("Morador possui rota de ajuda e suporte", () => {
    const moradorGroups = getNavigationGroups("morador");
    const moradorHrefs = moradorGroups.flatMap((g) => g.items.map((i) => i.href));
    assert.ok(moradorHrefs.includes("/painel/ajuda"), "Morador deve ter acesso a ajuda/suporte");
  });

  test("Superadmin possui Marketplace como item direto de navegação (sem subitens)", () => {
    const groups = getNavigationGroups("superadmin");
    const marketplace = groups.find((g) => g.id === "marketplace");

    assert.ok(marketplace, "Item Marketplace deve existir na navegação do Superadmin");
    assert.equal(marketplace.href, "/painel/admin/marketplace", "Marketplace deve possuir href direto");
    assert.equal(marketplace.items.length, 0, "Marketplace não deve ter subitens no menu lateral");
  });

  test("Superadmin possui Zeladoria Pay como item direto de navegação (sem subitens)", () => {
    const groups = getNavigationGroups("superadmin");
    const zeladoriaPay = groups.find((g) => g.id === "zeladoria_pay");

    assert.ok(zeladoriaPay, "Item Zeladoria Pay deve existir na navegação do Superadmin");
    assert.equal(zeladoriaPay.href, "/painel/admin/zeladoria-pay", "Zeladoria Pay deve possuir href direto");
    assert.equal(zeladoriaPay.items.length, 0, "Zeladoria Pay não deve ter subitens no menu lateral");
  });

  test("Módulo ui.tsx permanece compatível com Server Components (statusTone/statusLabel invocáveis na rota /painel/ajuda)", () => {
    const uiSource = fs.readFileSync(path.resolve(__dirname, "../src/components/ui.tsx"), "utf8");
    assert.equal(
      /^\s*["']use client["']/.test(uiSource),
      false,
      "ui.tsx não deve ter 'use client' no topo para não converter statusTone/statusLabel em Client Reference Proxies no RSC"
    );

    assert.equal(statusTone("aberto"), "yellow");
    assert.equal(statusTone("respondido"), "green");
    assert.equal(statusTone("encerrado"), "green");
    assert.equal(statusTone(null), "neutral");
    assert.equal(statusLabel("em_andamento"), "em andamento");
  });
});
