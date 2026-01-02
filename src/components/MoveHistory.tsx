import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveHistoryProps {
  moves: string[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="font-fredoka text-lg text-card-foreground">Moves</h3>
      </div>
      <ScrollArea className="h-48">
        <div ref={scrollRef} className="p-3">
          {movePairs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No moves yet</p>
          ) : (
            <div className="space-y-1">
              {movePairs.map((pair) => (
                <div 
                  key={pair.number} 
                  className="flex gap-2 text-sm font-mono text-card-foreground"
                >
                  <span className="w-6 text-muted-foreground">{pair.number}.</span>
                  <span className="w-16">{pair.white}</span>
                  <span className="w-16">{pair.black || ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
