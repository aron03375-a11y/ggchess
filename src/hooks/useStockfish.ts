import { useRef, useCallback, useEffect, useState } from 'react';
import { MittensFormula } from '@/types/bot';
import { Chess } from 'chess.js';
import { chooseEloMove, eloSettings, RootScore } from '@/lib/skillFormula';

interface UseStockfishOptions {
  skillLevel: number;
  moveTime?: number;
  depth?: number;
  formula?: MittensFormula;
  uciElo?: number;
  botElo?: number;
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

  const allowed = sorted
    .map(m => ({ move: m.move, loss: bestScore - m.score }))
    .filter(m => m.loss > 0 && m.loss <= formula.maxLoss);

  const r = Math.random();
  if (r > formula.suboptimalProb || allowed.length === 0) {
    return bestMove;
  }

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

export const useStockfish = ({ skillLevel, moveTime = 500, depth, formula, uciElo, botElo }: UseStockfishOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const restartCountRef = useRef(0);
  const maxRestarts = 5;
  const collectedMovesRef = useRef<MoveScore[]>([]);
  const useFormula = !!formula;
  const useDivision = typeof botElo === 'number' && botElo > 0;

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

      const worker = new Worker('/stockfish10/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const message = e.data;
        if (typeof message === 'string') {
          if (message === 'uciok') {
            if (useFormula || useDivision) {
              // MultiPV set per-move in getBestMove; full-strength engine otherwise.
            } else if (uciElo && uciElo > 0) {
              const clampedElo = Math.max(1350, Math.min(2850, uciElo));
              worker.postMessage('setoption name UCI_LimitStrength value true');
              worker.postMessage(`setoption name UCI_Elo value ${clampedElo}`);
            } else {
              const clamped = Math.max(0, skillLevel);
              worker.postMessage(`setoption name Skill Level value ${clamped}`);
            }
            worker.postMessage('setoption name Hash value 16');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
            restartCountRef.current = 0;
          } else if ((useFormula || useDivision) && message.startsWith('info') && message.includes(' pv ')) {
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
            const collected = collectedMovesRef.current;
            if (useDivision && collected.length > 0) {
              const picked = chooseEloMove(collected as RootScore[], botElo!);
              console.log(`Elo ${botElo}: picked ${picked?.move} from ${collected.length} lines`);
              if (resolverRef.current) {
                resolverRef.current(picked?.move ?? null);
                resolverRef.current = null;
              }
              collectedMovesRef.current = [];
            } else if (useFormula && formula && collected.length > 0) {
              const selectedMove = selectMoveByFormula(collected, formula);
              if (resolverRef.current) {
                console.log(`Mittens formula: selected ${selectedMove} from ${collected.length} total moves`);
                resolverRef.current(selectedMove || null);
                resolverRef.current = null;
              }
              collectedMovesRef.current = [];
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
  }, [skillLevel, useFormula, useDivision, botElo, uciElo]);

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

      const isFormulaBot = useFormula && !!formula;
      const isDivisionBot = useDivision;
      const formulaMoveTimeCap = isFormulaBot
        ? Math.max(1800, Math.min(4500, Math.max(moveTime, ((depth ?? 8) * 250))))
        : moveTime;

      try {
        if (isDivisionBot) {
          const tempGame = new Chess(fen);
          const legalMoves = tempGame.moves().length;
          const mpv = Math.max(1, legalMoves);
          workerRef.current.postMessage(`setoption name MultiPV value ${mpv}`);
        } else if (isFormulaBot) {
          const tempGame = new Chess(fen);
          const legalMoves = tempGame.moves().length;
          const mpv = Math.max(1, legalMoves);
          workerRef.current.postMessage(`setoption name MultiPV value ${mpv}`);
        }

        workerRef.current.postMessage(`position fen ${fen}`);

        let goCommand = '';
        if (isDivisionBot) {
          const s = eloSettings(botElo!);
          goCommand = `go depth ${s.depth}`;
        } else if (depth && isFormulaBot) {
          goCommand = `go depth ${depth} movetime ${formulaMoveTimeCap}`;
        } else if (depth) {
          goCommand = `go depth ${depth}`;
        } else {
          goCommand = `go movetime ${moveTime}`;
        }

        workerRef.current.postMessage(goCommand);
      } catch {
        resolverRef.current = null;
        resolve(null);
      }

      const timeoutMs = isDivisionBot
        ? Math.max(8000, eloSettings(botElo!).depth * 1500)
        : isFormulaBot
          ? formulaMoveTimeCap + 2500
          : depth
            ? Math.max(10000, depth * 1500)
            : 10000;

      setTimeout(() => {
        if (resolverRef.current !== resolve) return;

        if (isDivisionBot && collectedMovesRef.current.length > 0) {
          const picked = chooseEloMove(collectedMovesRef.current as RootScore[], botElo!);
          console.log(`Elo timeout fallback ${botElo}: picked ${picked?.move}`);
          collectedMovesRef.current = [];
          resolverRef.current = null;
          try { workerRef.current?.postMessage('stop'); } catch {}
          resolve(picked?.move ?? null);
          return;
        }

        if (isFormulaBot && formula && collectedMovesRef.current.length > 0) {
          const selectedMove = selectMoveByFormula(collectedMovesRef.current, formula);
          console.log(`Mittens timeout fallback: selected ${selectedMove} from ${collectedMovesRef.current.length} partial moves`);
          collectedMovesRef.current = [];
          resolverRef.current = null;
          try { workerRef.current?.postMessage('stop'); } catch {}
          resolve(selectedMove || null);
          return;
        }

        try { workerRef.current?.postMessage('stop'); } catch {}

        setTimeout(() => {
          if (resolverRef.current === resolve) {
            resolverRef.current = null;
            resolve(null);
          }
        }, 1200);
      }, timeoutMs);
    });
  }, [moveTime, depth, isReady, useFormula, formula, useDivision, botElo]);

  return { getBestMove, isReady };
};
