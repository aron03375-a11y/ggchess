import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import botCrusher from '@/assets/bot-crusher.png';
import botHealer from '@/assets/bot-healer.png';
import botLover from '@/assets/bot-lover.png';
import { Bot } from '@/types/bot';

export const aronBots: Bot[] = [
  {
    id: 'chill-aron',
    name: 'Chill Aron',
    elo: 800,
    skillLevel: 0, // Edit this (0-20)
    image: aronChill,
    greeting: "Ready for a fun game?",
    category: 'aron',
  },
  {
    id: 'focused-aron',
    name: 'Focused Aron',
    elo: 1200,
    skillLevel: 3, // Edit this (0-20)
    image: aronFocused,
    greeting: "Let's play a good game!",
    category: 'aron',
  },
  {
    id: 'competitive-aron',
    name: 'Competitive Aron',
    elo: 1600,
    skillLevel: 5, // Edit this (0-20)
    image: aronCompetitive,
    greeting: "I won't go easy on you!",
    category: 'aron',
  },
  {
    id: 'madness-aron',
    name: 'Madness Aron',
    elo: 2000,
    skillLevel: 9, // Edit this (0-20)
    image: aronMadness,
    greeting: "PREPARE FOR CHAOS!",
    category: 'aron',
  },
];

export const newYearBots: Bot[] = [
  {
    id: 'crusher',
    name: 'Crusher',
    elo: 1000,
    skillLevel: 2, // Edit this (0-20)
    image: botCrusher,
    greeting: "I'll crush your pieces!",
    category: 'newyear',
  },
  {
    id: 'healer',
    name: 'Healer',
    elo: 1400,
    skillLevel: 4, // Edit this (0-20)
    image: botHealer,
    greeting: "Let's have a gentle match!",
    category: 'newyear',
  },
  {
    id: 'lover',
    name: 'Lover',
    elo: 1800,
    skillLevel: 7, // Edit this (0-20)
    image: botLover,
    greeting: "I'll win with love! ♥",
    category: 'newyear',
  },
];

export const allBots = [...aronBots, ...newYearBots];
