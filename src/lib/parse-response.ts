export interface PromptBlock {
  label: string;
  content: string;
}

export interface Question {
  question: string;
  options: string[];
}

export interface ParsedResponse {
  blocks: PromptBlock[];
  questions: Question[];
  commentary: string;
  detectedTarget: string | null;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

/**
 * Extracts every `<tag>...</tag>` body. Tag contents are taken verbatim, so
 * markdown fences inside the prompt never break extraction. An unclosed tag
 * (mid-stream) captures to the end of the text.
 */
function extractTagged(
  text: string,
  tag: string,
): { contents: string[]; rest: string } {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const contents: string[] = [];
  let rest = "";
  let cursor = 0;
  for (;;) {
    const start = text.indexOf(open, cursor);
    if (start === -1) {
      rest += text.slice(cursor);
      break;
    }
    rest += text.slice(cursor, start);
    const bodyStart = start + open.length;
    const end = text.indexOf(close, bodyStart);
    const body = end === -1 ? text.slice(bodyStart) : text.slice(bodyStart, end);
    contents.push(body.replace(/^\n+/, "").trimEnd());
    if (end === -1) break;
    cursor = end + close.length;
  }
  return { contents, rest };
}

/** Legacy fallback for threads saved before the tag contract: fenced blocks. */
function extractFenced(text: string): { contents: string[]; rest: string } {
  const regex = /```[a-zA-Z]*\n([\s\S]*?)(?:\n```|$)/g;
  const contents: string[] = [];
  const rest = text.replace(regex, (_match, body: string) => {
    contents.push(body.trimEnd());
    return "";
  });
  return { contents, rest };
}

const QUESTION_LINE = /^\s*\d+\.\s+(.*?)(?:\s*(?:Options|Opciones):\s*(.*))?$/;
const PARTIAL_TAG_AT_END = /<\/?[a-z_]{0,24}>?\s*$/;

/** Splits the optimizer response into prompt blocks, questions and commentary. */
export function parseResponse(text: string): ParsedResponse {
  let commentary = text;

  const targetMatch = commentary.match(/^\*\*Target:\*\*\s*(.+)$/m);
  const detectedTarget = targetMatch?.[1]?.trim() ?? null;
  if (targetMatch) commentary = commentary.replace(targetMatch[0], "");

  const blocks: PromptBlock[] = [];
  const main = extractTagged(commentary, "optimized_prompt");
  const variants = extractTagged(main.rest, "variant");
  commentary = variants.rest;
  for (const content of main.contents) {
    blocks.push({ label: "Prompt optimizado", content });
  }
  for (const content of variants.contents) {
    blocks.push({ label: "Variante", content });
  }

  if (blocks.length === 0) {
    const fenced = extractFenced(commentary);
    if (fenced.contents.length > 0) {
      commentary = fenced.rest;
      fenced.contents.forEach((content, i) =>
        blocks.push({
          label: i === 0 ? "Prompt optimizado" : "Variante",
          content,
        }),
      );
    }
  }

  const questions: Question[] = [];
  if (/^## (?:Questions|Preguntas)/m.test(commentary) && blocks.length === 0) {
    for (const line of commentary.split("\n")) {
      const q = line.match(QUESTION_LINE);
      if (q?.[1]) {
        questions.push({
          question: q[1].trim(),
          options:
            q[2]
              ?.split("|")
              .map((option) => option.trim())
              .filter(Boolean) ?? [],
        });
      }
    }
    commentary = "";
  } else {
    commentary = commentary
      .replace(/^## Optimized Prompt\s*$/m, "")
      .replace(/^## Variant\s*$/m, "")
      .replace(PARTIAL_TAG_AT_END, "")
      .trim();
  }

  return { blocks, questions, commentary, detectedTarget };
}
