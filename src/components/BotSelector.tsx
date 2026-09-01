import { useState } from 'react';
import { Bot } from '@/types/bot';
import { chessClubBots, magnusBots, anonymousBots } from '@/data/bots';
import { BotAvatar } from './BotAvatar';
import { BotDetailCard } from './BotDetailCard';

interface BotSelectorProps {
  onStartGame: (bot: Bot, playerColor: 'white' | 'black') => void;
}

export const BotSelector = ({ onStartGame }: BotSelectorProps) => {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');

  const handleBotClick = (bot: Bot) => {
    if (selectedBot?.id === bot.id) {
      setSelectedBot(null);
      return;
    }
    setSelectedBot(bot);
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
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Chess club</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {chessClubBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Magnus moods</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {magnusBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Anonymous</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {anonymousBots.map((bot) => (
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
