import type { SkillPack } from "./types";

/**
 * Distilled domain expertise injected into the optimizer system prompt when the
 * user's idea (or the chosen target) matches. Principles are written in our own
 * words — no third-party course material is reproduced.
 *
 * Budget: each pack must stay under ~1000 tokens so a request never carries
 * more than ~2000 extra tokens (packs are capped at 2 per request).
 */
export const SKILL_PACKS: SkillPack[] = [
  {
    id: "frontend-taste",
    label: "Frontend design taste",
    keywords:
      /\b(landing|website|web ?page|pagina|sitio ?web|ui|ux|interfaz|interface|dashboard|frontend|front-end|componente?s?|navbar|hero|saas|boton(es)?|button|portfolio|app)\b/,
    rules: [
      "Instruct the model to avoid generic AI aesthetics: no purple/blue neon gradients, no glowing buttons, no centered-everything hero, no three-equal-cards feature row.",
      "Typography: one display font with personality plus one workhorse; tight tracking on large headings; body text at a readable measure (~65ch). Hierarchy comes from weight and color, not only size.",
      "Color: a neutral base (zinc/slate, never pure black #000) plus ONE desaturated accent. Consistent warm-or-cool grays across the whole design.",
      "Layout: prefer asymmetry — split screens, offset grids, generous intentional whitespace. On mobile, collapse to a disciplined single column.",
      "Depth: use borders, dividers and spacing before cards; use shadows only to signal real elevation, tinted toward the background hue.",
      "Demand full interaction states in the prompt: loading skeletons that match layout, designed empty states, inline errors, tactile pressed states.",
      "Content: realistic organic data (messy numbers, believable names), no filler marketing words like 'seamless', 'elevate' or 'next-gen'.",
      "Tell the model to name concrete references (a real product's density, a known site's typography) instead of vague adjectives like 'modern and clean'.",
    ],
  },
  {
    id: "motion-craft",
    label: "Animation & motion craft",
    keywords:
      /\b(animacion(es)?|animation?s?|animar|animate[ds]?|motion|transicion(es)?|transitions?|hover|parallax|scroll|micro-?interac\w*|gsap|framer)\b/,
    rules: [
      "Animate only transform and opacity; never width, height, top or left — this keeps everything GPU-composited at 60fps.",
      "Prefer spring physics over fixed-duration linear easing for interactive elements; springs make interruption and redirection feel natural.",
      "When using durations: micro-interactions 150-250ms, panel/page transitions 300-500ms, ease-out for entrances, ease-in-out for morphs. Nothing over ~700ms unless it is storytelling.",
      "Choreograph lists and grids with small staggers (30-80ms per item) instead of mounting everything at once.",
      "Animations must be interruptible: a second click mid-animation should retarget smoothly, never queue or jump.",
      "Motion needs a reason — guide attention, explain a spatial relationship, or confirm an action. If it does none of these, cut it.",
      "Continuous/looping motion belongs only in isolated decorative elements, never on content the user is trying to read.",
      "Always respect prefers-reduced-motion with a meaningful fallback (fade instead of slide, instant instead of spring).",
      "Scroll-driven effects: tie progress to scroll position, never to timers; keep parallax subtle (single-digit percentage offsets).",
    ],
  },
  {
    id: "copywriting",
    label: "Copywriting craft",
    keywords:
      /\b(slogan|eslogan|tagline|headline|copy|anuncio|ad ?copy|marketing|marca|brand(ing)?|email de ventas|cold ?email|publicidad|campana|campaign)\b/,
    rules: [
      "Lead with the concrete benefit or transformation, never with the product's features.",
      "Concrete verbs and specific nouns beat abstractions: 'ship your site in a weekend' > 'accelerate your digital journey'.",
      "Ban cliché filler: 'unleash', 'elevate', 'seamless', 'revolutionary', 'next-gen', 'transform your business'.",
      "One idea per sentence; vary sentence length for rhythm; read it aloud mentally — if it sounds like a press release, rewrite it.",
      "Specify audience and voice in the prompt: who is reading, what they already believe, what objection to defuse.",
      "For slogans: ask for 8-12 options across distinct angles (benefit, contrast, wordplay, command), then a shortlist rationale.",
      "Numbers and specifics create credibility: '47 integrations' beats 'many integrations'.",
    ],
  },
  {
    id: "image-craft",
    label: "Image art direction",
    categories: ["image"],
    keywords:
      /\b(logo|imagen(es)?|images?|foto(grafia)?s?|photos?|ilustracion(es)?|illustrations?|poster|wallpaper|render|thumbnail|portada)\b/,
    rules: [
      "Name the light: golden hour, overcast softbox, hard noon sun, neon practicals, chiaroscuro, rim light, volumetric god rays — lighting defines the image more than the subject.",
      "Name the optics: focal length (24mm wide / 50mm natural / 85mm portrait / 100mm macro), aperture feel (f/1.4 creamy bokeh vs f/11 deep focus), angle (eye-level, low-angle hero, top-down flat lay).",
      "Composition vocabulary: rule of thirds, centered symmetry, negative space, leading lines, frame-within-frame, foreground occlusion for depth.",
      "Color grade as intent: teal-and-orange blockbuster, muted Kinfolk pastels, Kodak Portra warmth, high-key minimal white, moody low-key.",
      "Material and texture words make renders believable: brushed aluminum, worn leather, condensation, subsurface-scattered skin, film grain.",
      "Anchor style with concrete references (film stock, art movement, named aesthetic) instead of 'beautiful, high quality, 8k'.",
      "State what to exclude explicitly through the target's negative mechanism, never as 'no X' inside the main prompt.",
    ],
  },
  {
    id: "video-cinema",
    label: "Cinematography",
    categories: ["video"],
    keywords:
      /\b(videos?|clip|escena|scene|cinematogr\w*|cinematic|film|trailer|comercial|short|reel)\b/,
    rules: [
      "One continuous shot per prompt: a single camera move, a single beat of action. Multi-shot sequences are chained prompts, not one prompt.",
      "Camera grammar: slow dolly-in for tension, orbit for reveal, crane-up for scale, handheld for urgency, locked-off tripod for calm, rack focus to shift attention.",
      "Describe motion with physics: weight, speed, momentum, follow-through — 'the coat settles a beat after she stops' reads better than 'she moves realistically'.",
      "Block the frame: what is foreground, midground, background; what enters or leaves; where the eye should land at second 0 and at the end.",
      "Time of day + weather drive the entire color grade; state them and the grade intent (bleach-bypass, warm tungsten night, blue hour).",
      "Sound design cues for audio-capable models: ambience bed, one or two spot effects, dialogue or its absence.",
      "Keep continuity handles for chaining: end the shot on a composition the next prompt can pick up.",
    ],
  },
];
