import { describe, expect, it } from "vitest";
import { parseResponse } from "@/lib/parse-response";

describe("parseResponse", () => {
  it("extracts the detected target line", () => {
    const { detectedTarget } = parseResponse(
      "**Target:** GPT / o-series (OpenAI) (text)\n\nrest",
    );
    expect(detectedTarget).toBe("GPT / o-series (OpenAI) (text)");
  });

  it("extracts tagged prompt and variant blocks", () => {
    const text = [
      "## Optimized Prompt",
      "",
      "<optimized_prompt>",
      "# Role",
      "You are a designer.",
      "</optimized_prompt>",
      "",
      "## Variant",
      "",
      "<variant>",
      "Alternative take.",
      "</variant>",
      "",
      "## Why this works",
      "- **Specific:** because reasons.",
    ].join("\n");
    const { blocks, commentary, questions } = parseResponse(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].label).toBe("Prompt optimizado");
    expect(blocks[0].content).toBe("# Role\nYou are a designer.");
    expect(blocks[1].label).toBe("Variante");
    expect(questions).toHaveLength(0);
    expect(commentary).toContain("Why this works");
    expect(commentary).not.toContain("<optimized_prompt>");
  });

  it("keeps markdown fences inside a tagged prompt intact", () => {
    const text = [
      "<optimized_prompt>",
      "# Output Format",
      "```html",
      "<!DOCTYPE html>",
      "```",
      "```css",
      ":root { --x: 1; }",
      "```",
      "</optimized_prompt>",
      "",
      "## Why this works",
      "- fences survived",
    ].join("\n");
    const { blocks, commentary } = parseResponse(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toContain("```html");
    expect(blocks[0].content).toContain("```css");
    expect(commentary).not.toContain("```");
  });

  it("captures an unclosed tag to the end while streaming", () => {
    const text = "<optimized_prompt>\npartial content so far";
    const { blocks } = parseResponse(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe("partial content so far");
  });

  it("strips a trailing partially-streamed tag from commentary", () => {
    const { commentary, blocks } = parseResponse(
      "## Optimized Prompt\n<optimized_pro",
    );
    expect(blocks).toHaveLength(0);
    expect(commentary).not.toContain("<optimized_pro");
  });

  it("falls back to legacy fenced blocks for old threads", () => {
    const text = "```text\nlegacy prompt\n```\n\n## Why this works\n- bullet";
    const { blocks } = parseResponse(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe("legacy prompt");
  });

  it("parses questions with options in English and Spanish", () => {
    const text = [
      "## Questions",
      "",
      "1. ¿Qué tipo de página? Options: Landing | Blog | Tienda",
      "2. ¿Qué estilo? Opciones: Minimalista | Colorido",
    ].join("\n");
    const { questions, commentary } = parseResponse(text);
    expect(questions).toHaveLength(2);
    expect(questions[0].options).toEqual(["Landing", "Blog", "Tienda"]);
    expect(questions[1].options).toEqual(["Minimalista", "Colorido"]);
    expect(commentary).toBe("");
  });

  it("ignores questions when a prompt block exists", () => {
    const text =
      "<optimized_prompt>\nfinal\n</optimized_prompt>\n## Questions\n1. ¿Algo? Options: a | b";
    const { questions, blocks } = parseResponse(text);
    expect(blocks).toHaveLength(1);
    expect(questions).toHaveLength(0);
  });
});
