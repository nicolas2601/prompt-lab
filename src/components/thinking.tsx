"use client";

import { motion } from "motion/react";

/** Streaming wait state: shimmering label + three pulsing dots. */
export function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-center gap-3 border border-line bg-surface px-4 py-3"
    >
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
      <span className="text-sm text-muted">
        Afinando tu prompt — el modelo está pensando…
      </span>
    </motion.div>
  );
}
