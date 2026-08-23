"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";
import { TARGETS, getTarget } from "@/lib/harness";
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

function buildMessages(entry: HistoryEntry): UIMessage[] {
  return entry.exchanges.flatMap((exchange, i) => [
    {
      id: `${entry.id}-u${i}`,
      role: "user" as const,
      parts: [{ type: "text" as const, text: exchange.input }],
    },
    {
      id: `${entry.id}-a${i}`,
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: exchange.output }],
    },
  ]);
}

export function PromptLab() {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sessionRef = useRef({ input: "", targetId: TARGETS[0].id, activeId: null as string | null });

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
      const { input, targetId: usedTarget, activeId: current } = sessionRef.current;
      const exchange = { input, output };
      if (current) {
        historyStore.appendExchange(current, exchange);
      } else {
        const created = historyStore.create(usedTarget, exchange);
        sessionRef.current.activeId = created.id;
        setActiveId(created.id);
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const hasThread = messages.length > 0;
  const target = getTarget(targetId);

  function handleSubmit(text: string, attachment: Attachment | null) {
    sessionRef.current = { input: text, targetId, activeId };
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
    setActiveId(null);
    sessionRef.current.activeId = null;
    setMessages([]);
    setSidebarOpen(false);
  }

  function handleSelect(entry: HistoryEntry) {
    setActiveId(entry.id);
    sessionRef.current.activeId = entry.id;
    setTargetId(entry.targetId);
    setMessages(buildMessages(entry));
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    historyStore.remove(id);
    if (activeId === id) handleNew();
  }

  const assistantIds = messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.id);

  return (
    <div className="paper flex h-dvh overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          entries={history}
          activeId={activeId}
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
            className="fixed inset-0 z-40 flex bg-ink/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.22, ease }}
              className="h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                entries={history}
                activeId={activeId}
                onSelect={handleSelect}
                onNew={handleNew}
                onDelete={handleDelete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-background/85 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open threads"
            className="pressable cursor-pointer border border-line px-2.5 py-1 text-sm text-muted"
          >
            ☰
          </button>
          <span className="font-serif-display text-lg text-ink">PromptLab</span>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:py-10 xl:px-10">
          {!hasThread && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                Prompt workbench — text · image · video
              </p>
              <h1 className="mt-3 max-w-2xl text-balance text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl 2xl:text-5xl">
                A rough idea becomes a{" "}
                <span className="font-serif-display">precise instruction.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Write it, dictate it, or drop a reference image. Then keep
                talking to refine it — every version is saved.
              </p>

              <div className="mt-10 grid gap-10 xl:grid-cols-[240px_minmax(0,1fr)]">
                <TargetPicker targetId={targetId} onChange={setTargetId} />
                <Composer disabled={busy} onSubmit={handleSubmit} />
              </div>
            </motion.div>
          )}

          {hasThread && (
            <div className="flex flex-col gap-6 pb-28">
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Thread · {target?.label}
                </span>
                <button
                  type="button"
                  onClick={handleNew}
                  className="pressable cursor-pointer text-[13px] text-muted transition-colors duration-200 hover:text-ink"
                >
                  + New prompt
                </button>
              </div>

              {messages.map((message, index) => {
                const text = messageText(message.parts);
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[80%] border border-line bg-surface px-4 py-2.5 text-sm leading-relaxed text-ink">
                        {text}
                      </div>
                    </div>
                  );
                }
                const isLast = index === messages.length - 1;
                return (
                  <ResultMessage
                    key={message.id}
                    text={text}
                    streaming={busy && isLast}
                    targetId={targetId}
                    version={assistantIds.indexOf(message.id) + 1}
                    onAnswer={(answer) => handleSubmit(answer, null)}
                  />
                );
              })}

              {error && (
                <p className="text-sm text-red-600">
                  Something went wrong: {error.message}. Groq may be
                  rate-limited — try again in a minute.
                </p>
              )}

              <div className="sticky bottom-0 -mx-1 bg-background/90 px-1 pb-4 pt-2 backdrop-blur-sm">
                <Composer compact disabled={busy} onSubmit={handleSubmit} />
              </div>
            </div>
          )}

          {!hasThread && error && (
            <p className="mt-4 text-sm text-red-600">
              Something went wrong: {error.message}. Try again.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
