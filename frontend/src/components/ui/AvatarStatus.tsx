import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarStatusProps {
  src?: string;
  alt?: string;
  fallback: string;
  isOnline?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const indicatorSizeClasses = {
  sm: 'h-2.5 w-2.5 -right-0.5 -bottom-0.5',
  md: 'h-3 w-3 -right-0.5 -bottom-0.5',
  lg: 'h-3.5 w-3.5 -right-0.5 -bottom-0.5',
  xl: 'h-4 w-4 -right-1 -bottom-1',
};

const fallbackTextSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const AvatarStatus = ({
  src,
  alt = 'User avatar',
  fallback,
  isOnline = false,
  className,
  size = 'md',
}: AvatarStatusProps) => {
  return (
    <div className={cn('relative w-fit', className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          'ring-offset-background',
          isOnline && 'ring-2 ring-offset-2 ring-green-500'
        )}
      >
        <AvatarImage src={src} alt={alt} className="object-cover" />
        <AvatarFallback className={cn('font-medium bg-gradient-to-br from-primary/80 to-primary text-primary-foreground', fallbackTextSizes[size])}>
          {fallback}
        </AvatarFallback>
      </Avatar>
      {isOnline && (
        <span
          className={cn(
            'absolute inline-flex items-center justify-center rounded-full bg-green-500 border-2 border-background',
            indicatorSizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export default AvatarStatus;
