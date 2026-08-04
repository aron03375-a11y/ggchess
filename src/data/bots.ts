import magniAvatar from '@/assets/magni.jpg';
import sleepyMagnus from '@/assets/sleepy-magnus.jpg';
import skaterMagnus from '@/assets/skater-magnus.jpg';
import soccerMagnus from '@/assets/soccer-magnus.jpg';
import chefMagnus from '@/assets/chef-magnus.jpg';
import emma1 from '@/assets/Emma1.jpg.asset.json';
import daniel3 from '@/assets/Daniel3.jpg.asset.json';
import sofia5 from '@/assets/Sofia5.jpg.asset.json';
import marcus8 from '@/assets/Marcus8.jpg.asset.json';
import jamal11 from '@/assets/Jamal11.jpg.asset.json';
import asha13 from '@/assets/Asha13.jpg.asset.json';
import aizen15 from '@/assets/Aizen15.jpg.asset.json';
import mei18 from '@/assets/Mei18.jpg.asset.json';
import { Bot } from '@/types/bot';

// Chess club — same division/skill formula as every other bot (src/lib/skillFormula.ts).
export const chessClubBots: Bot[] = [
  {
    id: 'emma-1',
    name: 'Emma',
    elo: 500,
    skillLevel: 0,
    divisionLevel: 1,
    image: emma1.url,
    greeting: "I'm just learning, be nice!",
    category: 'chessclub',
  },
  {
    id: 'daniel-3',
    name: 'Daniel',
    elo: 700,
    skillLevel: 0,
    divisionLevel: 3,
    image: daniel3.url,
    greeting: "Let's have a friendly game.",
    category: 'chessclub',
  },
  {
    id: 'sofia-5',
    name: 'Sofia',
    elo: 1000,
    skillLevel: 0,
    divisionLevel: 5,
    image: sofia5.url,
    greeting: "I've been practising my openings.",
    category: 'chessclub',
  },
  {
    id: 'marcus-8',
    name: 'Marcus',
    elo: 1300,
    skillLevel: 0,
    divisionLevel: 8,
    image: marcus8.url,
    greeting: 'Tactics are my thing.',
    category: 'chessclub',
  },
  {
    id: 'jamal-11',
    name: 'Jamal',
    elo: 1600,
    skillLevel: 0,
    divisionLevel: 11,
    image: jamal11.url,
    greeting: 'Club champion material, watch out.',
    category: 'chessclub',
  },
  {
    id: 'asha-13',
    name: 'Asha',
    elo: 1800,
    skillLevel: 0,
    divisionLevel: 13,
    image: asha13.url,
    greeting: 'I never miss a fork.',
    category: 'chessclub',
  },
  {
    id: 'aizen-15',
    name: 'Aizen',
    elo: 2000,
    skillLevel: 0,
    divisionLevel: 15,
    image: aizen15.url,
    greeting: 'Endgames? My favourite part.',
    category: 'chessclub',
  },
  {
    id: 'mei-18',
    name: 'Mei',
    elo: 2250,
    skillLevel: 0,
    divisionLevel: 18,
    image: mei18.url,
    greeting: 'Prepare to be outplayed.',
    category: 'chessclub',
  },
];

// Magnus Moods — full-strength Stockfish nerfed via MultiPV + skillFormula picker.
export const magnusBots: Bot[] = [
  {
    id: 'sleepy-magnus',
    name: 'Sleepy Magnus',
    elo: 500,
    skillLevel: 0,
    divisionLevel: 1,
    image: sleepyMagnus,
    greeting: "Yawn... let's play...",
    category: 'magnus',
  },
  {
    id: 'soccer-magnus',
    name: 'Soccer Magnus',
    elo: 1000,
    skillLevel: 0,
    divisionLevel: 5,
    image: soccerMagnus,
    greeting: "Let's kick off a game!",
    category: 'magnus',
  },
  {
    id: 'skater-magnus',
    name: 'Skater Magnus',
    elo: 1500,
    skillLevel: 0,
    divisionLevel: 10,
    image: skaterMagnus,
    greeting: 'Time to shred on the board!',
    category: 'magnus',
  },
  {
    id: 'chef-magnus',
    name: 'Chef Magnus',
    elo: 1700,
    skillLevel: 0,
    divisionLevel: 12,
    image: chefMagnus,
    greeting: 'Let me cook up some tactics!',
    category: 'magnus',
  },
  {
    id: 'the-magni',
    name: 'Magnus Carlsen',
    elo: 2884,
    skillLevel: 0,
    divisionLevel: 23,
    image: magniAvatar,
    greeting: 'I am The Magni.',
    category: 'magnus',
  },
];

export const allBots = [...chessClubBots, ...magnusBots];
