import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { buildSystemPrompt, getTarget } from "@/lib/harness";

export const maxDuration = 300;

const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.6-27b";

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  targetId: z.string().min(1),
  goal: z.string().optional(),
});

function hasImageParts(messages: UIMessage[]): boolean {
  return messages.some((message) =>
    message.parts?.some(
      (part) => part.type === "file" && part.mediaType?.startsWith("image/"),
    ),
  );
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, targetId, goal } = parsed.data;
  if (!getTarget(targetId)) {
    return Response.json({ error: "Unknown target model" }, { status: 400 });
  }

  const model = hasImageParts(messages) ? VISION_MODEL : TEXT_MODEL;

  const result = streamText({
    model: groq(model),
    system: buildSystemPrompt(targetId, goal),
    messages: await convertToModelMessages(messages),
    providerOptions: {
      groq: { reasoningFormat: "parsed" },
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
