import { useState } from 'react';
import { Bot } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';

interface BotDetailCardProps {
  bot: Bot;
  playerColor: 'white' | 'black';
  onColorChange: (color: 'white' | 'black') => void;
  onPlay: (bot: Bot) => void;
  onBack: () => void;
}

export const BotDetailCard = ({
  bot,
  playerColor,
  onColorChange,
  onPlay,
  onBack,
}: BotDetailCardProps) => {
  const [elo, setElo] = useState<number>(bot.defaultElo ?? bot.uciElo ?? 1500);

  const handlePlay = () => {
    if (bot.isEloSlider) {
      onPlay({ ...bot, uciElo: elo, elo });
    } else {
      onPlay(bot);
    }
  };

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
            {bot.name} {bot.isEloSlider ? `(${elo})` : `(${bot.elo})`}
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

      {bot.isEloSlider && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between font-nunito text-sm">
            <span className="text-foreground/70">Strength (UCI Elo)</span>
            <span className="font-semibold tabular-nums">{elo}</span>
          </div>
          <Slider
            value={[elo]}
            min={bot.minElo ?? 1}
            max={bot.maxElo ?? 3500}
            step={25}
            onValueChange={(v) => setElo(v[0])}
          />
          <div className="flex justify-between text-xs text-foreground/60 font-nunito">
            <span>{bot.minElo ?? 1}</span>
            <span>{bot.maxElo ?? 3500}</span>
          </div>
        </div>
      )}

      <Button
        onClick={handlePlay}
        className="w-full py-6 text-xl font-fredoka font-bold bg-primary hover:bg-primary/90"
      >
        PLAY
      </Button>
    </div>
  );
};
