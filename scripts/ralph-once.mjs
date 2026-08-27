#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_STATUSES = new Set(["pending", "in_progress"]);
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1_000;

export function selectSingleSubstep(plan) {
  const completedSteps = new Set(
    plan.steps.filter((step) => step.status === "completed").map((step) => step.id),
  );
  const eligibleSteps = plan.steps.filter(
    (step) =>
      ALLOWED_STATUSES.has(step.status) &&
      (step.dependsOn ?? []).every((dependency) => completedSteps.has(dependency)),
  );
  const step = eligibleSteps.find((candidate) => candidate.status === "in_progress") ?? eligibleSteps[0];
  if (!step) return null;

  const substep = (step.substeps ?? []).find((candidate) => candidate.status !== "completed");
  return substep ? { step, substep } : null;
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

export function completedOtherSubsteps(beforePlan, afterPlan, selected) {
  const beforeStep = beforePlan.steps.find((step) => step.id === selected.step.id);
  const afterStep = afterPlan.steps.find((step) => step.id === selected.step.id);
  if (!beforeStep || !afterStep) return ["etapa selecionada removida"];

  return (afterStep.substeps ?? [])
    .filter((after) => {
      const before = (beforeStep.substeps ?? []).find((item) => item.id === after.id);
      return after.id !== selected.substep.id && before?.status !== "completed" && after.status === "completed";
    })
    .map((substep) => substep.id);
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
  return `Execute somente a subetapa \"${selected.substep.title}\" (id: ${selected.substep.id}) da etapa \"${selected.step.title}\" (id: ${selected.step.id}).

Contrato obrigatório:
1. Leia AGENTS.md, project-plan.json e SPEC.md e respeite dependsOn e gates.
2. Não trabalhe em nenhuma outra subetapa e não complete outra subetapa.
3. Se esta for uma pesquisa, registre resultado verificável no campo research/notes e conclua apenas esta pesquisa.
4. Se for implementação, mantenha securityVerification in_progress desde o início e execute as validações aplicáveis.
5. Atualize project-plan.json, inclusive updatedAt, status, agente, evidências reais e limitações.
6. Não crie commit, push, Pull Request ou merge. O piloto deve deixar as alterações locais na branch criada pelo runner para revisão humana.
7. Pare e marque o trabalho como blocked, com motivo objetivo, se faltar credencial, decisão humana, permissão ou dependência externa.
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
    console.error("Outra execução do Ralph piloto está ativa (.ralph-once.lock existe).");
    return 3;
  }

  try {
    const validation = run(process.execPath, ["scripts/validate-plan-gates.mjs"], { cwd: root });
    output(validation);
    if (validation.status !== 0) return 4;

    const beforePlan = readPlan(planPath);
    const selected = selectSingleSubstep(beforePlan);
    if (!selected) {
      const unfinished = beforePlan.steps.filter((step) => step.status !== "completed");
      if (unfinished.length === 0) console.log("Plano concluído: nenhuma subetapa restante.");
      else console.error(`Nenhuma subetapa elegível. Etapas pendentes ou bloqueadas: ${unfinished.map((step) => step.id).join(", ")}`);
      return unfinished.length === 0 ? 0 : 5;
    }

    console.log(`Selecionada: ${selected.step.id} > ${selected.substep.id}`);
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

    const branch = `ralph/${slugBranchPart(selected.step.id)}/${slugBranchPart(selected.substep.id)}`;
    const switchResult = run("git", ["switch", "-c", branch], { cwd: root });
    output(switchResult);
    if (switchResult.status !== 0) return 8;

    const beforeHash = hashFile(planPath);
    const piArgs = ["-p", "--approve", "@project-plan.json", "@SPEC.md", buildPrompt(selected)];
    if (process.env.RALPH_PROVIDER) piArgs.unshift("--provider", process.env.RALPH_PROVIDER);
    if (process.env.RALPH_MODEL) piArgs.unshift("--model", process.env.RALPH_MODEL);
    if (process.env.RALPH_THINKING) piArgs.unshift("--thinking", process.env.RALPH_THINKING);

    const piResult = run(process.env.RALPH_PI_BIN || "pi", piArgs, {
      cwd: root,
      timeout: DEFAULT_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    });
    output(piResult);
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
    const unexpected = completedOtherSubsteps(beforePlan, afterPlan, selected);
    if (unexpected.length > 0) {
      console.error(`Mais de uma subetapa foi concluída: ${unexpected.join(", ")}`);
      return 12;
    }
    const afterStep = afterPlan.steps.find((step) => step.id === selected.step.id);
    const afterSubstep = afterStep?.substeps?.find((substep) => substep.id === selected.substep.id);
    if (!afterSubstep || afterSubstep.status === selected.substep.status) {
      console.error("A subetapa selecionada não avançou de status no project-plan.json.");
      return 13;
    }

    console.log(`Piloto concluído para uma subetapa. Revise a branch ${branch}; nenhum commit, PR ou merge foi criado.`);
    return 0;
  } finally {
    rmSync(lockPath, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
