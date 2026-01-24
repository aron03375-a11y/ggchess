import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Bot } from '@/types/bot';
import { ChessBoard } from './ChessBoard';
import { useCapturedPieces } from './CapturedPieces';
import { MoveHistory } from './MoveHistory';
import { PromotionDialog } from './PromotionDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useStockfish } from '@/hooks/useStockfish';

interface GameScreenProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onBack: () => void;
}

export const GameScreen = ({ bot, playerColor, onBack }: GameScreenProps) => {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moves, setMoves] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const isProcessingRef = useRef(false);

  const { getBestMove, isReady } = useStockfish({ skillLevel: bot.skillLevel, moveTime: 500 });
  const game = new Chess(fen);
  const capturedPieces = useCapturedPieces({ fen, playerColor });

  const makeBotMove = useCallback(async (currentFen: string) => {
    if (isProcessingRef.current) return;
    
    const tempGame = new Chess(currentFen);
    if (tempGame.isGameOver()) return;
    
    isProcessingRef.current = true;
    setIsThinking(true);
    
    try {
      console.log('Bot thinking with FEN:', currentFen);
      const bestMoveUci = await getBestMove(currentFen);
      console.log('Bot best move:', bestMoveUci);
      
      if (bestMoveUci && bestMoveUci !== '(none)') {
        const from = bestMoveUci.slice(0, 2);
        const to = bestMoveUci.slice(2, 4);
        const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;

        const newGame = new Chess(currentFen);
        const move = newGame.move({ from, to, promotion });
        
        if (move) {
          console.log('Bot played:', move.san);
          setFen(newGame.fen());
          setMoves(prev => [...prev, move.san]);
          setLastMove({ from, to });
          
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
  }, [getBestMove, bot.name]);

  // Bot moves first if player is black
  useEffect(() => {
    if (playerColor === 'black' && moves.length === 0 && isReady) {
      const timer = setTimeout(() => {
        makeBotMove(fen);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playerColor, gameKey, isReady]); // Only run on game start/reset or when engine is ready

  const handleGameEnd = (g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      const playerWon = (winner === 'White' && playerColor === 'white') || 
                        (winner === 'Black' && playerColor === 'black');
      toast(playerWon ? '🎉 You won!' : `${bot.name} wins!`);
    } else if (g.isDraw()) {
      toast("It's a draw!");
    } else if (g.isStalemate()) {
      toast('Stalemate!');
    }
  };

  const handleMove = useCallback((from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n'): boolean => {
    if (isProcessingRef.current || isThinking) return false;
    
    try {
      const currentGame = new Chess(fen);
      
      // Check if it's the player's turn
      const isWhiteTurn = currentGame.turn() === 'w';
      const isPlayerTurn = (playerColor === 'white' && isWhiteTurn) || 
                           (playerColor === 'black' && !isWhiteTurn);
      
      if (!isPlayerTurn) {
        console.log('Not player turn');
        return false;
      }

      const move = currentGame.move({ from, to, promotion });
      
      if (move) {
        console.log('Player played:', move.san);
        const newFen = currentGame.fen();
        setFen(newFen);
        setMoves(prev => [...prev, move.san]);
        setLastMove({ from, to });

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
  }, [fen, playerColor, isThinking, makeBotMove]);

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
    isProcessingRef.current = false;
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setMoves([]);
    setIsThinking(false);
    setLastMove(null);
    setPendingPromotion(null);
    setGameKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-6xl mx-auto">
      {/* Left side - Controls & Bot info */}
      <div className="flex flex-col gap-4 w-full lg:w-64">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Bots
        </Button>

        <div className="bg-card rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <img 
              src={bot.image} 
              alt={bot.name} 
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-fredoka font-semibold text-card-foreground">{bot.name}</p>
              <p className="text-sm text-muted-foreground">ELO: {bot.elo}</p>
            </div>
          </div>
        </div>

        <Button 
          variant="secondary" 
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw size={18} />
          New Game
        </Button>
      </div>

      {/* Center - Chess Board with Captured Pieces */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">
            You play as <span className="font-semibold capitalize">{playerColor}</span>
          </p>
          {game.isCheck() && !game.isGameOver() && (
            <p className="text-destructive font-semibold animate-pulse">Check!</p>
          )}
        </div>
        
        {/* Captured pieces - top (opponent's captures) */}
        {capturedPieces.top}
        
        <ChessBoard 
          key={gameKey}
          fen={fen}
          playerColor={playerColor} 
          onMove={handleMove}
          disabled={isThinking}
          lastMove={lastMove}
          onPromotionNeeded={handlePromotionNeeded}
        />
        
        {/* Captured pieces - bottom (player's captures) */}
        {capturedPieces.bottom}
        
        <MoveHistory moves={moves} />
      </div>

      {/* Promotion Dialog */}
      <PromotionDialog
        isOpen={!!pendingPromotion}
        color={playerColor === 'white' ? 'w' : 'b'}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
};
