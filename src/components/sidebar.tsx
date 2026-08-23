"use client";

import { AnimatePresence, motion } from "motion/react";
import { getTarget } from "@/lib/harness";
import { entryTitle, type HistoryEntry } from "@/lib/history";

const CATEGORY_COLORS: Record<string, string> = {
  text: "bg-accent/15 text-accent",
  image: "bg-accent-2/15 text-accent-2",
  video: "bg-amber-400/15 text-amber-300",
};

interface SidebarProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  entries,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  return (
    <aside className="glass relative z-10 flex h-full w-72 shrink-0 flex-col border-r border-line">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 font-mono text-sm font-bold text-background">
          ▞
        </span>
        <span className="font-mono text-sm tracking-tight text-foreground">
          promptlab
        </span>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNew}
          className="pressable w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent/40"
        >
          + New prompt
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-faint">
          History
        </p>
        {entries.length === 0 && (
          <p className="px-1 text-xs leading-relaxed text-faint">
            Your optimized prompts will appear here. They are saved in this
            browser.
          </p>
        )}
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const target = getTarget(entry.targetId);
            const active = entry.id === activeId;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="group relative"
              >
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className={`pressable mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-200 ${
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2/60 hover:text-foreground"
                  }`}
                >
                  <span className="block truncate pr-5 text-[13px] leading-snug">
                    {entryTitle(entry)}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      CATEGORY_COLORS[target?.category ?? "text"]
                    }`}
                  >
                    {target?.label ?? entry.targetId}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete prompt"
                  onClick={() => onDelete(entry.id)}
                  className="pressable absolute right-2 top-2.5 hidden text-xs text-faint hover:text-red-400 group-hover:block"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[11px] leading-relaxed text-faint">
          Powered by Groq · free tier
        </p>
      </div>
    </aside>
  );
}
