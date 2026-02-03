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

  // Initialize Stockfish using blob-based worker to bypass CORS
  useEffect(() => {
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
    `;
    
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const stockfish = new Worker(workerUrl);
      URL.revokeObjectURL(workerUrl);
      
      stockfishRef.current = stockfish;
      stockfish.postMessage('uci');
      stockfish.postMessage('isready');
      
      return () => {
        stockfish.terminate();
      };
    } catch (e) {
      console.error('Failed to create Stockfish worker:', e);
    }
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

      let lastEval: number | null = null;
      const isWhiteTurn = game.turn() === 'w';

      const handleMessage = (event: MessageEvent) => {
        const message = event.data;
        
        if (typeof message === 'string') {
          // Capture running evaluations at higher depths
          if (message.startsWith('info') && message.includes('depth')) {
            const depthMatch = message.match(/depth (\d+)/);
            const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
            
            // Only capture evaluations at reasonable depth
            if (depth >= 10) {
              if (message.includes('score cp')) {
                const match = message.match(/score cp (-?\d+)/);
                if (match) {
                  const eval_ = parseInt(match[1], 10);
                  // Normalize to White's perspective
                  lastEval = isWhiteTurn ? eval_ : -eval_;
                }
              } else if (message.includes('score mate')) {
                const match = message.match(/score mate (-?\d+)/);
                if (match) {
                  const mateIn = parseInt(match[1], 10);
                  // Positive mateIn = side to move can deliver mate (good for them)
                  // Negative mateIn = side to move gets mated (bad for them)
                  lastEval = isWhiteTurn 
                    ? (mateIn > 0 ? 10000 : -10000)
                    : (mateIn > 0 ? -10000 : 10000);
                }
              }
            }
          } else if (message.startsWith('bestmove')) {
            stockfish.removeEventListener('message', handleMessage);
            resolve(lastEval);
          }
        }
      };

      stockfish.addEventListener('message', handleMessage);
      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage('go depth 18'); // Deeper search for more accurate evals
      
      // Timeout after 8 seconds
      setTimeout(() => {
        stockfish.removeEventListener('message', handleMessage);
        stockfish.postMessage('stop');
        resolve(lastEval);
      }, 8000);
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
