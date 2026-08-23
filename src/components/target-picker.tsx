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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 self-start rounded-full border border-line bg-surface p-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              const first = TARGETS.find((t) => t.category === category);
              if (first) onChange(first.id);
            }}
            className={`pressable relative rounded-full px-4 py-1.5 text-sm transition-colors duration-200 ${
              activeCategory === category
                ? "text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {activeCategory === category && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 font-medium">
              {CATEGORY_LABELS[category]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TARGETS.filter((t) => t.category === activeCategory).map((target) => {
          const active = target.id === targetId;
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => onChange(target.id)}
              className={`pressable rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200 ${
                active
                  ? "border-accent/60 bg-accent-dim text-foreground"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-foreground"
              }`}
            >
              <span className="block font-medium">{target.label}</span>
              <span className="block text-xs text-faint">{target.vendor}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
