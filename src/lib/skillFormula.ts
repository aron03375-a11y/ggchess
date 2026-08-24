// Pure Elo-based bot strength logic: depth, maxLoss, best-move probability, and picker.
// Zero dependencies.
//
// Usage:
//   1) Ask Stockfish for MultiPV lines at `depth` from eloSettings(botElo).
//   2) Collect { move, score } pairs (score in centipawns from side-to-move POV).
//   3) Call chooseEloMove(scores, botElo) to pick the final move.

export type RootScore = { move: string; score: number };

/**
 * Probability of playing the engine's best move = botElo / 3200,
 * rounded to the nearest 1/100 (e.g. 0.459 -> 0.46). Clamped to [0, 1].
 */
export function bestMoveProbability(botElo: number): number {
  const p = Math.round((botElo / 3200) * 100) / 100;
  return Math.max(0, Math.min(1, p));
}

/**
 * Elo bands:
 *   <= 1000      -> depth 4,  maxLoss 350cp
 *   1001 - 1500  -> depth 6,  maxLoss 300cp
 *   1501 - 2000  -> depth 8,  maxLoss 250cp
 *   2001 - 2500  -> depth 10, maxLoss 200cp
 *   2501 - 3000  -> depth 12, maxLoss 150cp
 *   > 3000       -> depth 12, maxLoss 100cp
 */
export function eloSettings(botElo: number): {
  depth: number; maxLoss: number; bestChance: number; label: string;
} {
  const elo = Math.max(100, Math.min(3200, Math.round(botElo)));
  const bestChance = bestMoveProbability(elo);
  if (elo <= 1000) return { depth: 4, maxLoss: 350, bestChance, label: '≤1000' };
  if (elo <= 1500) return { depth: 6, maxLoss: 300, bestChance, label: '1000-1500' };
  if (elo <= 2000) return { depth: 8, maxLoss: 250, bestChance, label: '1600-2000' };
  if (elo <= 2500) return { depth: 10, maxLoss: 200, bestChance, label: '2100-2500' };
  if (elo <= 3000) return { depth: 12, maxLoss: 150, bestChance, label: '2600-3000' };
  return { depth: 12, maxLoss: 100, bestChance, label: '3000-3200' };
}

/**
 * Pick a move from the MultiPV list:
 *  - With probability `bestChance` play the best move.
 *  - Otherwise play a RANDOM move within `maxLoss` cp of the best (excluding the best).
 */
export function chooseEloMove(scores: RootScore[], botElo: number): RootScore | null {
  if (scores.length === 0) return null;
  const { maxLoss, bestChance } = eloSettings(botElo);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (Math.random() < bestChance) return best;

  const inside = sorted.slice(1).filter(c => best.score - c.score <= maxLoss);
  if (inside.length === 0) return best;
  return inside[Math.floor(Math.random() * inside.length)];
}

/**
 * Helper: parse a UCI `info ... score cp|mate N ...` token stream into centipawns.
 */
export function parseUciScore(parts: string[]): number | null {
  const i = parts.indexOf('score');
  if (i < 0) return null;
  const kind = parts[i + 1];
  const raw = Number(parts[i + 2]);
  if (!Number.isFinite(raw)) return null;
  if (kind === 'cp') return raw;
  if (kind === 'mate') return raw > 0 ? 401 - raw : -401 - raw;
  return null;
}
