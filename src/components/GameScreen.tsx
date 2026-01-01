import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Bot } from '@/types/bot';
import { ChessBoard } from './ChessBoard';
import { MoveHistory } from './MoveHistory';
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
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const { getBestMove } = useStockfish({ elo: bot.elo, moveTime: 100 });

  const makeBotMove = useCallback(async () => {
    if (game.isGameOver()) return;
    
    setIsThinking(true);
    
    try {
      const bestMoveUci = await getBestMove(game.fen());
      
      if (bestMoveUci && bestMoveUci !== '(none)') {
        const from = bestMoveUci.slice(0, 2);
        const to = bestMoveUci.slice(2, 4);
        const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;

        const newGame = new Chess(game.fen());
        const move = newGame.move({ from, to, promotion });
        
        if (move) {
          setGame(newGame);
          setMoves(prev => [...prev, move.san]);
          
          if (newGame.isGameOver()) {
            handleGameEnd(newGame);
          }
        }
      }
    } catch (error) {
      console.error('Stockfish error:', error);
    } finally {
      setIsThinking(false);
    }
  }, [game, getBestMove]);

  // Bot moves first if player is black
  useEffect(() => {
    if (playerColor === 'black' && game.turn() === 'w' && moves.length === 0) {
      const timer = setTimeout(() => makeBotMove(), 300);
      return () => clearTimeout(timer);
    }
  }, [playerColor, game, moves.length, makeBotMove, gameKey]);

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

  const handleMove = useCallback((from: string, to: string): boolean => {
    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from, to, promotion: 'q' });
      
      if (move) {
        setGame(newGame);
        setMoves(prev => [...prev, move.san]);

        if (newGame.isGameOver()) {
          handleGameEnd(newGame);
        } else {
          // Bot responds
          setTimeout(() => makeBotMove(), 100);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [game, makeBotMove]);

  const handleReset = () => {
    setGame(new Chess());
    setMoves([]);
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
          {isThinking && (
            <p className="text-sm text-muted-foreground mt-2 animate-pulse">
              {bot.name} is thinking...
            </p>
          )}
        </div>

        <Button 
          variant="secondary" 
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw size={18} />
          New Game
        </Button>

        <MoveHistory moves={moves} />
      </div>

      {/* Center - Chess Board */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">
            You play as <span className="font-semibold capitalize">{playerColor}</span>
          </p>
          {game.isCheck() && !game.isGameOver() && (
            <p className="text-destructive font-semibold animate-pulse">Check!</p>
          )}
        </div>
        <ChessBoard 
          game={game} 
          playerColor={playerColor} 
          onMove={handleMove}
        />
      </div>
    </div>
  );
};
