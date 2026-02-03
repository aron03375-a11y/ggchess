import { useState, useCallback, useRef, useEffect } from 'react';
import type { MoveAccuracy } from '@/components/MoveHistoryWithAccuracy';

// Thresholds in centipawns
const INACCURACY_THRESHOLD = 100; // 1.0 pawns
const MISTAKE_THRESHOLD = 150;    // 1.5 pawns  
const BLUNDER_THRESHOLD = 300;    // 3.0 pawns

interface EvaluationData {
  evaluation: number | null;
  isMate: boolean;
  mateIn: number | null;
  isWhiteTurn: boolean;
  depth: number;
}

export const useRealTimeAccuracy = () => {
  const [accuracyMarkers, setAccuracyMarkers] = useState<MoveAccuracy[]>([]);
  
  // Store the last stable evaluation before a move was made
  const lastStableEvalRef = useRef<{ eval: number; moveIndex: number } | null>(null);
  // Track which moves we've already marked
  const markedMovesRef = useRef<Set<number>>(new Set());
  // Track the current move count to detect when a move is made
  const lastMoveCountRef = useRef<number>(0);
  // Track if we're waiting to mark a move (after 3s of thinking)
  const pendingMarkRef = useRef<{ moveIndex: number; evalBefore: number; timeout: NodeJS.Timeout } | null>(null);
  // Store the latest evaluation as it comes in
  const currentEvalRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setAccuracyMarkers([]);
    lastStableEvalRef.current = null;
    markedMovesRef.current = new Set();
    lastMoveCountRef.current = 0;
    currentEvalRef.current = null;
    if (pendingMarkRef.current) {
      clearTimeout(pendingMarkRef.current.timeout);
      pendingMarkRef.current = null;
    }
  }, []);

  const normalizeEval = (data: EvaluationData): number | null => {
    if (data.isMate && data.mateIn !== null) {
      return data.isWhiteTurn
        ? (data.mateIn > 0 ? 10000 : -10000)
        : (data.mateIn > 0 ? -10000 : 10000);
    }
    if (data.evaluation !== null) {
      return data.isWhiteTurn ? data.evaluation : -data.evaluation;
    }
    return null;
  };

  const processEvaluation = useCallback((
    data: EvaluationData,
    currentMoveIndex: number
  ) => {
    const normalizedEval = normalizeEval(data);
    if (normalizedEval === null) return;

    // Always update current eval
    currentEvalRef.current = normalizedEval;

    // Detect when a new move was made
    if (currentMoveIndex > lastMoveCountRef.current) {
      const moveJustPlayed = currentMoveIndex - 1;
      
      // If we have a stable evaluation from before the move
      if (lastStableEvalRef.current && !markedMovesRef.current.has(moveJustPlayed)) {
        const evalBefore = lastStableEvalRef.current.eval;
        
        // Clear any existing pending mark
        if (pendingMarkRef.current) {
          clearTimeout(pendingMarkRef.current.timeout);
        }
        
        // Set up a 3-second timer to mark the move after engine stabilizes
        const timeout = setTimeout(() => {
          if (currentEvalRef.current === null) return;
          
          const evalAfter = currentEvalRef.current;
          
          // The move was made by the player whose turn it WAS before the move
          // Move index 0 = White's first move, index 1 = Black's first move, etc.
          const wasWhiteMove = moveJustPlayed % 2 === 0;
          
          // Calculate evaluation loss from the perspective of the moving player
          const evalLoss = wasWhiteMove 
            ? evalBefore - evalAfter
            : evalAfter - evalBefore;

          // Only mark if there's a significant loss
          if (evalLoss >= BLUNDER_THRESHOLD && !markedMovesRef.current.has(moveJustPlayed)) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'blunder',
              evalLoss: evalLoss / 100,
            }]);
          } else if (evalLoss >= MISTAKE_THRESHOLD && !markedMovesRef.current.has(moveJustPlayed)) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'mistake',
              evalLoss: evalLoss / 100,
            }]);
          } else if (evalLoss >= INACCURACY_THRESHOLD && !markedMovesRef.current.has(moveJustPlayed)) {
            markedMovesRef.current.add(moveJustPlayed);
            setAccuracyMarkers(prev => [...prev, {
              index: moveJustPlayed,
              type: 'inaccuracy',
              evalLoss: evalLoss / 100,
            }]);
          }
          
          // Update the stable eval for the next move comparison
          lastStableEvalRef.current = { eval: currentEvalRef.current, moveIndex: currentMoveIndex };
          pendingMarkRef.current = null;
        }, 3000);
        
        pendingMarkRef.current = { moveIndex: moveJustPlayed, evalBefore, timeout };
      }
      
      lastMoveCountRef.current = currentMoveIndex;
    }
    
    // Store stable evaluation when depth is high enough and no move is pending
    if (data.depth >= 15 && !pendingMarkRef.current) {
      lastStableEvalRef.current = { eval: normalizedEval, moveIndex: currentMoveIndex };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingMarkRef.current) {
        clearTimeout(pendingMarkRef.current.timeout);
      }
    };
  }, []);

  return {
    accuracyMarkers,
    processEvaluation,
    reset,
  };
};
