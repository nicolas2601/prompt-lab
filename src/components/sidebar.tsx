"use client";

import { AnimatePresence, motion } from "motion/react";
import { getTarget } from "@/lib/harness";
import { entryTitle, type HistoryEntry } from "@/lib/history";

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
    <aside className="relative z-10 flex h-full w-72 shrink-0 flex-col border-r border-line bg-background">
      <div className="flex items-baseline gap-2 px-5 pb-2 pt-5">
        <span className="font-serif-display text-xl text-ink">PromptLab</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
          beta
        </span>
      </div>

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={onNew}
          className="pressable w-full cursor-pointer border border-ink bg-ink px-3 py-2 text-left text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-85"
        >
          + New prompt
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          Threads
        </p>
        {entries.length === 0 && (
          <p className="px-2 text-xs leading-relaxed text-faint">
            Your prompt threads live here, saved in this browser. Each one is a
            conversation you can keep refining.
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
                  className={`pressable mb-0.5 w-full cursor-pointer border-l-2 px-3 py-2 text-left transition-colors duration-200 ${
                    active
                      ? "border-ink bg-surface text-ink"
                      : "border-transparent text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  <span className="block truncate pr-5 text-[13px] leading-snug">
                    {entryTitle(entry)}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-faint">
                    {target?.label ?? entry.targetId} ·{" "}
                    {entry.exchanges.length > 1
                      ? `v${entry.exchanges.length}`
                      : "v1"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete thread"
                  onClick={() => onDelete(entry.id)}
                  className="pressable absolute right-2 top-2 hidden cursor-pointer text-xs text-faint hover:text-red-600 group-hover:block"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="border-t border-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
          Groq · free tier · $0
        </p>
      </div>
    </aside>
  );
}
