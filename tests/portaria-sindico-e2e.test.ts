import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { hasPermission, ROLE_PERMISSIONS_MAP } from "../src/lib/permissions";
import { getNavigationGroups, getMobileNavItems } from "../src/lib/navigation";

const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

describe("FASE 91: Teste E2E — Porteiro (Central Operacional da Portaria)", () => {
  it("porteiro deve possuir permissões operacionais e NÃO de gestão estratégica", () => {
    // Porteiro can do operational checkin, packages, shifts, logbook
    assert.equal(hasPermission("porteiro", "visitor.checkin"), true, "Porteiro deve poder fazer checkin");
    assert.equal(hasPermission("porteiro", "visitor.checkout"), true, "Porteiro deve poder fazer checkout");
    assert.equal(hasPermission("porteiro", "package.register"), true, "Porteiro deve poder registrar encomenda");
    assert.equal(hasPermission("porteiro", "package.release"), true, "Porteiro deve poder entregar encomenda");
    assert.equal(hasPermission("porteiro", "shift.open"), true, "Porteiro deve poder abrir turno");
    assert.equal(hasPermission("porteiro", "shift.close"), true, "Porteiro deve poder fechar turno");
    assert.equal(hasPermission("porteiro", "logbook.create"), true, "Porteiro deve poder criar registro no livro");

    // Porteiro CANNOT manage financial, settings, or delete documents
    assert.equal(hasPermission("porteiro", "financial.manage"), false, "Porteiro não pode gerenciar financeiro");
    assert.equal(hasPermission("porteiro", "condominium.settings.manage"), false, "Porteiro não pode alterar configurações gerais");
    assert.equal(hasPermission("porteiro", "document.create"), false, "Porteiro não deve ter acesso a criação de atas/documentos");
  });

  it("menu e mobile bottom-nav do porteiro devem refletir operação imediata", () => {
    const porteiroGroups = getNavigationGroups("porteiro");
    const allHrefs = porteiroGroups.flatMap((g) => g.items.map((i) => i.href));

    assert.equal(allHrefs.includes("/painel/visitantes"), true, "Porteiro deve ter menu de Visitantes");
    assert.equal(allHrefs.includes("/painel/encomendas"), true, "Porteiro deve ter menu de Encomendas");
    assert.equal(allHrefs.includes("/painel/livro"), true, "Porteiro deve ter menu de Livro Digital");
    assert.equal(allHrefs.includes("/painel/turnos"), true, "Porteiro deve ter menu de Turnos");
    assert.equal(allHrefs.includes("/painel/financeiro"), false, "Porteiro não deve ter menu de Financeiro");

    const mobileItems = getMobileNavItems("porteiro");
    const mobileHrefs = mobileItems.map((i) => i.href);
    assert.equal(mobileHrefs.includes("/painel/visitantes"), true, "Mobile do porteiro deve ter Visitantes");
    assert.equal(mobileHrefs.includes("/painel/encomendas"), true, "Mobile do porteiro deve ter Encomendas");
    assert.equal(mobileHrefs.includes("/painel/livro"), true, "Mobile do porteiro deve ter Livro");
  });
});

describe("FASE 92: Teste E2E — Síndico (Central de Gestão do Condomínio)", () => {
  it("síndico deve possuir permissões completas de gestão, decisão e acompanhamento", () => {
    assert.equal(hasPermission("sindico", "occurrence.manage"), true, "Síndico deve gerenciar ocorrências");
    assert.equal(hasPermission("sindico", "reservation.approve"), true, "Síndico deve aprovar reservas");
    assert.equal(hasPermission("sindico", "service_order.create"), true, "Síndico deve criar ordens de serviço");
    assert.equal(hasPermission("sindico", "maintenance.manage"), true, "Síndico deve gerenciar manutenção preventiva");
    assert.equal(hasPermission("sindico", "logbook.ack"), true, "Síndico deve dar ciência no livro digital");
    assert.equal(hasPermission("sindico", "financial.view"), true, "Síndico deve ver financeiro");
    assert.equal(hasPermission("sindico", "condominium.settings.manage"), true, "Síndico deve gerenciar configurações");
  });

  it("menu do síndico deve incluir Gestão, Operação, Portaria, Serviços e Administração", () => {
    const sindicoGroups = getNavigationGroups("sindico");
    const groupTitles = sindicoGroups.map((g) => g.title);

    assert.equal(groupTitles.some((t) => /Gestão/i.test(t)), true, "Deve conter grupo Gestão");
    assert.equal(groupTitles.some((t) => /Operação/i.test(t)), true, "Deve conter grupo Operação");
    assert.equal(groupTitles.some((t) => /Portaria|Comunidade/i.test(t)), true, "Deve conter grupo Portaria & Comunidade");
    assert.equal(groupTitles.some((t) => /Administração/i.test(t)), true, "Deve conter grupo Administração");
  });
});

