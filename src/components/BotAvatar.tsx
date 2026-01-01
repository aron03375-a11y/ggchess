import { Bot } from '@/types/bot';

interface BotAvatarProps {
  bot: Bot;
  isSelected: boolean;
  onClick: () => void;
  size?: 'small' | 'large';
}

export const BotAvatar = ({ bot, isSelected, onClick, size = 'small' }: BotAvatarProps) => {
  const sizeClasses = size === 'small' 
    ? 'w-16 h-16 md:w-20 md:h-20' 
    : 'w-24 h-24 md:w-32 md:h-32';

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses} 
        rounded-lg overflow-hidden 
        transition-all duration-300 
        hover:scale-110 hover:shadow-lg
        ${isSelected ? 'ring-4 ring-accent scale-105' : ''}
      `}
    >
      <img 
        src={bot.image} 
        alt={bot.name} 
        className="w-full h-full object-cover"
      />
    </button>
  );
};
