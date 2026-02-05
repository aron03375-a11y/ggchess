import { Chess } from 'chess.js';

interface EvalBarProps {
  evaluation: number | null;
  isMate: boolean;
  mateIn: number | null;
  fen: string;
}

export const EvalBar = ({ evaluation, isMate, mateIn, fen }: EvalBarProps) => {
  const isWhiteTurn = new Chess(fen).turn() === 'w';
  
  // Normalize evaluation to always be from White's perspective
  const normalizedEval = evaluation !== null 
    ? (isWhiteTurn ? evaluation : -evaluation) 
    : null;
  const normalizedMateIn = mateIn !== null 
    ? (isWhiteTurn ? mateIn : -mateIn) 
    : null;

  // Calculate fill percentage (white portion)
  let whitePercent = 50;
  if (isMate && normalizedMateIn !== null) {
    whitePercent = normalizedMateIn > 0 ? 100 : 0;
  } else if (normalizedEval !== null) {
    // Scale: ±500cp = 0%/100%, 0cp = 50%
    whitePercent = 50 + Math.max(-50, Math.min(50, normalizedEval / 10));
  }

  const formatEvaluation = () => {
    if (isMate && normalizedMateIn !== null) {
      return normalizedMateIn > 0 ? `M${normalizedMateIn}` : `M${Math.abs(normalizedMateIn)}`;
    }
    if (normalizedEval !== null) {
      const evalInPawns = Math.abs(normalizedEval) / 100;
      return evalInPawns.toFixed(1);
    }
    return '0.0';
  };

  const isWhiteAdvantage = (normalizedEval !== null && normalizedEval > 0) || (isMate && normalizedMateIn && normalizedMateIn > 0);

  return (
    <div className="relative h-full w-6 bg-zinc-800 rounded overflow-hidden flex flex-col">
      {/* Black portion (top) */}
      <div 
        className="bg-zinc-700 transition-all duration-300 flex items-start justify-center"
        style={{ height: `${100 - whitePercent}%` }}
      >
        {!isWhiteAdvantage && (
          <span className="text-[10px] font-mono text-white font-bold py-1">
            {formatEvaluation()}
          </span>
        )}
      </div>
      {/* White portion (bottom) */}
      <div 
        className="bg-white transition-all duration-300 flex items-end justify-center flex-1"
      >
        {isWhiteAdvantage && (
          <span className="text-[10px] font-mono text-zinc-800 font-bold py-1">
            {formatEvaluation()}
          </span>
        )}
      </div>
    </div>
  );
};
