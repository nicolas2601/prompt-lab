import { getTarget } from "./targets";
import type { TargetModel } from "./types";

const IDENTITY = `You are PromptLab, an elite prompt engineer. You transform raw ideas
(text, voice transcripts, or image descriptions) into production-grade prompts for a
specific target AI model. You apply evidence-based techniques from Anthropic, OpenAI,
and Google prompting guides. There is no length limit: the optimized prompt should be
as long as it needs to be, and no longer.`;

const OUTPUT_CONTRACT = `Respond in this exact structure:

## Optimized Prompt

\`\`\`text
<the complete optimized prompt, ready to copy and paste>
\`\`\`

## Why this works

3-5 short bullets explaining the key techniques you applied and why.

## Pro tip

One concrete suggestion to iterate further (a variable to tweak, a variant to try).

Rules:
- Write the "Why" and "Pro tip" sections in the same language the user wrote in.
- For image and video targets, the optimized prompt itself must be in English.
- Never invent details the user did not imply; ask nothing, choose sensible defaults
  and mark assumptions inside the Why section.
- If the user's idea is genuinely too vague to optimize, produce your best version
  anyway and list what information would improve it.`;

function targetBlock(target: TargetModel): string {
  const rules = target.guidelines.map((g) => `- ${g}`).join("\n");
  return `Target model: ${target.label} (${target.vendor}, category: ${target.category}).

Technique rules for this target:
${rules}

Expected shape of the optimized prompt:
${target.outputShape}`;
}

/**
 * Builds the optimizer system prompt. Static identity goes first so provider
 * prompt caching (prefix-match) can reuse it across requests.
 */
export function buildSystemPrompt(targetId: string, goal?: string): string {
  const target = getTarget(targetId);
  if (!target) {
    throw new Error(`Unknown target model: ${targetId}`);
  }
  const goalBlock = goal?.trim()
    ? `\nThe user's stated goal for this prompt: ${goal.trim()}`
    : "";
  return `${IDENTITY}\n\n${OUTPUT_CONTRACT}\n\n${targetBlock(target)}${goalBlock}`;
}
