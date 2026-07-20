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
}

export type PiccoloPhase = "draw" | "prompt" | "gameover";

export interface PiccoloState {
  deck: Prompt[];
  currentPrompt: Prompt | null;
  activeRule: string | null; // last rule card is the standing rule
  drawnCount: number;
  phase: PiccoloPhase;
}
