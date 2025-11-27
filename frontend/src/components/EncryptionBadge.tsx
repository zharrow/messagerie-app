import { Lock, LockOpen, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EncryptionBadgeProps {
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Displays the encryption status of the current session
 * Shows a lock icon with optional text
 */
export const EncryptionBadge = ({ variant = 'compact', className = '' }: EncryptionBadgeProps) => {
  const { isEncryptionEnabled } = useAuth();

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          isEncryptionEnabled
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        } ${className}`}
        title={
          isEncryptionEnabled
            ? 'End-to-end encrypted - Your messages are secure'
            : 'Encryption not enabled'
        }
      >
        {isEncryptionEnabled ? (
          <Lock className="w-3 h-3" />
        ) : (
          <LockOpen className="w-3 h-3" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
        isEncryptionEnabled
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      } ${className}`}
    >
      {isEncryptionEnabled ? (
        <>
          <Shield className="w-4 h-4" />
          <span className="font-medium">End-to-end encrypted</span>
        </>
      ) : (
        <>
          <LockOpen className="w-4 h-4" />
          <span className="font-medium">Not encrypted</span>
        </>
      )}
    </div>
  );
};

export default EncryptionBadge;
