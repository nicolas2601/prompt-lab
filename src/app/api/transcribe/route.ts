import { groq } from "@ai-sdk/groq";
import { transcribe } from "ai";

export const maxDuration = 60;

/** Vercel serverless request body limit is 4.5 MB; keep a safety margin. */
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("audio");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing audio file" }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json(
      { error: "Audio too large (max 4 MB, about 4 minutes)" },
      { status: 413 },
    );
  }

  try {
    const result = await transcribe({
      model: groq.transcription("whisper-large-v3-turbo"),
      audio: new Uint8Array(await file.arrayBuffer()),
    });
    return Response.json({ text: result.text });
  } catch {
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
