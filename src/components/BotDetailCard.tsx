import { Bot } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';

interface BotDetailCardProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onColorChange: (color: 'white' | 'black') => void;
  onPlay: () => void;
  onBack: () => void;
  deepBlueLevel?: number;
  onDeepBlueLevelChange?: (level: number) => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const BotDetailCard = ({
  bot,
  playerColor,
  onColorChange,
  onPlay,
  onBack,
  deepBlueLevel,
  onDeepBlueLevelChange,
}: BotDetailCardProps) => {
  const showLevelSlider = bot.category === 'deepblue' && deepBlueLevel && onDeepBlueLevelChange;

  return (
    <div className="bot-card-bg rounded-lg p-4 md:p-6 animate-in fade-in duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        ← Back to bots
      </button>
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

      {showLevelSlider && (
        <div className="mb-6 px-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-nunito font-medium text-foreground/70">
              Difficulty
            </span>
            <span className="text-sm font-fredoka font-bold text-accent">
              Level {ROMAN[deepBlueLevel - 1]}
            </span>
          </div>
          <Slider
            value={[deepBlueLevel]}
            min={1}
            max={6}
            step={1}
            onValueChange={(v) => onDeepBlueLevelChange(v[0])}
            className="w-full"
          />
          <div className="flex justify-between mt-1 px-0.5">
            {ROMAN.map((r) => (
              <span key={r} className="text-[10px] font-nunito text-foreground/50">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

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
