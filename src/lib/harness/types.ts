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
