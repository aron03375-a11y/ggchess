import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import catKitten from '@/assets/cat-kitten.png';
import catWhiskers from '@/assets/cat-whiskers.png';
import catPatches from '@/assets/cat-patches.png';
import catShadow from '@/assets/cat-shadow.png';
import botMittens from '@/assets/bot-mittens.png';
import coachBotez from '@/assets/coach-botez.png';
import coachAnna from '@/assets/coach-anna.jpeg';
import coachDina from '@/assets/coach-dina.jpeg';
import coachEric from '@/assets/coach-eric.jpeg';
import coachGotham from '@/assets/coach-gotham.jpeg';
import botDeepBlue from '@/assets/bot-deepblue.png';
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

export const coachBots: Bot[] = [
  {
    id: 'botez-sisters',
    name: 'Botez Sisters',
    elo: 600,
    skillLevel: 0,
    depth: 3,
    image: coachBotez,
    greeting: "Let's have some fun with chess!",
    category: 'coach',
  },
  {
    id: 'anna-cramling',
    name: 'Anna Cramling',
    elo: 1100,
    skillLevel: 2,
    depth: 3,
    image: coachAnna,
    greeting: "Hi! Ready to learn some chess?",
    category: 'coach',
  },
  {
    id: 'dina-belenkaya',
    name: 'Dina Belenkaya',
    elo: 1375,
    skillLevel: 3,
    depth: 5,
    image: coachDina,
    greeting: "Let's play a beautiful game!",
    category: 'coach',
  },
  {
    id: 'eric-rosen',
    name: 'Eric Rosen',
    elo: 1820,
    skillLevel: 7,
    depth: 5,
    image: coachGotham,
    greeting: "Oh no my queen! Just kidding.",
    category: 'coach',
  },
  {
    id: 'gotham-chess',
    name: 'GothamChess',
    elo: 2450,
    skillLevel: 14,
    depth: 9,
    image: coachEric,
    openingMoves: { 'e4': 'c6' },
    greeting: "Get out the WAYYYY!",
    category: 'coach',
  },
];

// Deep Blue – 6 escalating levels (I → VI). Level VI uses UCI_LimitStrength at 2800.
// The other levels are tuned to climb consistently and stay within Stockfish's UCI_Elo range (≥1320).
export const deepBlueBots: Bot[] = [
  {
    id: 'deepblue-1',
    name: 'Deep Blue I',
    elo: 1400,
    skillLevel: 3,
    depth: 8,
    image: botDeepBlue,
    greeting: "Initializing... Level I online.",
    category: 'deepblue',
    uciElo: 1400,
  },
  {
    id: 'deepblue-2',
    name: 'Deep Blue II',
    elo: 1700,
    skillLevel: 6,
    depth: 10,
    image: botDeepBlue,
    greeting: "Calculating variations. Level II.",
    category: 'deepblue',
    uciElo: 1700,
  },
  {
    id: 'deepblue-3',
    name: 'Deep Blue III',
    elo: 2000,
    skillLevel: 10,
    depth: 12,
    image: botDeepBlue,
    greeting: "Pattern recognition active.",
    category: 'deepblue',
    uciElo: 2000,
  },
  {
    id: 'deepblue-4',
    name: 'Deep Blue IV',
    elo: 2300,
    skillLevel: 14,
    depth: 14,
    image: botDeepBlue,
    greeting: "Strategic depth: maximal.",
    category: 'deepblue',
    uciElo: 2300,
  },
  {
    id: 'deepblue-5',
    name: 'Deep Blue V',
    elo: 2550,
    skillLevel: 17,
    depth: 16,
    image: botDeepBlue,
    greeting: "Grandmaster protocols engaged.",
    category: 'deepblue',
    uciElo: 2550,
  },
  {
    id: 'deepblue-6',
    name: 'Deep Blue VI',
    elo: 2800,
    skillLevel: 20,
    depth: 18,
    image: botDeepBlue,
    greeting: "Kasparov, prepare yourself.",
    category: 'deepblue',
    uciElo: 2800,
  },
];

export const allBots = [...aronBots, ...catBots, ...coachBots, ...deepBlueBots];
