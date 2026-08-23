"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useRecorder } from "./use-recorder";

export interface Attachment {
  dataUrl: string;
  mediaType: string;
  name: string;
}

interface ComposerProps {
  disabled: boolean;
  onSubmit: (text: string, attachment: Attachment | null) => void;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function Composer({ disabled, onSubmit }: ComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorder = useRecorder((transcript) => {
    setText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
  });

  const canSubmit =
    !disabled && recorder.state === "idle" && text.trim().length > 0;

  function handleFile(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are supported");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image too large (max 3 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        dataUrl: reader.result as string,
        mediaType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!canSubmit) return;
    onSubmit(text.trim(), attachment);
    setText("");
    setAttachment(null);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        rows={4}
        placeholder="Describe your idea in plain words... or dictate it, or drop a reference image."
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-faint"
      />

      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="mb-2 flex items-center gap-2 self-start rounded-lg border border-line bg-surface-2 p-1.5 pr-3"
          >
            <Image
              src={attachment.dataUrl}
              alt={attachment.name}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-md object-cover"
            />
            <span className="max-w-40 truncate text-xs text-muted">
              {attachment.name}
            </span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="pressable text-xs text-faint hover:text-foreground"
              aria-label="Remove image"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              recorder.state === "recording" ? recorder.stop() : recorder.start()
            }
            disabled={disabled || recorder.state === "transcribing"}
            className={`pressable flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors duration-200 disabled:opacity-40 ${
              recorder.state === "recording"
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-line text-muted hover:border-line-strong hover:text-foreground"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                recorder.state === "recording"
                  ? "animate-pulse bg-red-400"
                  : "bg-faint"
              }`}
            />
            {recorder.state === "recording"
              ? "Stop"
              : recorder.state === "transcribing"
                ? "Transcribing..."
                : "Dictate"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="pressable flex h-9 items-center rounded-full border border-line px-3.5 text-sm text-muted transition-colors duration-200 hover:border-line-strong hover:text-foreground disabled:opacity-40"
          >
            Attach image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="pressable h-9 rounded-full bg-accent px-5 text-sm font-semibold text-background transition-opacity duration-200 disabled:opacity-30"
        >
          Optimize
        </button>
      </div>

      {(recorder.error ?? imageError) && (
        <p className="mt-2 text-xs text-red-400">
          {recorder.error ?? imageError}
        </p>
      )}
    </div>
  );
}
