import { SKILL_PACKS } from "./skill-packs";
import type { SkillPack, TargetModel } from "./types";

/** Max packs per request to protect latency and the Groq free-tier budget. */
const MAX_PACKS = 2;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function matchesIdea(pack: SkillPack, idea: string): boolean {
  return pack.keywords ? pack.keywords.test(idea) : false;
}

/**
 * Picks the skill packs to inject for a known target. Category-bound packs
 * (image/video) always attach; the rest attach only when the user's idea
 * mentions their domain. Pure and deterministic — no LLM call.
 */
export function pickSkillPacks(
  target: TargetModel,
  ideaText: string,
): SkillPack[] {
  const idea = normalize(ideaText);
  const picked = SKILL_PACKS.filter((pack) => {
    if (pack.categories?.includes(target.category)) return true;
    if (pack.categories && !pack.categories.includes(target.category)) {
      return false;
    }
    return matchesIdea(pack, idea);
  });
  return picked.slice(0, MAX_PACKS);
}

/** Keyword-only selection for auto-detect mode, where the target is unknown. */
export function pickSkillPacksForAuto(ideaText: string): SkillPack[] {
  const idea = normalize(ideaText);
  return SKILL_PACKS.filter((pack) => matchesIdea(pack, idea)).slice(
    0,
    MAX_PACKS,
  );
}

/** Renders packs as system-prompt blocks. Returns "" when nothing applies. */
export function renderSkillPacks(packs: SkillPack[]): string {
  if (packs.length === 0) return "";
  return packs
    .map(
      (pack) =>
        `Expert knowledge pack — ${pack.label}. Apply these principles when building the optimized prompt:\n${pack.rules
          .map((r) => `- ${r}`)
          .join("\n")}`,
    )
    .join("\n\n");
}
