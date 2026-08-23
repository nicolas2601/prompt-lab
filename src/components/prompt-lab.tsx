"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion } from "motion/react";
import { useState } from "react";
import { TARGETS } from "@/lib/harness";
import { Composer, type Attachment } from "./composer";
import { ResultMessage } from "./result-message";
import { TargetPicker } from "./target-picker";

const ease = [0.23, 1, 0.32, 1] as const;

export function PromptLab() {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/optimize" }),
  });

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(text: string, attachment: Attachment | null) {
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-14">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-background">
            ▞
          </span>
          <span className="font-mono text-sm tracking-tight text-muted">
            promptlab
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Rough idea in. <span className="text-accent">Perfect prompt out.</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Type it, dictate it, or drop a reference image. PromptLab rewrites it
          with evidence-based techniques for the model you are targeting.
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

      <section className="flex flex-col gap-6">
        {messages.map((message, index) => {
          const text = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-line bg-surface-2 px-4 py-2.5 text-sm leading-relaxed text-foreground">
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
            />
          );
        })}
      </section>
    </main>
  );
}
