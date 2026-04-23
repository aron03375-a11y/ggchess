export interface MittensFormula {
  maxLoss: number;       // Max centipawn loss for allowed moves
  temperature: number;   // Softmax temperature
  suboptimalProb: number; // Probability of picking a suboptimal move
}

export interface Bot {
  id: string;
  name: string;
  elo: number;
  skillLevel: number; // Stockfish skill level 0-20 (ignored for formula bots)
  depth?: number;
  image: string;
  greeting: string;
  category: 'aron' | 'cat' | 'coach' | 'deepblue';
  formula?: MittensFormula; // If set, uses formula-based move selection
  openingMoves?: Record<string, string>; // Maps opponent's first move (SAN) to bot's response (SAN)
  uciElo?: number; // If set, engine uses UCI_LimitStrength + UCI_Elo (Stockfish: 1320–3190)
}

export interface GameState {
  selectedBot: Bot | null;
  playerColor: 'white' | 'black';
  isPlaying: boolean;
}
