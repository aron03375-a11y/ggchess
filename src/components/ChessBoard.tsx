import { useState, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  game: Chess;
  playerColor: 'white' | 'black';
  onMove: (from: string, to: string) => boolean;
}

export const ChessBoard = ({ game, playerColor, onMove }: ChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Flip board if player is black
  const displayFiles = playerColor === 'black' ? [...files].reverse() : files;
  const displayRanks = playerColor === 'black' ? [...ranks].reverse() : ranks;

  const handleSquareClick = useCallback((square: string) => {
    const piece = game.get(square as Square);
    const isPlayerTurn = 
      (playerColor === 'white' && game.turn() === 'w') ||
      (playerColor === 'black' && game.turn() === 'b');

    if (!isPlayerTurn) return;

    if (selectedSquare) {
      // Try to make a move
      const success = onMove(selectedSquare, square);
      if (success) {
        setSelectedSquare(null);
        setLegalMoves([]);
      } else if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
        // Select new piece
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
      // Select piece
      setSelectedSquare(square);
      const moves = game.moves({ square: square as Square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    }
  }, [game, selectedSquare, playerColor, onMove]);

  return (
    <div className="inline-block rounded-lg overflow-hidden shadow-2xl border-4 border-primary/30">
      <div className="grid grid-cols-8">
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const piece = game.get(square as Square);
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalMove = legalMoves.includes(square);

            return (
              <button
                key={square}
                onClick={() => handleSquareClick(square)}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                  flex items-center justify-center
                  transition-all duration-150
                  ${isLight ? 'chess-square-light' : 'chess-square-dark'}
                  ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
                  ${isLegalMove ? 'after:absolute after:w-3 after:h-3 after:bg-yellow-400/50 after:rounded-full relative' : ''}
                  hover:brightness-110
                `}
              >
                {piece && (
                  <ChessPiece 
                    piece={piece.type} 
                    color={piece.color} 
                  />
                )}
                {isLegalMove && !piece && (
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-400/50 rounded-full" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
