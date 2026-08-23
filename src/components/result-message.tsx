"use client";

import { motion } from "motion/react";
import { Fragment, useState } from "react";

interface ResultMessageProps {
  text: string;
  streaming: boolean;
}

interface PromptBlock {
  label: string;
  content: string;
}

interface ParsedResponse {
  blocks: PromptBlock[];
  commentary: string;
}

/** Splits the optimizer response into prompt code blocks and the commentary. */
function parseResponse(text: string): ParsedResponse {
  const blocks: PromptBlock[] = [];
  let commentary = text;
  const regex = /```(?:text|txt)?\n([\s\S]*?)(?:```|$)/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      label: index === 0 ? "Optimized prompt" : "Variant",
      content: match[1].trimEnd(),
    });
    commentary = commentary.replace(match[0], "");
    index += 1;
  }
  commentary = commentary
    .replace(/^## Optimized Prompt\s*$/m, "")
    .replace(/^## Variant\s*$/m, "")
    .trim();
  return { blocks, commentary };
}

/** Minimal markdown: ## headings, bullets, **bold**. Enough for our contract. */
function renderCommentary(text: string) {
  return text.split("\n").map((line, i) => {
    const heading = line.match(/^##+\s+(.*)/);
    if (heading) {
      return (
        <p
          key={i}
          className="mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent"
        >
          {heading[1]}
        </p>
      );
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const content = bullet ? bullet[1] : line;
    const parts = content.split(/\*\*(.+?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="font-medium text-foreground">
          {part}
        </strong>
      ) : (
        <Fragment key={j}>{part}</Fragment>
      ),
    );
    if (bullet) {
      return (
        <p key={i} className="flex gap-2 py-0.5 pl-1">
          <span className="text-accent-2">·</span>
          <span>{rendered}</span>
        </p>
      );
    }
    return line.trim() ? (
      <p key={i} className="py-0.5">
        {rendered}
      </p>
    ) : null;
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="pressable rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors duration-200 hover:border-line-strong hover:text-foreground"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ResultMessage({ text, streaming }: ResultMessageProps) {
  const { blocks, commentary } = parseResponse(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-3"
    >
      {blocks.map((block, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-accent/20 bg-surface shadow-[0_0_40px_-18px_rgba(52,224,247,0.35)]"
        >
          <div className="flex items-center justify-between border-b border-line bg-accent-dim px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              {block.label}
            </span>
            <CopyButton value={block.content} />
          </div>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground">
            {block.content}
            {streaming && i === blocks.length - 1 && (
              <span className="animate-pulse text-accent">▍</span>
            )}
          </pre>
        </div>
      ))}

      {commentary && (
        <div className="text-sm leading-relaxed text-muted">
          {renderCommentary(commentary)}
          {streaming && blocks.length === 0 && (
            <span className="animate-pulse text-accent">▍</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
