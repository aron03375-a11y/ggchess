import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import komodoAvatar from '@/assets/bot-komodo.png';
import { Bot } from '@/types/bot';

// Aron Moods — powered by Komodo TEP with UCI_Elo (auto skill).
export const aronBots: Bot[] = [
  {
    id: 'chill-aron',
    name: 'Chill Aron',
    elo: 800,
    skillLevel: 0,
    uciElo: 800,
    engine: 'komodo',
    image: aronChill,
    greeting: "Ready for a fun game?",
    category: 'aron',
  },
  {
    id: 'focused-aron',
    name: 'Focused Aron',
    elo: 1200,
    skillLevel: 0,
    uciElo: 1200,
    engine: 'komodo',
    image: aronFocused,
    greeting: "Let's play a good game!",
    category: 'aron',
  },
  {
    id: 'competitive-aron',
    name: 'Competitive Aron',
    elo: 1700,
    skillLevel: 0,
    uciElo: 1700,
    engine: 'komodo',
    image: aronCompetitive,
    greeting: "I won't go easy on you!",
    category: 'aron',
  },
  {
    id: 'madness-aron',
    name: 'Madness Aron',
    elo: 2400,
    skillLevel: 0,
    uciElo: 2400,
    engine: 'komodo',
    image: aronMadness,
    greeting: "PREPARE FOR CHAOS!",
    category: 'aron',
  },
];

// Komodo — single tile that opens a UCI_Elo slider (1–3500).
export const komodoBots: Bot[] = [
  {
    id: 'komodo',
    name: 'Komodo',
    elo: 1500,
    skillLevel: 0,
    engine: 'komodo',
    isEloSlider: true,
    minElo: 1,
    maxElo: 3500,
    defaultElo: 1500,
    uciElo: 1500,
    image: komodoAvatar,
    greeting: "Pick your challenge.",
    category: 'komodo',
  },
];

export const allBots = [...aronBots, ...komodoBots];
