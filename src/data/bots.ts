import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import catKitten from '@/assets/cat-kitten.png';
import catWhiskers from '@/assets/cat-whiskers.png';
import catPatches from '@/assets/cat-patches.png';
import catShadow from '@/assets/cat-shadow.png';
import botMittens from '@/assets/bot-mittens.png';
import { Bot } from '@/types/bot';

export const aronBots: Bot[] = [
  {
    id: 'chill-aron',
    name: 'Chill Aron',
    elo: 800,
    skillLevel: 0,
    depth: 3,
    image: aronChill,
    greeting: "Ready for a fun game?",
    category: 'aron',
  },
  {
    id: 'focused-aron',
    name: 'Focused Aron',
    elo: 1200,
    skillLevel: 3,
    depth: 3,
    image: aronFocused,
    greeting: "Let's play a good game!",
    category: 'aron',
  },
  {
    id: 'competitive-aron',
    name: 'Competitive Aron',
    elo: 1600,
    skillLevel: 5,
    depth: 5,
    image: aronCompetitive,
    greeting: "I won't go easy on you!",
    category: 'aron',
  },
  {
    id: 'madness-aron',
    name: 'Madness Aron',
    elo: 2000,
    skillLevel: 9,
    depth: 7,
    image: aronMadness,
    greeting: "PREPARE FOR CHAOS!",
    category: 'aron',
  },
];

export const catBots: Bot[] = [
  {
    id: 'kitten',
    name: 'Kitten',
    elo: 600,
    skillLevel: 0,
    depth: 3,
    image: catKitten,
    greeting: "Mew~ What's chess?",
    category: 'cat',
  },
  {
    id: 'whiskers',
    name: 'Whiskers',
    elo: 1000,
    skillLevel: 1,
    depth: 3,
    image: catWhiskers,
    greeting: "Meow~ I just wanna play!",
    category: 'cat',
  },
  {
    id: 'patches',
    name: 'Patches',
    elo: 1400,
    skillLevel: 3,
    depth: 4,
    image: catPatches,
    greeting: "Purrfect time for chess!",
    category: 'cat',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    elo: 1800,
    skillLevel: 5,
    depth: 6,
    image: catShadow,
    greeting: "I see everything... *hiss*",
    category: 'cat',
  },
  {
    id: 'mittens',
    name: 'Mittens',
    elo: 1,
    skillLevel: 18,
    depth: 12,
    image: botMittens,
    greeting: "I will destroy you. Meow.",
    category: 'cat',
  },
];

export const allBots = [...aronBots, ...catBots];
