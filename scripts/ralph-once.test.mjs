import { describe, expect, it } from "vitest";
import { completedOtherSubsteps, selectSingleSubstep, slugBranchPart } from "./ralph-once.mjs";

const plan = (steps) => ({ steps });

describe("Ralph de uma subetapa", () => {
  it("prioriza etapa em progresso e a primeira subetapa não concluída", () => {
    const selected = selectSingleSubstep(plan([
      { id: "base", status: "completed", substeps: [] },
      { id: "pending", status: "pending", dependsOn: ["base"], substeps: [{ id: "p-1", status: "pending" }] },
      { id: "active", status: "in_progress", dependsOn: ["base"], substeps: [{ id: "a-1", status: "completed" }, { id: "a-2", status: "pending" }] },
    ]));
    expect(selected?.step.id).toBe("active");
    expect(selected?.substep.id).toBe("a-2");
  });

  it("não seleciona etapa cuja dependência não terminou", () => {
    const selected = selectSingleSubstep(plan([
      { id: "base", status: "pending", substeps: [{ id: "base-1", status: "pending" }] },
      { id: "blocked", status: "pending", dependsOn: ["base"], substeps: [{ id: "blocked-1", status: "pending" }] },
    ]));
    expect(selected?.substep.id).toBe("base-1");
  });

  it("detecta quando outra subetapa também foi concluída", () => {
    const before = plan([{ id: "step", substeps: [{ id: "one", status: "pending" }, { id: "two", status: "pending" }] }]);
    const after = plan([{ id: "step", substeps: [{ id: "one", status: "completed" }, { id: "two", status: "completed" }] }]);
    const selected = { step: { id: "step" }, substep: { id: "one" } };
    expect(completedOtherSubsteps(before, after, selected)).toEqual(["two"]);
  });

  it("sanitiza IDs usados no nome da branch", () => {
    expect(slugBranchPart("Etapa com espaço/ação")).toBe("etapa-com-espaco-acao");
  });
});
