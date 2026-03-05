import { useState, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { BoardArrows } from './BoardArrows';

interface Arrow {
  from: string;
  to: string;
}

interface AnalysisChessBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  onMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => boolean;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  onPromotionNeeded?: (from: string, to: string) => void;
}

// Analysis board allows moves from either side
export const AnalysisChessBoard = ({ 
  fen, 
  orientation, 
  onMove, 
  disabled = false, 
  lastMove = null, 
  onPromotionNeeded 
}: AnalysisChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  const clearArrows = useCallback(() => setArrows([]), []);

  const game = new Chess(fen);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  const displayFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

  const hasPiece = useCallback((square: string) => {
    return !!game.get(square as Square);
  }, [fen]);

  const isCurrentTurnPiece = useCallback((square: string) => {
    const piece = game.get(square as Square);
    if (!piece) return false;
    return piece.color === game.turn();
  }, [fen]);

  const getLegalMovesForSquare = useCallback((square: string) => {
    const tempGame = new Chess(fen);
    const moves = tempGame.moves({ square: square as Square, verbose: true });
    return moves.map(m => m.to);
  }, [fen]);

  const isPromotionMove = useCallback((from: string, to: string) => {
    const piece = game.get(from as Square);
    if (!piece || piece.type !== 'p') return false;
    const toRank = to[1];
    return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
  }, [fen]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleSquareClick = useCallback((square: string) => {
    clearArrows();
    
    if (disabled) return;

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        if (isPromotionMove(selectedSquare, square)) {
          onPromotionNeeded?.(selectedSquare, square);
          clearSelection();
          return;
        }
        const success = onMove(selectedSquare, square);
        if (success) {
          clearSelection();
          return;
        }
      }
      
      if (isCurrentTurnPiece(square)) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      } else {
        clearSelection();
      }
    } else if (isCurrentTurnPiece(square)) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(square));
    }
  }, [selectedSquare, legalMoves, disabled, isCurrentTurnPiece, getLegalMovesForSquare, onMove, isPromotionMove, onPromotionNeeded, clearArrows]);

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

  const handleNativeDragStart = useCallback((e: React.DragEvent, square: string) => {
    if (disabled || !isCurrentTurnPiece(square)) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggedPiece(square);
    setSelectedSquare(square);
    setLegalMoves(getLegalMovesForSquare(square));
  }, [disabled, isCurrentTurnPiece, getLegalMovesForSquare]);

  const handleNativeDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNativeDrop = useCallback((e: React.DragEvent, targetSquare: string) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('text/plain');
    
    if (fromSquare) {
      const tempGame = new Chess(fen);
      const moveLegal = tempGame.moves({ square: fromSquare as Square, verbose: true }).map(m => m.to);
      if (moveLegal.includes(targetSquare as Square)) {
        if (isPromotionMove(fromSquare, targetSquare)) {
          onPromotionNeeded?.(fromSquare, targetSquare);
        } else {
          onMove(fromSquare, targetSquare);
        }
      }
    }

    setDraggedPiece(null);
    clearSelection();
  }, [onMove, fen, isPromotionMove, onPromotionNeeded]);

  const handleNativeDragEnd = useCallback(() => {
    setDraggedPiece(null);
    clearSelection();
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, square: string) => {
    if (disabled || !isCurrentTurnPiece(square)) return;
    
    const touch = e.touches[0];
    setDraggedPiece(square);
    setSelectedSquare(square);
    setLegalMoves(getLegalMovesForSquare(square));
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  }, [disabled, isCurrentTurnPiece, getLegalMovesForSquare]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggedPiece) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  }, [draggedPiece]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!draggedPiece) return;

    const touch = e.changedTouches[0];
    const targetSquare = getSquareFromPoint(touch.clientX, touch.clientY);

    if (targetSquare && legalMoves.includes(targetSquare)) {
      if (isPromotionMove(draggedPiece, targetSquare)) {
        onPromotionNeeded?.(draggedPiece, targetSquare);
      } else {
        onMove(draggedPiece, targetSquare);
      }
    }

    setDraggedPiece(null);
    setDragPosition(null);
    clearSelection();
  }, [draggedPiece, legalMoves, getSquareFromPoint, onMove, isPromotionMove, onPromotionNeeded]);

  return (
    <div className="relative">
      <div 
        ref={boardRef}
        className="inline-grid grid-cols-8 rounded-lg overflow-hidden shadow-2xl border-4 border-primary/30"
        onTouchMove={handleTouchMove}
      >
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const piece = game.get(square as Square);
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalMove = legalMoves.includes(square);
            const isDragging = draggedPiece === square;
            const isLastMove = lastMove?.from === square || lastMove?.to === square;

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
                  ${isLastMove 
                    ? (isLight ? 'bg-yellow-300' : 'bg-yellow-600') 
                    : (isLight ? 'bg-chess-light' : 'bg-chess-dark')}
                  ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
                  hover:brightness-110 cursor-pointer
                `}
              >
                {isLegalMove && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {piece ? (
                      <div className="absolute inset-0 border-4 border-yellow-400/60 rounded-sm" />
                    ) : (
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-400/50 rounded-full" />
                    )}
                  </div>
                )}
                
                {piece && (
                  <div
                    draggable={!disabled && isCurrentTurnPiece(square)}
                    onDragStart={(e) => handleNativeDragStart(e, square)}
                    onDragEnd={handleNativeDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, square)}
                    onTouchEnd={handleTouchEnd}
                    className={`
                      ${isDragging ? 'opacity-30' : 'opacity-100'}
                      ${!disabled && isCurrentTurnPiece(square) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
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

      <BoardArrows
        boardRef={boardRef}
        playerColor={orientation}
        arrows={arrows}
        setArrows={setArrows}
        onClearArrows={clearArrows}
      />

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
