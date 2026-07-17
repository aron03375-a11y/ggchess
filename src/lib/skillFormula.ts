// Pure skill-level logic: divisions, depth, maxLoss, edge probability, and picker.
// Zero dependencies.
//
// Usage:
//   1) Ask Stockfish for MultiPV lines at `depth` from skillSettings(level).
//   2) Collect { move, score } pairs (score in centipawns from side-to-move POV).
//   3) Call chooseSkillMove(scores, level) to pick the final move.

export type RootScore = { move: string; score: number };

/**
 * Division tuning:
 *   Div 1 (lvl 1-9)   -> depth 6,  edge 60%
 *   Div 2 (lvl 10-20) -> depth 9,  edge 60%
 *   Div 3 (lvl 21-25) -> depth 11, edge 60%
 *
 * maxLoss (centipawns) shrinks as level rises: 10 * (26 - level)
 *   lvl 1  -> 250cp tolerated
 *   lvl 25 -> 10cp tolerated
 */
export function skillSettings(level: number): {
  depth: number; maxLoss: number; edgeChance: number; label: string;
} {
  const lvl = Math.max(1, Math.min(25, Math.floor(level)));
  if (lvl <= 9)  return { depth: 6,  maxLoss: 10 * (26 - lvl), edgeChance: 0.6, label: 'Div 1' };
  if (lvl <= 20) return { depth: 9,  maxLoss: 10 * (26 - lvl), edgeChance: 0.6, label: 'Div 2' };
  return         { depth: 11, maxLoss: 10 * (26 - lvl), edgeChance: 0.6, label: 'Div 3' };
}

/**
 * Pick a move from the MultiPV list according to the level's division rules:
 *  - Keep only moves within `maxLoss` cp of the best score.
 *  - With probability `edgeChance` play a RANDOM move inside that window
 *    (excluding the best); otherwise play the best.
 */
export function chooseSkillMove(scores: RootScore[], level: number): RootScore | null {
  if (scores.length === 0) return null;
  const { maxLoss, edgeChance } = skillSettings(level);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const inside = sorted.filter(c => best.score - c.score <= maxLoss);
  if (inside.length <= 1) return best;
  
  // Exclude the best move from candidates for random selection
  const suboptimal = inside.slice(1);
  return Math.random() < edgeChance ? suboptimal[Math.floor(Math.random() * suboptimal.length)] : best;
}

/**
 * Helper: parse a UCI `info ... score cp|mate N ...` token stream into centipawns.
 * Mate scores are mapped to +/-90000 minus distance, so sorting still works.
 */
export function parseUciScore(parts: string[]): number | null {
  const i = parts.indexOf('score');
  if (i < 0) return null;
  const kind = parts[i + 1];
  const raw = Number(parts[i + 2]);
  if (!Number.isFinite(raw)) return null;
  if (kind === 'cp') return raw;
  if (kind === 'mate') return raw > 0 ? 90000 - raw : -90000 - raw;
  return null;
}
