# PromptLab

Turn rough ideas, voice notes, or reference images into production-grade prompts for any AI model: LLMs, image generators, and video generators.

Built with Next.js App Router and the Vercel AI SDK, powered by Groq's free tier. Deploys to Vercel with no separate backend.

## Features

- **Multimodal input**: type your idea, dictate it (Whisper transcription), or attach a reference image (vision model analysis).
- **Target-aware optimization**: the harness applies evidence-based technique rules per target model — XML tags for Claude, no manual chain-of-thought for reasoning models, comma-phrase syntax plus parameters for Midjourney, structured cinematic blocks for Veo/Sora, and more.
- **Unlimited prompt length**: the optimizer writes prompts as long as they need to be.
- **Streaming UI**: results stream token by token with a copy-ready prompt block.
- **Cache-friendly by design**: static system prompt content goes first so Groq's automatic prefix caching applies (cached tokens do not count against rate limits).

## Architecture

```
Browser (Next.js client, AI SDK useChat)
  |
  |- POST /api/optimize    -> Groq LLM (gpt-oss-120b, qwen3.6-27b for vision)
  |- POST /api/transcribe  -> Groq Whisper (whisper-large-v3-turbo)

src/lib/harness/    Pure domain: target registry + optimizer system prompt (unit tested)
src/app/api/        Serverless routes (the only place the API key lives)
src/components/     UI: target picker, composer (text/audio/image), streaming result
```

The API key never reaches the client. Both routes run as Vercel serverless functions.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # add your Groq API key (console.groq.com/keys)
pnpm dev
```

## Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Development server           |
| `pnpm build` | Production build             |
| `pnpm test`  | Unit tests (Vitest)          |
| `pnpm lint`  | ESLint                       |

## Environment variables

| Variable       | Description                            |
| -------------- | -------------------------------------- |
| `GROQ_API_KEY` | Groq API key. Required. Server-only.   |

## Constraints worth knowing

- Vercel serverless request body limit is 4.5 MB: audio clips are capped at 4 MB (about 4 minutes of webm/opus) and images at 3 MB.
- Groq model catalogs rotate. Model ids live in `src/app/api/optimize/route.ts`; if a model is decommissioned, list the current catalog with `GET https://api.groq.com/openai/v1/models`.

## License

MIT
