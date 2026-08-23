# PromptLab

Turn rough ideas, voice notes, or reference images into production-grade prompts for any AI model: LLMs, image generators, and video generators.

Built with Next.js App Router and the Vercel AI SDK, powered by Groq's free tier. Runs entirely on Vercel with no separate backend.

## Features

- **Auto target detection**: describe what you want and the optimizer decides whether your prompt targets Claude, GPT, Gemini, open LLMs, Midjourney, Flux/SD, Nano Banana, or Veo/Sora — and applies that model's technique rules. Manual override available.
- **Multimodal input**: type your idea, dictate it (Whisper transcription), or attach a reference image (vision model analysis).
- **Iterative threads**: every prompt is a conversation. Ask for changes ("shorter", "different tone") and get a complete new version; all versions are saved.
- **Clarifying questions**: when the idea is too vague, the optimizer asks 2-3 quick questions with tappable options instead of guessing.
- **Live test runs**: execute the optimized prompt against a real model and watch the output stream, so you can verify the prompt actually works.
- **Prompt language control**: auto, Spanish, or English output regardless of input language.
- **Token estimate, copy and export** per version.
- **Local persistence**: threads are stored in the browser (localStorage) and survive reloads.

## Architecture

```
Browser (Next.js client, AI SDK useChat, Spanish UI)
  |
  |- POST /api/optimize    -> Groq LLM (gpt-oss-120b; qwen3.6-27b when images attached)
  |- POST /api/run         -> executes the optimized prompt (gpt-oss-120b)
  |- POST /api/transcribe  -> Groq Whisper (whisper-large-v3-turbo)

src/lib/harness/    Pure domain: target registry + optimizer system prompt (unit tested)
src/lib/history.ts  localStorage-backed thread store (useSyncExternalStore)
src/app/api/        Serverless routes (the only place the API key lives)
src/components/     UI: sidebar threads, composer, streaming results, test runs
```

The API key never reaches the client. All routes run as Vercel serverless functions.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # add your Groq API key (console.groq.com/keys)
pnpm dev
```

## Scripts

| Command      | Description         |
| ------------ | ------------------- |
| `pnpm dev`   | Development server  |
| `pnpm build` | Production build    |
| `pnpm test`  | Unit tests (Vitest) |
| `pnpm lint`  | ESLint              |

## Environment variables

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `GROQ_API_KEY` | Groq API key. Required. Server-only. |

## Deployment

Deploys to Vercel out of the box. Set `GROQ_API_KEY` in the project's environment variables. Streaming works on the Hobby plan (Fluid compute, 300s max duration).

## Constraints worth knowing

- Vercel serverless request body limit is 4.5 MB: audio clips are capped at 4 MB (about 4 minutes of webm/opus) and images at 3 MB.
- Groq model catalogs rotate. Model ids live in `src/app/api/optimize/route.ts`; if a model is decommissioned, list the current catalog with `GET https://api.groq.com/openai/v1/models`.

## License

MIT — see [LICENSE](LICENSE).
