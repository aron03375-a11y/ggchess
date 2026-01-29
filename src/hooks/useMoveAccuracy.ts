import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { MoveAccuracy } from '@/components/MoveHistoryWithAccuracy';

interface UseMoveAccuracyOptions {
  fenHistory: string[];
  moves: string[];
}

// Thresholds in centipawns
const INACCURACY_THRESHOLD = 100; // 1.0 pawns
const MISTAKE_THRESHOLD = 150;    // 1.5 pawns  
const BLUNDER_THRESHOLD = 300;    // 3.0 pawns

export const useMoveAccuracy = ({ fenHistory, moves }: UseMoveAccuracyOptions) => {
  const [accuracyMarkers, setAccuracyMarkers] = useState<MoveAccuracy[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const stockfishRef = useRef<Worker | null>(null);
  const evaluationsRef = useRef<Map<number, number>>(new Map());

  // Initialize Stockfish
  useEffect(() => {
    const stockfish = new Worker(
      'https://cdn.jsdelivr.net/npm/stockfish@10.0.2/stockfish.js'
    );
    
    stockfishRef.current = stockfish;
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    
    return () => {
      stockfish.terminate();
    };
  }, []);

  const evaluatePosition = useCallback((fen: string): Promise<number | null> => {
    return new Promise((resolve) => {
      const stockfish = stockfishRef.current;
      if (!stockfish) {
        resolve(null);
        return;
      }

      const game = new Chess(fen);
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          // Return a large value for checkmate
          const loser = game.turn();
          resolve(loser === 'w' ? -10000 : 10000);
        } else {
          resolve(0); // Draw
        }
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const message = event.data;
        
        if (typeof message === 'string') {
          // Look for the final evaluation in the bestmove response
          if (message.startsWith('info') && message.includes('score cp')) {
            const match = message.match(/score cp (-?\d+)/);
            if (match) {
              const eval_ = parseInt(match[1], 10);
              // Stockfish returns eval from side-to-move perspective
              // Normalize to White's perspective
              const isWhiteTurn = game.turn() === 'w';
              const normalizedEval = isWhiteTurn ? eval_ : -eval_;
              stockfish.removeEventListener('message', handleMessage);
              resolve(normalizedEval);
            }
          } else if (message.startsWith('info') && message.includes('score mate')) {
            const match = message.match(/score mate (-?\d+)/);
            if (match) {
              const mateIn = parseInt(match[1], 10);
              const isWhiteTurn = game.turn() === 'w';
              // Large value for mate
              const normalizedEval = isWhiteTurn 
                ? (mateIn > 0 ? 10000 : -10000)
                : (mateIn > 0 ? -10000 : 10000);
              stockfish.removeEventListener('message', handleMessage);
              resolve(normalizedEval);
            }
          } else if (message.startsWith('bestmove')) {
            // If we get bestmove without finding eval, use last known
            stockfish.removeEventListener('message', handleMessage);
            resolve(null);
          }
        }
      };

      stockfish.addEventListener('message', handleMessage);
      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage('go depth 12');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        stockfish.removeEventListener('message', handleMessage);
        resolve(null);
      }, 5000);
    });
  }, []);

  const analyzeGame = useCallback(async () => {
    if (fenHistory.length <= 1 || moves.length === 0) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    setAccuracyMarkers([]);
    evaluationsRef.current.clear();

    const markers: MoveAccuracy[] = [];
    const evaluations: number[] = [];

    // Evaluate each position
    for (let i = 0; i < fenHistory.length; i++) {
      const eval_ = await evaluatePosition(fenHistory[i]);
      evaluations.push(eval_ ?? 0);
      setProgress(Math.round((i / fenHistory.length) * 100));
    }

    // Calculate accuracy for each move
    for (let i = 0; i < moves.length; i++) {
      const evalBefore = evaluations[i];
      const evalAfter = evaluations[i + 1];
      
      // Determine who made the move (White moves on even indices, Black on odd)
      const isWhiteMove = i % 2 === 0;
      
      // Calculate evaluation loss from the perspective of the moving player
      // For White: positive eval is good, so loss = evalBefore - evalAfter
      // For Black: negative eval is good, so loss = evalAfter - evalBefore
      const evalLoss = isWhiteMove 
        ? evalBefore - evalAfter
        : evalAfter - evalBefore;

      // Only mark if there's a significant loss
      if (evalLoss >= BLUNDER_THRESHOLD) {
        markers.push({
          index: i,
          type: 'blunder',
          evalLoss: evalLoss / 100,
        });
      } else if (evalLoss >= MISTAKE_THRESHOLD) {
        markers.push({
          index: i,
          type: 'mistake',
          evalLoss: evalLoss / 100,
        });
      } else if (evalLoss >= INACCURACY_THRESHOLD) {
        markers.push({
          index: i,
          type: 'inaccuracy',
          evalLoss: evalLoss / 100,
        });
      }
    }

    setAccuracyMarkers(markers);
    setIsAnalyzing(false);
    setProgress(100);
  }, [fenHistory, moves, evaluatePosition]);

  return {
    accuracyMarkers,
    isAnalyzing,
    progress,
    analyzeGame,
  };
};
