"use client";

import { AUTO_TARGET_ID, TARGETS, type PromptLanguage } from "@/lib/harness";

const LANGUAGE_OPTIONS: Array<{ value: PromptLanguage; label: string }> = [
  { value: "auto", label: "Auto (según el modelo)" },
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

interface ControlsProps {
  targetId: string;
  language: PromptLanguage;
  onTargetChange: (targetId: string) => void;
  onLanguageChange: (language: PromptLanguage) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full cursor-pointer appearance-none border-b border-line-strong bg-transparent py-1.5 pr-6 text-sm text-ink outline-none transition-colors duration-200 hover:border-ink focus:border-ink";

export function Controls({
  targetId,
  language,
  onTargetChange,
  onLanguageChange,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <Field label="Modelo destino">
        <div className="relative">
          <select
            value={targetId}
            onChange={(e) => onTargetChange(e.target.value)}
            className={selectClass}
          >
            <option value={AUTO_TARGET_ID}>
              Auto — la IA detecta el modelo ideal
            </option>
            {TARGETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xs text-faint">
            ▾
          </span>
        </div>
      </Field>

      <Field label="Idioma del prompt">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as PromptLanguage)}
            className={selectClass}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xs text-faint">
            ▾
          </span>
        </div>
      </Field>
    </div>
  );
}
