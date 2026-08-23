import type { TargetModel } from "./types";

const SHARED_TEXT_RULES = [
  "Lead with a one-line role and objective, then context, then the task.",
  "State the expected output format explicitly (structure, length, language).",
  "Include 2-3 few-shot examples only when the format is hard to describe.",
  "Give the model an out: allow it to say it does not know instead of guessing.",
  "Place static/reusable content first so provider prompt caching can kick in.",
];

export const TARGETS: TargetModel[] = [
  {
    id: "claude",
    label: "Claude (Anthropic)",
    category: "text",
    vendor: "Anthropic",
    guidelines: [
      ...SHARED_TEXT_RULES,
      "Separate sections with XML tags: <instructions>, <context>, <examples>, <input>.",
      "For long documents: documents first inside <document> tags, question last.",
      "Do not add manual chain-of-thought; modern Claude reasons adaptively.",
      "Do not rely on assistant prefill; it is deprecated on current models.",
    ],
    outputShape:
      "A complete prompt using XML-tagged sections, ready to paste into Claude.",
  },
  {
    id: "gpt",
    label: "GPT / o-series (OpenAI)",
    category: "text",
    vendor: "OpenAI",
    guidelines: [
      ...SHARED_TEXT_RULES,
      "Use markdown headers and delimiters to structure the prompt.",
      "Never instruct reasoning models to 'think step by step'; it causes overthinking.",
      "Prefer zero-shot first; add few-shot only for complex output formats.",
      "If markdown output is desired from reasoning models, say 'Formatting re-enabled'.",
    ],
    outputShape:
      "A complete prompt with markdown sections, ready for ChatGPT or the API.",
  },
  {
    id: "gemini",
    label: "Gemini (Google)",
    category: "text",
    vendor: "Google",
    guidelines: [
      ...SHARED_TEXT_RULES,
      "Use clear section headers; Gemini handles very long context well.",
      "Anchor instructions at the start and repeat critical constraints at the end.",
    ],
    outputShape: "A complete structured prompt ready for Gemini.",
  },
  {
    id: "open-llm",
    label: "Llama / DeepSeek / open models",
    category: "text",
    vendor: "Meta / DeepSeek / open weights",
    guidelines: [
      ...SHARED_TEXT_RULES,
      "Be extra explicit; smaller open models follow literal instructions best.",
      "Manual chain-of-thought ('reason step by step, then answer') helps non-reasoning models.",
      "Use simple delimiters (###, ---) instead of nested structure.",
      "For DeepSeek-R1-style models: keep everything in the user message, zero-shot.",
    ],
    outputShape:
      "A complete prompt with simple delimiters, ready for open-weight models.",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    category: "image",
    vendor: "Midjourney",
    guidelines: [
      "Order: subject, action, environment, style/medium, lighting, camera/lens, mood.",
      "Use comma-separated dense phrases, not full sentences or narrative prose.",
      "Never use negations ('no X'); use --no parameter instead.",
      "Append parameters: --ar <ratio>, --stylize <0-1000>, --v <version> when relevant.",
      "Write the prompt in English; Midjourney is trained primarily on English captions.",
    ],
    outputShape:
      "One single-line Midjourney prompt with parameters, plus 1-2 alternate variations.",
  },
  {
    id: "flux-sd",
    label: "Flux / Stable Diffusion",
    category: "image",
    vendor: "BFL / Stability",
    guidelines: [
      "Flux prefers rich natural-language scene descriptions in full sentences.",
      "Stable Diffusion supports (emphasis) weighting and a separate negative prompt.",
      "Describe: subject, pose, environment, lighting, color palette, composition, style.",
      "Specify camera details (lens, angle, depth of field) for photorealism.",
      "Write in English.",
    ],
    outputShape:
      "A detailed positive prompt; for SD also include a negative prompt block.",
  },
  {
    id: "nano-banana",
    label: "Nano Banana / GPT Image",
    category: "image",
    vendor: "Google / OpenAI",
    guidelines: [
      "These models excel with conversational, richly detailed full sentences.",
      "Put any text that must appear in the image inside double quotes.",
      "Describe composition, subject, environment, lighting, style, and mood explicitly.",
      "For edits, describe the change AND what must stay the same.",
      "Write in English.",
    ],
    outputShape:
      "A rich natural-language paragraph prompt, ready for Gemini Image or GPT Image.",
  },
  {
    id: "veo-sora",
    label: "Veo / Sora / Kling / Runway",
    category: "video",
    vendor: "Google / OpenAI / Kuaishou / Runway",
    guidelines: [
      "Structure the prompt as labeled blocks: Scene, Subject, Action, Camera, Lighting, Style, Audio.",
      "Describe ONE continuous shot per prompt; chain prompts for multi-shot sequences.",
      "Camera language matters: dolly-in, orbit, crane, handheld, FPV, slow push, rack focus.",
      "Specify duration, aspect ratio, and frame style (e.g. 8s, 16:9, cinematic 35mm).",
      "Include audio/ambience cues for models that generate sound (Veo 3).",
      "Write in English.",
    ],
    outputShape:
      "A structured cinematic prompt with labeled blocks (Scene/Subject/Action/Camera/Lighting/Style/Audio), unlimited length.",
  },
];

export function getTarget(targetId: string): TargetModel | undefined {
  return TARGETS.find((t) => t.id === targetId);
}
