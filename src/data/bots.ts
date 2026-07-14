import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import magniAvatar from '@/assets/magni.png';
import { Bot } from '@/types/bot';

// Aron Moods — full-strength Stockfish nerfed via MultiPV + skillFormula picker.
// divisionLevel drives depth, maxLoss (cp), and edge probability.
export const aronBots: Bot[] = [
  {
    id: 'chill-aron',
    name: 'Chill Aron',
    elo: 800,
    skillLevel: 0,
    divisionLevel: 3, // Div 1, depth 6, maxLoss 230cp, edge 50%
    image: aronChill,
    greeting: "Ready for a fun game?",
    category: 'aron',
  },
  {
    id: 'focused-aron',
    name: 'Focused Aron',
    elo: 1200,
    skillLevel: 0,
    divisionLevel: 7, // Div 1, depth 6, maxLoss 180cp, edge 50%
    image: aronFocused,
    greeting: "Let's play a good game!",
    category: 'aron',
  },
  {
    id: 'competitive-aron',
    name: 'Competitive Aron',
    elo: 1600,
    skillLevel: 0,
    divisionLevel: 11, // Div 2, depth 9, maxLoss 110cp, edge 30%
    image: aronCompetitive,
    greeting: "I won't go easy on you!",
    category: 'aron',
  },
  {
    id: 'madness-aron',
    name: 'Madness Aron',
    elo: 2000,
    skillLevel: 0,
    divisionLevel: 16, // Div 3, depth 11, maxLoss 40cp, edge 50%
    image: aronMadness,
    greeting: "PREPARE FOR CHAOS!",
    category: 'aron',
  },
  {
    id: 'the-magni',
    name: 'The Magni',
    elo: 99999,
    skillLevel: 0,
    divisionLevel: 24,
    image: magniAvatar,
    greeting: "I am The Magni.",
    category: 'aron',
  },
];

export const allBots = [...aronBots];
