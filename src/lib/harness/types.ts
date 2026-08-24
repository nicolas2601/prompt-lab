export type TargetCategory = "text" | "image" | "video";

export interface TargetModel {
  id: string;
  label: string;
  category: TargetCategory;
  vendor: string;
  /** Technique rules injected into the optimizer system prompt. */
  guidelines: string[];
  /** How the final prompt should be shaped for this model. */
  outputShape: string;
}

export interface OptimizeInput {
  targetId: string;
  goal?: string;
}

export interface SkillPack {
  id: string;
  label: string;
  /** Target categories this pack always attaches to (e.g. image, video). */
  categories?: TargetCategory[];
  /** Idea-text matcher for contextual attachment. Tested against normalized (lowercase, accent-stripped) text. */
  keywords?: RegExp;
  /** Distilled principles injected into the optimizer system prompt. */
  rules: string[];
}
