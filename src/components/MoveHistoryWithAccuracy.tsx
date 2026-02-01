import { useEffect, useRef } from 'react';
import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MoveAccuracy {
  index: number;
  type: 'inaccuracy' | 'mistake' | 'blunder';
  evalLoss: number;
}

interface MoveHistoryWithAccuracyProps {
  moves: string[];
  viewingIndex: number | null;
  onNavigate: (index: number | null) => void;
  accuracyMarkers?: MoveAccuracy[];
}

const getAccuracySymbol = (type: MoveAccuracy['type']) => {
  switch (type) {
    case 'inaccuracy':
      return '?!';
    case 'mistake':
      return '?';
    case 'blunder':
      return '??';
    default:
      return '';
  }
};

const getAccuracyColor = (type: MoveAccuracy['type']) => {
  switch (type) {
    case 'inaccuracy':
      return 'text-yellow-500';
    case 'mistake':
      return 'text-orange-500';
    case 'blunder':
      return 'text-red-500';
    default:
      return '';
  }
};

export const MoveHistoryWithAccuracy = ({ 
  moves, 
  viewingIndex, 
  onNavigate,
  accuracyMarkers = []
}: MoveHistoryWithAccuracyProps) => {
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

  // Create a map for quick accuracy lookup
  const accuracyMap = new Map<number, MoveAccuracy>();
  accuracyMarkers.forEach(marker => {
    accuracyMap.set(marker.index, marker);
  });

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (scrollRef.current && viewingIndex === null) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, viewingIndex]);

  const currentIndex = viewingIndex ?? moves.length;
  const canGoBack = moves.length > 0 && currentIndex > -1;
  const canGoForward = viewingIndex !== null && viewingIndex < moves.length;

  const markTouchHandled = () => {
    touchHandledRef.current = true;
    window.setTimeout(() => {
      touchHandledRef.current = false;
    }, 0);
  };

  const handleBack = () => {
    if (!canGoBack) return;
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

  const highlightedMove = viewingIndex;

  const renderMove = (move: string, index: number) => {
    const accuracy = accuracyMap.get(index);
    return (
      <span className="inline-flex items-center gap-0.5">
        {move}
        {accuracy && (
          <span className={cn('text-xs font-bold', getAccuracyColor(accuracy.type))}>
            {getAccuracySymbol(accuracy.type)}
          </span>
        )}
      </span>
    );
  };

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
                      className={cn(
                        'w-20 px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent',
                        highlightedMove === whiteIndex && 'bg-primary/20'
                      )}
                      onTouchEnd={(e) => handleMoveTouchEnd(e, whiteIndex)}
                      onClick={(e) => handleMoveClick(e, whiteIndex)}
                    >
                      {renderMove(pair.white, whiteIndex)}
                    </span>
                    <span 
                      className={cn(
                        'w-20 px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent',
                        highlightedMove === blackIndex && 'bg-primary/20'
                      )}
                      onTouchEnd={(e) => {
                        if (!pair.black) return;
                        handleMoveTouchEnd(e, blackIndex);
                      }}
                      onClick={(e) => {
                        if (!pair.black) return;
                        handleMoveClick(e, blackIndex);
                      }}
                    >
                      {pair.black ? renderMove(pair.black, blackIndex) : ''}
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
