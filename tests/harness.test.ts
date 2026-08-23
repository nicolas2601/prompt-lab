import { describe, expect, it } from "vitest";
import { TARGETS, getTarget, buildSystemPrompt } from "@/lib/harness";

describe("target registry", () => {
  it("exposes text, image and video categories", () => {
    const categories = new Set(TARGETS.map((t) => t.category));
    expect(categories).toEqual(new Set(["text", "image", "video"]));
  });

  it("has unique ids", () => {
    const ids = TARGETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves a target by id and returns undefined for unknown ids", () => {
    expect(getTarget("claude")?.label).toContain("Claude");
    expect(getTarget("nope")).toBeUndefined();
  });

  it("every target has guidelines and an output shape", () => {
    for (const target of TARGETS) {
      expect(target.guidelines.length).toBeGreaterThanOrEqual(3);
      expect(target.outputShape.length).toBeGreaterThan(10);
    }
  });
});

describe("buildSystemPrompt", () => {
  it("throws on unknown target", () => {
    expect(() => buildSystemPrompt("nope")).toThrow(/Unknown target/);
  });

  it("starts with the static identity so prefix caching applies", () => {
    const a = buildSystemPrompt("claude");
    const b = buildSystemPrompt("midjourney");
    const prefix = a.slice(0, 200);
    expect(b.startsWith(prefix)).toBe(true);
  });

  it("injects target-specific rules", () => {
    const claude = buildSystemPrompt("claude");
    expect(claude).toContain("XML tags");
    const mj = buildSystemPrompt("midjourney");
    expect(mj).toContain("--ar");
  });

  it("appends the user goal when provided and skips it when blank", () => {
    expect(buildSystemPrompt("gpt", "sell shoes")).toContain("sell shoes");
    expect(buildSystemPrompt("gpt", "   ")).not.toContain("stated goal");
  });

  it("forbids manual chain-of-thought for reasoning models", () => {
    expect(buildSystemPrompt("gpt")).toContain("think step by step");
    expect(buildSystemPrompt("claude")).toContain("adaptively");
  });

  it("includes the clarifying questions and refinement protocols", () => {
    const prompt = buildSystemPrompt("claude");
    expect(prompt).toContain("## Questions");
    expect(prompt).toContain("Refinement protocol");
    expect(prompt).toContain("COMPLETE updated prompt");
  });

  it("requires a variant for image and video targets", () => {
    expect(buildSystemPrompt("midjourney")).toContain("## Variant");
  });
});
