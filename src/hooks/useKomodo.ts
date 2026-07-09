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
 * This TEP build reports classic Skill as 1–35, but Elo mode is still 1–3500.
 */
export const useKomodo = ({ uciElo, moveTime = 1200, depth }: UseKomodoOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [isReady, setIsReady] = useState(false);
  const readyRef = useRef(false);
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

      // Loader reads self.location.hash raw (substr(1)). Pass the wasm URL as-is;
      // encoding '/' as %2F makes some browsers fetch HTML/404 instead of WASM.
      const wasmCandidates = getWasmCandidates();
      const wasmUrl = wasmCandidates[wasmCandidateIndexRef.current] ?? wasmCandidates[0];
      const worker = new Worker(`/komodo/komodo-worker.js#${wasmUrl}`);
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data : String(e.data);
        if (line.startsWith('uciok')) {
          // Configure engine
          worker.postMessage('setoption name Threads value 1');
          worker.postMessage('setoption name Hash value 16');
          worker.postMessage('setoption name MultiPV value 1');
          if (typeof uciElo === 'number' && uciElo > 0) {
            const elo = Math.max(1, Math.min(3500, Math.round(uciElo)));
            // Exact option names exposed by this Komodo TEP build:
            //   option name UCI Elo type spin default 3500 min 1 max 3500
            //   option name UCI LimitStrength type check default false
            // It also exposes "Use UCI_Elo", but "UCI_Elo" itself is not accepted.
            worker.postMessage('setoption name UCI LimitStrength value true');
            worker.postMessage(`setoption name UCI Elo value ${elo}`);
          }
          worker.postMessage('ucinewgame');
          worker.postMessage('isready');
        } else if (line.startsWith('readyok')) {
          readyRef.current = true;
          setIsReady(true);
          restartCountRef.current = 0;
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

      worker.postMessage('uci');
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
      setIsReady(false);
    };
  }, [init]);

  const getBestMove = useCallback((fen: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) { resolve(null); return; }
      resolverRef.current = resolve;
      try {
        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage(depth ? `go depth ${depth}` : `go movetime ${moveTime}`);
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
  }, [isReady, moveTime, depth]);

  return { getBestMove, isReady };
};
