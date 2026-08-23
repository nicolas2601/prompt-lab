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
  compact?: boolean;
  onSubmit: (text: string, attachment: Attachment | null) => void;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function Composer({ disabled, compact = false, onSubmit }: ComposerProps) {
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
      setImageError("Solo se aceptan imágenes");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Imagen muy grande (máx 3 MB)");
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
    <div className="border border-line-strong bg-surface">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        rows={compact ? 2 : 5}
        placeholder={
          compact
            ? "Refinalo: más corto, otro tono, respondé una pregunta..."
            : "Describí tu idea con tus palabras. Dictala o subí una imagen de referencia."
        }
        className="w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
      />

      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="mx-4 mb-1 flex items-center gap-2 self-start border border-line bg-surface-2 p-1.5 pr-3"
          >
            <Image
              src={attachment.dataUrl}
              alt={attachment.name}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 object-cover"
            />
            <span className="max-w-40 truncate text-xs text-muted">
              {attachment.name}
            </span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="pressable cursor-pointer text-xs text-faint hover:text-ink"
              aria-label="Remove image"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              recorder.state === "recording" ? recorder.stop() : recorder.start()
            }
            disabled={disabled || recorder.state === "transcribing"}
            className={`pressable flex h-8 cursor-pointer items-center gap-2 px-2.5 text-[13px] transition-colors duration-200 disabled:opacity-40 ${
              recorder.state === "recording"
                ? "text-red-600"
                : "text-muted hover:text-ink"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                recorder.state === "recording"
                  ? "animate-pulse bg-red-500"
                  : "bg-faint"
              }`}
            />
            {recorder.state === "recording"
              ? "Detener"
              : recorder.state === "transcribing"
                ? "Transcribiendo..."
                : "Dictar"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="pressable h-8 cursor-pointer px-2.5 text-[13px] text-muted transition-colors duration-200 hover:text-ink disabled:opacity-40"
          >
            Adjuntar imagen
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
          className="pressable h-8 cursor-pointer bg-ink px-4 text-[13px] font-medium text-background transition-opacity duration-200 disabled:opacity-25"
        >
          {compact ? "Enviar" : "Optimizar →"}
        </button>
      </div>

      {(recorder.error ?? imageError) && (
        <p className="px-4 pb-3 text-xs text-red-600">
          {recorder.error ?? imageError}
        </p>
      )}
    </div>
  );
}
