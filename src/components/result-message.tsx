"use client";

import { motion } from "motion/react";
import { Fragment, useState } from "react";
import { TARGETS, getTarget } from "@/lib/harness";
import {
  estimateTokens,
  parseResponse,
  type Question,
} from "@/lib/parse-response";
import { RunPanel } from "./run-panel";

interface ResultMessageProps {
  text: string;
  streaming: boolean;
  interactive: boolean;
  targetId: string;
  version: number;
  onAnswer: (answer: string) => void;
}

/** Decides whether the optimized prompt can be executed against a text model. */
function canRunPrompt(targetId: string, detectedTarget: string | null): boolean {
  const manual = getTarget(targetId);
  if (manual) return manual.category === "text";
  if (!detectedTarget) return false;
  return TARGETS.some(
    (t) => t.category === "text" && detectedTarget.includes(t.label),
  );
}

function renderInline(content: string, keyPrefix: string) {
  return content.split(/(\*\*.+?\*\*|`[^`]+`)/g).map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${j}`} className="font-medium text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-${j}`}
          className="rounded-sm bg-surface px-1 py-px font-mono text-[12px] text-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${j}`}>{part}</Fragment>;
  });
}

/** Minimal markdown: ## headings, bullets, ordered lists, **bold**, `code`. */
function renderCommentary(text: string) {
  return text.split("\n").map((line, i) => {
    if (/^\s*```/.test(line)) return null;
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
    const ordered = line.match(/^\s*(\d+)\.\s+(.*)/);
    const marker = bullet ? "—" : ordered ? `${ordered[1]}.` : null;
    const content = bullet ? bullet[1] : ordered ? ordered[2] : line;
    const rendered = renderInline(content, `l${i}`);
    if (marker) {
      return (
        <p key={i} className="flex gap-2 py-0.5">
          <span className="shrink-0 text-faint">{marker}</span>
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

interface QuestionsCardProps {
  questions: Question[];
  interactive: boolean;
  onAnswer: (answer: string) => void;
}

/**
 * Collects one choice per question locally and submits the whole batch as a
 * single message — never one request per click.
 */
function QuestionsCard({ questions, interactive, onAnswer }: QuestionsCardProps) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const answered = questions.filter((_, i) => selected[i]).length;

  function toggle(i: number, option: string) {
    if (!interactive) return;
    setSelected((prev) => ({
      ...prev,
      [i]: prev[i] === option ? "" : option,
    }));
  }

  function submit() {
    const answer = questions
      .map((q, i) => (selected[i] ? `${q.question} → ${selected[i]}` : null))
      .filter(Boolean)
      .join("\n");
    if (answer) onAnswer(answer);
  }

  return (
    <div className="border border-line-strong bg-surface p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
        Preguntas rápidas antes de optimizar
      </p>
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="mb-1.5 text-sm text-ink">{q.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((option) => {
                const active = selected[i] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!interactive}
                    aria-pressed={active}
                    onClick={() => toggle(i, option)}
                    className={`pressable border px-2.5 py-1 text-[13px] transition-colors duration-200 ${
                      active
                        ? "border-ink bg-ink text-background"
                        : "border-line-strong text-muted"
                    } ${
                      interactive
                        ? "cursor-pointer hover:border-ink"
                        : "cursor-default opacity-60"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {interactive && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={answered === 0}
            onClick={submit}
            className={`pressable border px-3 py-1.5 text-[13px] transition-colors duration-200 ${
              answered > 0
                ? "cursor-pointer border-ink bg-ink text-background hover:bg-ink/85"
                : "cursor-default border-line-strong text-faint"
            }`}
          >
            Optimizar con estas respuestas
            {questions.length > 1 ? ` (${answered}/${questions.length})` : ""}
          </button>
          <span className="text-xs text-faint">
            Marcá tus respuestas o escribí con tus palabras abajo.
          </span>
        </div>
      )}
    </div>
  );
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
      {copied ? "Copiado" : "Copiar"}
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
      Exportar
    </button>
  );
}

export function ResultMessage({
  text,
  streaming,
  interactive,
  targetId,
  version,
  onAnswer,
}: ResultMessageProps) {
  const { blocks, questions, commentary, detectedTarget } = parseResponse(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-4"
    >
      {detectedTarget && (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          Modelo detectado:{" "}
          <span className="text-ink">{detectedTarget}</span>
        </p>
      )}

      {questions.length > 0 && (
        <QuestionsCard
          questions={questions}
          interactive={interactive}
          onAnswer={onAnswer}
        />
      )}

      {blocks.map((block, i) => (
        <div key={i} className="bg-ink text-background">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-background/70">
                {block.label}
              </span>
              {i === 0 && (
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

      {!streaming && blocks[0] && canRunPrompt(targetId, detectedTarget) && (
        <RunPanel prompt={blocks[0].content} targetId={targetId} />
      )}
    </motion.div>
  );
}
