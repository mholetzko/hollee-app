import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <DirectionsBikeIcon 
        className="w-8 h-8 text-gray-400 hover:text-gray-300 transition-colors" 
        style={{ transform: 'rotate(-15deg)' }} 
      />
      <span className="font-['Arial'] italic font-bold text-xl text-gray-400 hover:text-gray-300 transition-colors">
        HOLLEE RIDES
      </span>
    </div>
  );
}; 