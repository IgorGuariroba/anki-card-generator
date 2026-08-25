import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readPlan(cwd: string): any {
  return JSON.parse(readFileSync(join(cwd, "project-plan.json"), "utf8"));
}

function currentStep(plan: any) {
  return plan.steps.find((step: any) => step.status === "in_progress") ?? plan.steps.at(-1);
}

function git(cwd: string, args: string[]) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 200_000 }).trim();
  } catch {
    return "Não foi possível consultar o Git.";
  }
}

function buildReport(cwd: string) {
  const plan = readPlan(cwd);
  const step = currentStep(plan);
  const completed = step?.substeps?.filter((item: any) => item.status === "completed").map((item: any) => item.title) ?? [];
  const pending = step?.substeps?.filter((item: any) => item.status !== "completed").map((item: any) => item.title) ?? [];
  const security = step?.securityVerification;
  const checks = security?.requiredChecks?.map((check: any) => `${check.name}: ${check.status}`).join("; ") ?? "Não registrado";
  return [
    `## Relatório da implementação`,
    `- Etapa: ${step?.title ?? "não identificada"} (${step?.status ?? "desconhecida"})`,
    `- Arquivos alterados:`,
    "```text",
    git(cwd, ["diff", "--name-only"]),
    "```",
    `- Pesquisa de código: ${step?.research?.code ?? "não registrada"}`,
    `- Documentação: ${step?.research?.docs ?? "não registrada"}`,
    `- Guardrails: ${(step?.research?.guardrails ?? []).join(" | ") || "não registrados"}`,
    `- Subpassos concluídos: ${completed.join("; ") || "nenhum"}`,
    `- Subpassos pendentes: ${pending.join("; ") || "nenhum"}`,
    `- Segurança: ${checks}`,
    `- Limitações: evidências são lidas do plano e do diff; a extensão não presume que comandos foram executados.`,
  ].join("\n");
}

function projectReportExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    if (!event.prompt) return;
    return {
      message: {
        customType: "project-report-guardrail",
        content: "Ao concluir esta implementação, atualize project-plan.json e entregue relatório com código reutilizado, documentação consultada, guardrails, testes de segurança, comandos e limitações. Não declare evidência sem execução ou registro verificável.",
        display: false,
      },
    };
  });

  pi.on("agent_settled", async (_event, ctx) => {
    try {
      const step = currentStep(readPlan(ctx.cwd));
      const incomplete = step?.status !== "completed" || step?.securityVerification?.status !== "completed";
      if (incomplete) ctx.ui.notify(`Relatório obrigatório: ${step?.title ?? "etapa atual"} ainda possui gates pendentes. Use /report.`, "warning");
    } catch {
      ctx.ui.notify("Relatório obrigatório: project-plan.json não pôde ser validado.", "warning");
    }
  });

  pi.registerCommand("report", {
    description: "Exibe o relatório auditável da implementação atual",
    handler: async (_args, ctx) => {
      const report = buildReport(ctx.cwd);
      ctx.ui.setWidget("project-report", report.split("\n"));
      ctx.ui.notify("Relatório gerado no widget project-report.", "info");
    },
  });
}

export default projectReportExtension;
