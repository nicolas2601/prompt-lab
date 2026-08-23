"use client";

import { useCallback, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "transcribing";

interface UseRecorderResult {
  state: RecorderState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/** Records mic audio and resolves the transcript via /api/transcribe. */
export function useRecorder(
  onTranscript: (text: string) => void,
): UseRecorderResult {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setState("transcribing");
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          const data = (await res.json()) as { text?: string; error?: string };
          if (!res.ok || !data.text) {
            throw new Error(data.error ?? "Transcription failed");
          }
          onTranscript(data.text);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setState("idle");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      setError("Microphone access denied");
      setState("idle");
    }
  }, [onTranscript]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  return { state, error, start, stop };
}
