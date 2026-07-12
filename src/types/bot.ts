export interface MittensFormula {
  maxLoss: number;
  temperature: number;
  suboptimalProb: number;
}

export interface Bot {
  id: string;
  name: string;
  elo: number;
  skillLevel: number; // legacy Stockfish skill level (unused when divisionLevel is set)
  depth?: number;
  image: string;
  greeting: string;
  category: 'aron';
  formula?: MittensFormula;
  openingMoves?: Record<string, string>;
  uciElo?: number;
  /**
   * Division-based skill level (1-25) from src/lib/skillFormula.ts.
   * When set, engine runs full-strength MultiPV and picker chooses among
   * moves within maxLoss cp of the best.
   */
  divisionLevel?: number;
}

export interface GameState {
  selectedBot: Bot | null;
  playerColor: 'white' | 'black';
  isPlaying: boolean;
}
