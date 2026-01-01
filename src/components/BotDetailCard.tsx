import { Bot } from '@/types/bot';
import { Button } from '@/components/ui/button';

interface BotDetailCardProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onColorChange: (color: 'white' | 'black') => void;
  onPlay: () => void;
}

export const BotDetailCard = ({ bot, playerColor, onColorChange, onPlay }: BotDetailCardProps) => {
  return (
    <div className="bot-card-bg rounded-lg p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex items-start gap-4 mb-6">
        <img 
          src={bot.image} 
          alt={bot.name} 
          className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shadow-md"
        />
        <div className="flex flex-col gap-2">
          <div className="speech-bubble max-w-[180px] md:max-w-[220px]">
            <p className="font-fredoka text-lg md:text-xl font-semibold leading-tight">
              {bot.greeting}
            </p>
          </div>
          <p className="text-sm md:text-base font-nunito font-medium mt-2">
            {bot.name} ({bot.elo})
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-6">
        <button
          onClick={() => onColorChange('black')}
          className={`
            w-14 h-14 md:w-16 md:h-16 
            bg-chess-pieceDark rounded-md 
            transition-all duration-200
            ${playerColor === 'black' ? 'ring-4 ring-accent scale-110' : 'opacity-70 hover:opacity-100'}
          `}
          aria-label="Play as black"
        />
        <button
          onClick={() => onColorChange('white')}
          className={`
            w-14 h-14 md:w-16 md:h-16 
            bg-chess-pieceLight rounded-md border-2 border-muted
            transition-all duration-200
            ${playerColor === 'white' ? 'ring-4 ring-accent scale-110' : 'opacity-70 hover:opacity-100'}
          `}
          aria-label="Play as white"
        />
      </div>

      <Button 
        onClick={onPlay}
        className="w-full py-6 text-xl font-fredoka font-bold bg-primary hover:bg-primary/90"
      >
        PLAY
      </Button>
    </div>
  );
};
