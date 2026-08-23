"use client";

import { motion } from "motion/react";
import { TARGETS, type TargetCategory } from "@/lib/harness";

const CATEGORY_LABELS: Record<TargetCategory, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
};

interface TargetPickerProps {
  targetId: string;
  onChange: (targetId: string) => void;
}

export function TargetPicker({ targetId, onChange }: TargetPickerProps) {
  const categories: TargetCategory[] = ["text", "image", "video"];
  const activeCategory =
    TARGETS.find((t) => t.id === targetId)?.category ?? "text";
  const targets = TARGETS.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          Target model
        </span>
        <div className="flex gap-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                const first = TARGETS.find((t) => t.category === category);
                if (first) onChange(first.id);
              }}
              className={`pressable relative cursor-pointer pb-0.5 text-sm transition-colors duration-200 ${
                activeCategory === category
                  ? "text-ink"
                  : "text-faint hover:text-muted"
              }`}
            >
              {CATEGORY_LABELS[category]}
              {activeCategory === category && (
                <motion.span
                  layoutId="category-underline"
                  className="absolute -bottom-[13px] left-0 right-0 h-px bg-ink"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line">
        {targets.map((target, index) => {
          const active = target.id === targetId;
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => onChange(target.id)}
              className={`pressable group flex w-full cursor-pointer items-baseline gap-4 py-2.5 text-left transition-colors duration-200 ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span className="font-mono text-[11px] text-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-medium">{target.label}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                  active ? "bg-ink" : "bg-transparent group-hover:bg-line-strong"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
