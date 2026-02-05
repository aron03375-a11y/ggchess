import { Chess } from 'chess.js';
import { Loader2 } from 'lucide-react';

interface EngineLinesProps {
  lines: Array<{
    evaluation: number | null;
    isMate: boolean;
    mateIn: number | null;
    pv: string[];
  }>;
  isAnalyzing: boolean;
  fen: string;
  depth: number;
  onPlayMove?: (from: string, to: string, promotion?: string) => void;
}

export const EngineLines = ({ 
  lines, 
  isAnalyzing, 
  fen,
  depth,
  onPlayMove 
}: EngineLinesProps) => {
  const isWhiteTurn = new Chess(fen).turn() === 'w';

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

  const formatEvaluation = (evaluation: number | null, isMate: boolean, mateIn: number | null) => {
    // Normalize to White's perspective
    const normalizedEval = evaluation !== null 
      ? (isWhiteTurn ? evaluation : -evaluation) 
      : null;
    const normalizedMateIn = mateIn !== null 
      ? (isWhiteTurn ? mateIn : -mateIn) 
      : null;

    if (isMate && normalizedMateIn !== null) {
      return normalizedMateIn > 0 ? `+M${normalizedMateIn}` : `-M${Math.abs(normalizedMateIn)}`;
    }
    if (normalizedEval !== null) {
      const evalInPawns = normalizedEval / 100;
      const sign = evalInPawns >= 0 ? '+' : '';
      return `${sign}${evalInPawns.toFixed(2)}`;
    }
    return '0.00';
  };

  const getEvalColor = (evaluation: number | null, isMate: boolean, mateIn: number | null) => {
    const normalizedEval = evaluation !== null 
      ? (isWhiteTurn ? evaluation : -evaluation) 
      : null;
    const normalizedMateIn = mateIn !== null 
      ? (isWhiteTurn ? mateIn : -mateIn) 
      : null;

    if ((normalizedEval !== null && normalizedEval > 0) || (isMate && normalizedMateIn && normalizedMateIn > 0)) {
      return 'bg-white text-zinc-900';
    }
    return 'bg-zinc-700 text-white';
  };

  const handlePlayLine = (pv: string[]) => {
    if (!pv.length || !onPlayMove) return;
    const bestMove = pv[0];
    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);
    const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
    onPlayMove(from, to, promotion);
  };

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Stockfish</span>
          {isAnalyzing && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">depth={depth}</span>
      </div>
      
      <div className="divide-y divide-border">
        {lines.map((line, index) => {
          const pvSan = pvToSan(line.pv, fen);
          
          return (
            <div 
              key={index}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handlePlayLine(line.pv)}
            >
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${getEvalColor(line.evaluation, line.isMate, line.mateIn)}`}>
                {formatEvaluation(line.evaluation, line.isMate, line.mateIn)}
              </span>
              <span className="text-sm text-muted-foreground font-mono truncate flex-1">
                {pvSan.length > 0 ? pvSan.slice(0, 10).join(' ') : 'Calculating...'}
              </span>
            </div>
          );
        })}
        
        {lines.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground italic">
            Calculating...
          </div>
        )}
      </div>
    </div>
  );
};
