export type PromptCategory =
  | "drink"
  | "dare"
  | "truth"
  | "rule"
  | "race"
  | "group"
  | "chance";

export interface Prompt {
  category: PromptCategory;
  text: string;
}

export interface PiccoloSettings {
  spicy: boolean; // include spicier / raunchier prompts
  categories: Record<PromptCategory, boolean>; // which card types are in the deck
}

export const ALL_CATEGORIES: PromptCategory[] = [
  "drink",
  "dare",
  "truth",
  "group",
  "race",
  "chance",
  "rule",
];

export function defaultCategories(): Record<PromptCategory, boolean> {
  return {
    drink: true,
    dare: true,
    truth: true,
    group: true,
    race: true,
    chance: true,
    rule: true,
  };
}

export type PiccoloPhase = "draw" | "prompt" | "gameover";

export interface PiccoloState {
  deck: Prompt[];
  currentPrompt: Prompt | null;
  activeRule: string | null; // last rule card is the standing rule
  drawnCount: number;
  phase: PiccoloPhase;
}
