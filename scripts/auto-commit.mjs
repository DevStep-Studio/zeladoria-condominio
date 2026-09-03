#!/usr/bin/env node

/**
 * Auto-Commit Engine para Zeladoria Condomínio
 * 
 * Monitora alterações no repositório e realiza commits automáticos com:
 * - Mensagens semânticas inteligentes baseadas nos arquivos modificados
 * - Debounce para não interromper enquanto você está digitando
 * - Opção de push automático para a branch remota
 * - Proteção contra merge conflicts
 * 
 * Uso:
 *   node scripts/auto-commit.mjs                (Modo contínuo)
 *   node scripts/auto-commit.mjs --push         (Commit + git push automático)
 *   node scripts/auto-commit.mjs --once         (Executa uma única vez e sai)
 *   node scripts/auto-commit.mjs --interval 20  (Checa a cada 20 segundos)
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Configurações e argumentos
const args = process.argv.slice(2);
const shouldPush = args.includes("--push") || process.env.AUTO_PUSH === "true";
const runOnce = args.includes("--once");
const dryRun = args.includes("--dry-run");

const intervalIndex = args.indexOf("--interval");
const CHECK_INTERVAL_SEC = intervalIndex !== -1 ? Number(args[intervalIndex + 1]) || 30 : 30;

const debounceIndex = args.indexOf("--debounce");
const DEBOUNCE_SEC = debounceIndex !== -1 ? Number(args[debounceIndex + 1]) || 15 : 15;

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function log(tag, message, color = colors.cyan) {
  const time = new Date().toLocaleTimeString("pt-BR");
  console.log(`${colors.dim}[${time}]${colors.reset} ${color}${colors.bold}[${tag}]${colors.reset} ${message}`);
}

function run(command, options = {}) {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "pipe", ...options }).trim();
  } catch (error) {
    if (options.throwOnError) throw error;
    return null;
  }
}

// Verifica se o repositório git é válido
function checkGitRepo() {
  const isRepo = run("git rev-parse --is-inside-work-tree");
  if (!isRepo) {
    log("ERRO", "Este diretório não é um repositório git válido.", colors.red);
    process.exit(1);
  }
}

// Verifica se há merge ou rebase em andamento para segurança
function isMergeInProgress() {
  const gitDir = run("git rev-parse --git-dir") || ".git";
  return (
    existsSync(resolve(gitDir, "MERGE_HEAD")) ||
    existsSync(resolve(gitDir, "REBASE_HEAD")) ||
    existsSync(resolve(gitDir, "CHERRY_PICK_HEAD"))
  );
}

// Obtém branch atual
function getCurrentBranch() {
  return run("git rev-parse --abbrev-ref HEAD") || "main";
}

// Gera mensagem semântica e inteligente
function generateCommitMessage(statusLines) {
  const files = statusLines
    .map((l) => l.slice(3).trim())
    .filter(Boolean);

  if (files.length === 0) return null;

  // Classifica por escopo
  const scopes = new Set();
  const types = new Set();

  for (const f of files) {
    const lower = f.toLowerCase();
    if (lower.includes("reservas")) {
      scopes.add("reservas");
      types.add("feat");
    } else if (lower.includes("visitantes") || lower.includes("portaria")) {
      scopes.add("visitantes");
      types.add("feat");
    } else if (lower.includes("ocorrencias")) {
      scopes.add("ocorrencias");
      types.add("feat");
    } else if (lower.includes("dashboard") || lower.includes("painel/page")) {
      scopes.add("dashboard");
      types.add("feat");
    } else if (lower.includes("components/") || lower.includes("ui.tsx") || lower.includes("icon.tsx")) {
      scopes.add("ui");
      types.add("style");
    } else if (lower.includes("db/") || lower.includes("schema.ts")) {
      scopes.add("db");
      types.add("chore");
    } else if (lower.includes("auth") || lower.includes("rbac")) {
      scopes.add("auth");
      types.add("security");
    } else if (lower.includes("scripts/")) {
      scopes.add("scripts");
      types.add("chore");
    } else if (lower.includes(".md")) {
      scopes.add("docs");
      types.add("docs");
    } else {
      scopes.add("sistema");
      types.add("feat");
    }
  }

  const primaryScope = Array.from(scopes)[0] || "sistema";
  const primaryType = Array.from(types)[0] || "feat";

  const scopeLabel = scopes.size === 1 ? primaryScope : `${primaryScope}+${scopes.size - 1}`;
  const actionDescription = getActionDescription(primaryScope, files.length);

  const title = `${primaryType}(${scopeLabel}): ${actionDescription}`;
  
  // Detalhes dos arquivos alterados
  const fileSummary = files.slice(0, 8).map((f) => `  - ${f}`).join("\n");
  const extra = files.length > 8 ? `\n  ... e mais ${files.length - 8} arquivos` : "";

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const body = `Arquivos atualizados (${now}):\n${fileSummary}${extra}\n\nAutomated-by: Zeladoria Auto-Commit Engine`;

  return { title, body };
}

function getActionDescription(scope, count) {
  const map = {
    reservas: "melhorias nas áreas e fluxo de agendamentos",
    visitantes: "atualização no controle de acesso e autorizações",
    ocorrencias: "ajustes no registro e acompanhamento de ocorrências",
    dashboard: "aprimoramento do painel e visão executiva",
    ui: "refinamento visual de componentes e navegação",
    db: "atualização de schema e persistência",
    auth: "ajustes de perfis e permissões de segurança",
    scripts: "atualização de utilitários e automações",
    docs: "atualização de documentação",
    sistema: `atualizações e melhorias gerais [${count} ${count === 1 ? "arquivo" : "arquivos"}]`,
  };
  return map[scope] || `atualização contínua [${count} arquivos]`;
}

// Executa ciclo de commit
function processCommit() {
  if (isMergeInProgress()) {
    log("ALERTA", "Merge ou rebase em andamento. Ignorando commit automático para evitar conflitos.", colors.yellow);
    return false;
  }

  const statusRaw = run("git status --porcelain");
  if (!statusRaw) {
    return false;
  }

  const lines = statusRaw.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;

  const commitMsg = generateCommitMessage(lines);
  if (!commitMsg) return false;

  log("DETECTADO", `${lines.length} ${lines.length === 1 ? "arquivo alterado" : "arquivos alterados"}:`, colors.blue);
  for (const line of lines.slice(0, 6)) {
    console.log(`  ${colors.dim}${line}${colors.reset}`);
  }
  if (lines.length > 6) {
    console.log(`  ${colors.dim}... e mais ${lines.length - 6} arquivos${colors.reset}`);
  }

  if (dryRun) {
    log("DRY-RUN", `Commit seria: "${commitMsg.title}"`, colors.yellow);
    return true;
  }

  // 1. Git add
  log("GIT", "Adicionando alterações ao stage (git add -A)...", colors.cyan);
  run("git add -A");

  // 2. Git commit
  const fullMessage = `${commitMsg.title}\n\n${commitMsg.body}`;
  log("COMMIT", `Criando commit: "${commitMsg.title}"`, colors.green);
  
  const commitRes = spawnSync("git", ["commit", "-m", fullMessage], { encoding: "utf-8" });
  if (commitRes.status !== 0) {
    log("AVISO", `Commit cancelado ou nada a commitar: ${commitRes.stderr || commitRes.stdout}`, colors.yellow);
    return false;
  }

  const shortHash = run("git rev-parse --short HEAD");
  log("SUCESSO", `Commit ${colors.bold}${shortHash}${colors.reset} criado com sucesso!`, colors.green);

  // 3. Git push se habilitado
  if (shouldPush) {
    const branch = getCurrentBranch();
    log("PUSH", `Enviando alterações para origin/${branch}...`, colors.magenta);
    const pushRes = spawnSync("git", ["push", "origin", branch], { encoding: "utf-8" });
    if (pushRes.status === 0) {
      log("PUSH-OK", `Alterações sincronizadas com o GitHub/remoto!`, colors.green);
    } else {
      log("PUSH-ERRO", `Não foi possível fazer push: ${pushRes.stderr || pushRes.stdout}`, colors.yellow);
    }
  }

  return true;
}

// Inicia execução
checkGitRepo();

console.log("");
console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   🚀 ZELADORIA CONDOMÍNIO - AUTO-COMMIT ENGINE    ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}`);
console.log(`  ${colors.dim}Branch:${colors.reset}        ${colors.bold}${getCurrentBranch()}${colors.reset}`);
console.log(`  ${colors.dim}Push Remoto:${colors.reset}   ${shouldPush ? colors.green + "ATIVADO (origin/" + getCurrentBranch() + ")" : colors.yellow + "DESATIVADO (--push para ativar)"}${colors.reset}`);
console.log(`  ${colors.dim}Intervalo:${colors.reset}     ${CHECK_INTERVAL_SEC}s`);
console.log(`  ${colors.dim}Modo:${colors.reset}          ${runOnce ? "Execução única (--once)" : "Contínuo com monitoramento automático"}`);
console.log(`${colors.cyan}----------------------------------------------------${colors.reset}\n`);

if (runOnce) {
  const committed = processCommit();
  if (!committed) {
    log("LIMPO", "Nenhuma alteração detectada no repositório. Árvore de trabalho limpa.", colors.green);
  }
  process.exit(0);
}

// Loop de monitoramento contínuo
let isProcessing = false;
let lastChangeTime = 0;
let pendingCommit = false;

// Executa verificação inicial
processCommit();

log("MONITOR", `Aguardando alterações... (Verificando a cada ${CHECK_INTERVAL_SEC}s)`, colors.cyan);

setInterval(() => {
  if (isProcessing) return;

  const status = run("git status --porcelain");
  if (status && status.trim().length > 0) {
    const now = Date.now();
    if (!pendingCommit) {
      pendingCommit = true;
      lastChangeTime = now;
      log("STATUS", "Alteração detectada! Aguardando você terminar de digitar...", colors.yellow);
    } else if (now - lastChangeTime >= DEBOUNCE_SEC * 1000) {
      isProcessing = true;
      try {
        processCommit();
      } catch (err) {
        log("ERRO", `Falha no ciclo: ${err.message}`, colors.red);
      } finally {
        pendingCommit = false;
        isProcessing = false;
        log("MONITOR", `Aguardando novas alterações...`, colors.cyan);
      }
    }
  } else {
    pendingCommit = false;
  }
}, CHECK_INTERVAL_SEC * 1000);

// Tratamento de encerramento gracioso
process.on("SIGINT", () => {
  console.log(`\n${colors.yellow}[ENCERRADO] Auto-commit finalizado.${colors.reset}`);
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.exit(0);
});
