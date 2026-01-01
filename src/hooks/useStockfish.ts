import { useRef, useCallback, useEffect } from 'react';

interface UseStockfishOptions {
  elo: number;
  moveTime?: number; // in milliseconds
}

const createStockfishWorker = (): Worker | null => {
  try {
    // Create a blob-based worker that loads Stockfish via importScripts
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);
    return worker;
  } catch (e) {
    console.error('Failed to create Stockfish worker:', e);
    return null;
  }
};

export const useStockfish = ({ elo, moveTime = 100 }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const worker = createStockfishWorker();
    if (!worker) return;
    
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const message = e.data;
      
      if (typeof message === 'string') {
        if (message === 'uciok') {
          // Set skill level based on ELO (0-20 scale)
          const skillLevel = Math.min(20, Math.max(0, Math.floor((elo - 800) / 60)));
          worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
          worker.postMessage('isready');
        } else if (message === 'readyok') {
          isReadyRef.current = true;
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

    // Initialize UCI
    worker.postMessage('uci');

    return () => {
      worker.terminate();
      workerRef.current = null;
      isReadyRef.current = false;
    };
  }, [elo]);

  const getBestMove = useCallback((fen: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(null);
        return;
      }

      // Wait for engine to be ready
      const checkReady = () => {
        if (isReadyRef.current) {
          resolverRef.current = resolve;
          workerRef.current!.postMessage(`position fen ${fen}`);
          workerRef.current!.postMessage(`go movetime ${moveTime}`);
        } else {
          setTimeout(checkReady, 50);
        }
      };
      
      checkReady();
    });
  }, [moveTime]);

  return { getBestMove };
};
