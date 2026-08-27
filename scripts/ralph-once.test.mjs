import { describe, expect, it } from "vitest";
import {
  buildPiArgs,
  DEFAULT_PI_CONFIG,
  selectSingleTask,
  slugBranchPart,
  unexpectedCompletedSubsteps,
} from "./ralph-once.mjs";

const plan = (steps) => ({ steps });

function plannedStep(overrides = {}) {
  return {
    id: "providers",
    status: "pending",
    dependsOn: ["base"],
    gates: {
      preImplementation: { requiredSubsteps: ["research-code", "research-docs", "guardrails"] },
    },
    securityVerification: { id: "security" },
    substeps: [
      { id: "research-code", status: "pending" },
      { id: "research-docs", status: "pending" },
      { id: "guardrails", status: "pending" },
      { id: "implementation", status: "pending", title: "Implementar integração" },
      { id: "security", status: "pending" },
    ],
    ...overrides,
  };
}

describe("Ralph de uma tarefa completa", () => {
  it("seleciona a tarefa funcional e carrega pesquisas como preparação da mesma execução", () => {
    const selected = selectSingleTask(plan([
      { id: "base", status: "completed", substeps: [] },
      plannedStep(),
    ]));

    expect(selected?.task.id).toBe("implementation");
    expect(selected?.pendingPreparation.map((item) => item.id)).toEqual([
      "research-code",
      "research-docs",
      "guardrails",
    ]);
  });

  it("infere pesquisas e guardrails pelos IDs quando o gate antigo não declara requiredSubsteps", () => {
    const selected = selectSingleTask(plan([
      { id: "base", status: "completed", substeps: [] },
      {
        id: "legacy",
        status: "pending",
        dependsOn: ["base"],
        gates: { preImplementation: { status: "pending" } },
        securityVerification: { id: "legacy-security-verification" },
        substeps: [
          { id: "legacy-research-code", status: "completed" },
          { id: "legacy-research-docs", status: "pending" },
          { id: "legacy-define-guardrails", status: "pending" },
          { id: "legacy-implementation", status: "pending" },
          { id: "legacy-security-verification", status: "pending" },
        ],
      },
    ]));
    expect(selected?.task.id).toBe("legacy-implementation");
    expect(selected?.pendingPreparation.map((item) => item.id)).toEqual([
      "legacy-research-docs",
      "legacy-define-guardrails",
    ]);
  });

  it("não seleciona tarefa cuja dependência não terminou", () => {
    const selected = selectSingleTask(plan([
      { id: "base", status: "pending", substeps: [{ id: "base-security-verification", status: "pending" }] },
      plannedStep(),
    ]));
    expect(selected).toBeNull();
  });

  it("permite concluir preparação e segurança, mas detecta outra tarefa funcional", () => {
    const before = plan([{
      ...plannedStep(),
      substeps: [...plannedStep().substeps, { id: "second-feature", status: "pending" }],
    }]);
    const after = plan([{
      ...plannedStep(),
      substeps: [
        { id: "research-code", status: "completed" },
        { id: "research-docs", status: "completed" },
        { id: "guardrails", status: "completed" },
        { id: "implementation", status: "completed" },
        { id: "security", status: "completed" },
        { id: "second-feature", status: "completed" },
      ],
    }]);
    const selected = { step: { id: "providers" }, task: { id: "implementation" } };
    expect(unexpectedCompletedSubsteps(before, after, selected)).toEqual(["second-feature"]);
  });

  it("usa Luna do Codex com thinking low por padrão", () => {
    const selected = {
      step: { id: "providers", title: "Provedores" },
      task: { id: "implementation", title: "Implementar" },
      pendingPreparation: [],
    };
    const args = buildPiArgs(selected, {});
    expect(DEFAULT_PI_CONFIG).toEqual({ provider: "openai-codex", model: "gpt-5.6-luna", thinking: "low" });
    expect(args.slice(0, 6)).toEqual([
      "--provider", "openai-codex",
      "--model", "gpt-5.6-luna",
      "--thinking", "low",
    ]);
  });

  it("permite override de runtime apenas por variáveis de ambiente", () => {
    const selected = {
      step: { id: "providers", title: "Provedores" },
      task: { id: "implementation", title: "Implementar" },
      pendingPreparation: [],
    };
    expect(buildPiArgs(selected, {
      RALPH_PROVIDER: "openrouter",
      RALPH_MODEL: "openai/gpt-5.6-luna",
      RALPH_THINKING: "medium",
    }).slice(0, 6)).toEqual([
      "--provider", "openrouter",
      "--model", "openai/gpt-5.6-luna",
      "--thinking", "medium",
    ]);
  });

  it("sanitiza IDs usados no nome da branch", () => {
    expect(slugBranchPart("Etapa com espaço/ação")).toBe("etapa-com-espaco-acao");
  });
});
