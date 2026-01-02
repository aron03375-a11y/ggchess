interface ChessPieceProps {
  piece: string | null;
  color: 'w' | 'b';
}

// Lichess cburnett piece set URLs
const getPieceUrl = (piece: string, color: 'w' | 'b'): string => {
  const colorName = color === 'w' ? 'white' : 'black';
  const pieceNames: Record<string, string> = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
  };
  const pieceName = pieceNames[piece.toLowerCase()];
  return `https://lichess1.org/assets/_BcVVbc/piece/cburnett/${colorName[0]}${piece.toUpperCase()}.svg`;
};

export const ChessPiece = ({ piece, color }: ChessPieceProps) => {
  if (!piece) return null;
  
  const pieceUrl = getPieceUrl(piece, color);
  
  return (
    <img 
      src={pieceUrl}
      alt={`${color === 'w' ? 'White' : 'Black'} ${piece}`}
      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 select-none pointer-events-none"
      draggable={false}
    />
  );
};
