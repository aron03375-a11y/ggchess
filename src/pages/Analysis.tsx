import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useLocation } from 'react-router-dom';
import { AnalysisChessBoard } from '@/components/AnalysisChessBoard';
import { MoveHistory } from '@/components/MoveHistory';
import { EngineEvaluation } from '@/components/EngineEvaluation';
import { PromotionDialog } from '@/components/PromotionDialog';
import { useCapturedPieces } from '@/components/CapturedPieces';
import { useStockfishAnalysis } from '@/hooks/useStockfishAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, FlipVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const Analysis = () => {
  const location = useLocation();
  const gameData = location.state as { pgn?: string; fenHistory?: string[]; fromGame?: boolean } | null;

  const [fen, setFen] = useState(INITIAL_FEN);
  const [moves, setMoves] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>([INITIAL_FEN]);
  const [moveFromTo, setMoveFromTo] = useState<{ from: string; to: string }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const { analysis, isReady, isAnalyzing, startAnalysis } = useStockfishAnalysis({ thinkTime: 3000 });
  
  const displayFen = viewingIndex !== null ? fenHistory[viewingIndex + 1] : fen;
  const displayLastMove = viewingIndex !== null ? moveFromTo[viewingIndex] : lastMove;
  
  const game = new Chess(displayFen);
  const capturedPieces = useCapturedPieces({ fen: displayFen, playerColor: orientation });

  // Load game from navigation state
  useEffect(() => {
    if (gameData?.fromGame && gameData.fenHistory && gameData.fenHistory.length > 1) {
      // Reconstruct moves from FEN history
      const loadedMoves: string[] = [];
      const loadedMoveFromTo: { from: string; to: string }[] = [];
      
      for (let i = 0; i < gameData.fenHistory.length - 1; i++) {
        try {
          const beforeGame = new Chess(gameData.fenHistory[i]);
          const afterGame = new Chess(gameData.fenHistory[i + 1]);
          
          // Find the move by comparing positions
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
      // Start at the beginning to review the game
      setViewingIndex(-1);
    }
  }, []);

  // Start analysis when position changes
  useEffect(() => {
    if (isReady) {
      startAnalysis(displayFen);
    }
  }, [displayFen, isReady, startAnalysis]);

  const handleMove = useCallback((from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n'): boolean => {
    if (viewingIndex !== null) {
      // Playing from a historical position - create new line
      const historicalFen = fenHistory[viewingIndex + 1];
      const newGame = new Chess(historicalFen);
      
      try {
        const move = newGame.move({ from, to, promotion });
        if (move) {
          const newFen = newGame.fen();
          // Truncate history and add new move
          const newMoves = [...moves.slice(0, viewingIndex + 1), move.san];
          const newFenHistory = [...fenHistory.slice(0, viewingIndex + 2), newFen];
          const newMoveFromTo = [...moveFromTo.slice(0, viewingIndex + 1), { from, to }];
          
          setMoves(newMoves);
          setFenHistory(newFenHistory);
          setMoveFromTo(newMoveFromTo);
          setFen(newFen);
          setLastMove({ from, to });
          setViewingIndex(null);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    }

    try {
      const currentGame = new Chess(fen);
      const move = currentGame.move({ from, to, promotion });
      
      if (move) {
        const newFen = currentGame.fen();
        setFen(newFen);
        setMoves(prev => [...prev, move.san]);
        setFenHistory(prev => [...prev, newFen]);
        setMoveFromTo(prev => [...prev, { from, to }]);
        setLastMove({ from, to });
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [fen, viewingIndex, fenHistory, moves, moveFromTo]);

  const handlePlayEngineMove = useCallback((from: string, to: string, promotion?: string) => {
    handleMove(from, to, promotion as 'q' | 'r' | 'b' | 'n' | undefined);
  }, [handleMove]);

  const handlePromotionNeeded = useCallback((from: string, to: string) => {
    setPendingPromotion({ from, to });
  }, []);

  const handlePromotionSelect = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      handleMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  }, [pendingPromotion, handleMove]);

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const handleReset = () => {
    setFen(INITIAL_FEN);
    setMoves([]);
    setFenHistory([INITIAL_FEN]);
    setMoveFromTo([]);
    setLastMove(null);
    setPendingPromotion(null);
    setViewingIndex(null);
  };

  const handleNavigate = useCallback((index: number | null) => {
    if (index === null) {
      setViewingIndex(null);
      return;
    }
    if (moves.length > 0 && index === moves.length - 1) {
      setViewingIndex(null);
      return;
    }
    setViewingIndex(index);
  }, [moves.length]);

  const handleFlip = () => {
    setOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Determine promotion color from the pending promotion square (before the move is made)
  const getPromotionColor = (): 'w' | 'b' => {
    if (!pendingPromotion) return 'w';
    const currentFen = viewingIndex !== null ? fenHistory[viewingIndex + 1] : fen;
    const tempGame = new Chess(currentFen);
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
        {/* Left side - Controls */}
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <Button 
            variant="outline" 
            asChild
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Board
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleFlip}
            className="flex items-center gap-2"
          >
            <FlipVertical size={18} />
            Flip Board
          </Button>

          {/* Engine Evaluation */}
          <EngineEvaluation 
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            fen={displayFen}
            onPlayMove={handlePlayEngineMove}
          />
        </div>

        {/* Center - Chess Board with Captured Pieces */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">
              {game.turn() === 'w' ? 'White' : 'Black'} to move
            </p>
            {game.isCheck() && !game.isGameOver() && (
              <p className="text-destructive font-semibold animate-pulse">Check!</p>
            )}
            {game.isCheckmate() && (
              <p className="text-destructive font-semibold">Checkmate!</p>
            )}
            {game.isDraw() && (
              <p className="text-muted-foreground font-semibold">Draw!</p>
            )}
          </div>
          
          {capturedPieces.top}
          
          <AnalysisChessBoard 
            fen={displayFen}
            orientation={orientation}
            onMove={handleMove}
            disabled={false}
            lastMove={displayLastMove}
            onPromotionNeeded={handlePromotionNeeded}
          />
          
          {capturedPieces.bottom}
          
          <MoveHistory 
            moves={moves} 
            viewingIndex={viewingIndex} 
            onNavigate={handleNavigate}
          />
        </div>

        <PromotionDialog
          isOpen={!!pendingPromotion}
          color={getPromotionColor()}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
        />
      </main>
    </div>
  );
};

export default Analysis;