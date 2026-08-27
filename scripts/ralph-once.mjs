#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_STATUSES = new Set(["pending", "in_progress"]);
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1_000;
export const DEFAULT_PI_CONFIG = Object.freeze({
  provider: "openai-codex",
  model: "gpt-5.6-luna",
  thinking: "low",
});

function preparationIds(step) {
  const declared = step.gates?.preImplementation?.requiredSubsteps ?? [];
  const inferred = (step.substeps ?? [])
    .filter((substep) => /-(research-code|research-docs|define-guardrails)$/.test(substep.id))
    .map((substep) => substep.id);
  return [...new Set([...declared, ...inferred])];
}

function securityIds(step) {
  return new Set([
    step.securityVerification?.id,
    ...(step.substeps ?? [])
      .filter((substep) => substep.id.endsWith("-security-verification"))
      .map((substep) => substep.id),
  ].filter(Boolean));
}

export function selectSingleTask(plan) {
  const completedSteps = new Set(
    plan.steps.filter((step) => step.status === "completed").map((step) => step.id),
  );
  const eligibleSteps = plan.steps.filter(
    (step) =>
      ALLOWED_STATUSES.has(step.status) &&
      (step.dependsOn ?? []).every((dependency) => completedSteps.has(dependency)),
  );

  const selections = eligibleSteps.map((step) => {
    const preparation = new Set(preparationIds(step));
    const security = securityIds(step);
    const tasks = (step.substeps ?? []).filter(
      (substep) => !preparation.has(substep.id) && !security.has(substep.id),
    );
    const task = tasks.find((candidate) => candidate.status === "in_progress") ??
      tasks.find((candidate) => candidate.status === "pending");
    return task
      ? {
          step,
          task,
          pendingPreparation: (step.substeps ?? []).filter(
            (substep) => preparation.has(substep.id) && substep.status !== "completed",
          ),
        }
      : null;
  }).filter(Boolean);

  return selections.find((selection) => selection.step.status === "in_progress") ?? selections[0] ?? null;
}

export function slugBranchPart(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
}

export function unexpectedCompletedSubsteps(beforePlan, afterPlan, selected) {
  const beforeStep = beforePlan.steps.find((step) => step.id === selected.step.id);
  const afterStep = afterPlan.steps.find((step) => step.id === selected.step.id);
  if (!beforeStep || !afterStep) return ["etapa selecionada removida"];

  const allowed = new Set([
    selected.task.id,
    ...preparationIds(beforeStep),
    ...securityIds(beforeStep),
  ]);
  return (afterStep.substeps ?? [])
    .filter((after) => {
      const before = (beforeStep.substeps ?? []).find((item) => item.id === after.id);
      return !allowed.has(after.id) && before?.status !== "completed" && after.status === "completed";
    })
    .map((substep) => substep.id);
}

export function buildPiArgs(selected, env = process.env) {
  const provider = env.RALPH_PROVIDER || DEFAULT_PI_CONFIG.provider;
  const model = env.RALPH_MODEL || DEFAULT_PI_CONFIG.model;
  const thinking = env.RALPH_THINKING || DEFAULT_PI_CONFIG.thinking;
  return [
    "--provider", provider,
    "--model", model,
    "--thinking", thinking,
    "-p",
    "--approve",
    "@project-plan.json",
    "@SPEC.md",
    buildPrompt(selected),
  ];
}

function readPlan(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", ...options });
}

