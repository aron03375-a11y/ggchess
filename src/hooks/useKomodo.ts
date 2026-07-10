import { useCallback, useEffect, useRef, useState } from 'react';
import wasmAsset from '@/assets/explanation-engine.wasm.asset.json';

interface UseKomodoOptions {
  /** Komodo UCI Elo target in [1, 3500]. Komodo maps this to internal skill automatically. */
  uciElo?: number;
  /** Optional fixed movetime ms. Defaults to 1200ms. */
  moveTime?: number;
  /** Optional search depth cap. */
  depth?: number;
}

/**
 * Runs chess.com's Komodo TEP wasm in a Web Worker and returns UCI bestmoves.
 * Uses Komodo's built-in UCI Elo dialing — no external picker.
 * This TEP build exposes classic Skill as 1–35 and UCI Elo as 1–3500.
 */
export const useKomodo = ({ uciElo, moveTime = 1200, depth }: UseKomodoOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const readyRef = useRef(false);
  const readyWaitersRef = useRef<(() => void)[]>([]);
  const restartCountRef = useRef(0);
  const wasmCandidateIndexRef = useRef(0);
  const maxRestarts = 3;

  const getWasmCandidates = useCallback(() => {
    const assetPath = (wasmAsset as { url: string }).url;
    const sameOrigin = new URL(assetPath, window.location.origin).href;
    const hosted = [
      `https://ggchess.lovable.app${assetPath}`,
      `https://id-preview--ddcd45d3-df7d-4965-99b9-862744fe1137.lovable.app${assetPath}`,
    ];

    // Lovable's /__l5e asset route is available on deployed/preview origins,
    // but not on localhost. Use the hosted asset first during local testing so
    // the real browser worker can be verified from the dev server too.
    const candidates = window.location.hostname === 'localhost'
      ? [...hosted, sameOrigin]
      : [sameOrigin, ...hosted];

    return Array.from(new Set(candidates));
  }, []);

  const init = useCallback(() => {
    try {
      if (workerRef.current) {
        try { workerRef.current.postMessage('quit'); workerRef.current.terminate(); } catch {}
      }
      workerRef.current = null;
      readyRef.current = false;
      setIsReady(false);

      const wasmCandidates = getWasmCandidates();
      const orderedWasmCandidates = [
        ...wasmCandidates.slice(wasmCandidateIndexRef.current),
        ...wasmCandidates.slice(0, wasmCandidateIndexRef.current),
      ];
      const workerPayload = encodeURIComponent(JSON.stringify(orderedWasmCandidates));
      const worker = new Worker(`/komodo/komodo-worker.js#${workerPayload}`);
      workerRef.current = worker;

      const postUci = (command: string) => {
        if (
          command === 'uci' ||
          command === 'isready' ||
          command === 'ucinewgame' ||
          command.startsWith('setoption') ||
          command.startsWith('position') ||
          command.startsWith('go ')
        ) {
          console.debug(`[Komodo UCI] <= ${command}`);
        }
        worker.postMessage(command);
      };

      worker.onmessage = (e: MessageEvent) => {
        if (e.data && typeof e.data === 'object' && 'error' in e.data) {
          console.error('Komodo worker message error:', e.data.error);
          if (resolverRef.current) {
            resolverRef.current(null);
            resolverRef.current = null;
          }
          return;
        }

        const line = typeof e.data === 'string' ? e.data : String(e.data);
        if (
          line.startsWith('uciok') ||
          line.startsWith('readyok') ||
          line.startsWith('bestmove') ||
          /option name (UCI Elo|UCI LimitStrength|Use UCI_Elo|Auto Skill|Skill)\b/.test(line)
        ) {
          console.debug(`[Komodo UCI] => ${line}`);
        }

        if (line.startsWith('uciok')) {
          // Configure engine
          postUci('setoption name Threads value 1');
          postUci('setoption name Hash value 16');
          postUci('setoption name MultiPV value 1');
          if (typeof uciElo === 'number' && uciElo > 0) {
            const elo = Math.max(1, Math.min(3500, Math.round(uciElo)));
            // Exact option names exposed by this Komodo TEP build:
            //   option name UCI Elo type spin default 3500 min 1 max 3500
            //   option name UCI LimitStrength type check default false
            //   option name Use UCI_Elo type check default false
            //   option name Auto Skill type check default false
            // "UCI_Elo" itself is not accepted; the space form is.
            postUci('setoption name UCI LimitStrength value true');
            postUci('setoption name Use UCI_Elo value true');
            postUci('setoption name Auto Skill value true');
            postUci(`setoption name UCI Elo value ${elo}`);
          }
          postUci('ucinewgame');
          postUci('isready');
        } else if (line.startsWith('readyok')) {
          readyRef.current = true;
          setIsReady(true);
          restartCountRef.current = 0;
          readyWaitersRef.current.splice(0).forEach((resolveReady) => resolveReady());
        } else if (line.startsWith('bestmove')) {
          const m = line.match(/bestmove\s+(\S+)/);
          const best = m ? m[1] : null;
          if (resolverRef.current) {
            resolverRef.current(best && best !== '(none)' ? best : null);
            resolverRef.current = null;
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Komodo worker error:', err);
        if (resolverRef.current) { resolverRef.current(null); resolverRef.current = null; }
        const wasmCandidates = getWasmCandidates();
        if (!readyRef.current && wasmCandidateIndexRef.current < wasmCandidates.length - 1) {
          wasmCandidateIndexRef.current++;
          setTimeout(() => init(), 250);
          return;
        }
        if (restartCountRef.current < maxRestarts) {
          restartCountRef.current++;
          setTimeout(() => init(), 500);
        }
      };

      postUci('uci');
    } catch (e) {
      console.error('Failed to start Komodo worker:', e);
    }
  }, [uciElo, getWasmCandidates]);

  useEffect(() => {
    init();
    return () => {
      if (workerRef.current) {
        try { workerRef.current.postMessage('quit'); workerRef.current.terminate(); } catch {}
        workerRef.current = null;
      }
      readyRef.current = false;
      readyWaitersRef.current.splice(0).forEach((resolveReady) => resolveReady());
      setIsReady(false);
    };
  }, [init]);

  const waitUntilReady = useCallback((timeoutMs = 20000): Promise<boolean> => {
    if (workerRef.current && readyRef.current) return Promise.resolve(true);

    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        readyWaitersRef.current = readyWaitersRef.current.filter((waiter) => waiter !== resolveReady);
        resolve(false);
      }, timeoutMs);

      const resolveReady = () => {
        window.clearTimeout(timeout);
        resolve(!!workerRef.current && readyRef.current);
      };

      readyWaitersRef.current.push(resolveReady);
    });
  }, []);

  const getBestMove = useCallback(async (fen: string): Promise<string | null> => {
    const ready = await waitUntilReady();
    if (!workerRef.current || !ready) return null;

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      try {
        const positionCommand = `position fen ${fen}`;
        const goCommand = depth ? `go depth ${depth}` : `go movetime ${moveTime}`;
        console.debug(`[Komodo UCI] <= ${positionCommand}`);
        console.debug(`[Komodo UCI] <= ${goCommand}`);
        workerRef.current.postMessage(positionCommand);
        workerRef.current.postMessage(goCommand);
      } catch {
        resolverRef.current = null;
        resolve(null);
      }
      const timeoutMs = (depth ? Math.max(6000, depth * 1500) : moveTime) + 4000;
      setTimeout(() => {
        if (resolverRef.current === resolve) {
          try { workerRef.current?.postMessage('stop'); } catch {}
          setTimeout(() => {
            if (resolverRef.current === resolve) {
              resolverRef.current = null;
              resolve(null);
            }
          }, 1500);
        }
      }, timeoutMs);
    });
  }, [moveTime, depth, waitUntilReady]);

  return { getBestMove, isReady };
};
