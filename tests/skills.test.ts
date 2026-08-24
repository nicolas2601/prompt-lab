import { describe, expect, it } from "vitest";
import {
  SKILL_PACKS,
  pickSkillPacks,
  buildSystemPrompt,
  AUTO_TARGET_ID,
  getTarget,
} from "@/lib/harness";

describe("skill pack registry", () => {
  it("has unique ids", () => {
    const ids = SKILL_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every pack has a label and at least 5 rules", () => {
    for (const pack of SKILL_PACKS) {
      expect(pack.label.length).toBeGreaterThan(3);
      expect(pack.rules.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps every pack within the token budget (~1000 tokens ≈ 4000 chars)", () => {
    for (const pack of SKILL_PACKS) {
      const size = pack.rules.join("\n").length;
      expect(size).toBeLessThan(4000);
    }
  });
});

describe("pickSkillPacks", () => {
  it("always attaches image craft to image targets", () => {
    const packs = pickSkillPacks(getTarget("midjourney")!, "un logo para mi cafe");
    expect(packs.map((p) => p.id)).toContain("image-craft");
  });

  it("always attaches cinematography to video targets", () => {
    const packs = pickSkillPacks(getTarget("veo-sora")!, "a car chase at night");
    expect(packs.map((p) => p.id)).toContain("video-cinema");
  });

  it("attaches frontend taste when the idea is about UI (English + Spanish)", () => {
    const en = pickSkillPacks(getTarget("claude")!, "build a landing page for my SaaS");
    expect(en.map((p) => p.id)).toContain("frontend-taste");
    const es = pickSkillPacks(getTarget("gpt")!, "una página web para mi negocio");
    expect(es.map((p) => p.id)).toContain("frontend-taste");
  });

  it("attaches motion craft when the idea mentions animation", () => {
    const packs = pickSkillPacks(
      getTarget("claude")!,
      "quiero animaciones suaves para el hero de mi sitio",
    );
    expect(packs.map((p) => p.id)).toContain("motion-craft");
  });

  it("attaches copywriting for marketing asks", () => {
    const packs = pickSkillPacks(getTarget("gpt")!, "un slogan para mi marca de ropa");
    expect(packs.map((p) => p.id)).toContain("copywriting");
  });

  it("returns no packs for a generic text idea", () => {
    const packs = pickSkillPacks(getTarget("claude")!, "summarize this contract");
    expect(packs).toEqual([]);
  });

  it("caps the selection at 2 packs", () => {
    const packs = pickSkillPacks(
      getTarget("claude")!,
      "landing page con animaciones y un slogan para la marca",
    );
    expect(packs.length).toBeLessThanOrEqual(2);
  });
});

describe("buildSystemPrompt with skill packs", () => {
  it("injects matching packs after the target block", () => {
    const prompt = buildSystemPrompt(
      "claude",
      undefined,
      "auto",
      "build a landing page with smooth animations",
    );
    expect(prompt).toContain("Expert knowledge pack");
    expect(prompt.indexOf("Technique rules")).toBeLessThan(
      prompt.indexOf("Expert knowledge pack"),
    );
  });

  it("keeps the static prefix identical with and without packs (prompt caching)", () => {
    const bare = buildSystemPrompt("claude");
    const packed = buildSystemPrompt(
      "claude",
      undefined,
      "auto",
      "a landing page with animations",
    );
    expect(packed.startsWith(bare)).toBe(true);
  });

  it("auto mode also picks packs from the idea text", () => {
    const prompt = buildSystemPrompt(
      AUTO_TARGET_ID,
      undefined,
      "auto",
      "diseña una interfaz para mi dashboard",
    );
    expect(prompt).toContain("Expert knowledge pack");
  });

  it("omits packs when the idea has no domain match", () => {
    const prompt = buildSystemPrompt(
      "claude",
      undefined,
      "auto",
      "resume este contrato legal",
    );
    expect(prompt).not.toContain("Expert knowledge pack");
  });
});
