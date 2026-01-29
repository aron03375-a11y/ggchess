import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface GameResultDialogProps {
  isOpen: boolean;
  result: 'win' | 'loss' | 'draw' | null;
  botName: string;
  pgn: string;
  fenHistory: string[];
  onNewGame: () => void;
  onClose: () => void;
}

export const GameResultDialog = ({
  isOpen,
  result,
  botName,
  pgn,
  fenHistory,
  onNewGame,
  onClose,
}: GameResultDialogProps) => {
  const navigate = useNavigate();

  const getTitle = () => {
    switch (result) {
      case 'win':
        return '🎉 Victory!';
      case 'loss':
        return `${botName} wins!`;
      case 'draw':
        return "It's a Draw!";
      default:
        return 'Game Over';
    }
  };

  const getDescription = () => {
    switch (result) {
      case 'win':
        return 'Congratulations! You won the game.';
      case 'loss':
        return 'Better luck next time!';
      case 'draw':
        return 'The game ended in a draw.';
      default:
        return '';
    }
  };

  const handleAnalyse = () => {
    // Navigate to analysis with game data
    navigate('/analyse', { 
      state: { 
        pgn, 
        fenHistory,
        fromGame: true 
      } 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-fredoka">{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onNewGame} className="flex-1">
            New Game
          </Button>
          <Button onClick={handleAnalyse} className="flex-1">
            Analyse Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
