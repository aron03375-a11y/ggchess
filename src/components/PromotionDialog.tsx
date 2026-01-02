import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PromotionDialogProps {
  isOpen: boolean;
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

const pieces: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

const getPieceUrl = (piece: string, color: 'w' | 'b'): string => {
  return `https://lichess1.org/assets/_BcVVbc/piece/cburnett/${color}${piece.toUpperCase()}.svg`;
};

export const PromotionDialog = ({ isOpen, color, onSelect, onCancel }: PromotionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[200px] p-4 bg-card border-border">
        <div className="text-center mb-3">
          <p className="text-sm font-medium text-card-foreground">Choose promotion</p>
        </div>
        <div className="flex justify-center gap-2">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="w-12 h-12 rounded-lg bg-muted hover:bg-accent transition-colors flex items-center justify-center"
            >
              <img 
                src={getPieceUrl(piece, color)} 
                alt={piece}
                className="w-10 h-10"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
