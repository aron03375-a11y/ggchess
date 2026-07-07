export interface MittensFormula {
  maxLoss: number;
  temperature: number;
  suboptimalProb: number;
}

export type BotEngine = 'stockfish10' | 'komodo';

export interface Bot {
  id: string;
  name: string;
  elo: number;
  skillLevel: number; // legacy Stockfish skill level (unused for komodo bots)
  depth?: number;
  image: string;
  greeting: string;
  category: 'aron' | 'komodo';
  formula?: MittensFormula;
  openingMoves?: Record<string, string>;
  /** UCI_Elo target — used by Komodo (and legacy Stockfish LimitStrength). */
  uciElo?: number;
  /** Legacy custom picker division (unused for komodo bots). */
  divisionLevel?: number;
  /** Which engine drives this bot. Defaults to 'komodo'. */
  engine?: BotEngine;
  /**
   * If true, this bot exposes an Elo slider in the detail card
   * (min/max/default). The user picks Elo per-game.
   */
  isEloSlider?: boolean;
  minElo?: number;
  maxElo?: number;
  defaultElo?: number;
}

export interface GameState {
  selectedBot: Bot | null;
  playerColor: 'white' | 'black';
  isPlaying: boolean;
}