function output(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function buildPrompt(selected) {
  const preparation = selected.pendingPreparation.length > 0
    ? selected.pendingPreparation.map((substep) => `${substep.id}: ${substep.title}`).join("\n")
    : "nenhuma; os gates preparatórios já estão concluídos";

  return `Execute uma única TAREFA FUNCIONAL: "${selected.task.title}" (id: ${selected.task.id}) da etapa "${selected.step.title}" (id: ${selected.step.id}).

Pesquisas e guardrails não são tarefas separadas: são fases obrigatórias desta mesma execução.
Preparação ainda pendente:\n${preparation}

Contrato obrigatório:
1. Leia AGENTS.md, project-plan.json e SPEC.md e confirme dependsOn.
2. Antes de alterar código, conclua e registre, na ordem, todos os subpassos preparatórios pendentes (research-code, research-docs e define-guardrails) e feche o gate preImplementation. Não encerre apenas porque uma pesquisa terminou.
3. Implemente somente a tarefa funcional selecionada. Não implemente nem complete outra tarefa funcional.
4. Mantenha securityVerification in_progress durante a implementação e execute as validações e verificações de segurança aplicáveis. Subpassos preparatórios e segurança da mesma etapa podem ser atualizados nesta execução.
5. Atualize project-plan.json, inclusive updatedAt, status, agente, comandos realmente executados, evidências e limitações. Não invente evidência.
6. Não crie commit, push, Pull Request ou merge. Deixe as alterações locais na branch criada pelo runner para revisão humana.
7. Se faltar credencial, escolha de provedor, permissão, decisão humana ou dependência externa, marque a etapa/subpasso como blocked com motivo objetivo e pare sem inventar implementação.
8. Ao final, produza relatório conciso com arquivos, código reutilizado, documentação, guardrails, comandos, segurança e limitações.

Não use uma marca textual de COMPLETE; o runner validará project-plan.json.`;
}

export function main(argv = process.argv.slice(2)) {
  const allowed = new Set(["--dry-run"]);
  const unknown = argv.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) {
    console.error(`Uso: npm run ralph:once -- [--dry-run]\nArgumento inválido: ${unknown.join(", ")}`);
    return 2;
  }

  const dryRun = argv.includes("--dry-run");
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const planPath = resolve(root, "project-plan.json");
  const lockPath = resolve(root, ".ralph-once.lock");

  try {
    mkdirSync(lockPath);
  } catch {
    console.error("Outra execução do Ralph está ativa (.ralph-once.lock existe).");
    return 3;
  }

  try {
    const validation = run(process.execPath, ["scripts/validate-plan-gates.mjs"], { cwd: root });
    output(validation);
    if (validation.status !== 0) return 4;

    const beforePlan = readPlan(planPath);
    const selected = selectSingleTask(beforePlan);
    if (!selected) {
      const unfinished = beforePlan.steps.filter((step) => step.status !== "completed");
      if (unfinished.length === 0) console.log("Plano concluído: nenhuma tarefa restante.");
      else console.error(`Nenhuma tarefa funcional elegível. Etapas pendentes ou bloqueadas: ${unfinished.map((step) => step.id).join(", ")}`);
      return unfinished.length === 0 ? 0 : 5;
    }

    console.log(`Tarefa selecionada: ${selected.step.id} > ${selected.task.id}`);
    const pendingIds = selected.pendingPreparation.map((substep) => substep.id);
    console.log(`Preparação pendente nesta execução: ${pendingIds.join(", ") || "nenhuma"}`);
    console.log(`Modelo: ${process.env.RALPH_PROVIDER || DEFAULT_PI_CONFIG.provider}/${process.env.RALPH_MODEL || DEFAULT_PI_CONFIG.model} (thinking ${process.env.RALPH_THINKING || DEFAULT_PI_CONFIG.thinking})`);
    if (dryRun) return 0;

    const branchCheck = run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd: root });
    if (branchCheck.status !== 0 || branchCheck.stdout.trim() !== "main") {
      console.error("Execução real exige a branch main como ponto de partida.");
      return 6;
    }
    const status = run("git", ["status", "--porcelain"], { cwd: root });
    if (status.status !== 0 || status.stdout.trim()) {
      console.error("Execução real exige working tree limpa.");
      return 7;
    }

    const branch = `ralph/${slugBranchPart(selected.step.id)}/${slugBranchPart(selected.task.id)}`;
    const switchResult = run("git", ["switch", "-c", branch], { cwd: root });
    output(switchResult);
    if (switchResult.status !== 0) return 8;

    const beforeHash = hashFile(planPath);
    const piResult = run("pi", buildPiArgs(selected), {
      cwd: root,
      timeout: DEFAULT_TIMEOUT_MS,
      stdio: "inherit",
    });
    if (piResult.error || piResult.status !== 0) {
      console.error(`pi falhou ou excedeu 60 minutos (código ${piResult.status ?? "indisponível"}). Alterações foram preservadas em ${branch}.`);
      return 9;
    }
    if (beforeHash === hashFile(planPath)) {
      console.error("pi terminou sem atualizar project-plan.json; alterações foram preservadas para diagnóstico.");
      return 10;
    }

    const afterValidation = run(process.execPath, ["scripts/validate-plan-gates.mjs"], { cwd: root });
    output(afterValidation);
    if (afterValidation.status !== 0) return 11;

    const afterPlan = readPlan(planPath);
    const unexpected = unexpectedCompletedSubsteps(beforePlan, afterPlan, selected);
    if (unexpected.length > 0) {
      console.error(`Outra tarefa funcional foi concluída indevidamente: ${unexpected.join(", ")}`);
      return 12;
    }
    const afterStep = afterPlan.steps.find((step) => step.id === selected.step.id);
    const afterTask = afterStep?.substeps?.find((substep) => substep.id === selected.task.id);
    const blocked = afterStep?.status === "blocked" ||
      afterTask?.status === "blocked" ||
      (afterStep?.substeps ?? []).some(
        (substep) => preparationIds(afterStep).includes(substep.id) && substep.status === "blocked",
      );
    if (!blocked && (!afterTask || afterTask.status === selected.task.status)) {
      console.error("A tarefa funcional selecionada não avançou de status no project-plan.json.");
      return 13;
    }

    if (blocked) console.log(`Tarefa bloqueada com registro no plano. Revise a branch ${branch}.`);
    else console.log(`Tarefa concluída pelo piloto. Revise a branch ${branch}; nenhum commit, PR ou merge foi criado.`);
    return 0;
  } finally {
    rmSync(lockPath, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
