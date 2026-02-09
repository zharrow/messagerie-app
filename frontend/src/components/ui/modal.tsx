import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className={`bg-background rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} mx-4 animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              {icon}
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className={title || icon ? '' : 'pt-4'}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
