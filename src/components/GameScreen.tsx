import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Bot } from '@/types/bot';
import { ChessBoard } from './ChessBoard';
import { useCapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { PromotionDialog } from './PromotionDialog';
import { GameResultDialog } from './GameResultDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useStockfish } from '@/hooks/useStockfish';
interface GameScreenProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onBack: () => void;
}
export const GameScreen = ({
  bot,
  playerColor,
  onBack
}: GameScreenProps) => {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moves, setMoves] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);
  const [moveFromTo, setMoveFromTo] = useState<{
    from: string;
    to: string;
  }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const isProcessingRef = useRef(false);
  const {
    getBestMove,
    isReady
  } = useStockfish({
    skillLevel: bot.skillLevel,
    depth: bot.depth
  });

  // Display FEN based on viewing index
  const displayFen = viewingIndex !== null ? fenHistory[viewingIndex + 1] : fen;
  const displayLastMove = viewingIndex !== null ? moveFromTo[viewingIndex] : lastMove;
  const game = new Chess(displayFen);
  const capturedPieces = useCapturedPieces({
    fen: displayFen,
    playerColor
  });
  const makeBotMove = useCallback(async (currentFen: string) => {
    if (isProcessingRef.current) return;
    const tempGame = new Chess(currentFen);
    if (tempGame.isGameOver()) return;
    isProcessingRef.current = true;
    setIsThinking(true);
    try {
      let bestMoveUci: string | null = null;

      // Streamer Hikaru plays b3 as white first move, g3 as black first move
      if (bot.id === 'streamer-hikaru') {
        const isStartingPosition = currentFen.startsWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
        const isBlackFirstMove = currentFen.startsWith('rnbqkbnr/pppppppp/8/8/') && tempGame.turn() === 'b' && tempGame.moveNumber() === 1;
        if (isStartingPosition && tempGame.turn() === 'w') {
          bestMoveUci = 'b2b3'; // b3 as white
        } else if (isBlackFirstMove) {
          bestMoveUci = 'g7g6'; // g6 as black (g3 notation is for white, g6 is the equivalent pawn move for black)
        }
      }

      // If no hardcoded move, use Stockfish
      if (!bestMoveUci) {
        console.log('Bot thinking with FEN:', currentFen);
        bestMoveUci = await getBestMove(currentFen);
        console.log('Bot best move:', bestMoveUci);
      }
      if (bestMoveUci && bestMoveUci !== '(none)') {
        const from = bestMoveUci.slice(0, 2);
        const to = bestMoveUci.slice(2, 4);
        const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
        const newGame = new Chess(currentFen);
        const move = newGame.move({
          from,
          to,
          promotion
        });
        if (move) {
          console.log('Bot played:', move.san);
          const newFen = newGame.fen();
          setFen(newFen);
          setMoves(prev => [...prev, move.san]);
          setFenHistory(prev => [...prev, newFen]);
          setMoveFromTo(prev => [...prev, {
            from,
            to
          }]);
          setLastMove({
            from,
            to
          });
          setViewingIndex(null); // Return to current position when bot moves

          if (newGame.isGameOver()) {
            handleGameEnd(newGame);
          }
        }
      }
    } catch (error) {
      console.error('Stockfish error:', error);
    } finally {
      setIsThinking(false);
      isProcessingRef.current = false;
    }
  }, [getBestMove, bot.id]);

  // Bot moves first if player is black
  useEffect(() => {
    if (playerColor === 'black' && moves.length === 0 && isReady) {
      const timer = setTimeout(() => {
        makeBotMove(fen);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playerColor, gameKey, isReady]); // Only run on game start/reset or when engine is ready

  const handleGameEnd = (g: Chess, isResign = false) => {
    if (isResign) {
      setGameResult('loss');
      setShowResultDialog(true);
      toast(`You resigned. ${bot.name} wins!`);
      return;
    }
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      const playerWon = winner === 'White' && playerColor === 'white' || winner === 'Black' && playerColor === 'black';
      setGameResult(playerWon ? 'win' : 'loss');
      setShowResultDialog(true);
      toast(playerWon ? '🎉 You won!' : `${bot.name} wins!`);
    } else if (g.isDraw() || g.isStalemate()) {
      setGameResult('draw');
      setShowResultDialog(true);
      toast("It's a draw!");
    }
  };
  const handleMove = useCallback((from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n'): boolean => {
    if (isProcessingRef.current || isThinking || viewingIndex !== null) return false;
    try {
      const currentGame = new Chess(fen);

      // Check if it's the player's turn
      const isWhiteTurn = currentGame.turn() === 'w';
      const isPlayerTurn = playerColor === 'white' && isWhiteTurn || playerColor === 'black' && !isWhiteTurn;
      if (!isPlayerTurn) {
        console.log('Not player turn');
        return false;
      }
      const move = currentGame.move({
        from,
        to,
        promotion
      });
      if (move) {
        console.log('Player played:', move.san);
        const newFen = currentGame.fen();
        setFen(newFen);
        setMoves(prev => [...prev, move.san]);
        setFenHistory(prev => [...prev, newFen]);
        setMoveFromTo(prev => [...prev, {
          from,
          to
        }]);
        setLastMove({
          from,
          to
        });
        if (currentGame.isGameOver()) {
          handleGameEnd(currentGame);
        } else {
          // Bot responds after a delay
          setTimeout(() => makeBotMove(newFen), 300);
        }
        return true;
      }
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
    return false;
  }, [fen, playerColor, isThinking, viewingIndex, makeBotMove]);
  const handlePromotionNeeded = useCallback((from: string, to: string) => {
    setPendingPromotion({
      from,
      to
    });
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
    isProcessingRef.current = false;
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setMoves([]);
    setFenHistory(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);
    setMoveFromTo([]);
    setIsThinking(false);
    setLastMove(null);
    setPendingPromotion(null);
    setViewingIndex(null);
    setGameResult(null);
    setShowResultDialog(false);
    setGameKey(prev => prev + 1);
  };
  const handleResign = () => {
    handleGameEnd(game, true);
  };

  // Generate PGN from moves
  const getPgn = () => {
    const tempGame = new Chess();
    for (const san of moves) {
      try {
        tempGame.move(san);
      } catch {
        break;
      }
    }
    return tempGame.pgn();
  };
  const handleNavigate = useCallback((index: number | null) => {
    // If the selected index would display the live position (i.e. last move index),
    // automatically exit history mode so the board is immediately playable.
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
  return <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-6xl mx-auto">
      {/* Left side - Controls & Bot info */}
      <div className="flex flex-col gap-4 w-full lg:w-64">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Bots
        </Button>

        <div className="bg-card rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <img src={bot.image} alt={bot.name} className="w-12 h-12 rounded-lg object-cover" />
            <div>
              <p className="font-fredoka font-semibold text-card-foreground">{bot.name}</p>
              <p className="text-sm text-muted-foreground">ELO: {bot.elo}</p>
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={handleReset} className="flex items-center gap-2">
          <RotateCcw size={18} />
          New Game
        </Button>

        <Button variant="destructive" onClick={handleResign} disabled={moves.length === 0 || game.isGameOver()} className="flex items-center gap-2">
          <Flag size={18} />
          Resign
        </Button>
      </div>

      {/* Center - Chess Board with Captured Pieces */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">
            You play as <span className="font-semibold capitalize">{playerColor}</span>
          </p>
          {game.isCheck() && !game.isGameOver()}
        </div>
        
        {/* Captured pieces - top (opponent's captures) */}
        {capturedPieces.top}
        
        <ChessBoard key={gameKey} fen={displayFen} playerColor={playerColor} onMove={handleMove} disabled={isThinking || viewingIndex !== null} lastMove={displayLastMove} onPromotionNeeded={handlePromotionNeeded} />
        
        {/* Captured pieces - bottom (player's captures) */}
        {capturedPieces.bottom}
        
        <MoveHistory moves={moves} viewingIndex={viewingIndex} onNavigate={handleNavigate} />
      </div>

      {/* Promotion Dialog */}
      <PromotionDialog isOpen={!!pendingPromotion} color={playerColor === 'white' ? 'w' : 'b'} onSelect={handlePromotionSelect} onCancel={handlePromotionCancel} />

      {/* Game Result Dialog */}
      <GameResultDialog isOpen={showResultDialog} result={gameResult} botName={bot.name} pgn={getPgn()} fenHistory={fenHistory} onNewGame={handleReset} onClose={() => setShowResultDialog(false)} />
    </div>;
};