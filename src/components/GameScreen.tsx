import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Bot } from '@/types/bot';
import { ChessBoard } from './ChessBoard';
import { MoveHistory } from './MoveHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface GameScreenProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onBack: () => void;
}

export const GameScreen = ({ bot, playerColor, onBack }: GameScreenProps) => {
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Calculate bot delay based on elo
  const getBotDelay = () => {
    const baseDelay = 500;
    const eloFactor = Math.min(bot.elo / 2000, 1);
    return baseDelay + eloFactor * 1500;
  };

  // Simple bot move logic - weighted random based on elo
  const makeBotMove = useCallback(() => {
    if (game.isGameOver()) return;
    
    setIsThinking(true);
    
    setTimeout(() => {
      const possibleMoves = game.moves();
      if (possibleMoves.length === 0) return;

      // Higher elo = slightly better moves (capture preference, center control)
      let selectedMove: string;
      
      if (bot.elo >= 1500 && Math.random() < 0.6) {
        // Prefer captures
        const captures = possibleMoves.filter(m => m.includes('x'));
        if (captures.length > 0) {
          selectedMove = captures[Math.floor(Math.random() * captures.length)];
        } else {
          selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
      } else if (bot.elo >= 1000 && Math.random() < 0.4) {
        // Slight center preference
        const centerMoves = possibleMoves.filter(m => 
          m.includes('d') || m.includes('e') || m.includes('4') || m.includes('5')
        );
        if (centerMoves.length > 0) {
          selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
        } else {
          selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
      } else {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }

      const newGame = new Chess(game.fen());
      newGame.move(selectedMove);
      setGame(newGame);
      setMoves(prev => [...prev, selectedMove]);
      setIsThinking(false);

      if (newGame.isGameOver()) {
        handleGameEnd(newGame);
      }
    }, getBotDelay());
  }, [game, bot.elo]);

  // Bot moves first if player is black
  useEffect(() => {
    if (playerColor === 'black' && game.turn() === 'w' && moves.length === 0) {
      makeBotMove();
    }
  }, [playerColor, game, moves.length, makeBotMove]);

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

  const handleMove = (from: string, to: string): boolean => {
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
  };

  const handleReset = () => {
    setGame(new Chess());
    setMoves([]);
    if (playerColor === 'black') {
      setTimeout(() => makeBotMove(), 500);
    }
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
