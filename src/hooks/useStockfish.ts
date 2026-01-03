import { useRef, useCallback, useEffect, useState } from 'react';

interface UseStockfishOptions {
  skillLevel: number; // 0-20
  moveTime?: number;
}

export const useStockfish = ({ skillLevel, moveTime = 500 }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create worker using stockfish.js CDN that supports CORS
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
    `;
    
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      URL.revokeObjectURL(workerUrl);
      
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const message = e.data;
        
        if (typeof message === 'string') {
          console.log('Stockfish:', message);
          
          if (message === 'uciok') {
            // Use skill level directly (0-20 scale)
            const clampedSkillLevel = Math.min(20, Math.max(0, skillLevel));
            console.log('Setting skill level:', clampedSkillLevel);
            worker.postMessage(`setoption name Skill Level value ${clampedSkillLevel}`);
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            console.log('Stockfish ready');
            setIsReady(true);
          } else if (message.startsWith('bestmove')) {
            const match = message.match(/bestmove\s+(\S+)/);
            const bestMove = match ? match[1] : null;
            console.log('Best move parsed:', bestMove);
            
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

      // Initialize UCI
      worker.postMessage('uci');

      return () => {
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
        console.log('No worker available');
        resolve(null);
        return;
      }

      const attemptMove = (attempts = 0) => {
        if (attempts > 50) {
          console.log('Stockfish not ready after timeout');
          resolve(null);
          return;
        }
        
        if (isReady && workerRef.current) {
          resolverRef.current = resolve;
          console.log('Sending position to Stockfish:', fen);
          workerRef.current.postMessage(`position fen ${fen}`);
          workerRef.current.postMessage(`go movetime ${moveTime}`);
        } else {
          setTimeout(() => attemptMove(attempts + 1), 100);
        }
      };
      
      attemptMove();
    });
  }, [moveTime, isReady]);

  return { getBestMove, isReady };
};
