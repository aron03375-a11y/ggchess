interface ChessPieceProps {
  piece: string | null;
  color: 'w' | 'b';
}

const pieceSymbols: Record<string, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

export const ChessPiece = ({ piece, color }: ChessPieceProps) => {
  if (!piece) return null;
  
  const symbol = pieceSymbols[piece.toLowerCase()]?.[color];
  
  return (
    <span 
      className={`
        text-3xl md:text-4xl lg:text-5xl
        select-none cursor-grab active:cursor-grabbing
        ${color === 'w' ? 'text-chess-pieceLight drop-shadow-md' : 'text-chess-pieceDark'}
      `}
      style={{ 
        textShadow: color === 'w' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' 
      }}
    >
      {symbol}
    </span>
  );
};
