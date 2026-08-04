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

const club = (
  id: string,
  name: string,
  level: number,
  elo: number,
  image: string,
  greeting: string,
): Bot => ({
  id,
  name,
  elo,
  skillLevel: 0,
  divisionLevel: level,
  image,
  greeting,
  category: 'chessclub',
});

export const chessClubBots: Bot[] = [
  club('emma-1', 'Emma', 1, 500, emma1.url, "I'm just learning, be nice!"),
  club('daniel-3', 'Daniel', 3, 700, daniel3.url, "Let's have a friendly game."),
  club('sofia-5', 'Sofia', 5, 900, sofia5.url, "I've been practising my openings."),
  club('marcus-8', 'Marcus', 8, 1200, marcus8.url, "Tactics are my thing."),
  club('jamal-11', 'Jamal', 11, 1500, jamal11.url, "Club champion material, watch out."),
  club('asha-13', 'Asha', 13, 1700, asha13.url, "I never miss a fork."),
  club('aizen-15', 'Aizen', 15, 1900, aizen15.url, "Endgames? My favourite part."),
  club('mei-18', 'Mei', 18, 2200, mei18.url, "Prepare to be outplayed."),
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
    greeting: "Time to shred on the board!",
    category: 'magnus',
  },
  {
    id: 'chef-magnus',
    name: 'Chef Magnus',
    elo: 1700,
    skillLevel: 0,
    divisionLevel: 12,
    image: chefMagnus,
    greeting: "Let me cook up some tactics!",
    category: 'magnus',
  },
  {
    id: 'the-magni',
    name: 'Magnus Carlsen',
    elo: 2884,
    skillLevel: 0,
    divisionLevel: 23,
    image: magniAvatar,
    greeting: "I am The Magni.",
    category: 'magnus',
  },
];

export const allBots = [...chessClubBots, ...magnusBots];
