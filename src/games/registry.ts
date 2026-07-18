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
    tagline: "Coming soon",
    minPlayers: 2,
    path: "/games/kings-cup/setup",
    available: false,
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
