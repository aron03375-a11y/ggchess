import { useRef, useCallback, useEffect } from 'react';

interface UseStockfishOptions {
  elo: number;
  moveTime?: number; // in milliseconds
}

export const useStockfish = ({ elo, moveTime = 100 }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);

  useEffect(() => {
    // Initialize Stockfish worker
    const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(
      new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])
    );

    const workerPath = wasmSupported
      ? 'https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish-nnue-16-single.js'
      : 'https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish-16.1.js';

    const worker = new Worker(workerPath);
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const message = e.data;
      
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        const match = message.match(/bestmove\s+(\S+)/);
        const bestMove = match ? match[1] : null;
        
        if (resolverRef.current) {
          resolverRef.current(bestMove);
          resolverRef.current = null;
        }
      }
    };

    // Initialize UCI
    worker.postMessage('uci');
    worker.postMessage('isready');
    
    // Set skill level based on ELO (0-20 scale)
    // ELO 800 = skill 0, ELO 2000+ = skill 20
    const skillLevel = Math.min(20, Math.max(0, Math.floor((elo - 800) / 60)));
    worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
    
    // Limit strength by UCI_LimitStrength and UCI_Elo
    worker.postMessage('setoption name UCI_LimitStrength value true');
    worker.postMessage(`setoption name UCI_Elo value ${Math.min(3200, Math.max(1320, elo))}`);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [elo]);

  const getBestMove = useCallback((fen: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(null);
        return;
      }

      resolverRef.current = resolve;
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go movetime ${moveTime}`);
    });
  }, [moveTime]);

  return { getBestMove };
};
