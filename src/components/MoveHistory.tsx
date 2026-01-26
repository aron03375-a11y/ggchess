import { useEffect, useRef } from 'react';
import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MoveHistoryProps {
  moves: string[];
  viewingIndex: number | null;
  onNavigate: (index: number | null) => void;
}

export const MoveHistory = ({ moves, viewingIndex, onNavigate }: MoveHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchHandledRef = useRef(false);
  
  const movePairs: { number: number; white: string; black?: string }[] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (scrollRef.current && viewingIndex === null) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, viewingIndex]);

  const currentIndex = viewingIndex ?? moves.length;
  // We treat `viewingIndex` as an index into the `moves` array, with one extra virtual
  // position `-1` meaning "start position" (fenHistory[0]).
  const canGoBack = moves.length > 0 && currentIndex > -1;
  const canGoForward = viewingIndex !== null && viewingIndex < moves.length;

  const markTouchHandled = () => {
    touchHandledRef.current = true;
    // Allow the next tick to clear so subsequent clicks work normally
    window.setTimeout(() => {
      touchHandledRef.current = false;
    }, 0);
  };

  const handleBack = () => {
    if (!canGoBack) return;

    // From the live position (viewingIndex === null), jumping to moves.length - 1
    // would still show the live FEN (fenHistory[moves.length]).
    // So we jump one earlier so the first tap actually goes "back" visually.
    if (viewingIndex === null) {
      onNavigate(moves.length >= 2 ? moves.length - 2 : -1);
      return;
    }

    onNavigate(currentIndex - 1);
  };

  const handleForward = () => {
    if (!canGoForward) return;
    const newIndex = currentIndex + 1;
    onNavigate(newIndex >= moves.length ? null : newIndex);
  };

  const handleButtonTouchEnd = (e: React.TouchEvent, action: () => void) => {
    markTouchHandled();
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    if (touchHandledRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  const handleMoveTouchEnd = (e: React.TouchEvent, index: number) => {
    markTouchHandled();
    e.preventDefault();
    e.stopPropagation();
    onNavigate(index);
  };

  const handleMoveClick = (e: React.MouseEvent, index: number) => {
    if (touchHandledRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onNavigate(index);
  };

  // Calculate which move is highlighted based on viewingIndex
  const getHighlightedMove = () => {
    if (viewingIndex === null) return null;
    return viewingIndex; // 0-indexed into moves array
  };

  const highlightedMove = getHighlightedMove();

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-fredoka text-lg text-card-foreground">Moves</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 touch-manipulation"
            onTouchEnd={(e) => handleButtonTouchEnd(e, handleBack)}
            onClick={(e) => handleButtonClick(e, handleBack)}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 touch-manipulation"
            onTouchEnd={(e) => handleButtonTouchEnd(e, handleForward)}
            onClick={(e) => handleButtonClick(e, handleForward)}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-48">
        <div ref={scrollRef} className="p-3">
          {movePairs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No moves yet</p>
          ) : (
            <div className="space-y-1">
              {movePairs.map((pair, pairIndex) => {
                const whiteIndex = pairIndex * 2;
                const blackIndex = pairIndex * 2 + 1;
                return (
                  <div 
                    key={pair.number} 
                    className="flex gap-2 text-sm font-mono text-card-foreground"
                  >
                    <span className="w-6 text-muted-foreground">{pair.number}.</span>
                    <span 
                      className={`w-16 px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent ${
                        highlightedMove === whiteIndex ? 'bg-primary/20' : ''
                      }`}
                      onTouchEnd={(e) => handleMoveTouchEnd(e, whiteIndex)}
                      onClick={(e) => handleMoveClick(e, whiteIndex)}
                    >
                      {pair.white}
                    </span>
                    <span 
                      className={`w-16 px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent ${
                        highlightedMove === blackIndex ? 'bg-primary/20' : ''
                      }`}
                      onTouchEnd={(e) => {
                        if (!pair.black) return;
                        handleMoveTouchEnd(e, blackIndex);
                      }}
                      onClick={(e) => {
                        if (!pair.black) return;
                        handleMoveClick(e, blackIndex);
                      }}
                    >
                      {pair.black || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
