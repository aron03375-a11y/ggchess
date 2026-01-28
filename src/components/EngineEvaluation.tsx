import { Chess } from 'chess.js';
import { Loader2 } from 'lucide-react';

interface EngineEvaluationProps {
  analysis: {
    bestMove: string | null;
    pv: string[];
    evaluation: number | null;
    depth: number;
    isMate: boolean;
    mateIn: number | null;
  };
  isAnalyzing: boolean;
  fen: string;
  onPlayMove?: (from: string, to: string, promotion?: string) => void;
}

export const EngineEvaluation = ({ 
  analysis, 
  isAnalyzing, 
  fen,
  onPlayMove 
}: EngineEvaluationProps) => {
  const { bestMove, pv, evaluation, depth, isMate, mateIn } = analysis;
  const isWhiteTurn = new Chess(fen).turn() === 'w';

  // Convert single UCI move to SAN for display
  const uciToSan = (uci: string, positionFen: string): string | null => {
    try {
      const game = new Chess(positionFen);
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;
      const move = game.move({ from, to, promotion });
      return move ? move.san : null;
    } catch {
      return null;
    }
  };

  // Convert UCI moves to SAN for display
  const pvToSan = (uciMoves: string[], startFen: string): string[] => {
    const game = new Chess(startFen);
    const sanMoves: string[] = [];
    
    for (const uci of uciMoves) {
      try {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        const move = game.move({ from, to, promotion });
        if (move) {
          sanMoves.push(move.san);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    
    return sanMoves;
  };

  // Normalize evaluation to always be from White's perspective
  // Stockfish returns eval from the side-to-move's perspective
  const normalizedEval = evaluation !== null 
    ? (isWhiteTurn ? evaluation : -evaluation) 
    : null;
  const normalizedMateIn = mateIn !== null 
    ? (isWhiteTurn ? mateIn : -mateIn) 
    : null;

  const formatEvaluation = () => {
    if (isMate && normalizedMateIn !== null) {
      return normalizedMateIn > 0 ? `+M${normalizedMateIn}` : `-M${Math.abs(normalizedMateIn)}`;
    }
    if (normalizedEval !== null) {
      const evalInPawns = normalizedEval / 100;
      const sign = evalInPawns >= 0 ? '+' : '';
      return `${sign}${evalInPawns.toFixed(1)}`;
    }
    return '0.0';
  };

  const handlePlayBestMove = () => {
    if (!bestMove || !onPlayMove) return;
    
    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);
    const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
    
    onPlayMove(from, to, promotion);
  };

  const pvSan = pvToSan(pv, fen);
  const bestMoveSan = bestMove ? uciToSan(bestMove, fen) : null;
  const evalBar = normalizedEval !== null ? Math.max(-500, Math.min(500, normalizedEval)) : 0;
  const evalPercent = 50 + (evalBar / 10); // Scale to 0-100

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-fredoka text-lg text-card-foreground">Engine</h3>
          {isAnalyzing && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <span className="text-sm text-muted-foreground">Depth: {depth}</span>
      </div>
      
      {/* Evaluation bar */}
      <div className="h-2 bg-zinc-800 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
          style={{ width: `${evalPercent}%` }}
        />
      </div>
      
      <div className="p-3">
        {/* Evaluation score */}
        <div className="flex items-center justify-between mb-2">
          <span 
            className={`font-mono text-xl font-bold ${
              (normalizedEval !== null && normalizedEval > 0) || (isMate && normalizedMateIn && normalizedMateIn > 0)
                ? 'text-white' 
                : (normalizedEval !== null && normalizedEval < 0) || (isMate && normalizedMateIn && normalizedMateIn < 0)
                ? 'text-zinc-400'
                : 'text-muted-foreground'
            }`}
          >
            {formatEvaluation()}
          </span>
          
          {bestMove && (
            <button
              onClick={handlePlayBestMove}
              className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-md text-sm font-medium transition-colors"
            >
              Play {bestMoveSan || pvSan[0] || bestMove}
            </button>
          )}
        </div>
        
        {/* Principal variation line */}
        <div className="text-sm text-muted-foreground font-mono">
          {pvSan.length > 0 ? (
            <span className="break-words">
              {pvSan.slice(0, 8).join(' ')}
              {pvSan.length > 8 && '...'}
            </span>
          ) : (
            <span className="italic">Calculating...</span>
          )}
        </div>
      </div>
    </div>
  );
};
