"use client";

import { motion } from "motion/react";
import { Fragment, useState } from "react";
import { getTarget } from "@/lib/harness";
import { RunPanel } from "./run-panel";

interface ResultMessageProps {
  text: string;
  streaming: boolean;
  targetId: string;
  version: number;
  onAnswer: (answer: string) => void;
}

interface PromptBlock {
  label: string;
  content: string;
}

interface Question {
  question: string;
  options: string[];
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

/** Splits the optimizer response into prompt blocks, questions and commentary. */
function parseResponse(text: string): {
  blocks: PromptBlock[];
  questions: Question[];
  commentary: string;
} {
  const blocks: PromptBlock[] = [];
  let commentary = text;

  const codeRegex = /```(?:text|txt)?\n([\s\S]*?)(?:```|$)/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = codeRegex.exec(text)) !== null) {
    blocks.push({
      label: index === 0 ? "Optimized prompt" : "Variant",
      content: match[1].trimEnd(),
    });
    commentary = commentary.replace(match[0], "");
    index += 1;
  }

  const questions: Question[] = [];
  if (/^## Questions/m.test(commentary)) {
    const lines = commentary.split("\n");
    for (const line of lines) {
      const q = line.match(/^\s*\d+\.\s+(.*?)(?:\s*Options:\s*(.*))?$/);
      if (q?.[1]) {
        questions.push({
          question: q[1].trim(),
          options:
            q[2]
              ?.split("|")
              .map((o) => o.trim())
              .filter(Boolean) ?? [],
        });
      }
    }
    commentary = "";
  } else {
    commentary = commentary
      .replace(/^## Optimized Prompt\s*$/m, "")
      .replace(/^## Variant\s*$/m, "")
      .trim();
  }

  return { blocks, questions, commentary };
}

/** Minimal markdown: ## headings, bullets, **bold**. Enough for our contract. */
function renderCommentary(text: string) {
  return text.split("\n").map((line, i) => {
    const heading = line.match(/^##+\s+(.*)/);
    if (heading) {
      return (
        <p
          key={i}
          className="mt-5 mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint"
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
        <strong key={j} className="font-medium text-ink">
          {part}
        </strong>
      ) : (
        <Fragment key={j}>{part}</Fragment>
      ),
    );
    if (bullet) {
      return (
        <p key={i} className="flex gap-2 py-0.5">
          <span className="text-faint">—</span>
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
      className="pressable cursor-pointer px-2 py-1 text-xs text-background/60 transition-colors duration-200 hover:text-background"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ExportButton({ content }: { content: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "prompt.md";
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="pressable cursor-pointer px-2 py-1 text-xs text-background/60 transition-colors duration-200 hover:text-background"
    >
      Export
    </button>
  );
}

export function ResultMessage({
  text,
  streaming,
  targetId,
  version,
  onAnswer,
}: ResultMessageProps) {
  const { blocks, questions, commentary } = parseResponse(text);
  const isText = getTarget(targetId)?.category === "text";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-4"
    >
      {questions.length > 0 && (
        <div className="border border-line-strong bg-surface p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Quick questions before optimizing
          </p>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="mb-1.5 text-sm text-ink">{q.question}</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAnswer(option)}
                      className="pressable cursor-pointer border border-line-strong px-2.5 py-1 text-[13px] text-muted transition-colors duration-200 hover:bg-ink hover:text-background"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Tap an option or answer in your own words below.
          </p>
        </div>
      )}

      {blocks.map((block, i) => (
        <div key={i} className="bg-ink text-background">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-background/70">
                {block.label}
              </span>
              {block.label === "Optimized prompt" && (
                <span className="font-mono text-[11px] text-background/40">
                  v{version} · ≈{estimateTokens(block.content)} tokens
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ExportButton content={block.content} />
              <CopyButton value={block.content} />
            </div>
          </div>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-[13px] leading-relaxed">
            {block.content}
            {streaming && i === blocks.length - 1 && (
              <span className="animate-pulse">▍</span>
            )}
          </pre>
        </div>
      ))}

      {commentary && (
        <div className="text-sm leading-relaxed text-muted">
          {renderCommentary(commentary)}
          {streaming && blocks.length === 0 && questions.length === 0 && (
            <span className="animate-pulse text-ink">▍</span>
          )}
        </div>
      )}

      {!streaming && isText && blocks[0] && (
        <RunPanel prompt={blocks[0].content} targetId={targetId} />
      )}
    </motion.div>
  );
}
