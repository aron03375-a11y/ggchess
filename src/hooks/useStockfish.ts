import { useRef, useCallback, useEffect, useState } from 'react';

interface UseStockfishOptions {
  skillLevel: number; // 0-20
  moveTime?: number;
  depth?: number; // Optional depth limit
}

export const useStockfish = ({ skillLevel, moveTime = 500, depth }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const worker = new Worker('/stockfish/stockfish-17.1-lite-single.js');
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const message = e.data;
        
        if (typeof message === 'string') {
          if (message === 'uciok') {
            const clampedSkillLevel = Math.min(20, Math.max(0, skillLevel));
            worker.postMessage(`setoption name Skill Level value ${clampedSkillLevel}`);
            worker.postMessage('setoption name Hash value 16');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
          } else if (message.startsWith('bestmove')) {
            const match = message.match(/bestmove\s+(\S+)/);
            const bestMove = match ? match[1] : null;
            
            if (resolverRef.current) {
              resolverRef.current(bestMove);
              resolverRef.current = null;
            }
          }
        }
      };

      worker.onerror = (e) => {
        console.error('Stockfish worker error:', e);
      };

      worker.postMessage('uci');

      return () => {
        worker.postMessage('quit');
        worker.terminate();
        workerRef.current = null;
        setIsReady(false);
      };
    } catch (e) {
      console.error('Failed to create Stockfish worker:', e);
    }
  }, [skillLevel]);

  const getBestMove = useCallback((fen: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(null);
        return;
      }

      const attemptMove = (attempts = 0) => {
        if (attempts > 50) {
          resolve(null);
          return;
        }
        
        if (isReady && workerRef.current) {
          resolverRef.current = resolve;
          workerRef.current.postMessage(`position fen ${fen}`);
          const goCommand = depth ? `go depth ${depth}` : `go movetime ${moveTime}`;
          workerRef.current.postMessage(goCommand);
        } else {
          setTimeout(() => attemptMove(attempts + 1), 100);
        }
      };
      
      attemptMove();
    });
  }, [moveTime, depth, isReady]);

  return { getBestMove, isReady };
};
