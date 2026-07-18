export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  minPlayers: number;
  path: string;
  available: boolean;
}

export const GAMES: GameDefinition[] = [
  {
    id: "up-down-river",
    name: "Up the River, Down the River",
    tagline: "Pyramid guesses, then rivers of drinks",
    minPlayers: 2,
    path: "/games/up-down-river/setup",
    available: true,
  },
  {
    id: "kings-cup",
    name: "Kings Cup",
    tagline: "Draw cards, make rules, don't be the last King",
    minPlayers: 2,
    path: "/games/kings-cup/setup",
    available: true,
  },
  {
    id: "fuck-the-dealer",
    name: "Fuck the Dealer",
    tagline: "Guess the rank, miss too many, become the new dealer",
    minPlayers: 2,
    path: "/games/fuck-the-dealer/setup",
    available: true,
  },
  {
    id: "ride-the-bus",
    name: "Ride the Bus",
    tagline: "Coming soon",
    minPlayers: 1,
    path: "/games/ride-the-bus/setup",
    available: false,
  },
];
