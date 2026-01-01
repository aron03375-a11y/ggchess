import { useState, useCallback, useRef } from 'react';
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
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Flip board if player is black
  const displayFiles = playerColor === 'black' ? [...files].reverse() : files;
  const displayRanks = playerColor === 'black' ? [...ranks].reverse() : ranks;

  const isPlayerPiece = useCallback((square: string) => {
    const piece = game.get(square as Square);
    if (!piece) return false;
    return (playerColor === 'white' && piece.color === 'w') || 
           (playerColor === 'black' && piece.color === 'b');
  }, [game, playerColor]);

  const isPlayerTurn = useCallback(() => {
    return (playerColor === 'white' && game.turn() === 'w') ||
           (playerColor === 'black' && game.turn() === 'b');
  }, [game, playerColor]);

  const getLegalMovesForSquare = useCallback((square: string) => {
    const moves = game.moves({ square: square as Square, verbose: true });
    return moves.map(m => m.to);
  }, [game]);

  const handleSquareClick = useCallback((square: string) => {
    if (!isPlayerTurn()) return;

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        const success = onMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }
      
      if (isPlayerPiece(square)) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (isPlayerPiece(square)) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(square));
    }
  }, [selectedSquare, legalMoves, isPlayerTurn, isPlayerPiece, getLegalMovesForSquare, onMove]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent, square: string) => {
    if (!isPlayerTurn() || !isPlayerPiece(square)) return;
    
    e.preventDefault?.();
    setDraggedPiece(square);
    setSelectedSquare(square);
    setLegalMoves(getLegalMovesForSquare(square));

    if ('touches' in e) {
      const touch = e.touches[0];
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    }
  }, [isPlayerTurn, isPlayerPiece, getLegalMovesForSquare]);

  const handleDragMove = useCallback((e: React.TouchEvent | MouseEvent) => {
    if (!draggedPiece) return;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    }
  }, [draggedPiece]);

  const getSquareFromPoint = useCallback((x: number, y: number): string | null => {
    if (!boardRef.current) return null;
    
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    
    const col = Math.floor((x - rect.left) / squareSize);
    const row = Math.floor((y - rect.top) / squareSize);
    
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    
    const file = displayFiles[col];
    const rank = displayRanks[row];
    
    return `${file}${rank}`;
  }, [displayFiles, displayRanks]);

  const handleDragEnd = useCallback((e: React.DragEvent | React.TouchEvent) => {
    if (!draggedPiece) return;

    let targetSquare: string | null = null;

    if ('changedTouches' in e) {
      const touch = e.changedTouches[0];
      targetSquare = getSquareFromPoint(touch.clientX, touch.clientY);
    } else if ('clientX' in e) {
      targetSquare = getSquareFromPoint(e.clientX, e.clientY);
    }

    if (targetSquare && legalMoves.includes(targetSquare)) {
      onMove(draggedPiece, targetSquare);
    }

    setDraggedPiece(null);
    setDragPosition(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [draggedPiece, legalMoves, getSquareFromPoint, onMove]);

  const handleNativeDragStart = useCallback((e: React.DragEvent, square: string) => {
    if (!isPlayerTurn() || !isPlayerPiece(square)) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggedPiece(square);
    setSelectedSquare(square);
    setLegalMoves(getLegalMovesForSquare(square));
  }, [isPlayerTurn, isPlayerPiece, getLegalMovesForSquare]);

  const handleNativeDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNativeDrop = useCallback((e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('text/plain');
    
    if (fromSquare && legalMoves.includes(targetSquare)) {
      onMove(fromSquare, targetSquare);
    }

    setDraggedPiece(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [legalMoves, onMove]);

  const handleNativeDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  return (
    <div className="relative">
      <div 
        ref={boardRef}
        className="inline-grid grid-cols-8 rounded-lg overflow-hidden shadow-2xl border-4 border-primary/30"
        onTouchMove={handleDragMove as unknown as React.TouchEventHandler}
      >
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const piece = game.get(square as Square);
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalMove = legalMoves.includes(square);
            const isDragging = draggedPiece === square;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleNativeDragOver}
                onDrop={(e) => handleNativeDrop(e, square)}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                  flex items-center justify-center relative
                  transition-all duration-150
                  ${isLight ? 'bg-chess-light' : 'bg-chess-dark'}
                  ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
                  hover:brightness-110 cursor-pointer
                `}
              >
                {/* Legal move indicator */}
                {isLegalMove && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${piece ? '' : ''}`}>
                    {piece ? (
                      <div className="absolute inset-0 border-4 border-yellow-400/60 rounded-sm" />
                    ) : (
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-400/50 rounded-full" />
                    )}
                  </div>
                )}
                
                {/* Chess piece */}
                {piece && (
                  <div
                    draggable={isPlayerPiece(square) && isPlayerTurn()}
                    onDragStart={(e) => handleNativeDragStart(e, square)}
                    onDragEnd={handleNativeDragEnd}
                    onTouchStart={(e) => handleDragStart(e, square)}
                    onTouchEnd={handleDragEnd}
                    className={`
                      ${isDragging ? 'opacity-50' : 'opacity-100'}
                      ${isPlayerPiece(square) && isPlayerTurn() ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                    `}
                  >
                    <ChessPiece 
                      piece={piece.type} 
                      color={piece.color} 
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dragged piece overlay for touch */}
      {draggedPiece && dragPosition && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: dragPosition.x, top: dragPosition.y }}
        >
          {game.get(draggedPiece as Square) && (
            <ChessPiece 
              piece={game.get(draggedPiece as Square)!.type} 
              color={game.get(draggedPiece as Square)!.color} 
            />
          )}
        </div>
      )}
    </div>
  );
};
