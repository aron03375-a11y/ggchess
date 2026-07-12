import { useEffect, useRef } from 'react';
import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Variation {
  id: number;
  branchIndex: number; // index in mainline `moves` that this variation replaces
  moves: string[];
}

export interface ViewState {
  varId: number | null; // null = mainline
  index: number | null; // null = live end of mainline; -1 = start position; else moves index within that line
}

interface MoveHistoryProps {
  moves: string[];
  variations?: Variation[];
  viewing?: ViewState;
  // Legacy prop kept for compatibility (mainline only): index into mainline moves
  viewingIndex?: number | null;
  onNavigate: (view: ViewState) => void;
}

export const MoveHistory = ({
  moves,
  variations = [],
  viewing,
  viewingIndex,
  onNavigate,
}: MoveHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchHandledRef = useRef(false);

  // Normalize view state (support legacy viewingIndex prop)
  const view: ViewState = viewing ?? { varId: null, index: viewingIndex ?? null };

  // Auto-scroll when new moves added and viewing live
  useEffect(() => {
    if (scrollRef.current && view.varId === null && view.index === null) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, view.varId, view.index]);

  const markTouchHandled = () => {
    touchHandledRef.current = true;
    window.setTimeout(() => {
      touchHandledRef.current = false;
    }, 0);
  };

  const goTo = (v: ViewState) => onNavigate(v);

  // Navigation: back/forward operate on the currently viewed line
  const currentLineMoves = view.varId === null
    ? moves
    : (variations.find(v => v.id === view.varId)?.moves ?? []);
  const currentIdx = view.index ?? currentLineMoves.length; // treat null (live) as end
  const canGoBack = currentLineMoves.length > 0 && currentIdx > -1;
  const canGoForward = view.index !== null && currentIdx < currentLineMoves.length;

  const handleBack = () => {
    if (!canGoBack) return;
    if (view.varId === null && view.index === null) {
      goTo({ varId: null, index: moves.length >= 2 ? moves.length - 2 : -1 });
      return;
    }
    goTo({ ...view, index: currentIdx - 1 });
  };

  const handleForward = () => {
    if (!canGoForward) return;
    const newIndex = currentIdx + 1;
    if (view.varId === null && newIndex >= moves.length) {
      goTo({ varId: null, index: null });
    } else {
      goTo({ ...view, index: newIndex });
    }
  };

  const handleTokenTouch = (e: React.TouchEvent, v: ViewState) => {
    markTouchHandled();
    e.preventDefault();
    e.stopPropagation();
    goTo(v);
  };
  const handleTokenClick = (e: React.MouseEvent, v: ViewState) => {
    if (touchHandledRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    goTo(v);
  };

  const isActive = (v: ViewState) =>
    v.varId === view.varId && v.index === view.index;

  const renderMainlineToken = (moveIdx: number) => {
    const san = moves[moveIdx];
    const isWhite = moveIdx % 2 === 0;
    const target: ViewState = { varId: null, index: moveIdx };
    return (
      <span key={`m-${moveIdx}`} className="inline-flex items-baseline gap-1 mr-1">
        {isWhite && (
          <span className="text-muted-foreground">{Math.floor(moveIdx / 2) + 1}.</span>
        )}
        <span
          className={`px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent ${
            isActive(target) ? 'bg-primary/20' : ''
          }`}
          onTouchEnd={(e) => handleTokenTouch(e, target)}
          onClick={(e) => handleTokenClick(e, target)}
        >
          {san}
        </span>
      </span>
    );
  };

  const renderVariation = (variation: Variation) => {
    const startMoveNum = Math.floor(variation.branchIndex / 2) + 1;
    const startIsWhite = variation.branchIndex % 2 === 0;
    return (
      <span
        key={`v-${variation.id}`}
        className="inline text-muted-foreground/80 italic mr-1"
      >
        (
        {variation.moves.map((san, i) => {
          const globalWhite = (variation.branchIndex + i) % 2 === 0;
          const moveNum = Math.floor((variation.branchIndex + i) / 2) + 1;
          const target: ViewState = { varId: variation.id, index: i };
          const showNum = i === 0 || globalWhite;
          const numLabel = globalWhite ? `${moveNum}.` : `${moveNum}...`;
          return (
            <span key={i} className="inline-flex items-baseline gap-1 mr-1">
              {showNum && <span>{numLabel}</span>}
              <span
                className={`px-1 rounded cursor-pointer touch-manipulation md:hover:bg-accent active:bg-accent not-italic ${
                  isActive(target) ? 'bg-primary/20 text-card-foreground' : ''
                }`}
                onTouchEnd={(e) => handleTokenTouch(e, target)}
                onClick={(e) => handleTokenClick(e, target)}
              >
                {san}
              </span>
            </span>
          );
        })}
        )
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
            onTouchEnd={(e) => {
              markTouchHandled();
              e.preventDefault();
              e.stopPropagation();
              handleBack();
            }}
            onClick={(e) => {
              if (touchHandledRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              handleBack();
            }}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 touch-manipulation"
            onTouchEnd={(e) => {
              markTouchHandled();
              e.preventDefault();
              e.stopPropagation();
              handleForward();
            }}
            onClick={(e) => {
              if (touchHandledRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              handleForward();
            }}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-48">
        <div ref={scrollRef} className="p-3 text-sm font-mono text-card-foreground leading-7">
          {moves.length === 0 ? (
            <p className="text-muted-foreground text-sm">No moves yet</p>
          ) : (
            <div>
              {moves.map((_, i) => {
                const varsHere = variations.filter(v => v.branchIndex === i);
                // We render the variation AFTER the preceding mainline move.
                // A variation that branches at index i replaces move i, so it
                // should appear right after we render move i-1. We render before move i.
                return (
                  <span key={i} className="inline">
                    {varsHere.map(v => renderVariation(v))}
                    {renderMainlineToken(i)}
                  </span>
                );
              })}
              {/* trailing variations that branch at moves.length (shouldn't normally happen) */}
              {variations
                .filter(v => v.branchIndex >= moves.length)
                .map(v => renderVariation(v))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
