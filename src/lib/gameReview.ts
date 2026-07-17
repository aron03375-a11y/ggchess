/**
 * Move accuracy analysis types and calculations
 */

export type MoveCategory = 'brilliant' | 'great' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  moveNumber: number;
  san: string;
  category: MoveCategory;
  cpLoss: number;
}

export interface GameReview {
  totalMoves: number;
  totalCpLoss: number;
  averageCpLoss: number;
  accuracy: number;
  gameRating: number;
  moves: MoveAnalysis[];
  categoryCount: Record<MoveCategory, number>;
}

/**
 * Categorizes a move based on centipawn loss
 * - brilliant: No cp loss but undefended material (special case, evaluated elsewhere)
 * - great: No cp loss (maintains evaluation)
 * - inaccuracy: 0.6 to 1.4 cp loss
 * - mistake: 1.5 to 2.5 cp loss
 * - blunder: > 2.5 cp loss
 */
export function categorizeMoveByLoss(cpLoss: number): Exclude<MoveCategory, 'brilliant'> {
  if (cpLoss < 0.6) return 'great';
  if (cpLoss <= 1.4) return 'inaccuracy';
  if (cpLoss <= 2.5) return 'mistake';
  return 'blunder';
}

/**
 * Calculate game review metrics
 * @param moves Array of moves with their cp loss values
 * @returns GameReview object with all metrics
 */
export function calculateGameReview(moves: { san: string; cpLoss: number }[]): GameReview {
  if (moves.length === 0) {
    return {
      totalMoves: 0,
      totalCpLoss: 0,
      averageCpLoss: 0,
      accuracy: 100,
      gameRating: 3400,
      moves: [],
      categoryCount: {
        brilliant: 0,
        great: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0
      }
    };
  }

  const totalCpLoss = Math.round(moves.reduce((sum, m) => sum + m.cpLoss, 0));
  const averageCpLoss = Math.round(totalCpLoss / moves.length);
  const accuracy = Math.max(0, 100 - averageCpLoss);
  const gameRating = Math.round((3400 - averageCpLoss * 70) / 50) * 50;

  const categoryCount: Record<MoveCategory, number> = {
    brilliant: 0,
    great: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0
  };

  const analyzedMoves = moves.map((m, i) => {
    const category = categorizeMoveByLoss(m.cpLoss);
    categoryCount[category]++;
    return {
      moveNumber: i + 1,
      san: m.san,
      category,
      cpLoss: Math.round(m.cpLoss)
    };
  });

  return {
    totalMoves: moves.length,
    totalCpLoss,
    averageCpLoss,
    accuracy,
    gameRating,
    moves: analyzedMoves,
    categoryCount
  };
}

/**
 * Get the symbol for a move category
 */
export function getCategorySymbol(category: MoveCategory): string {
  switch (category) {
    case 'brilliant': return '!!';
    case 'great': return '!';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
  }
}

/**
 * Get the color class for a move category
 */
export function getCategoryColor(category: MoveCategory): string {
  switch (category) {
    case 'brilliant': return 'text-teal-400';
    case 'great': return 'text-blue-400';
    case 'inaccuracy': return 'text-yellow-400';
    case 'mistake': return 'text-orange-400';
    case 'blunder': return 'text-red-400';
  }
}
