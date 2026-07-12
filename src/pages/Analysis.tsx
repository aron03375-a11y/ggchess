import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { useLocation } from 'react-router-dom';
import { AnalysisChessBoard } from '@/components/AnalysisChessBoard';
import { MoveHistory, type Variation, type ViewState } from '@/components/MoveHistory';
import { EvalBar } from '@/components/EvalBar';
import { EngineLines } from '@/components/EngineLines';
import { PromotionDialog } from '@/components/PromotionDialog';
import { useCapturedPieces } from '@/components/CapturedPieces';
import { useStockfishAnalysis } from '@/hooks/useStockfishAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, FlipVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface FullVariation extends Variation {
  fenHistory: string[]; // fenHistory[0] = position before first variation move
  moveFromTo: { from: string; to: string }[];
}

const Analysis = () => {
  const location = useLocation();
  const gameData = location.state as {
    pgn?: string;
    fenHistory?: string[];
    fromGame?: boolean;
  } | null;

  const [fen, setFen] = useState(INITIAL_FEN);
  const [moves, setMoves] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>([INITIAL_FEN]);
  const [moveFromTo, setMoveFromTo] = useState<{ from: string; to: string }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [variations, setVariations] = useState<FullVariation[]>([]);
  const varIdRef = useRef(1);
  const [view, setView] = useState<ViewState>({ varId: null, index: null });
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const {
    analysis,
    isReady,
    isAnalyzing,
    startAnalysis,
  } = useStockfishAnalysis({ maxDepth: 20, multiPV: 2 });

  // Derive current position from view state
  const currentVar = view.varId !== null ? variations.find(v => v.id === view.varId) : null;

  const displayFen = (() => {
    if (currentVar) {
      const idx = view.index ?? currentVar.moves.length - 1;
      if (idx < 0) return currentVar.fenHistory[0];
      return currentVar.fenHistory[idx + 1];
    }
    if (view.index === null) return fen;
    if (view.index < 0) return fenHistory[0];
    return fenHistory[view.index + 1];
  })();

  const displayLastMove = (() => {
    if (currentVar) {
      const idx = view.index ?? currentVar.moves.length - 1;
      if (idx < 0) return null;
      return currentVar.moveFromTo[idx];
    }
    if (view.index === null) return lastMove;
    if (view.index < 0) return null;
    return moveFromTo[view.index];
  })();

  const game = new Chess(displayFen);
  const capturedPieces = useCapturedPieces({ fen: displayFen, playerColor: orientation });

  // Load game from navigation state
  useEffect(() => {
    if (gameData?.fromGame && gameData.fenHistory && gameData.fenHistory.length > 1) {
      const loadedMoves: string[] = [];
      const loadedMoveFromTo: { from: string; to: string }[] = [];
      for (let i = 0; i < gameData.fenHistory.length - 1; i++) {
        try {
          const beforeGame = new Chess(gameData.fenHistory[i]);
          const afterGame = new Chess(gameData.fenHistory[i + 1]);
          const legalMoves = beforeGame.moves({ verbose: true });
          for (const move of legalMoves) {
            beforeGame.move(move);
            if (beforeGame.fen() === afterGame.fen()) {
              loadedMoves.push(move.san);
              loadedMoveFromTo.push({ from: move.from, to: move.to });
              break;
            }
            beforeGame.undo();
          }
        } catch {
          break;
        }
      }
      setFenHistory(gameData.fenHistory);
      setMoves(loadedMoves);
      setMoveFromTo(loadedMoveFromTo);
      setFen(gameData.fenHistory[gameData.fenHistory.length - 1]);
      if (loadedMoveFromTo.length > 0) {
        setLastMove(loadedMoveFromTo[loadedMoveFromTo.length - 1]);
      }
      setView({ varId: null, index: -1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start analysis when position changes
  useEffect(() => {
    if (isReady) startAnalysis(displayFen);
  }, [displayFen, isReady, startAnalysis]);

  const handleMove = useCallback(
    (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n'): boolean => {
      // Determine the position we're playing from
      const fromFen = displayFen;
      const tempGame = new Chess(fromFen);
      let move;
      try {
        move = tempGame.move({ from, to, promotion });
      } catch {
        return false;
      }
      if (!move) return false;
      const newFen = tempGame.fen();

      // Case A: viewing a variation
      if (currentVar) {
        const curIdx = view.index ?? currentVar.moves.length - 1;
        const nextIdx = curIdx + 1;
        // If matches next move in variation, just advance
        if (nextIdx < currentVar.moves.length && currentVar.moves[nextIdx] === move.san) {
          setView({ varId: currentVar.id, index: nextIdx });
          return true;
        }
        // Otherwise, truncate variation after curIdx and append this move
        setVariations(prev =>
          prev.map(v =>
            v.id === currentVar.id
              ? {
                  ...v,
                  moves: [...v.moves.slice(0, curIdx + 1), move.san],
                  fenHistory: [...v.fenHistory.slice(0, curIdx + 2), newFen],
                  moveFromTo: [...v.moveFromTo.slice(0, curIdx + 1), { from, to }],
                }
              : v
          )
        );
        setView({ varId: currentVar.id, index: nextIdx });
        return true;
      }

      // Case B: viewing mainline live position -> append to mainline
      if (view.index === null) {
        setFen(newFen);
        setMoves(prev => [...prev, move!.san]);
        setFenHistory(prev => [...prev, newFen]);
        setMoveFromTo(prev => [...prev, { from, to }]);
        setLastMove({ from, to });
        return true;
      }

      // Case C: viewing mainline at historical index
      const curIdx = view.index; // -1 means start
      const replacedIdx = curIdx + 1; // index in `moves` that this new move would occupy

      // If matches mainline move, just advance
      if (replacedIdx < moves.length && moves[replacedIdx] === move.san) {
        if (replacedIdx === moves.length - 1) {
          setView({ varId: null, index: null });
        } else {
          setView({ varId: null, index: replacedIdx });
        }
        return true;
      }

      // Check if a variation already branches here with the same first move
      const existing = variations.find(
        v => v.branchIndex === replacedIdx && v.moves[0] === move!.san
      );
      if (existing) {
        setView({ varId: existing.id, index: 0 });
        return true;
      }

      // Create a new variation
      const newId = varIdRef.current++;
      const newVar: FullVariation = {
        id: newId,
        branchIndex: replacedIdx,
        moves: [move.san],
        fenHistory: [fromFen, newFen],
        moveFromTo: [{ from, to }],
      };
      setVariations(prev => [...prev, newVar]);
      setView({ varId: newId, index: 0 });
      return true;
    },
    [displayFen, currentVar, view, moves, variations]
  );

  const handlePlayEngineMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      handleMove(from, to, promotion as 'q' | 'r' | 'b' | 'n' | undefined);
    },
    [handleMove]
  );

  const handlePromotionNeeded = useCallback((from: string, to: string) => {
    setPendingPromotion({ from, to });
  }, []);

  const handlePromotionSelect = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (pendingPromotion) {
        handleMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, handleMove]
  );

  const handlePromotionCancel = useCallback(() => setPendingPromotion(null), []);

  const handleReset = () => {
    setFen(INITIAL_FEN);
    setMoves([]);
    setFenHistory([INITIAL_FEN]);
    setMoveFromTo([]);
    setLastMove(null);
    setPendingPromotion(null);
    setVariations([]);
    setView({ varId: null, index: null });
  };

  const handleNavigate = useCallback(
    (arg: ViewState | number | null) => {
      // Normalize (MoveHistory sends ViewState; legacy sends number|null)
      const v: ViewState =
        typeof arg === 'number' || arg === null ? { varId: null, index: arg } : arg;

      if (v.varId === null) {
        if (v.index === null) {
          setView({ varId: null, index: null });
          return;
        }
        if (moves.length > 0 && v.index === moves.length - 1) {
          setView({ varId: null, index: null });
          return;
        }
      }
      setView(v);
    },
    [moves.length]
  );

  const handleFlip = () => {
    setOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  };

  const getPromotionColor = (): 'w' | 'b' => {
    if (!pendingPromotion) return 'w';
    const tempGame = new Chess(displayFen);
    return tempGame.turn();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="font-fredoka text-4xl md:text-5xl lg:text-6xl font-bold text-title">
          Analysis Board
        </h1>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <Button variant="outline" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </Button>

          <Button variant="secondary" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw size={18} />
            Reset Board
          </Button>

          <Button variant="secondary" onClick={handleFlip} className="flex items-center gap-2">
            <FlipVertical size={18} />
            Flip Board
          </Button>

          <EngineLines
            lines={analysis.lines}
            isAnalyzing={isAnalyzing}
            fen={displayFen}
            depth={analysis.depth}
            onPlayMove={handlePlayEngineMove}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-center mb-1">
            <p className="text-muted-foreground text-sm">
              {game.turn() === 'w' ? 'White' : 'Black'} to move
            </p>
            {game.isCheck() && !game.isGameOver()}
            {game.isCheckmate() && <p className="text-destructive font-semibold">Checkmate!</p>}
            {game.isDraw() && <p className="text-muted-foreground font-semibold">Draw!</p>}
          </div>

          {capturedPieces.top}

          <div className="flex items-stretch gap-2">
            <div className="h-[min(80vw,400px)]">
              <EvalBar
                evaluation={analysis.lines[0]?.evaluation ?? null}
                isMate={analysis.lines[0]?.isMate ?? false}
                mateIn={analysis.lines[0]?.mateIn ?? null}
                fen={displayFen}
              />
            </div>

            <AnalysisChessBoard
              fen={displayFen}
              orientation={orientation}
              onMove={handleMove}
              disabled={false}
              lastMove={displayLastMove}
              onPromotionNeeded={handlePromotionNeeded}
            />
          </div>

          {capturedPieces.bottom}

          <MoveHistory
            moves={moves}
            variations={variations}
            viewing={view}
            onNavigate={handleNavigate}
          />
        </div>
      </main>

      <PromotionDialog
        isOpen={!!pendingPromotion}
        color={getPromotionColor()}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
};

export default Analysis;
