import { CheckIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarStatusProps {
  src?: string;
  alt?: string;
  fallback: string;
  isOnline?: boolean;
  className?: string;
}

const AvatarStatus = ({
  src,
  alt = 'User avatar',
  fallback,
  isOnline = false,
  className,
}: AvatarStatusProps) => {
  return (
    <div className={cn('relative w-fit', className)}>
      <Avatar
        className={cn(
          'ring-offset-background ring-2 ring-offset-2',
          isOnline ? 'ring-green-600 dark:ring-green-400' : 'ring-muted-foreground/30'
        )}
      >
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="text-xs font-medium">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {isOnline && (
        <span className="absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-green-600 dark:bg-green-400">
          <CheckIcon className="size-3 text-white" />
        </span>
      )}
    </div>
  );
};

export default AvatarStatus;
