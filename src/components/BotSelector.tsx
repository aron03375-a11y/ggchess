import { useState } from 'react';
import { Bot } from '@/types/bot';
import { aronBots, catBots, coachBots, deepBlueBots } from '@/data/bots';
import { BotAvatar } from './BotAvatar';
import { BotDetailCard } from './BotDetailCard';
import botDeepBlue from '@/assets/bot-deepblue.png';

interface BotSelectorProps {
  onStartGame: (bot: Bot, playerColor: 'white' | 'black') => void;
}

export const BotSelector = ({ onStartGame }: BotSelectorProps) => {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [deepBlueLevel, setDeepBlueLevel] = useState(1); // 1..6

  const isDeepBlue = selectedBot?.category === 'deepblue';
  const activeBot: Bot | null = isDeepBlue ? deepBlueBots[deepBlueLevel - 1] : selectedBot;

  const handleBotClick = (bot: Bot) => {
    if (selectedBot?.id === bot.id || (bot.category === 'deepblue' && isDeepBlue)) {
      setSelectedBot(null);
      return;
    }
    if (bot.category === 'deepblue') {
      setDeepBlueLevel(1);
    }
    setSelectedBot(bot);
  };

  const handlePlay = () => {
    if (activeBot) {
      onStartGame(activeBot, playerColor);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 shadow-xl max-w-md w-full">
      {activeBot ? (
        <BotDetailCard
          bot={activeBot}
          playerColor={playerColor}
          onColorChange={setPlayerColor}
          onPlay={handlePlay}
          onBack={() => setSelectedBot(null)}
          deepBlueLevel={isDeepBlue ? deepBlueLevel : undefined}
          onDeepBlueLevelChange={isDeepBlue ? setDeepBlueLevel : undefined}
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

          {/* Cat Bots */}
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Cat bots</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {catBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>

          {/* Internet's Chess Coaches */}
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Internet's chess coaches</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {coachBots.map((bot) => (
                <BotAvatar
                  key={bot.id}
                  bot={bot}
                  isSelected={selectedBot?.id === bot.id}
                  onClick={() => handleBotClick(bot)}
                />
              ))}
            </div>
          </div>

          {/* Deep Blue */}
          <div className="bot-card-bg rounded-lg p-4">
            <h3 className="text-center font-nunito font-medium text-sm mb-3">Deep Blue</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              <BotAvatar
                bot={{ ...deepBlueBots[0], image: botDeepBlue, name: 'Deep Blue' }}
                isSelected={isDeepBlue}
                onClick={() => handleBotClick(deepBlueBots[0])}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
