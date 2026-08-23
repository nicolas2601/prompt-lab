import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { z } from "zod";
import { getTarget } from "@/lib/harness";

export const maxDuration = 300;

const RUN_MODEL = "openai/gpt-oss-120b";

const bodySchema = z.object({
  prompt: z.string().min(1).max(60_000),
  targetId: z.string().min(1),
});

/** Executes an optimized prompt against a text model so users can see real output. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const target = getTarget(parsed.data.targetId);
  if (parsed.data.targetId !== "auto" && target?.category !== "text") {
    return Response.json(
      { error: "Test runs are only available for text targets" },
      { status: 400 },
    );
  }

  const result = streamText({
    model: groq(RUN_MODEL),
    prompt: parsed.data.prompt,
    providerOptions: {
      groq: { reasoningFormat: "parsed" },
    },
  });

  return result.toTextStreamResponse();
}
