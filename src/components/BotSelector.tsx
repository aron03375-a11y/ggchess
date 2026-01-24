import { useState } from 'react';
import { Bot } from '@/types/bot';
import { aronBots, newYearBots } from '@/data/bots';
import { BotAvatar } from './BotAvatar';
import { BotDetailCard } from './BotDetailCard';

interface BotSelectorProps {
  onStartGame: (bot: Bot, playerColor: 'white' | 'black') => void;
}

export const BotSelector = ({ onStartGame }: BotSelectorProps) => {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');

  const handleBotClick = (bot: Bot) => {
    setSelectedBot(selectedBot?.id === bot.id ? null : bot);
  };

  const handlePlay = () => {
    if (selectedBot) {
      onStartGame(selectedBot, playerColor);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 shadow-xl max-w-md w-full">
      {selectedBot ? (
        <BotDetailCard
          bot={selectedBot}
          playerColor={playerColor}
          onColorChange={setPlayerColor}
          onPlay={handlePlay}
          onBack={() => setSelectedBot(null)}
        />
      ) : (
        <div className="space-y-4">
          {/* Aron Moods */}
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Aron moods</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {aronBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>

          {/* New Year Bots */}
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">New year bots</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {newYearBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
