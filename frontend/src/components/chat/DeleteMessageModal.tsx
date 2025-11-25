import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteMessageModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteMessageModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Supprimer le message</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
