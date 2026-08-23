"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";
import { TARGETS } from "@/lib/harness";
import { historyStore, type HistoryEntry } from "@/lib/history";
import { Composer, type Attachment } from "./composer";
import { ResultMessage } from "./result-message";
import { Sidebar } from "./sidebar";
import { TargetPicker } from "./target-picker";

const ease = [0.23, 1, 0.32, 1] as const;

function messageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

export function PromptLab() {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastInput, setLastInput] = useState("");
  const submissionRef = useRef({ input: "", targetId: TARGETS[0].id });

  const history = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.getSnapshot,
    historyStore.getServerSnapshot,
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/optimize" }),
    onFinish: ({ message }) => {
      const output = messageText(message.parts);
      if (!output) return;
      const saved = historyStore.add({
        targetId: submissionRef.current.targetId,
        input: submissionRef.current.input,
        output,
      });
      setActiveEntry(saved);
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const assistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const liveOutput = assistantMessage ? messageText(assistantMessage.parts) : "";
  const shownOutput = busy || !activeEntry ? liveOutput : activeEntry.output;
  const shownInput = busy || !activeEntry ? lastInput : activeEntry.input;

  function handleSubmit(text: string, attachment: Attachment | null) {
    submissionRef.current = { input: text, targetId };
    setLastInput(text);
    setActiveEntry(null);
    setMessages([]);
    sendMessage(
      {
        role: "user",
        parts: [
          ...(attachment
            ? [
                {
                  type: "file" as const,
                  mediaType: attachment.mediaType,
                  url: attachment.dataUrl,
                },
              ]
            : []),
          { type: "text" as const, text },
        ],
      },
      { body: { targetId } },
    );
  }

  function handleNew() {
    setActiveEntry(null);
    setMessages([]);
    setLastInput("");
    setSidebarOpen(false);
  }

  function handleSelect(entry: HistoryEntry) {
    setActiveEntry(entry);
    setTargetId(entry.targetId);
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    historyStore.remove(id);
    if (activeEntry?.id === id) setActiveEntry(null);
  }

  const showResult = Boolean(shownOutput) || busy;

  return (
    <div className="atmosphere flex h-dvh overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          entries={history}
          activeId={activeEntry?.id ?? null}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
        />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.22, ease }}
              className="h-full bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                entries={history}
                activeId={activeEntry?.id ?? null}
                onSelect={handleSelect}
                onNew={handleNew}
                onDelete={handleDelete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-background/70 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="pressable rounded-md border border-line px-2.5 py-1.5 text-sm text-muted"
          >
            ☰
          </button>
          <span className="font-mono text-sm text-foreground">promptlab</span>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-4 py-10 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              Rough idea in.{" "}
              <span className="gradient-text">Perfect prompt out.</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
              Type it, dictate it, or drop a reference image. PromptLab rewrites
              it with evidence-based techniques for the model you are targeting.
            </p>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease }}
            className="flex flex-col gap-4"
          >
            <TargetPicker targetId={targetId} onChange={setTargetId} />
            <Composer disabled={busy} onSubmit={handleSubmit} />
            {error && (
              <p className="text-sm text-red-400">
                Something went wrong: {error.message}. Try again.
              </p>
            )}
          </motion.section>

          {showResult && (
            <section className="flex flex-col gap-4 pb-10">
              {shownInput && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md border border-line bg-surface-2 px-4 py-2.5 text-sm leading-relaxed text-foreground">
                    {shownInput}
                  </div>
                </div>
              )}
              <ResultMessage text={shownOutput} streaming={busy} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