describe("FASE 93: Teste de Permissões & Route Guards (HTTP)", () => {
  const PORTEIRO_USER_ID = 5; // Porteiro no seed
  const MORADOR_USER_ID = 7;  // Morador no seed
  const SINDICO_USER_ID = 1;  // Síndica no seed

  it("porteiro tentando acessar financeiro ou configurações administrativas deve receber 403", async () => {
    const porteiroCookie = generateSessionCookie(PORTEIRO_USER_ID);
    const res = await fetch(`${BASE_URL}/painel/financeiro`, {
      headers: { Cookie: `gc_session=${porteiroCookie}; gc_condo=1` },
      redirect: "manual",
    });

    // Deve redirecionar para /painel/403 ou retornar 403
    const isForbidden = res.status === 403 || (res.status === 307 && res.headers.get("location")?.includes("/403"));
    assert.equal(isForbidden, true, "Porteiro deve ser bloqueado ao tentar acessar financeiro");
  });

  it("morador tentando acessar ordens de manutenção deve receber 403", async () => {
    const moradorCookie = generateSessionCookie(MORADOR_USER_ID);
    const res = await fetch(`${BASE_URL}/painel/ordens`, {
      headers: { Cookie: `gc_session=${moradorCookie}; gc_condo=1` },
      redirect: "manual",
    });

    const isForbidden = res.status === 403 || (res.status === 307 && res.headers.get("location")?.includes("/403"));
    assert.equal(isForbidden, true, "Morador deve ser bloqueado ao tentar acessar ordens");
  });

  it("síndico autorizado acessando rotas de gestão deve receber 200 OK", async () => {
    const sindicoCookie = generateSessionCookie(SINDICO_USER_ID);
    const res = await fetch(`${BASE_URL}/painel`, {
      headers: { Cookie: `gc_session=${sindicoCookie}; gc_condo=1` },
    });

    assert.equal(res.status, 200, "Síndico deve acessar /painel com 200 OK");
  });
});

describe("FASE 94: Teste Multi-Condomínio (Troca de Condomínio sem Vazamento)", () => {
  it("recalcula role e grupos de navegação ao alterar papel entre condomínios", () => {
    // Cenário: Usuário é porteiro no condomínio A e morador no condomínio B
    const navAsPorteiro = getNavigationGroups("porteiro");
    const navAsMorador = getNavigationGroups("morador");
    const navAsSindico = getNavigationGroups("sindico");

    assert.notDeepEqual(navAsPorteiro, navAsMorador, "Navegação de porteiro deve ser distinta de morador");
    assert.notDeepEqual(navAsSindico, navAsPorteiro, "Navegação de síndico deve ser distinta de porteiro");

    const porteiroHrefs = navAsPorteiro.flatMap((g) => g.items.map((i) => i.href));
    const moradorHrefs = navAsMorador.flatMap((g) => g.items.map((i) => i.href));

    assert.equal(porteiroHrefs.includes("/painel/portaria"), true, "Porteiro enxerga /painel/portaria");
    assert.equal(moradorHrefs.includes("/painel/portaria"), false, "Morador não deve enxergar /painel/portaria na sidebar");
  });
});

describe("FASE 95 & 96: Conformidade Visual e Regra Zero Gradientes", () => {
  it("nenhum componente de porteiro ou síndico deve conter gradientes Tailwind", () => {
    function checkDir(dir: string) {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          checkDir(full);
        } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry)) {
          const content = readFileSync(full, "utf-8");
          const hasGradient = /bg-gradient-to-[a-z]+/i.test(content);
          assert.equal(hasGradient, false, `Arquivo ${full} não deve conter gradientes (Regra Zero Gradientes)`);
        }
      }
    }

    checkDir(join(process.cwd(), "src/components"));
  });
});
