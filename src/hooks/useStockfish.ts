import { useRef, useCallback, useEffect, useState } from 'react';
import { MittensFormula } from '@/types/bot';
import { Chess } from 'chess.js';

interface UseStockfishOptions {
  skillLevel: number;
  moveTime?: number;
  depth?: number;
  formula?: MittensFormula;
}

interface MoveScore {
  move: string;
  score: number;
}

function selectMoveByFormula(moves: MoveScore[], formula: MittensFormula): string {
  if (moves.length === 0) return '';
  if (moves.length === 1) return moves[0].move;

  const sorted = [...moves].sort((a, b) => b.score - a.score);
  const bestScore = sorted[0].score;
  const bestMove = sorted[0].move;

  // Compute loss and filter: allowed = moves where 0 < loss <= maxLoss
  const allowed = sorted
    .map(m => ({ move: m.move, loss: bestScore - m.score }))
    .filter(m => m.loss > 0 && m.loss <= formula.maxLoss);

  // Roll to decide if we make a suboptimal move
  const r = Math.random();
  if (r > formula.suboptimalProb || allowed.length === 0) {
    return bestMove;
  }

  // Pick from allowed using softmax weighted by temperature
  const T = formula.temperature;
  const weights = allowed.map(m => Math.exp(-m.loss / T));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < allowed.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return allowed[i].move;
  }

  return allowed[allowed.length - 1].move;
}

export const useStockfish = ({ skillLevel, moveTime = 500, depth, formula }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const restartCountRef = useRef(0);
  const maxRestarts = 5;
  const collectedMovesRef = useRef<MoveScore[]>([]);
  const useFormula = !!formula;
  const fenRef = useRef<string>('');

  const initWorker = useCallback(() => {
    try {
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
            if (useFormula) {
              // For formula bots, request ALL legal moves via high MultiPV
              // We'll set a very high number; Stockfish caps it at the number of legal moves
              worker.postMessage('setoption name MultiPV value 500');
            } else {
              const clamped = Math.min(20, Math.max(0, skillLevel));
              worker.postMessage(`setoption name Skill Level value ${clamped}`);
            }
            worker.postMessage('setoption name Hash value 16');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
            restartCountRef.current = 0;
          } else if (useFormula && message.startsWith('info') && message.includes(' pv ')) {
            const scoreMatch = message.match(/score cp (-?\d+)/);
            const mateMatch = message.match(/score mate (-?\d+)/);
            const pvMatch = message.match(/ pv (\S+)/);
            if (pvMatch) {
              let score = 0;
              if (scoreMatch) {
                score = parseInt(scoreMatch[1]);
              } else if (mateMatch) {
                const mateIn = parseInt(mateMatch[1]);
                score = mateIn > 0 ? 30000 - mateIn * 100 : -30000 + Math.abs(mateIn) * 100;
              }
              const move = pvMatch[1];
              const existing = collectedMovesRef.current.findIndex(m => m.move === move);
              if (existing >= 0) {
                collectedMovesRef.current[existing].score = score;
              } else {
                collectedMovesRef.current.push({ move, score });
              }
            }
          } else if (message.startsWith('bestmove')) {
            if (useFormula && formula && collectedMovesRef.current.length > 0) {
              const selectedMove = selectMoveByFormula(collectedMovesRef.current, formula);
              console.log(`Mittens formula: selected ${selectedMove} from ${collectedMovesRef.current.length} total moves`);
              collectedMovesRef.current = [];
              if (resolverRef.current) {
                resolverRef.current(selectedMove || null);
                resolverRef.current = null;
              }
            } else {
              const match = message.match(/bestmove\s+(\S+)/);
              const bestMove = match ? match[1] : null;
              collectedMovesRef.current = [];
              if (resolverRef.current) {
                resolverRef.current(bestMove);
                resolverRef.current = null;
              }
            }
          }
        }
      };

      worker.onerror = (e) => {
        console.error('Stockfish worker error, will restart:', e);
        if (resolverRef.current) {
          resolverRef.current(null);
          resolverRef.current = null;
        }
        if (restartCountRef.current < maxRestarts) {
          restartCountRef.current++;
          setTimeout(() => initWorker(), 500);
        }
      };

      worker.postMessage('uci');
    } catch (e) {
      console.error('Failed to create Stockfish worker:', e);
    }
  }, [skillLevel, useFormula]);

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
      collectedMovesRef.current = [];

      try {
        workerRef.current.postMessage(`position fen ${fen}`);
        const goCommand = depth ? `go depth ${depth}` : `go movetime ${moveTime}`;
        workerRef.current.postMessage(goCommand);
      } catch {
        resolverRef.current = null;
        resolve(null);
      }

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
