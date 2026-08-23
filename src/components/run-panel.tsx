"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface RunPanelProps {
  prompt: string;
  targetId: string;
}

type RunState = "idle" | "running" | "done" | "error";

/** Executes the optimized prompt against a real model and streams the output. */
export function RunPanel({ prompt, targetId }: RunPanelProps) {
  const [state, setState] = useState<RunState>("idle");
  const [output, setOutput] = useState("");

  async function run() {
    setState("running");
    setOutput("");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, targetId }),
      });
      if (!res.ok || !res.body) throw new Error("Run failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={state === "running"}
        className="pressable cursor-pointer border border-line-strong px-3 py-1.5 text-[13px] text-muted transition-colors duration-200 hover:bg-ink hover:text-background disabled:opacity-40"
      >
        {state === "running" ? "Running..." : "Test this prompt ▸"}
      </button>

      <AnimatePresence>
        {(output || state === "error") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mt-3 border border-line bg-surface"
          >
            <p className="border-b border-line px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              Live output — what the model produced with your prompt
            </p>
            <div className="max-h-[360px] overflow-auto whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed text-ink">
              {state === "error" ? (
                <span className="text-red-600">
                  The test run failed. Groq may be rate-limited; try again in a
                  minute.
                </span>
              ) : (
                <>
                  {output}
                  {state === "running" && <span className="animate-pulse">▍</span>}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
