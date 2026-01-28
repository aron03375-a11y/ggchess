import { useRef, useCallback, useEffect, useState } from 'react';

interface AnalysisInfo {
  bestMove: string | null;
  pv: string[]; // Principal variation
  evaluation: number | null; // Centipawns
  depth: number;
  isMate: boolean;
  mateIn: number | null;
}

interface UseStockfishAnalysisOptions {
  thinkTime?: number; // milliseconds
}

export const useStockfishAnalysis = ({ thinkTime = 3000 }: UseStockfishAnalysisOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisInfo>({
    bestMove: null,
    pv: [],
    evaluation: null,
    depth: 0,
    isMate: false,
    mateIn: null,
  });
  const currentFenRef = useRef<string>('');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
          if (message === 'uciok') {
            worker.postMessage('setoption name Skill Level value 20');
            worker.postMessage('setoption name MultiPV value 1');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
          } else if (message.startsWith('info depth')) {
            // Parse analysis info
            const depthMatch = message.match(/depth (\d+)/);
            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
            const pvMatch = message.match(/pv (.+)/);
            
            if (depthMatch) {
              const depth = parseInt(depthMatch[1]);
              let evaluation: number | null = null;
              let isMate = false;
              let mateIn: number | null = null;
              
              if (scoreMatch) {
                if (scoreMatch[1] === 'cp') {
                  evaluation = parseInt(scoreMatch[2]);
                } else if (scoreMatch[1] === 'mate') {
                  isMate = true;
                  mateIn = parseInt(scoreMatch[2]);
                }
              }
              
              const pv = pvMatch ? pvMatch[1].split(' ') : [];
              
              setAnalysis(prev => ({
                ...prev,
                depth,
                evaluation,
                isMate,
                mateIn,
                pv,
              }));
            }
          } else if (message.startsWith('bestmove')) {
            const match = message.match(/bestmove\s+(\S+)/);
            const bestMove = match ? match[1] : null;
            
            setAnalysis(prev => ({
              ...prev,
              bestMove,
            }));
            setIsAnalyzing(false);
          }
        }
      };

      worker.onerror = (e) => {
        console.error('Stockfish analysis worker error:', e);
      };

      worker.postMessage('uci');

      return () => {
        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
        }
        worker.terminate();
        workerRef.current = null;
        setIsReady(false);
      };
    } catch (e) {
      console.error('Failed to create Stockfish worker:', e);
    }
  }, []);

  const startAnalysis = useCallback((fen: string) => {
    if (!workerRef.current || !isReady) return;
    
    // Stop any previous analysis
    workerRef.current.postMessage('stop');
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    currentFenRef.current = fen;
    setIsAnalyzing(true);
    setAnalysis({
      bestMove: null,
      pv: [],
      evaluation: null,
      depth: 0,
      isMate: false,
      mateIn: null,
    });
    
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go movetime ${thinkTime}`);
  }, [isReady, thinkTime]);

  const stopAnalysis = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage('stop');
    setIsAnalyzing(false);
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
  }, []);

  return { 
    analysis, 
    isReady, 
    isAnalyzing, 
    startAnalysis, 
    stopAnalysis 
  };
};
