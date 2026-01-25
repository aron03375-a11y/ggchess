import { useEffect, useRef } from 'react';
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
  const canGoBack = currentIndex > 0;
  const canGoForward = viewingIndex !== null && viewingIndex < moves.length;

  const handleBack = () => {
    if (canGoBack) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      const newIndex = currentIndex + 1;
      onNavigate(newIndex >= moves.length ? null : newIndex);
    }
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
            className="h-7 w-7"
            onClick={handleBack}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleForward}
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
                      className={`w-16 px-1 rounded cursor-pointer hover:bg-accent ${
                        highlightedMove === whiteIndex ? 'bg-primary/20' : ''
                      }`}
                      onClick={() => onNavigate(whiteIndex)}
                    >
                      {pair.white}
                    </span>
                    <span 
                      className={`w-16 px-1 rounded cursor-pointer hover:bg-accent ${
                        highlightedMove === blackIndex ? 'bg-primary/20' : ''
                      }`}
                      onClick={() => pair.black && onNavigate(blackIndex)}
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
      {viewingIndex !== null && (
        <div className="p-2 border-t border-border bg-muted/50 text-center">
          <span className="text-xs text-muted-foreground">Viewing history • Click a move or → to return</span>
        </div>
      )}
    </div>
  );
};
