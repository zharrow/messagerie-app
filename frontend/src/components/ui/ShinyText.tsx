import { cn } from '@/lib/utils';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText = ({
  text,
  disabled = false,
  speed = 3,
  className = '',
}: ShinyTextProps) => {
  return (
    <span
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        'bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground',
        'bg-[length:200%_100%]',
        !disabled && 'animate-shine',
        className
      )}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
      <style>{`
        @keyframes shine {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
        .animate-shine {
          animation: shine linear infinite;
        }
      `}</style>
    </span>
  );
};

export default ShinyText;
