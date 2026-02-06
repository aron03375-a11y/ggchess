import { useRef, useCallback, useEffect, useState } from 'react';

interface AnalysisLine {
  pv: string[];
  evaluation: number | null;
  isMate: boolean;
  mateIn: number | null;
}

interface AnalysisInfo {
  bestMove: string | null;
  lines: AnalysisLine[];
  depth: number;
}

interface UseStockfishAnalysisOptions {
  maxDepth?: number; // Maximum depth to analyze to
  multiPV?: number; // Number of lines to analyze
}

export const useStockfishAnalysis = ({ maxDepth = 20, multiPV = 2 }: UseStockfishAnalysisOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisInfo>({
    bestMove: null,
    lines: [],
    depth: 0,
  });
  const currentFenRef = useRef<string>('');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linesRef = useRef<Map<number, AnalysisLine>>(new Map());

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
            worker.postMessage('setoption name MultiPV value 2');
            worker.postMessage('isready');
          } else if (message === 'readyok') {
            setIsReady(true);
          } else if (message.startsWith('info') && message.includes(' pv ')) {
            // Parse analysis info with MultiPV support
            const depthMatch = message.match(/depth (\d+)/);
            const multipvMatch = message.match(/multipv (\d+)/);
            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
            const pvMatch = message.match(/ pv (.+)$/);
            
            if (depthMatch && pvMatch) {
              const depth = parseInt(depthMatch[1]);
              const lineIndex = multipvMatch ? parseInt(multipvMatch[1]) - 1 : 0;
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
              
              const pv = pvMatch[1].trim().split(/\s+/);
              
              // Update the line in our ref
              linesRef.current.set(lineIndex, { pv, evaluation, isMate, mateIn });
              
              // Convert map to sorted array
              const linesArray: AnalysisLine[] = [];
              for (let i = 0; i < 2; i++) {
                const line = linesRef.current.get(i);
                if (line) {
                  linesArray.push(line);
                }
              }
              
              setAnalysis({
                bestMove: null,
                depth,
                lines: [...linesArray],
              });
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
    console.log('startAnalysis called, isReady:', isReady, 'worker:', !!workerRef.current);
    if (!workerRef.current || !isReady) return;
    
    // Stop any previous analysis
    workerRef.current.postMessage('stop');
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    currentFenRef.current = fen;
    setIsAnalyzing(true);
    linesRef.current.clear();
    setAnalysis({
      bestMove: null,
      lines: [],
      depth: 0,
    });
    
    console.log('Sending to analysis worker:', `position fen ${fen}`, `go depth ${maxDepth}`);
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${maxDepth}`);
  }, [isReady, maxDepth]);

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
