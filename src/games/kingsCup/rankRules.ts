import type { Rank } from "../../lib/deck";

export interface RankRule {
  title: string;
  description: string;
}

export const RANK_RULES: Partial<Record<Rank, RankRule>> = {
  "2": { title: "You", description: "Pick someone to drink." },
  "3": { title: "Me", description: "You drink." },
  "4": { title: "Floor", description: "Last to touch the floor (or table) drinks." },
  "5": { title: "Guys", description: "All guys drink." },
  "6": { title: "Chicks", description: "All girls drink." },
  "7": { title: "Heaven", description: "Last to put a hand up drinks." },
  "8": { title: "Mate", description: "Pick a mate. Whenever either of you drinks, you both drink." },
  "9": { title: "Rhyme", description: "Pick a word. Go around rhyming with it — first to fail or repeat drinks." },
  "10": { title: "Categories", description: "Pick a category. Go around naming things in it — first to fail drinks." },
  J: {
    title: "Never Have I Ever",
    description: "Everyone starts with 3 fingers up. Say something you've never done — anyone who has, puts a finger down.",
  },
  Q: {
    title: "Question Master",
    description: "You're the Question Master until the next Queen. Anyone who answers your questions (instead of replying with a question) drinks.",
  },
  K: { title: "Make a Rule", description: "Create a rule that lasts until the next King replaces it." },
  A: { title: "Waterfall", description: "Everyone drinks continuously, starting with you. No one can stop until the person before them stops." },
};

export const KING_RULE_PRESETS = [
  "No pointing at anyone",
  "No saying anyone's name",
  "No swearing",
  "Everyone must talk in an accent",
  "No drinking with your dominant hand",
  "Must stand up before you drink",
  "No saying the word 'drink'",
  "Everything you say must rhyme",
  "Only whisper for the rest of the game",
  "No crossing your arms or legs",
  "Must refer to the person on your left as 'boss'",
  "Every sentence must end in 'eh'",
  "Must raise a toast before drinking",
  "No using first names",
  "Left-handed drinking only",
];
