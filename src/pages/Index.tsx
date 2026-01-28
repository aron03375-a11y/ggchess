import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot } from '@/types/bot';
import { BotSelector } from '@/components/BotSelector';
import { GameScreen } from '@/components/GameScreen';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const Index = () => {
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartGame = (bot: Bot, color: 'white' | 'black') => {
    setCurrentBot(bot);
    setPlayerColor(color);
    setIsPlaying(true);
  };

  const handleBackToSelector = () => {
    setIsPlaying(false);
    setCurrentBot(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <header className="text-center mb-8">
        <div className="flex justify-center gap-4 mb-4">
          <Button variant="ghost" asChild>
            <Link to="/analyse" className="flex items-center gap-2">
              <Search size={18} />
              Analyse
            </Link>
          </Button>
        </div>
        <h1 className="font-fredoka text-4xl md:text-5xl lg:text-6xl font-bold text-title">
          Play vs bots
        </h1>
      </header>

      <main className="flex justify-center">
        {isPlaying && currentBot ? (
          <GameScreen 
            bot={currentBot} 
            playerColor={playerColor} 
            onBack={handleBackToSelector}
          />
        ) : (
          <BotSelector onStartGame={handleStartGame} />
        )}
      </main>
    </div>
  );
};

export default Index;
