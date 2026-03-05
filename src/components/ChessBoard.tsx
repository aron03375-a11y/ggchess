import { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { BoardArrows } from './BoardArrows';

interface Arrow {
  from: string;
  to: string;
}

interface ChessBoardProps {
  fen: string;
  playerColor: 'white' | 'black';
  onMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => boolean;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  onPromotionNeeded?: (from: string, to: string) => void;
}

export interface ChessBoardHandle {
  clearArrows: () => void;
}

export const ChessBoard = forwardRef<ChessBoardHandle, ChessBoardProps>(
  ({ fen, playerColor, onMove, disabled = false, lastMove = null, onPromotionNeeded }, ref) => {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [legalMoves, setLegalMoves] = useState<string[]>([]);
    const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const boardRef = useRef<HTMLDivElement>(null);
    const prevLastMoveRef = useRef<{ from: string; to: string } | null>(null);
    const wasDragMoveRef = useRef(false);

    // Expose clearArrows method
    useImperativeHandle(ref, () => ({
      clearArrows: () => setArrows([]),
    }));

    const clearArrows = useCallback(() => setArrows([]), []);

    // Create game instance from FEN
    const game = new Chess(fen);

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    // Flip board if player is black
    const displayFiles = playerColor === 'black' ? [...files].reverse() : files;
    const displayRanks = playerColor === 'black' ? [...ranks].reverse() : ranks;

    // Calculate square position based on board orientation
    const getSquarePosition = useCallback((square: string): { col: number; row: number } => {
      const file = square[0];
      const rank = square[1];
      const col = displayFiles.indexOf(file);
      const row = displayRanks.indexOf(rank);
      return { col, row };
    }, [displayFiles, displayRanks]);

    // Synchronous animation: compute offset on render when lastMove changes
    const animationData = (() => {
      if (!lastMove) {
        prevLastMoveRef.current = null;
        return null;
      }
      if (wasDragMoveRef.current) {
        // Skip animation for drag moves
        prevLastMoveRef.current = lastMove;
        wasDragMoveRef.current = false;
        return null;
      }
      if (prevLastMoveRef.current &&
          lastMove.from === prevLastMoveRef.current.from &&
          lastMove.to === prevLastMoveRef.current.to) {
        return null; // Same move, already animated
      }
      const fromPos = getSquarePosition(lastMove.from);
      const toPos = getSquarePosition(lastMove.to);
      return {
        square: lastMove.to,
        offsetX: fromPos.col - toPos.col,
        offsetY: fromPos.row - toPos.row,
      };
    })();

    // Update ref after render via effect
    useEffect(() => {
      if (lastMove) {
        prevLastMoveRef.current = lastMove;
      }
    }, [lastMove]);

    const isPlayerPiece = useCallback((square: string) => {
      const piece = game.get(square as Square);
      if (!piece) return false;
      return (playerColor === 'white' && piece.color === 'w') || 
             (playerColor === 'black' && piece.color === 'b');
    }, [fen, playerColor]);

    const isPlayerTurn = useCallback(() => {
      if (disabled) return false;
      return (playerColor === 'white' && game.turn() === 'w') ||
             (playerColor === 'black' && game.turn() === 'b');
    }, [fen, playerColor, disabled]);

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
      // Clear arrows on left click
      clearArrows();
      
      if (!isPlayerTurn()) return;

      if (selectedSquare) {
        if (legalMoves.includes(square)) {
          // Check if this is a promotion move
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
        
        if (isPlayerPiece(square)) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
        } else {
          clearSelection();
        }
      } else if (isPlayerPiece(square)) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      }
    }, [selectedSquare, legalMoves, isPlayerTurn, isPlayerPiece, getLegalMovesForSquare, onMove, isPromotionMove, onPromotionNeeded, clearArrows]);

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

    // Native HTML5 Drag handlers
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
      
      if (fromSquare) {
        const tempGame = new Chess(fen);
        const moveLegal = tempGame.moves({ square: fromSquare as Square, verbose: true }).map(m => m.to);
        if (moveLegal.includes(targetSquare as Square)) {
          if (isPromotionMove(fromSquare, targetSquare)) {
            onPromotionNeeded?.(fromSquare, targetSquare);
          } else {
            wasDragMoveRef.current = true;
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

    // Touch drag handlers
    const handleTouchStart = useCallback((e: React.TouchEvent, square: string) => {
      if (!isPlayerTurn() || !isPlayerPiece(square)) return;
      
      const touch = e.touches[0];
      setDraggedPiece(square);
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(square));
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    }, [isPlayerTurn, isPlayerPiece, getLegalMovesForSquare]);

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
              const isAnimating = animationData?.square === square;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleNativeDragOver}
                  onDrop={(e) => handleNativeDrop(e, square)}
                  className={`
                    w-[calc((100vw-2rem)/8)] h-[calc((100vw-2rem)/8)] sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                    flex items-center justify-center relative
                    transition-all duration-150
                    ${isLastMove 
                      ? (isLight ? 'bg-yellow-300' : 'bg-yellow-600') 
                      : (isLight ? 'bg-chess-light' : 'bg-chess-dark')}
                    ${isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''}
                    hover:brightness-110 cursor-pointer
                  `}
                >
                  {/* Legal move indicator */}
                  {isLegalMove && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
                      onTouchStart={(e) => handleTouchStart(e, square)}
                      onTouchEnd={handleTouchEnd}
                      className={`
                        w-full h-full flex items-center justify-center
                        ${isDragging ? 'opacity-30' : 'opacity-100'}
                        ${isPlayerPiece(square) && isPlayerTurn() ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                      `}
                      style={isAnimating && animationData ? {
                        '--from-x': `${animationData.offsetX * 100}%`,
                        '--from-y': `${animationData.offsetY * 100}%`,
                        animation: 'piece-move 300ms ease-out forwards',
                      } as React.CSSProperties : undefined}
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

        {/* Arrow overlay */}
        <BoardArrows
          boardRef={boardRef}
          playerColor={playerColor}
          arrows={arrows}
          setArrows={setArrows}
          onClearArrows={clearArrows}
        />

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
  }
);

ChessBoard.displayName = 'ChessBoard';
