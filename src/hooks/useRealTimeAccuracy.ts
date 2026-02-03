import { useState, useCallback, useRef, useEffect } from 'react';
import type { MoveAccuracy } from '@/components/MoveHistoryWithAccuracy';

// Thresholds in centipawns
const INACCURACY_THRESHOLD = 100; // 1.0 pawns
const MISTAKE_THRESHOLD = 150;    // 1.5 pawns  
const BLUNDER_THRESHOLD = 300;    // 3.0 pawns

interface UseRealTimeAccuracyOptions {
  evaluation: number | null;
  isMate: boolean;
  mateIn: number | null;
  currentMoveIndex: number;
  isWhiteTurn: boolean;
  depth: number;
}

export const useRealTimeAccuracy = () => {
  const [accuracyMarkers, setAccuracyMarkers] = useState<MoveAccuracy[]>([]);
  const previousEvalRef = useRef<{ eval: number; moveIndex: number; depth: number } | null>(null);
  const markedMovesRef = useRef<Set<number>>(new Set());
  const stableEvalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentEvalRef = useRef<{ eval: number; depth: number } | null>(null);

  const reset = useCallback(() => {
    setAccuracyMarkers([]);
    previousEvalRef.current = null;
    markedMovesRef.current = new Set();
    currentEvalRef.current = null;
    if (stableEvalTimeoutRef.current) {
      clearTimeout(stableEvalTimeoutRef.current);
      stableEvalTimeoutRef.current = null;
    }
  }, []);

  const processEvaluation = useCallback(({
    evaluation,
    isMate,
    mateIn,
    currentMoveIndex,
    isWhiteTurn,
    depth,
  }: UseRealTimeAccuracyOptions) => {
    // Calculate normalized evaluation (always from White's perspective)
    let normalizedEval: number;
    if (isMate && mateIn !== null) {
      normalizedEval = isWhiteTurn
        ? (mateIn > 0 ? 10000 : -10000)
        : (mateIn > 0 ? -10000 : 10000);
    } else if (evaluation !== null) {
      normalizedEval = isWhiteTurn ? evaluation : -evaluation;
    } else {
      return;
    }

    // Store current eval
    currentEvalRef.current = { eval: normalizedEval, depth };

    // Clear any pending timeout
    if (stableEvalTimeoutRef.current) {
      clearTimeout(stableEvalTimeoutRef.current);
    }

    // Wait 3 seconds for evaluation to stabilize before marking
    stableEvalTimeoutRef.current = setTimeout(() => {
      if (!currentEvalRef.current || depth < 12) return;

      const stableEval = currentEvalRef.current.eval;

      // If we have a previous evaluation and this is a new move
      if (previousEvalRef.current && currentMoveIndex > previousEvalRef.current.moveIndex) {
        const moveJustPlayed = currentMoveIndex - 1;
        
        // Don't mark the same move twice
        if (!markedMovesRef.current.has(moveJustPlayed)) {
          const evalBefore = previousEvalRef.current.eval;
          const evalAfter = stableEval;
          
          // The move was made by the player whose turn it WAS (before the move)
          // At currentMoveIndex, it's the opponent's turn, so the previous player moved
          // Move index 0 = White's first move, index 1 = Black's first move, etc.
          const wasWhiteMove = moveJustPlayed % 2 === 0;
          
          // Calculate evaluation loss from the perspective of the moving player
          // For White: positive eval is good, so loss = evalBefore - evalAfter
          // For Black: negative eval is good, so loss = evalAfter - evalBefore
          const evalLoss = wasWhiteMove 
            ? evalBefore - evalAfter
            : evalAfter - evalBefore;

          // Only mark if there's a significant loss
          if (evalLoss >= BLUNDER_THRESHOLD) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'blunder',
              evalLoss: evalLoss / 100,
            }]);
          } else if (evalLoss >= MISTAKE_THRESHOLD) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'mistake',
              evalLoss: evalLoss / 100,
            }]);
          } else if (evalLoss >= INACCURACY_THRESHOLD) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'inaccuracy',
              evalLoss: evalLoss / 100,
            }]);
          }
        }
      }

      // Store this evaluation for the next move comparison
      previousEvalRef.current = {
        eval: stableEval,
        moveIndex: currentMoveIndex,
        depth: currentEvalRef.current.depth,
      };
    }, 3000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stableEvalTimeoutRef.current) {
        clearTimeout(stableEvalTimeoutRef.current);
      }
    };
  }, []);

  return {
    accuracyMarkers,
    processEvaluation,
    reset,
  };
};
