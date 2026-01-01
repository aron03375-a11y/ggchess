export interface Bot {
  id: string;
  name: string;
  elo: number;
  image: string;
  greeting: string;
  category: 'aron' | 'newyear';
}

export interface GameState {
  selectedBot: Bot | null;
  playerColor: 'white' | 'black';
  isPlaying: boolean;
}
