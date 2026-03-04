export interface ChessPieceProps {
  piece: string | null;
  color: 'w' | 'b';
  size?: 'sm' | 'md';
}

const getPieceUrl = (piece: string, color: 'w' | 'b'): string => {
  return `/pieces/${color}${piece.toLowerCase()}.png`;
};

export const ChessPiece = ({ piece, color, size = 'md' }: ChessPieceProps) => {
  if (!piece) return null;
  
  const pieceUrl = getPieceUrl(piece, color);
  
  const sizeClasses = size === 'sm' 
    ? 'w-6 h-6 sm:w-7 sm:h-7' 
    : 'w-[90%] h-[90%]';
  
  return (
    <img 
      src={pieceUrl}
      alt={`${color === 'w' ? 'White' : 'Black'} ${piece}`}
      className={`${sizeClasses} select-none pointer-events-none`}
      draggable={false}
    />
  );
};
