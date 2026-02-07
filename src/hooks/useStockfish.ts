import { useRef, useCallback, useEffect, useState } from 'react';

interface UseStockfishOptions {
  skillLevel: number;
  moveTime?: number;
  depth?: number;
}

export const useStockfish = ({ skillLevel, moveTime = 500, depth }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const restartCountRef = useRef(0);
  const maxRestarts = 5;

  const initWorker = useCallback(() => {
    try {
      // Clean up old worker
      if (workerRef.current) {
        try {
          workerRef.current.postMessage('quit');
          workerRef.current.terminate();
        } catch {}
      }
      workerRef.current = null;
      setIsReady(false);

      const worker = new Worker('/stockfish/stockfish-17.1-lite-single.js');
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const message = e.data;
        if (typeof message === 'string') {
          if (message === 'uciok') {
            const clamped = Math.min(20, Math.max(0, skillLevel));
            worker.postMessage(`setoption name Skill Level value ${clamped}`);
            worker.postMessage('setoption name Hash value 16');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
            restartCountRef.current = 0; // Reset on successful init
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
        console.error('Stockfish worker error, will restart:', e);
        // Resolve any pending promise so the game doesn't hang
        if (resolverRef.current) {
          resolverRef.current(null);
          resolverRef.current = null;
        }
        // Auto-restart
        if (restartCountRef.current < maxRestarts) {
          restartCountRef.current++;
          console.log(`Restarting Stockfish worker (attempt ${restartCountRef.current}/${maxRestarts})...`);
          setTimeout(() => initWorker(), 500);
        }
      };

      worker.postMessage('uci');
    } catch (e) {
      console.error('Failed to create Stockfish worker:', e);
    }
  }, [skillLevel]);

  useEffect(() => {
    restartCountRef.current = 0;
    initWorker();

    return () => {
      if (workerRef.current) {
        try {
          workerRef.current.postMessage('quit');
          workerRef.current.terminate();
        } catch {}
        workerRef.current = null;
      }
      setIsReady(false);
    };
  }, [initWorker]);

  const getBestMove = useCallback((fen: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve(null);
        return;
      }

      resolverRef.current = resolve;
      
      try {
        workerRef.current.postMessage('ucinewgame');
        workerRef.current.postMessage(`position fen ${fen}`);
        const goCommand = depth ? `go depth ${depth}` : `go movetime ${moveTime}`;
        workerRef.current.postMessage(goCommand);
      } catch {
        resolverRef.current = null;
        resolve(null);
      }

      // Safety timeout - if no response in 10s, resolve null
      setTimeout(() => {
        if (resolverRef.current === resolve) {
          resolverRef.current = null;
          resolve(null);
        }
      }, 10000);
    });
  }, [moveTime, depth, isReady]);

  return { getBestMove, isReady };
};
