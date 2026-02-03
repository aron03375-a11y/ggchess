export interface Bot {
  id: string;
  name: string;
  elo: number;
  skillLevel: number; // Stockfish skill level 0-20
  depth?: number; // Optional depth limit for weaker bots
  image: string;
  greeting: string;
  category: 'aron' | 'hikaru';
}

export interface GameState {
  selectedBot: Bot | null;
  playerColor: 'white' | 'black';
  isPlaying: boolean;
}
