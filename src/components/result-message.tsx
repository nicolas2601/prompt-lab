"use client";

import { motion } from "motion/react";
import { useState } from "react";

interface ResultMessageProps {
  text: string;
  streaming: boolean;
}

/** Splits the optimizer response into the prompt block and the commentary. */
function parseResponse(text: string): { prompt: string | null; rest: string } {
  const match = text.match(/```(?:text|txt)?\n([\s\S]*?)(?:```|$)/);
  if (!match) return { prompt: null, rest: text };
  const rest = text
    .replace(match[0], "")
    .replace(/^## Optimized Prompt\s*$/m, "")
    .trim();
  return { prompt: match[1].trimEnd(), rest };
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
  const { prompt, rest } = parseResponse(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-3"
    >
      {prompt !== null && (
        <div className="overflow-hidden rounded-xl border border-accent/25 bg-surface">
          <div className="flex items-center justify-between border-b border-line bg-accent-dim px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              Optimized prompt
            </span>
            <CopyButton value={prompt} />
          </div>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground">
            {prompt}
            {streaming && <span className="animate-pulse text-accent">▍</span>}
          </pre>
        </div>
      )}

      {rest && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {rest}
          {streaming && prompt === null && (
            <span className="animate-pulse text-accent">▍</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
