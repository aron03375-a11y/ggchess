import aronChill from '@/assets/aron-chill.png';
import aronFocused from '@/assets/aron-focused.png';
import aronCompetitive from '@/assets/aron-competitive.png';
import aronMadness from '@/assets/aron-madness.png';
import hikaruSleepy from '@/assets/hikaru-sleepy.png';
import hikaruSoccer from '@/assets/hikaru-soccer.png';
import hikaruChef from '@/assets/hikaru-chef.png';
import hikaruStreamer from '@/assets/hikaru-streamer.png';
import { Bot } from '@/types/bot';

export const aronBots: Bot[] = [
  {
    id: 'chill-aron',
    name: 'Chill Aron',
    elo: 800,
    skillLevel: 0, // Edit this (0-20)
    depth: 3, // Edit this (1-15) - higher = stronger/slower
    image: aronChill,
    greeting: "Ready for a fun game?",
    category: 'aron',
  },
  {
    id: 'focused-aron',
    name: 'Focused Aron',
    elo: 1200,
    skillLevel: 3, // Edit this (0-20)
    depth: 3,
    image: aronFocused,
    greeting: "Let's play a good game!",
    category: 'aron',
  },
  {
    id: 'competitive-aron',
    name: 'Competitive Aron',
    elo: 1600,
    skillLevel: 5, // Edit this (0-20)
    depth: 5,
    image: aronCompetitive,
    greeting: "I won't go easy on you!",
    category: 'aron',
  },
  {
    id: 'madness-aron',
    name: 'Madness Aron',
    elo: 2000,
    skillLevel: 9, // Edit this (0-20)
    depth: 7,
    image: aronMadness,
    greeting: "PREPARE FOR CHAOS!",
    category: 'aron',
  },
];

export const hikaruBots: Bot[] = [
  {
    id: 'sleepy-hikaru',
    name: 'Sleepy Hikaru',
    elo: 1000,
    skillLevel: 1,
    depth: 3,
    image: hikaruSleepy,
    greeting: "*yawn* Let's play... I guess...",
    category: 'hikaru',
  },
  {
    id: 'soccer-hikaru',
    name: 'Soccer Hikaru',
    elo: 1400,
    skillLevel: 4,
    depth: 4,
    image: hikaruSoccer,
    greeting: "Time to score some checkmates!",
    category: 'hikaru',
  },
  {
    id: 'chef-hikaru',
    name: 'Chef Hikaru',
    elo: 1800,
    skillLevel: 7,
    depth: 6,
    image: hikaruChef,
    greeting: "I'm cooking up a tasty attack!",
    category: 'hikaru',
  },
  {
    id: 'streamer-hikaru',
    name: 'Streamer Hikaru',
    elo: 2800,
    skillLevel: 20,
    depth: 15,
    image: hikaruStreamer,
    greeting: "Chat, let's destroy this guy!",
    category: 'hikaru',
  },
];

export const allBots = [...aronBots, ...hikaruBots];
